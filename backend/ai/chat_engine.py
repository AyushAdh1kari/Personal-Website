import json
import os
import re
import sys
import time
from pathlib import Path

# A curated set of common English stop words to exclude from tokenization. This helps focus on meaningful keywords for retrieval while still allowing important
# context words to be included. The list is intentionally concise to avoid over-filtering given the relatively small knowledge base and the importance of retaining relevant terms.
STOP_WORDS = {
    "about",
    "after",
    "also",
    "and",
    "any",
    "are",
    "because",
    "been",
    "before",
    "between",
    "can",
    "could",
    "does",
    "from",
    "have",
    "here",
    "into",
    "like",
    "more",
    "most",
    "much",
    "over",
    "same",
    "some",
    "than",
    "that",
    "their",
    "them",
    "there",
    "these",
    "they",
    "this",
    "those",
    "very",
    "what",
    "when",
    "where",
    "which",
    "with",
    "would",
    "your",
}

# A simple rule-based playbook to provide fallback answers on common topics related to Ayush's background, projects, design style, interests, and hiring fit. Each entry includes keywords to match against the user's question
# and a concise, recruiter-friendly answer based on the knowledge base. The sources field indicates which markdown files contain relevant information for that topic, which can be
# used to inform the fallback answer and provide transparency about where the information is coming from.
PLAYBOOK = [
    {
        "match": ["project", "build", "built", "portfolio"],
        "answer": "Ayush is building ayush.ai as a conversation-first portfolio and maintains a dedicated photography archive. The near-term roadmap includes stronger AI and retrieval integration.",
        "sources": ["projects.md", "resume.md"],
    },
    {
        "match": ["design", "style", "aesthetic", "ui", "ux"],
        "answer": "His design style is clean, high-contrast, and intentional. The black/red visual language is meant to feel memorable while staying recruiter-friendly and easy to scan.",
        "sources": ["writing-style.md", "personality.md"],
    },
    {
        "match": ["hire", "team", "collaborator", "why"],
        "answer": "Ayush combines practical engineering with clear communication and ownership. He tends to move quickly from idea to implementation while keeping user experience and clarity in focus.",
        "sources": ["resume.md", "personality.md"],
    },
    {
        "match": ["interest", "hobby", "outside", "free time"],
        "answer": "Outside of coding, Ayush spends time on photography, astronomy, aviation, fitness, and documentaries. Those interests shape his creative direction and attention to detail.",
        "sources": ["bio.md"],
    },
]

# System prompt for the OpenAI model to set the context and rules for generating responses. Emphasizes the importance of grounding answers in the provided knowledge context, being
# consi
SYSTEM_PROMPT = """You are Ayush AI, the assistant for ayush.ai.
Rules:
- Stay grounded in provided knowledge context.
- Be concise, clear, and recruiter-friendly.
- Avoid making up facts not present in context.
- If context is insufficient, say so briefly and answer conservatively."""


def tokenize(text: str) -> list[str]:
    normalized = re.sub(r"[^a-z0-9\\s]", " ", text.lower())
    tokens = [token for token in normalized.split() if len(token) >= 3 and token not in STOP_WORDS]
    return tokens


def knowledge_dir() -> Path:
    env_dir = os.getenv("KNOWLEDGE_DIR")
    if env_dir:
        return Path(env_dir).resolve()
    return Path(__file__).resolve().parents[2] / "frontend" / "knowledge"


def load_chunks() -> list[dict]:
    chunks = []
    directory = knowledge_dir()
    if not directory.exists():
        return chunks

    for file_path in sorted(directory.glob("*.md")):
        content = file_path.read_text(encoding="utf-8")
        blocks = [block.strip() for block in re.split(r"\\n\\s*\\n", content) if block.strip()]
        for index, block in enumerate(blocks, start=1):
            chunks.append(
                {
                    "id": f"{file_path.name}#{index}",
                    "source": file_path.name,
                    "text": block,
                    "tokens": tokenize(block),
                }
            )
    return chunks


def retrieve_context(question: str, limit: int = 3) -> list[dict]:
    chunks = load_chunks()
    if not chunks:
        return []

    query_tokens = tokenize(question)
    if not query_tokens:
        return [{"source": chunk["source"], "text": chunk["text"]} for chunk in chunks[:limit]]

    scored = []
    for chunk in chunks:
        token_set = set(chunk["tokens"])
        score = sum(1 for token in query_tokens if token in token_set)
        if score > 0:
            scored.append(
                {
                    "source": chunk["source"],
                    "text": chunk["text"],
                    "score": score,
                }
            )

    if not scored:
        return [{"source": chunk["source"], "text": chunk["text"]} for chunk in chunks[:limit]]

    scored.sort(key=lambda item: item["score"], reverse=True)
    return [{"source": item["source"], "text": item["text"]} for item in scored[:limit]]


def fallback_answer(question: str, context_sources: list[str]) -> tuple[str, list[str]]:
    normalized = question.lower()
    selected = None
    for entry in PLAYBOOK:
        if any(token in normalized for token in entry["match"]):
            selected = entry
            break

    if selected is None:
        selected = {
            "answer": "Good question. AI integration is in progress. Ask about projects, skills, design style, interests, or hiring fit for the strongest results.",
            "sources": ["bio.md", "projects.md", "resume.md"],
        }

    all_sources = list(dict.fromkeys([*selected["sources"], *context_sources]))
    return selected["answer"], all_sources


def call_openai(question: str, context: list[dict], history: list[dict]) -> str | None:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        return None

    try:
        from openai import OpenAI  # type: ignore
    except Exception:
        return None

    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")

    context_block = "\\n\\n".join([f"[{chunk['source']}] {chunk['text']}" for chunk in context])
    history_lines = []
    for item in history[-6:]:
        role = "User" if item.get("role") == "user" else "Assistant"
        content = str(item.get("content", "")).strip()
        if content:
            history_lines.append(f"{role}: {content}")

    prompt = "\\n\\n".join(
        [
            "Conversation history:",
            "\\n".join(history_lines) if history_lines else "(none)",
            "Knowledge context:",
            context_block if context_block else "(none)",
            "User question:",
            question,
        ]
    )

    try:
        response = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": SYSTEM_PROMPT}]},
                {"role": "user", "content": [{"type": "input_text", "text": prompt}]},
            ],
            temperature=0.4,
        )

        output_text = getattr(response, "output_text", None)
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()
    except Exception:
        pass

    try:
        completion = client.chat.completions.create(
            model=model,
            temperature=0.4,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        text = completion.choices[0].message.content
        if isinstance(text, str) and text.strip():
            return text.strip()
    except Exception:
        return None

    return None


def main() -> int:
    started_at = time.time()
    raw_input = sys.stdin.read().strip()
    payload = json.loads(raw_input or "{}")

    message = str(payload.get("message", "")).strip()
    history = payload.get("history", [])
    if not isinstance(history, list):
        history = []

    if not message:
        print(json.dumps({"ok": False, "message": "Message is required."}))
        return 1

    context = retrieve_context(message, limit=3)
    context_sources = list(dict.fromkeys([chunk["source"] for chunk in context]))

    ai_text = call_openai(message, context, history)
    if ai_text:
        result = {
            "ok": True,
            "answer": ai_text,
            "sources": context_sources,
            "mode": "python-openai",
            "latencyMs": round((time.time() - started_at) * 1000),
        }
        print(json.dumps(result))
        return 0

    fallback_text, fallback_sources = fallback_answer(message, context_sources)
    result = {
        "ok": True,
        "answer": fallback_text,
        "sources": fallback_sources,
        "mode": "python-fallback",
        "latencyMs": round((time.time() - started_at) * 1000),
    }
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

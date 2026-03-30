import json
import os
import re
import sys
import time
from pathlib import Path

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

MODE_SYSTEM_PROMPTS = {
    "professional": """You are Ayush AI in Professional mode.
Rules:
- Prioritize recruiter-relevant clarity and concise professional language.
- Focus on skills, project impact, collaboration style, and role fit.
- Stay grounded in provided knowledge context and avoid unsupported claims.
- If context is insufficient, say so briefly and answer conservatively.""",
    "personal": """You are Ayush AI in Personal mode.
Rules:
- Keep tone warm, human, and curious while staying concise.
- Highlight interests, personality, motivations, and personal context when relevant.
- Stay grounded in provided knowledge context and avoid unsupported claims.
- If context is insufficient, acknowledge it briefly and respond thoughtfully.""",
}

SOURCE_BOOSTS = {
    "professional": {
        "resume.md": 2,
        "projects.md": 2,
        "writing-style.md": 1,
    },
    "personal": {
        "bio.md": 2,
        "personality.md": 2,
        "writing-style.md": 1,
    },
}

PLAYBOOK = [
    {
        "match": ["project", "build", "built", "portfolio"],
        "professional": "Ayush is building ayush.ai as a conversation-first portfolio and maintains a dedicated photography archive. Current focus is deeper AI integration with grounded context retrieval.",
        "personal": "He is currently building ayush.ai as a chat-first personal site and also curates a photography archive. A lot of his momentum is around making the AI experience feel natural and useful.",
        "sources": ["projects.md", "resume.md"],
    },
    {
        "match": ["design", "style", "aesthetic", "ui", "ux"],
        "professional": "His design style is clean, high-contrast, and intentional. The black/red system is designed to be memorable while keeping recruiter scanning speed high.",
        "personal": "His design taste is bold and minimal: strong contrast, intentional typography, and no visual clutter. The black/red palette is meant to feel confident and distinctive.",
        "sources": ["writing-style.md", "personality.md"],
    },
    {
        "match": ["hire", "team", "collaborator", "why"],
        "professional": "Ayush combines practical engineering execution with clear communication and ownership. He moves quickly from idea to implementation while keeping product clarity in focus.",
        "personal": "He is collaborative, direct, and execution-focused. People usually appreciate that he can move from idea to shipped work quickly while still caring about user experience.",
        "sources": ["resume.md", "personality.md"],
    },
    {
        "match": ["interest", "hobby", "outside", "free time"],
        "professional": "Outside coding, Ayush spends time on photography, astronomy, aviation, fitness, and documentaries. These interests influence creativity and attention to detail in project work.",
        "personal": "Outside work, he is into photography, astronomy, aviation, fitness, and documentaries. These interests strongly shape his creative energy and how he thinks about details.",
        "sources": ["bio.md"],
    },
]


def normalize_mode(mode: str) -> str:
    return "personal" if mode == "personal" else "professional"


def tokenize(text: str) -> list[str]:
    normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    return [token for token in normalized.split() if len(token) >= 3 and token not in STOP_WORDS]


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
        blocks = [block.strip() for block in re.split(r"\n\s*\n", content) if block.strip()]
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


def score_chunk(chunk: dict, query_tokens: list[str], mode: str) -> int:
    if not query_tokens:
        return 0

    token_set = set(chunk["tokens"])
    score = sum(1 for token in query_tokens if token in token_set)
    boost = SOURCE_BOOSTS.get(mode, {}).get(chunk["source"], 0)
    return score + boost


def retrieve_context(question: str, mode: str, limit: int = 3) -> list[dict]:
    chunks = load_chunks()
    if not chunks:
        return []

    query_tokens = tokenize(question)
    if not query_tokens:
        scored_default = [
            {
                "source": chunk["source"],
                "text": chunk["text"],
                "score": SOURCE_BOOSTS.get(mode, {}).get(chunk["source"], 0),
            }
            for chunk in chunks
        ]
        scored_default.sort(key=lambda item: item["score"], reverse=True)
        return [{"source": item["source"], "text": item["text"]} for item in scored_default[:limit]]

    scored = []
    for chunk in chunks:
        score = score_chunk(chunk, query_tokens, mode)
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


def fallback_answer(question: str, context_sources: list[str], mode: str) -> tuple[str, list[str]]:
    normalized = question.lower()
    selected = None
    for entry in PLAYBOOK:
        if any(token in normalized for token in entry["match"]):
            selected = entry
            break

    if selected is None:
        selected = {
            "professional": "Good question. Professional mode is active, so I can help most with projects, technical skills, role fit, and collaboration style.",
            "personal": "Great question. Personal mode is active, so ask about interests, working style, motivations, or what Ayush is currently exploring.",
            "sources": ["bio.md", "projects.md", "resume.md"],
        }

    all_sources = list(dict.fromkeys([*selected["sources"], *context_sources]))
    return selected[mode], all_sources


def model_for_mode(mode: str) -> str:
    default_model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")
    if mode == "personal":
        return os.getenv("OPENAI_CHAT_MODEL_PERSONAL", default_model)
    return os.getenv("OPENAI_CHAT_MODEL_PROFESSIONAL", default_model)


def call_openai(question: str, context: list[dict], history: list[dict], mode: str) -> str | None:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        return None

    try:
        from openai import OpenAI  # type: ignore
    except Exception:
        return None

    client = OpenAI(api_key=api_key)
    model = model_for_mode(mode)
    system_prompt = MODE_SYSTEM_PROMPTS[mode]

    context_block = "\n\n".join([f"[{chunk['source']}] {chunk['text']}" for chunk in context])
    history_lines = []
    for item in history[-6:]:
        role = "User" if item.get("role") == "user" else "Assistant"
        content = str(item.get("content", "")).strip()
        if content:
            history_lines.append(f"{role}: {content}")

    prompt = "\n\n".join(
        [
            f"Mode: {mode}",
            "Conversation history:",
            "\n".join(history_lines) if history_lines else "(none)",
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
                {"role": "system", "content": [{"type": "input_text", "text": system_prompt}]},
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
                {"role": "system", "content": system_prompt},
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
    mode = normalize_mode(str(payload.get("mode", "professional")))

    if not isinstance(history, list):
        history = []

    if not message:
        print(json.dumps({"ok": False, "message": "Message is required."}))
        return 1

    context = retrieve_context(message, mode=mode, limit=3)
    context_sources = list(dict.fromkeys([chunk["source"] for chunk in context]))

    ai_text = call_openai(message, context, history, mode)
    if ai_text:
        result = {
            "ok": True,
            "answer": ai_text,
            "sources": context_sources,
            "mode": f"python-openai-{mode}",
            "persona": mode,
            "latencyMs": round((time.time() - started_at) * 1000),
        }
        print(json.dumps(result))
        return 0

    fallback_text, fallback_sources = fallback_answer(message, context_sources, mode)
    result = {
        "ok": True,
        "answer": fallback_text,
        "sources": fallback_sources,
        "mode": f"python-fallback-{mode}",
        "persona": mode,
        "latencyMs": round((time.time() - started_at) * 1000),
    }
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

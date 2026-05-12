const nodeCrypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

require("dotenv").config();

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR
    ? path.resolve(process.env.KNOWLEDGE_DIR)
    : path.resolve(__dirname, "../../frontend/knowledge");

async function main() {
    assertEnv("SUPABASE_URL", SUPABASE_URL);
    assertEnv("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY", SUPABASE_KEY);
    assertEnv("OPENAI_API_KEY", OPENAI_API_KEY);

    const chunks = await readKnowledgeChunks();
    if (chunks.length === 0) {
        console.log("No knowledge chunks found.");
        return;
    }

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content));
    const rows = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index]
    }));

    await upsertKnowledgeChunks(rows);
    console.log(`Synced ${rows.length} knowledge chunks to Supabase.`);
}

async function readKnowledgeChunks() {
    const entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
    const markdownFiles = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
        .map((entry) => entry.name)
        .sort();

    const chunks = [];

    for (const fileName of markdownFiles) {
        const fullPath = path.join(KNOWLEDGE_DIR, fileName);
        const content = await fs.readFile(fullPath, "utf8");
        const blocks = content
            .split(/\n\s*\n/g)
            .map((block) => block.trim())
            .filter(Boolean);

        blocks.forEach((block, index) => {
            chunks.push({
                source: fileName,
                chunk_index: index + 1,
                content: block,
                content_hash: hashContent(block),
                token_count: estimateTokenCount(block)
            });
        });
    }

    return chunks;
}

async function createEmbeddings(texts) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts
        })
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`OpenAI embeddings request failed (${response.status}): ${detail}`);
    }

    const payload = /** @type {{ data: Array<{ embedding: number[] }> }} */ (await response.json());
    return payload.data.map((item) => item.embedding);
}

async function upsertKnowledgeChunks(rows) {
    const url = new URL("/rest/v1/knowledge_chunks", SUPABASE_URL);
    url.searchParams.set("on_conflict", "source,chunk_index");

    const response = await fetch(url, {
        method: "POST",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(rows)
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Supabase knowledge upsert failed (${response.status}): ${detail}`);
    }
}

function hashContent(content) {
    return nodeCrypto.createHash("sha256").update(content).digest("hex");
}

function estimateTokenCount(content) {
    return Math.ceil(content.split(/\s+/).filter(Boolean).length * 1.33);
}

function assertEnv(name, value) {
    if (!value) {
        throw new Error(`${name} is required.`);
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_KNOWLEDGE_DIR = path.resolve(__dirname, "../../../frontend/knowledge");
const DEFAULT_LIMIT = 3;
const CACHE_TTL_MS = 30_000;

const STOP_WORDS = new Set([
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
    "your"
]);

let cache = {
    loadedAt: 0,
    chunks: []
};

function getKnowledgeDirectory() {
    const envDir = process.env.KNOWLEDGE_DIR;
    return envDir ? path.resolve(envDir) : DEFAULT_KNOWLEDGE_DIR;
}

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function chunkMarkdown(sourceName, markdown) {
    return markdown
        .split(/\n\s*\n/g)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block, index) => {
            return {
                id: `${sourceName}#${index + 1}`,
                source: sourceName,
                text: block,
                tokens: tokenize(block)
            };
        });
}

function scoreChunk(chunk, queryTokens) {
    if (queryTokens.length === 0 || chunk.tokens.length === 0) {
        return 0;
    }

    const tokenSet = new Set(chunk.tokens);
    let score = 0;

    for (const token of queryTokens) {
        if (tokenSet.has(token)) {
            score += 1;
        }
    }

    return score;
}

async function readKnowledgeChunks() {
    const knowledgeDir = getKnowledgeDirectory();
    const entries = await fs.readdir(knowledgeDir, { withFileTypes: true });

    const markdownFiles = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
        .map((entry) => entry.name);

    const chunks = [];

    for (const fileName of markdownFiles) {
        const fullPath = path.join(knowledgeDir, fileName);
        const markdown = await fs.readFile(fullPath, "utf8");
        chunks.push(...chunkMarkdown(fileName, markdown));
    }

    return chunks;
}

async function getKnowledgeChunks() {
    const now = Date.now();
    if (now - cache.loadedAt < CACHE_TTL_MS && cache.chunks.length > 0) {
        return cache.chunks;
    }

    const chunks = await readKnowledgeChunks();
    cache = {
        loadedAt: now,
        chunks
    };

    return chunks;
}

async function retrieveRelevantChunks(question, limit = DEFAULT_LIMIT) {
    const chunks = await getKnowledgeChunks();
    const queryTokens = tokenize(question);

    const scored = chunks
        .map((chunk) => {
            return {
                ...chunk,
                score: scoreChunk(chunk, queryTokens)
            };
        })
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
        return chunks.slice(0, limit).map((chunk) => {
            return {
                source: chunk.source,
                text: chunk.text
            };
        });
    }

    return scored.slice(0, limit).map((chunk) => {
        return {
            source: chunk.source,
            text: chunk.text
        };
    });
}

module.exports = {
    retrieveRelevantChunks,
    getKnowledgeDirectory
};

const fs = require("node:fs/promises");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const BACKEND_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_KNOWLEDGE_DIR = path.resolve(__dirname, "../../../frontend/knowledge");
const DEFAULT_PRIVATE_KNOWLEDGE_DIR = path.resolve(BACKEND_ROOT, "private");
const DEFAULT_PERSONAL_PROFILE_PATH = path.resolve(DEFAULT_PRIVATE_KNOWLEDGE_DIR, "profile.md");
const DEFAULT_LIMIT = 3;
const CACHE_TTL_MS = 30_000;
const IGNORED_KNOWLEDGE_FILES = new Set(["readme.md"]);
const SOURCE_BOOSTS = {
    professional: {
        "resume.md": 2,
        "projects.md": 2,
        "writing-style.md": 1
    },
    personal: {
        "profile.md": 4,
        "about-me.md": 3,
        "personality.md": 2,
        "bio.md": 2,
        "writing-style.md": 1
    }
};

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
    cacheKey: "",
    chunks: []
};

function resolveConfiguredPath(configuredPath, fallbackPath) {
    if (!configuredPath) {
        return fallbackPath;
    }

    if (path.isAbsolute(configuredPath)) {
        return configuredPath;
    }

    return path.resolve(PROJECT_ROOT, configuredPath);
}

function getKnowledgeDirectory() {
    return resolveConfiguredPath(process.env.KNOWLEDGE_DIR, DEFAULT_KNOWLEDGE_DIR);
}

function getPrivateKnowledgeDirectory() {
    return resolveConfiguredPath(process.env.PRIVATE_KNOWLEDGE_DIR, DEFAULT_PRIVATE_KNOWLEDGE_DIR);
}

function getPersonalProfilePath() {
    return resolveConfiguredPath(process.env.PERSONAL_PROFILE_PATH, DEFAULT_PERSONAL_PROFILE_PATH);
}

async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function statOrNull(targetPath) {
    try {
        return await fs.stat(targetPath);
    } catch {
        return null;
    }
}

async function resolveKnowledgeSources() {
    const sources = [];
    const seen = new Set();

    async function addSource(targetPath) {
        if (!targetPath || seen.has(targetPath) || !(await pathExists(targetPath))) {
            return;
        }

        seen.add(targetPath);
        const stats = await statOrNull(targetPath);
        if (!stats) {
            return;
        }

        if (stats.isDirectory()) {
            const entries = await fs.readdir(targetPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && isLoadableMarkdownFile(entry.name)) {
                    sources.push(path.join(targetPath, entry.name));
                }
            }
            return;
        }

        if (stats.isFile() && isLoadableMarkdownFile(path.basename(targetPath))) {
            sources.push(targetPath);
        }
    }

    await addSource(getKnowledgeDirectory());
    await addSource(getPrivateKnowledgeDirectory());
    await addSource(getPersonalProfilePath());

    return Array.from(new Set(sources)).sort();
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

function isLoadableMarkdownFile(fileName) {
    const normalized = fileName.toLowerCase();
    return (
        normalized.endsWith(".md") &&
        !normalized.endsWith(".example.md") &&
        !IGNORED_KNOWLEDGE_FILES.has(normalized)
    );
}

function normalizeMode(mode) {
    return mode === "personal" ? "personal" : "professional";
}

function scoreChunk(chunk, queryTokens, mode) {
    if (queryTokens.length === 0 || chunk.tokens.length === 0) {
        return SOURCE_BOOSTS[normalizeMode(mode)][chunk.source] || 0;
    }

    const tokenSet = new Set(chunk.tokens);
    let score = 0;

    for (const token of queryTokens) {
        if (tokenSet.has(token)) {
            score += 1;
        }
    }

    return score + (SOURCE_BOOSTS[normalizeMode(mode)][chunk.source] || 0);
}

async function readKnowledgeChunks() {
    const chunks = [];
    const markdownFiles = await resolveKnowledgeSources();

    for (const fullPath of markdownFiles) {
        const markdown = await fs.readFile(fullPath, "utf8");
        chunks.push(...chunkMarkdown(path.basename(fullPath), markdown));
    }

    return chunks;
}

async function getKnowledgeChunks() {
    const now = Date.now();
    const cacheKey = [
        getKnowledgeDirectory(),
        getPrivateKnowledgeDirectory(),
        getPersonalProfilePath()
    ].join("|");

    if (
        now - cache.loadedAt < CACHE_TTL_MS &&
        cache.cacheKey === cacheKey &&
        cache.chunks.length > 0
    ) {
        return cache.chunks;
    }

    const chunks = await readKnowledgeChunks();
    cache = {
        loadedAt: now,
        cacheKey,
        chunks
    };

    return chunks;
}

async function retrieveRelevantChunks(question, limit = DEFAULT_LIMIT, mode = "professional") {
    const chunks = await getKnowledgeChunks();
    const queryTokens = tokenize(question);
    const normalizedMode = normalizeMode(mode);

    if (queryTokens.length === 0) {
        return chunks
            .map((chunk) => {
                return {
                    source: chunk.source,
                    text: chunk.text,
                    score: SOURCE_BOOSTS[normalizedMode][chunk.source] || 0
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((chunk) => {
                return {
                    source: chunk.source,
                    text: chunk.text
                };
            });
    }

    const scored = chunks
        .map((chunk) => {
            return {
                ...chunk,
                score: scoreChunk(chunk, queryTokens, normalizedMode)
            };
        })
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
        return chunks
            .map((chunk) => {
                return {
                    source: chunk.source,
                    text: chunk.text,
                    score: SOURCE_BOOSTS[normalizedMode][chunk.source] || 0
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((chunk) => {
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
    getKnowledgeDirectory,
    getPrivateKnowledgeDirectory,
    getPersonalProfilePath
};

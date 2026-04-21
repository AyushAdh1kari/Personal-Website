const path = require("node:path");
const { spawn } = require("node:child_process");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { retrieveRelevantChunks } = require("./lib/knowledge");
const { buildFallbackAnswer } = require("./services/fallbackResponder");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = Number(process.env.PORT || 3001);
const pythonTimeoutMs = Number(process.env.PYTHON_TIMEOUT_MS || 12_000);
const maxMessageLength = Number(process.env.MAX_MESSAGE_LENGTH || 500);
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitChatMax = Number(process.env.RATE_LIMIT_CHAT_MAX || 30);
const aiScriptPath = path.resolve(__dirname, "../ai/chat_engine.py");

const frontendOrigin = process.env.FRONTEND_ORIGIN;
const corsOptions = frontendOrigin
    ? {
          origin: frontendOrigin.split(",").map((origin) => origin.trim())
      }
    : {
          origin: true
      };

app.use(cors(corsOptions));
app.use(express.json());

const chatRateLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    maxRequests: rateLimitChatMax
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "ayush-ai-backend",
        aiLayer: "python",
        supportedModes: ["professional", "personal"]
    });
});

app.post("/api/chat", chatRateLimiter, async (req, res) => {
    const startedAt = Date.now();
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = normalizeHistory(req.body?.history);
    const mode = normalizeMode(req.body?.mode);

    if (!message) {
        return res.status(400).json({
            ok: false,
            message: "Message is required."
        });
    }

    if (message.length > maxMessageLength) {
        return res.status(400).json({
            ok: false,
            message: `Message must be ${maxMessageLength} characters or fewer.`
        });
    }

    try {
        const pythonResponse = await runPythonAiLayer({
            message,
            history,
            mode
        });

        if (pythonResponse.warning) {
            console.warn("[ai] Python layer returned fallback warning:", pythonResponse.warning);
        }

        return res.status(200).json({
            ok: true,
            answer: pythonResponse.answer,
            sources: normalizeSources(pythonResponse.sources),
            mode: pythonResponse.mode || "python-openai",
            persona: mode,
            latencyMs: Date.now() - startedAt,
            ...(pythonResponse.warning ? { warning: pythonResponse.warning } : {})
        });
    } catch (error) {
        console.error("[ai] Python AI layer unavailable:", error);
        const relevantChunks = await retrieveRelevantChunks(message, 3, mode).catch(() => []);
        const retrievalSources = relevantChunks.map((chunk) => chunk.source);
        const fallback = buildFallbackAnswer(message, retrievalSources, mode);

        return res.status(200).json({
            ok: true,
            answer: fallback.answer,
            sources: fallback.sources,
            mode: "fallback-node",
            persona: mode,
            latencyMs: Date.now() - startedAt,
            warning: "python_ai_unavailable"
        });
    }
});

function normalizeSources(sources) {
    if (!Array.isArray(sources)) {
        return [];
    }

    return Array.from(new Set(sources.filter((source) => typeof source === "string")));
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .map((entry) => {
            const role = entry?.role === "assistant" ? "assistant" : "user";
            const content = typeof entry?.content === "string" ? entry.content.trim() : "";
            return { role, content };
        })
        .filter((entry) => entry.content.length > 0)
        .slice(-8);
}

function normalizeMode(mode) {
    return mode === "personal" ? "personal" : "professional";
}

function createRateLimiter(options) {
    const windowMs = Number(options.windowMs);
    const maxRequests = Number(options.maxRequests);
    const entries = new Map();

    return function rateLimitMiddleware(req, res, next) {
        const now = Date.now();
        const key = resolveClientKey(req);
        const entry = entries.get(key);

        if (!entry || now >= entry.resetAt) {
            entries.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            setRateLimitHeaders(res, maxRequests, maxRequests - 1, now + windowMs);
            cleanupRateLimitEntries(entries, now);
            next();
            return;
        }

        entry.count += 1;
        const remaining = Math.max(0, maxRequests - entry.count);
        setRateLimitHeaders(res, maxRequests, remaining, entry.resetAt);

        if (entry.count > maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader("Retry-After", retryAfterSeconds);
            res.status(429).json({
                ok: false,
                message: "Rate limit exceeded. Please retry shortly."
            });
            return;
        }

        cleanupRateLimitEntries(entries, now);
        next();
    };
}

function resolveClientKey(req) {
    const header = req.headers["x-forwarded-for"];
    if (typeof header === "string" && header.trim() !== "") {
        return header.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
}

function setRateLimitHeaders(res, limit, remaining, resetAtMs) {
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAtMs / 1000)));
}

function cleanupRateLimitEntries(entries, now) {
    if (entries.size < 2000) {
        return;
    }

    for (const [key, value] of entries.entries()) {
        if (value.resetAt <= now) {
            entries.delete(key);
        }
    }
}

function getPythonCandidates() {
    const explicitBinary = process.env.PYTHON_BIN;
    if (explicitBinary) {
        return [{ command: explicitBinary, args: [] }];
    }

    if (process.platform === "win32") {
        return [
            { command: "py", args: ["-3"] },
            { command: "python", args: [] }
        ];
    }

    return [
        { command: "python3", args: [] },
        { command: "python", args: [] }
    ];
}

async function runPythonAiLayer(payload) {
    const candidates = getPythonCandidates();
    let lastError = null;

    for (const candidate of candidates) {
        try {
            return await runPythonCandidate(candidate, payload);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("No Python runtime available.");
}

function runPythonCandidate(candidate, payload) {
    return new Promise((resolve, reject) => {
        const child = spawn(candidate.command, [...candidate.args, aiScriptPath], {
            cwd: path.resolve(__dirname, ".."),
            env: process.env
        });

        let stdout = "";
        let stderr = "";
        let completed = false;

        const timeoutHandle = setTimeout(() => {
            if (completed) {
                return;
            }
            completed = true;
            child.kill();
            reject(new Error(`Python AI layer timeout (${pythonTimeoutMs}ms).`));
        }, pythonTimeoutMs);

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", (error) => {
            if (completed) {
                return;
            }
            completed = true;
            clearTimeout(timeoutHandle);
            reject(error);
        });

        child.on("close", (code) => {
            if (completed) {
                return;
            }
            completed = true;
            clearTimeout(timeoutHandle);

            if (code !== 0) {
                reject(new Error(stderr || `Python process exited with code ${code}.`));
                return;
            }

            try {
                const parsed = JSON.parse(stdout || "{}");
                if (typeof parsed.answer !== "string" || parsed.answer.trim() === "") {
                    reject(new Error("Python response missing answer."));
                    return;
                }
                resolve(parsed);
            } catch (error) {
                reject(error);
            }
        });

        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();
    });
}

app.listen(port, () => {
    console.log(`Backend API listening on http://localhost:${port}`);
});

const nodeCrypto = require("node:crypto");

const { insertChatEvent, isDatabaseConfigured, listChatEvents } = require("./database");

const MAX_EVENTS = Number(process.env.ANALYTICS_MAX_EVENTS || 500);
const INCLUDE_PROMPT_PREVIEWS = process.env.ANALYTICS_INCLUDE_PROMPTS === "true";
const TOPIC_RULES = [
    { label: "Projects", tokens: ["project", "portfolio", "build", "built", "github"] },
    { label: "Hiring", tokens: ["hire", "hiring", "team", "collaborator", "fit"] },
    { label: "Skills", tokens: ["skill", "stack", "tech", "technology", "python", "java"] },
    { label: "Design", tokens: ["design", "style", "ui", "ux", "aesthetic"] },
    { label: "Personal", tokens: ["interest", "hobby", "outside", "personality", "story"] },
    { label: "Resume", tokens: ["resume", "experience", "education", "northeastern"] }
];

const events = [];

async function recordChatEvent(event) {
    const normalized = createChatEvent(event);
    events.push(normalized);

    if (events.length > MAX_EVENTS) {
        events.splice(0, events.length - MAX_EVENTS);
    }

    if (isDatabaseConfigured()) {
        try {
            const inserted = await insertChatEvent(normalized);
            if (inserted?.id) {
                normalized.id = inserted.id;
                normalized.storage = "supabase";
            }
        } catch {
            normalized.storage = "memory";
        }
    }

    return {
        id: normalized.id,
        storage: normalized.storage
    };
}

async function buildAnalyticsSnapshot() {
    if (isDatabaseConfigured()) {
        try {
            const rows = await listChatEvents(MAX_EVENTS);
            if (Array.isArray(rows)) {
                return buildSnapshotFromEvents(rows.map(mapDatabaseEvent), "supabase");
            }
        } catch {
            return buildSnapshotFromEvents(events, "memory", "database_unavailable");
        }
    }

    return buildSnapshotFromEvents(events, "memory");
}

function createChatEvent(event) {
    const recordedAt = new Date();
    const message = typeof event.message === "string" ? event.message : "";
    const sources = Array.isArray(event.sources) ? event.sources : [];

    return {
        id: `${recordedAt.getTime()}-${events.length}`,
        timestamp: recordedAt.toISOString(),
        mode: event.mode === "personal" ? "personal" : "professional",
        responseMode: normalizeResponseMode(event.responseMode),
        latencyMs: Math.max(0, Number(event.latencyMs || 0)),
        sourceCount: sources.length,
        sources,
        topic: classifyPrompt(message),
        promptLength: message.length,
        promptHash: hashPrompt(message),
        promptPreview: INCLUDE_PROMPT_PREVIEWS ? sanitizePromptPreview(message) : "",
        storage: isDatabaseConfigured() ? "pending" : "memory"
    };
}

function mapDatabaseEvent(row) {
    const sources = Array.isArray(row.sources) ? row.sources : [];

    return {
        id: row.id,
        timestamp: row.created_at,
        mode: row.mode,
        responseMode: row.response_mode,
        latencyMs: Number(row.latency_ms || 0),
        sourceCount: sources.length,
        sources,
        topic: row.topic || "General",
        promptLength: Number(row.prompt_length || 0),
        promptPreview: row.prompt_preview || "",
        storage: "supabase"
    };
}

function buildSnapshotFromEvents(sourceEvents, storage, warning) {
    const now = Date.now();
    const chronologicalEvents = [...sourceEvents].sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
    );
    const last24Hours = chronologicalEvents.filter(
        (event) => now - Date.parse(event.timestamp) <= 24 * 60 * 60 * 1000
    );
    const totalMessages = chronologicalEvents.length;
    const latencies = chronologicalEvents.map((event) => event.latencyMs).sort((a, b) => a - b);

    return {
        ok: true,
        generatedAt: new Date(now).toISOString(),
        storage,
        warning,
        retention: {
            maxEvents: MAX_EVENTS,
            storedEvents: totalMessages,
            promptPreviewsEnabled: INCLUDE_PROMPT_PREVIEWS
        },
        summary: {
            totalMessages,
            last24Hours: last24Hours.length,
            averageLatencyMs: Math.round(average(latencies)),
            p95LatencyMs: percentile(latencies, 0.95),
            averageSourcesPerAnswer: roundOne(
                average(chronologicalEvents.map((event) => event.sourceCount))
            )
        },
        modes: countBy(chronologicalEvents, "mode"),
        responseModes: countBy(chronologicalEvents, "responseMode"),
        topics: countBy(chronologicalEvents, "topic"),
        sources: countSources(chronologicalEvents),
        timeline: buildHourlyTimeline(chronologicalEvents, now),
        recent: chronologicalEvents
            .slice(-12)
            .reverse()
            .map((event) => ({
                id: event.id,
                timestamp: event.timestamp,
                mode: event.mode,
                responseMode: event.responseMode,
                latencyMs: event.latencyMs,
                topic: event.topic,
                promptLength: event.promptLength,
                promptPreview: event.promptPreview,
                sources: event.sources
            }))
    };
}

function hashPrompt(message) {
    return nodeCrypto.createHash("sha256").update(message.trim().toLowerCase()).digest("hex");
}

function normalizeResponseMode(responseMode) {
    const value = typeof responseMode === "string" ? responseMode : "";
    if (value.includes("openai")) {
        return "openai";
    }
    if (value.includes("fallback")) {
        return "fallback";
    }
    return value || "unknown";
}

function classifyPrompt(message) {
    const normalized = message.toLowerCase();
    const match = TOPIC_RULES.find((rule) => {
        return rule.tokens.some((token) => normalized.includes(token));
    });

    return match ? match.label : "General";
}

function sanitizePromptPreview(message) {
    return message.replace(/\s+/g, " ").trim().slice(0, 120);
}

function average(values) {
    if (values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues, percentileValue) {
    if (sortedValues.length === 0) {
        return 0;
    }

    const index = Math.ceil(sortedValues.length * percentileValue) - 1;
    return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function roundOne(value) {
    return Math.round(value * 10) / 10;
}

function countBy(items, key) {
    return items.reduce((counts, item) => {
        const value = item[key] || "unknown";
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}

function countSources(items) {
    const counts = {};

    items.forEach((item) => {
        item.sources.forEach((source) => {
            counts[source] = (counts[source] || 0) + 1;
        });
    });

    return counts;
}

function buildHourlyTimeline(items, now) {
    const buckets = [];

    for (let i = 23; i >= 0; i -= 1) {
        const bucketStart = new Date(now - i * 60 * 60 * 1000);
        bucketStart.setMinutes(0, 0, 0);
        buckets.push({
            hour: bucketStart.toISOString(),
            count: 0,
            averageLatencyMs: 0,
            latencyTotal: 0
        });
    }

    const bucketByHour = new Map(buckets.map((bucket) => [bucket.hour, bucket]));

    items.forEach((item) => {
        const timestamp = Date.parse(item.timestamp);
        if (Number.isNaN(timestamp) || now - timestamp > 24 * 60 * 60 * 1000) {
            return;
        }

        const hour = new Date(timestamp);
        hour.setMinutes(0, 0, 0);
        const bucket = bucketByHour.get(hour.toISOString());
        if (!bucket) {
            return;
        }

        bucket.count += 1;
        bucket.latencyTotal += item.latencyMs;
        bucket.averageLatencyMs = Math.round(bucket.latencyTotal / bucket.count);
    });

    return buckets.map(({ hour, count, averageLatencyMs }) => ({
        hour,
        count,
        averageLatencyMs
    }));
}

module.exports = {
    buildAnalyticsSnapshot,
    recordChatEvent
};

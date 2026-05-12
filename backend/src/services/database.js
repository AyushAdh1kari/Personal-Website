const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

function isDatabaseConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function insertChatEvent(event) {
    if (!isDatabaseConfigured()) {
        return null;
    }

    const rows = await supabaseRequest("/rest/v1/chat_events", {
        method: "POST",
        headers: {
            Prefer: "return=representation"
        },
        body: {
            mode: event.mode,
            response_mode: event.responseMode,
            latency_ms: event.latencyMs,
            sources: event.sources,
            topic: event.topic,
            prompt_length: event.promptLength,
            prompt_hash: event.promptHash,
            prompt_preview: event.promptPreview || null
        }
    });

    return Array.isArray(rows) ? rows[0] : null;
}

async function listChatEvents(limit) {
    if (!isDatabaseConfigured()) {
        return null;
    }

    return await supabaseRequest("/rest/v1/chat_events", {
        searchParams: {
            select: "id,created_at,mode,response_mode,latency_ms,sources,topic,prompt_length,prompt_preview",
            order: "created_at.desc",
            limit: String(limit)
        }
    });
}

async function insertMessageFeedback(feedback) {
    if (!isDatabaseConfigured()) {
        return null;
    }

    const rows = await supabaseRequest("/rest/v1/message_feedback", {
        method: "POST",
        headers: {
            Prefer: "return=representation"
        },
        body: {
            chat_event_id: feedback.chatEventId,
            rating: feedback.rating,
            correction: feedback.correction || null,
            metadata: feedback.metadata || {}
        }
    });

    return Array.isArray(rows) ? rows[0] : null;
}

async function supabaseRequest(path, options = {}) {
    const url = new URL(path, SUPABASE_URL);
    const searchParams = options.searchParams || {};

    Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Supabase request failed (${response.status}): ${detail}`);
    }

    if (response.status === 204) {
        return null;
    }

    return await response.json();
}

module.exports = {
    insertChatEvent,
    insertMessageFeedback,
    isDatabaseConfigured,
    listChatEvents
};

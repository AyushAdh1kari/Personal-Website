const { insertMessageFeedback, isDatabaseConfigured } = require("./database");

const MAX_LOCAL_FEEDBACK = Number(process.env.FEEDBACK_MAX_EVENTS || 200);
const localFeedback = [];

async function recordMessageFeedback(feedback) {
    const normalized = {
        chatEventId: typeof feedback.chatEventId === "string" ? feedback.chatEventId : "",
        rating: normalizeRating(feedback.rating),
        correction: normalizeCorrection(feedback.correction),
        metadata:
            feedback.metadata && typeof feedback.metadata === "object" ? feedback.metadata : {}
    };

    if (!normalized.chatEventId) {
        throw new Error("chatEventId is required.");
    }

    if (isDatabaseConfigured()) {
        const inserted = await insertMessageFeedback(normalized);
        if (inserted) {
            return {
                id: inserted.id,
                storage: "supabase"
            };
        }
    }

    const local = {
        id: `feedback-${Date.now()}-${localFeedback.length}`,
        createdAt: new Date().toISOString(),
        ...normalized
    };

    localFeedback.push(local);
    if (localFeedback.length > MAX_LOCAL_FEEDBACK) {
        localFeedback.splice(0, localFeedback.length - MAX_LOCAL_FEEDBACK);
    }

    return {
        id: local.id,
        storage: "memory"
    };
}

function normalizeRating(rating) {
    if (rating === "positive" || rating === "negative") {
        return rating;
    }

    throw new Error("rating must be positive or negative.");
}

function normalizeCorrection(correction) {
    if (typeof correction !== "string") {
        return "";
    }

    return correction.trim().slice(0, 1000);
}

module.exports = {
    recordMessageFeedback
};

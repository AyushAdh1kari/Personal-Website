const RESPONSE_PLAYBOOK = [
    {
        match: ["project", "build", "built", "portfolio"],
        professional:
            "Ayush is building ayush.ai as a conversation-first portfolio and also maintains a dedicated photography archive. The ongoing roadmap includes stronger AI integration and retrieval-backed answers.",
        personal:
            "He is currently building ayush.ai as a chat-first personal site and also curates a photography archive. A lot of his current momentum is around making the AI experience feel more natural and grounded.",
        sources: ["projects.md", "resume.md"]
    },
    {
        match: ["design", "style", "aesthetic", "ui", "ux"],
        professional:
            "His design style is clean, high-contrast, and intentional. The black/red visual system is built to feel memorable while staying easy to scan for recruiters and collaborators.",
        personal:
            "His design taste leans bold and minimal: strong contrast, intentional typography, and no visual noise. The black/red palette is meant to feel confident without being flashy.",
        sources: ["writing-style.md", "personality.md"]
    },
    {
        match: ["hire", "team", "collaborator", "why"],
        professional:
            "Ayush combines practical engineering with strong communication and ownership. He tends to move quickly from idea to implementation while keeping user experience and clarity in focus.",
        personal:
            "He is collaborative, direct, and execution-focused. People usually appreciate that he can move from idea to shipped work quickly while still caring about user experience.",
        sources: ["resume.md", "personality.md"]
    },
    {
        match: ["interest", "hobby", "outside", "free time"],
        professional:
            "Outside of coding, Ayush spends time on photography, astronomy, aviation, fitness, and documentaries. Those interests shape both his creativity and attention to detail.",
        personal:
            "Outside work, he is into photography, astronomy, aviation, fitness, and documentaries. Those interests strongly influence how he thinks about creativity and precision.",
        sources: ["bio.md"]
    },
    {
        match: ["skill", "stack", "technology", "tech"],
        professional:
            "Current strengths include Python and Java with a product-minded builder approach. The next technical step is integrating OpenAI and retrieval workflows for grounded chat responses.",
        personal:
            "His current stack is centered around Python and Java, with a practical builder mindset. Right now, he is focused on making the AI layer more reliable and context-aware.",
        sources: ["resume.md", "projects.md"]
    }
];

function normalizeMode(mode) {
    return mode === "personal" ? "personal" : "professional";
}

function buildFallbackAnswer(question, retrievalSources = [], mode = "professional") {
    const normalizedMode = normalizeMode(mode);
    const normalized = question.toLowerCase();
    let selected = null;

    for (const entry of RESPONSE_PLAYBOOK) {
        const isMatch = entry.match.some((token) => normalized.includes(token));
        if (isMatch) {
            selected = entry;
            break;
        }
    }

    if (!selected) {
        selected = {
            professional:
                "Good question. The full AI integration is now in progress. Ask about projects, technical skills, design style, interests, or hiring fit for the most useful results.",
            personal:
                "Great question. AI mode tuning is in progress, but I can still help. Ask about projects, interests, skills, or what Ayush is currently focused on.",
            sources: ["bio.md", "projects.md", "resume.md"]
        };
    }

    const combinedSources = [...selected.sources, ...retrievalSources];
    const uniqueSources = Array.from(new Set(combinedSources));

    return {
        answer: selected[normalizedMode],
        sources: uniqueSources
    };
}

module.exports = {
    buildFallbackAnswer
};

const RESPONSE_PLAYBOOK = [
    {
        match: ["project", "build", "built", "portfolio"],
        answer: "Ayush is building ayush.ai as a conversation-first portfolio and also maintains a dedicated photography archive. The ongoing roadmap includes stronger AI integration and retrieval-backed answers.",
        sources: ["projects.md", "resume.md"]
    },
    {
        match: ["design", "style", "aesthetic", "ui", "ux"],
        answer: "His design style is clean, high-contrast, and intentional. The black/red visual system is built to feel memorable while staying easy to scan for recruiters and collaborators.",
        sources: ["writing-style.md", "personality.md"]
    },
    {
        match: ["hire", "team", "collaborator", "why"],
        answer: "Ayush combines practical engineering with strong communication and ownership. He tends to move quickly from idea to implementation while keeping user experience and clarity in focus.",
        sources: ["resume.md", "personality.md"]
    },
    {
        match: ["interest", "hobby", "outside", "free time"],
        answer: "Outside of coding, Ayush spends time on photography, astronomy, aviation, fitness, and documentaries. Those interests shape both his creativity and attention to detail.",
        sources: ["bio.md"]
    },
    {
        match: ["skill", "stack", "technology", "tech"],
        answer: "Current strengths include Python and Java with a product-minded builder approach. The next technical step is integrating OpenAI and retrieval workflows for grounded chat responses.",
        sources: ["resume.md", "projects.md"]
    }
];

function buildFallbackAnswer(question, retrievalSources = []) {
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
            answer: "Good question. The full AI integration is now in progress. Ask about projects, technical skills, design style, interests, or hiring fit for the most useful results.",
            sources: ["bio.md", "projects.md", "resume.md"]
        };
    }

    const combinedSources = [...selected.sources, ...retrievalSources];
    const uniqueSources = Array.from(new Set(combinedSources));

    return {
        answer: selected.answer,
        sources: uniqueSources
    };
}

module.exports = {
    buildFallbackAnswer
};

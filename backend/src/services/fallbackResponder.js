const RESPONSE_PLAYBOOK = [
    {
        match: ["project", "build", "built", "portfolio"],
        professional:
            "Ayush is building ai.yush as a conversation-first portfolio and also maintains a dedicated photography archive. The ongoing roadmap includes stronger AI integration and retrieval-backed answers.",
        personal:
            "I'm currently building ai.yush as a chat-first personal site, and I also curate a photography archive. A lot of my current momentum is around making the AI experience feel more natural and grounded.",
        sources: ["projects.md", "resume.md"]
    },
    {
        match: ["design", "style", "aesthetic", "ui", "ux"],
        professional:
            "His design style is clean, high-contrast, and intentional. The black/red visual system is built to feel memorable while staying easy to scan for recruiters and collaborators.",
        personal:
            "My design taste leans bold and minimal: strong contrast, intentional typography, and no visual noise. I want the black/red palette to feel confident without being flashy.",
        sources: ["writing-style.md", "personality.md"]
    },
    {
        match: ["hire", "team", "collaborator", "why"],
        professional:
            "Ayush combines practical engineering with strong communication and ownership. He tends to move quickly from idea to implementation while keeping user experience and clarity in focus.",
        personal:
            "I'm collaborative, direct, and execution-focused. I like moving from idea to shipped work quickly while still caring about user experience.",
        sources: ["resume.md", "personality.md"]
    },
    {
        match: ["interest", "hobby", "outside", "free time"],
        professional:
            "Outside of coding, Ayush spends time on photography, astronomy, aviation, fitness, and documentaries. Those interests shape both his creativity and attention to detail.",
        personal:
            "Outside work, I'm into photography, astronomy, aviation, fitness, and documentaries. Those interests strongly influence how I think about creativity and precision.",
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
                "Happy to help — try asking about projects, technical skills, design style, interests, or hiring fit for the most grounded answers.",
            personal:
                "Happy to talk more personally. Ask about my interests, motivations, routines, working style, or anything else that helps you get a better sense of who I am.",
            sources: ["profile.md", "bio.md", "projects.md", "resume.md"]
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

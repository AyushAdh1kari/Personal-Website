/**
 * @param {HTMLImageElement} imgElem
 * @param {string} date
 * @param {string} loc
 */
function openExpander(imgElem, date, loc) {
    var expander = document.getElementById("photoExpander");
    /** @type {HTMLImageElement | null} */
    var expanderImage = /** @type {HTMLImageElement | null} */ (
        document.getElementById("expanderImage")
    );
    var expanderInfo = document.getElementById("expanderInfo");

    if (!expander || !expanderImage || !expanderInfo) {
        return;
    }

    expander.style.display = "flex";
    expanderImage.src = imgElem.src;
    expanderImage.alt = imgElem.alt || "Expanded photo";
    expanderInfo.innerHTML = date + "<br>" + loc;

    expander.onclick = function (event) {
        if (event.target === expander) {
            closeExpander();
        }
    };
}

function closeExpander() {
    var expander = document.getElementById("photoExpander");
    if (expander) {
        expander.style.display = "none";
    }
}

const LOCAL_RESPONSE_PLAYBOOK = [
    {
        match: ["project", "build", "built", "portfolio"],
        answer: "Ayush is building ayush.ai as a conversation-first portfolio, maintains a dedicated photography archive, and is growing a project stack that combines engineering and design thinking.",
        sources: ["projects.md", "resume.md"]
    },
    {
        match: ["design", "style", "aesthetic", "theme", "ui"],
        answer: "His design style is clean, high-contrast, and intentional. The black/red system is meant to feel bold while keeping content easy to scan for recruiters.",
        sources: ["writing-style.md", "personality.md"]
    },
    {
        match: ["hire", "why", "team", "collaborator"],
        answer: "Ayush brings a strong combination of technical execution, curiosity, and communication. He moves quickly from idea to implementation while caring about product clarity.",
        sources: ["resume.md", "personality.md"]
    },
    {
        match: ["interest", "hobby", "outside", "free time"],
        answer: "Outside of coding, Ayush is into photography, astronomy, aviation, fitness, and documentaries. Those interests influence his creative direction across projects.",
        sources: ["bio.md"]
    },
    {
        match: ["skill", "stack", "technology", "tech"],
        answer: "Current strengths include Python, Java, and practical software workflows. The roadmap includes OpenAI, embeddings, and retrieval-backed chat responses.",
        sources: ["resume.md", "projects.md"]
    }
];

const CHAT_HISTORY_LIMIT = 8;
const API_TIMEOUT_MS = 10_000;
const chatHistory = [];
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", function () {
    wireChatDemo();

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeExpander();
        }
    });
});

function wireChatDemo() {
    const chatForm = /** @type {HTMLFormElement | null} */ (document.getElementById("chatForm"));
    const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById("chatInput"));
    /** @type {HTMLElement | null} */
    const chatMessages = document.getElementById("chatMessages");

    if (!chatForm || !chatInput || !chatMessages) {
        return;
    }

    const promptButtons = document.querySelectorAll(".prompt-btn");

    promptButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const promptText = button.getAttribute("data-prompt");
            if (promptText) {
                submitPrompt(promptText, chatMessages, chatInput);
            }
        });
    });

    chatForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const question = chatInput.value.trim();
        if (!question) {
            return;
        }
        submitPrompt(question, chatMessages, chatInput);
    });
}

/**
 * @param {string} question
 * @param {HTMLElement} chatMessages
 * @param {HTMLInputElement} chatInput
 */
async function submitPrompt(question, chatMessages, chatInput) {
    if (isSubmitting) {
        return;
    }

    isSubmitting = true;
    appendBubble(chatMessages, "user", question);
    chatInput.value = "";

    const typingBubble = appendTyping(chatMessages);
    let chatResponse;

    try {
        chatResponse = await requestBackendResponse(question, chatHistory);
    } catch {
        chatResponse = buildLocalFallback(question);
    }

    if (typingBubble && typingBubble.parentNode) {
        typingBubble.parentNode.removeChild(typingBubble);
    }

    appendBubble(chatMessages, "assistant", chatResponse.answer, chatResponse.sources);
    pushHistory("user", question);
    pushHistory("assistant", chatResponse.answer);
    isSubmitting = false;
}

/**
 * @param {string} role
 * @param {string} content
 */
function pushHistory(role, content) {
    chatHistory.push({ role, content });

    if (chatHistory.length > CHAT_HISTORY_LIMIT) {
        chatHistory.splice(0, chatHistory.length - CHAT_HISTORY_LIMIT);
    }
}

/**
 * @param {string} question
 * @param {Array<{role: string, content: string}>} history
 */
async function requestBackendResponse(question, history) {
    const apiBaseUrl = resolveApiBaseUrl();
    const endpoint = apiBaseUrl + "/api/chat";
    const controller = new AbortController();
    const timeoutHandle = setTimeout(function () {
        controller.abort();
    }, API_TIMEOUT_MS);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question,
                history: history.slice(-6)
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error("Backend response was not OK.");
        }

        const payload = await response.json();
        if (!payload || typeof payload.answer !== "string" || payload.answer.trim() === "") {
            throw new Error("Backend payload is missing answer.");
        }

        return {
            answer: payload.answer,
            sources: Array.isArray(payload.sources) ? payload.sources : [],
            mode: typeof payload.mode === "string" ? payload.mode : "backend"
        };
    } finally {
        clearTimeout(timeoutHandle);
    }
}

function resolveApiBaseUrl() {
    const explicit = window["__AYUSH_API_BASE_URL"];
    if (typeof explicit === "string" && explicit.trim() !== "") {
        return explicit.replace(/\/+$/, "");
    }
    return "http://localhost:3001";
}

/**
 * @param {string} question
 */
function buildLocalFallback(question) {
    const normalized = question.toLowerCase();

    for (let i = 0; i < LOCAL_RESPONSE_PLAYBOOK.length; i += 1) {
        const entry = LOCAL_RESPONSE_PLAYBOOK[i];
        const isMatch = entry.match.some(function (token) {
            return normalized.includes(token);
        });

        if (isMatch) {
            return {
                answer: entry.answer,
                sources: entry.sources,
                mode: "fallback-local"
            };
        }
    }

    return {
        answer: "Good question. The full AI backend is in progress. Ask about projects, skills, design style, interests, or hiring fit for the strongest answers.",
        sources: ["bio.md", "projects.md", "resume.md"],
        mode: "fallback-local"
    };
}

function appendBubble(container, role, message, sources) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + role;

    const label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : "Ayush AI";

    const body = document.createElement("div");
    body.textContent = message;

    bubble.appendChild(label);
    bubble.appendChild(body);

    if (sources && sources.length > 0) {
        const sourceRow = document.createElement("div");
        sourceRow.className = "sources";

        sources.forEach(function (sourceName) {
            const chip = document.createElement("span");
            chip.className = "source-chip";
            chip.textContent = sourceName;
            sourceRow.appendChild(chip);
        });

        bubble.appendChild(sourceRow);
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return bubble;
}

function appendTyping(container) {
    const bubble = document.createElement("div");
    bubble.className = "bubble assistant";

    const label = document.createElement("strong");
    label.textContent = "Ayush AI";

    const typing = document.createElement("div");
    typing.className = "typing";

    for (let i = 0; i < 3; i += 1) {
        typing.appendChild(document.createElement("span"));
    }

    bubble.appendChild(label);
    bubble.appendChild(typing);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return bubble;
}

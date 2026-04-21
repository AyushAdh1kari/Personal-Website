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

const CHAT_MODES = {
    professional: {
        label: "Professional",
        description: "Recruiters, projects, fit."
    },
    personal: {
        label: "Personal",
        description: "Personality, interests, story."
    }
};
const BOT_NAME = "ai.yush";

const LOCAL_RESPONSE_PLAYBOOK = [
    {
        match: ["project", "build", "built", "portfolio"],
        professional:
            "Ayush is building ai.yush as a conversation-first portfolio, maintains a dedicated photography archive, and is growing a project stack that combines engineering and design thinking.",
        personal:
            "I'm currently building ai.yush as a chat-first personal site, and I also curate a photography archive. A lot of my momentum right now is making the AI experience feel natural and grounded.",
        sources: ["projects.md", "resume.md"]
    },
    {
        match: ["design", "style", "aesthetic", "theme", "ui"],
        professional:
            "His design style is clean, high-contrast, and intentional. The black/red system is meant to feel bold while staying easy to scan for recruiters.",
        personal:
            "My visual style leans bold and minimal: strong contrast, intentional typography, and no unnecessary clutter. I want the black/red palette to feel confident and memorable.",
        sources: ["writing-style.md", "personality.md"]
    },
    {
        match: ["hire", "why", "team", "collaborator"],
        professional:
            "Ayush brings a strong combination of technical execution, curiosity, and communication. He moves quickly from idea to implementation while caring about product clarity.",
        personal:
            "I'm collaborative, direct, and execution-focused. I like moving from ideas to shipped work quickly while still caring about user experience.",
        sources: ["resume.md", "personality.md"]
    },
    {
        match: ["interest", "hobby", "outside", "free time"],
        professional:
            "Outside of coding, Ayush is into photography, astronomy, aviation, fitness, and documentaries. Those interests influence his creative direction across projects.",
        personal:
            "Outside work, I spend a lot of time on photography, astronomy, and aviation, plus fitness and documentaries. Those interests strongly shape how I think and create.",
        sources: ["bio.md"]
    },
    {
        match: ["skill", "stack", "technology", "tech"],
        professional:
            "Current strengths include Python, Java, and practical software workflows. The roadmap includes OpenAI, embeddings, and retrieval-backed chat responses.",
        personal:
            "My current stack is centered around Python and Java with a practical builder mindset. Right now I'm focused on making the AI layer more reliable and context-aware.",
        sources: ["resume.md", "projects.md"]
    }
];

const HUB_EXIT_MESSAGES = {
    "ai-yush.html": [
        "ai.yush awaits you.",
        "go ahead, ask it something weird.",
        "it knows more than it lets on."
    ],
    "about.html": [
        "Who is Ayush?",
        "just a guy with too many tabs open.",
        "nepali kid who ended up in boston somehow."
    ],
    "projects.html": [
        "The grind never ends...",
        "shipping things nobody asked for.",
        "yes, I built that at 2am."
    ],
    "experiences.html": [
        "Still working on it...",
        "credentials loading...",
        "harvard, amazon, fidelity. not bad for a kid."
    ],
    "photopage.html": [
        "Take a look :)",
        "shot on a mirrorless, edited with taste.",
        "I see things differently."
    ],
    "works.html": [
        "Too lazy to go to my GitHub? worth it, I promise.",
        "the commits tell the story.",
        "green squares don't lie."
    ],
    "journey.html": [
        "The boy with no hometown...",
        "11 cities. still counting.",
        "born in kathmandu, raised everywhere."
    ]
};

const CHAT_HISTORY_LIMIT = 8;
const API_TIMEOUT_MS = 10_000;
const chatHistory = [];
let activeChatMode = "professional";
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", function () {
    wireLandingIntro();
    wireHubNavExit();
    wireChatDemo();

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeExpander();
        }
    });
});

function wireHubNavExit() {
    const hubLinks = document.querySelectorAll(".home-hub-link");
    const intro = document.querySelector("[data-intro]");
    const typeTarget = document.querySelector("[data-type-text]");
    const nepaliSubline = document.getElementById("nepaliSubline");
    const nepaliDevanagari = document.getElementById("nepaliDevanagari");

    if (!hubLinks.length || !intro || !typeTarget) return;

    function resetNepaliLines() {
        if (nepaliSubline) {
            nepaliSubline.classList.remove("visible");
            nepaliSubline.textContent = "";
        }
        if (nepaliDevanagari) {
            nepaliDevanagari.classList.remove("visible");
            nepaliDevanagari.textContent = "";
        }
    }

    function showNepaliLines(/** @type {() => void} */ onDone) {
        if (nepaliSubline) {
            nepaliSubline.textContent = "Namaste, mero naam Ayush ho.";
            nepaliSubline.classList.add("visible");
        }
        window.setTimeout(function () {
            if (nepaliDevanagari) {
                nepaliDevanagari.textContent = "(नमस्ते, मेरो नाम आयुष हो।)";
                nepaliDevanagari.classList.add("visible");
            }
        }, 320);
        window.setTimeout(onDone, 1100);
    }

    hubLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const href = link.getAttribute("href") || "";
            const filename = href.split("?")[0].split("/").pop();
            const pool = HUB_EXIT_MESSAGES[filename];
            const message = pool ? pool[Math.floor(Math.random() * pool.length)] : null;

            if (!message) {
                window.location.href = href;
                return;
            }

            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            typeTarget.textContent = "";
            resetNepaliLines();
            document.body.classList.remove("intro-complete");

            if (prefersReducedMotion) {
                typeTarget.textContent = message;
                window.setTimeout(function () {
                    window.location.href = href;
                }, 400);
                return;
            }

            const typeSpeedMs = 72;
            let index = 0;

            window.setTimeout(function () {
                const typeInterval = window.setInterval(function () {
                    index += 1;
                    typeTarget.textContent = message.slice(0, index);
                    if (index >= message.length) {
                        window.clearInterval(typeInterval);
                        showNepaliLines(function () {
                            window.location.href = href;
                        });
                    }
                }, typeSpeedMs);
            }, 120);
        });
    });
}

function wireLandingIntro() {
    const intro = document.querySelector("[data-intro]");
    const siteStart = document.getElementById("siteStart");
    const typeTarget = document.querySelector("[data-type-text]");

    if (!intro) {
        document.body.classList.add("intro-complete");
        document.body.classList.remove("intro-locked");
        return;
    }

    if (new URLSearchParams(window.location.search).has("skip")) {
        document.body.classList.add("intro-complete");
        document.body.classList.remove("intro-locked");
        if (siteStart) siteStart.focus({ preventScroll: true });
        return;
    }

    let completed = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const typeText =
        typeTarget && typeTarget.getAttribute("data-type-text")
            ? String(typeTarget.getAttribute("data-type-text"))
            : "";
    const typeSpeedMs = prefersReducedMotion ? 0 : 85;
    const holdDelayMs = prefersReducedMotion ? 120 : 1400;

    function finishIntro() {
        if (completed) {
            return;
        }

        completed = true;
        document.body.classList.add("intro-complete");
        document.body.classList.remove("intro-locked");

        if (siteStart) {
            siteStart.focus({ preventScroll: true });
        }
    }

    if (!typeTarget || !typeText) {
        window.setTimeout(finishIntro, holdDelayMs);
        return;
    }

    typeTarget.textContent = "";

    if (prefersReducedMotion) {
        typeTarget.textContent = typeText;
        window.setTimeout(finishIntro, holdDelayMs);
        return;
    }

    const nepaliSubline = document.getElementById("nepaliSubline");
    const nepaliDevanagari = document.getElementById("nepaliDevanagari");

    function afterTyping() {
        if (nepaliSubline) {
            nepaliSubline.textContent = "Namaste, mero naam Ayush ho.";
            nepaliSubline.classList.add("visible");
        }
        window.setTimeout(function () {
            if (nepaliDevanagari) {
                nepaliDevanagari.textContent = "(नमस्ते, मेरो नाम आयुष हो।)";
                nepaliDevanagari.classList.add("visible");
            }
        }, 320);
        window.setTimeout(finishIntro, 1400);
    }

    let index = 0;
    const typeInterval = window.setInterval(function () {
        index += 1;
        typeTarget.textContent = typeText.slice(0, index);

        if (index >= typeText.length) {
            window.clearInterval(typeInterval);
            afterTyping();
        }
    }, typeSpeedMs);
}

function wireChatDemo() {
    const chatForm = /** @type {HTMLFormElement | null} */ (document.getElementById("chatForm"));
    const chatInput = /** @type {HTMLInputElement | null} */ (document.getElementById("chatInput"));
    /** @type {HTMLElement | null} */
    const chatMessages = document.getElementById("chatMessages");
    const modeButtons = document.querySelectorAll(".mode-btn");
    /** @type {HTMLElement | null} */
    const modeNote = document.getElementById("modeNote");

    if (!chatForm || !chatInput || !chatMessages) {
        return;
    }

    modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const nextMode = button.getAttribute("data-mode");
            if (nextMode) {
                setChatMode(nextMode, modeButtons, modeNote, chatMessages, true);
            }
        });
    });

    setChatMode(activeChatMode, modeButtons, modeNote, chatMessages, false);

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
 * @param {string} mode
 * @param {NodeListOf<Element>} modeButtons
 * @param {HTMLElement | null} modeNote
 * @param {HTMLElement} chatMessages
 * @param {boolean} announce
 */
function setChatMode(mode, modeButtons, modeNote, chatMessages, announce) {
    activeChatMode = mode === "personal" ? "personal" : "professional";

    modeButtons.forEach(function (button) {
        const isActive = button.getAttribute("data-mode") === activeChatMode;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (modeNote) {
        modeNote.textContent = CHAT_MODES[activeChatMode].description;
    }

    chatHistory.length = 0;

    if (announce) {
        appendBubble(
            chatMessages,
            "assistant",
            "Switched to " + CHAT_MODES[activeChatMode].label + " mode.",
            []
        );
    }
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
        chatResponse = await requestBackendResponse(question, chatHistory, activeChatMode);
    } catch {
        chatResponse = buildLocalFallback(question, activeChatMode);
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
 * @param {string} mode
 */
async function requestBackendResponse(question, history, mode) {
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
                history: history.slice(-6),
                mode
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
 * @param {string} mode
 */
function buildLocalFallback(question, mode) {
    const normalized = question.toLowerCase();
    const normalizedMode = mode === "personal" ? "personal" : "professional";

    for (let i = 0; i < LOCAL_RESPONSE_PLAYBOOK.length; i += 1) {
        const entry = LOCAL_RESPONSE_PLAYBOOK[i];
        const isMatch = entry.match.some(function (token) {
            return normalized.includes(token);
        });

        if (isMatch) {
            return {
                answer: entry[normalizedMode],
                sources: entry.sources,
                mode: "fallback-local-" + normalizedMode
            };
        }
    }

    return {
        answer:
            normalizedMode === "professional"
                ? "Good question. Professional mode is active. Ask about projects, technical skills, collaboration style, or hiring fit for the strongest answers."
                : "Happy to talk more personally. Ask about my interests, motivations, routines, working style, or anything else that helps you get a better sense of who I am.",
        sources: ["bio.md", "projects.md", "resume.md"],
        mode: "fallback-local-" + normalizedMode
    };
}

function appendBubble(container, role, message, sources) {
    const bubble = document.createElement("div");
    bubble.className = "bubble " + role;

    const label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : BOT_NAME;

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
    label.textContent = BOT_NAME;

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

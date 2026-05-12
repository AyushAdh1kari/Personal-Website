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
        {
            en: "ai.yush awaits you.",
            romanized: "ai.yush tayyar chha.",
            devanagari: "ai.yush तयार छ।"
        },
        {
            en: "go ahead, ask it something weird.",
            romanized: "sodhnus, ajib kura ni thik chha.",
            devanagari: "सोध्नुस्, अजिब कुरा पनि ठिक छ।"
        },
        {
            en: "it knows more than it lets on.",
            romanized: "yo bhaneko bhandaa badi jancha.",
            devanagari: "यो भनेकोभन्दा बढी जान्छ।"
        }
    ],
    "about.html": [
        {
            en: "Who is Ayush?",
            romanized: "Ayush ko ho?",
            devanagari: "आयुष को हो?"
        },
        {
            en: "just a guy with too many tabs open.",
            romanized: "dherai tab haru khuleka chhan.",
            devanagari: "धेरै ट्याब हरु खुलेका छन्।"
        },
        {
            en: "nepali kid who ended up in boston somehow.",
            romanized: "Nepali keta, Boston pugyo kasari.",
            devanagari: "नेपाली केटा, बोस्टन पुग्यो कसरी।"
        }
    ],
    "projects.html": [
        {
            en: "The grind never ends...",
            romanized: "kaam kaile rukdaina...",
            devanagari: "काम कहिल्यै रुकदैन..."
        },
        {
            en: "shipping things nobody asked for.",
            romanized: "kasaile nabhane pani banairakhyo.",
            devanagari: "कसैले नभने पनि बनाइराख्यो।"
        },
        {
            en: "yes, I built that at 2am.",
            romanized: "ho, raati 2 baje banayeko.",
            devanagari: "हो, राति २ बजे बनाएको।"
        }
    ],
    "experiences.html": [
        {
            en: "Still working on it...",
            romanized: "ajhai kaam gaardaichha...",
            devanagari: "अझै काम गार्दैछ..."
        },
        {
            en: "credentials loading...",
            romanized: "credentials load hudaichha...",
            devanagari: "क्रेडेन्सियल्स लोड हुँदैछ..."
        },
        {
            en: "harvard, amazon, fidelity. not bad for a kid.",
            romanized: "Harvard, Amazon, Fidelity. naraamo chaina.",
            devanagari: "हार्वर्ड, अमेजन, फिडेलिटी। नराम्रो छैन।"
        }
    ],
    "photopage.html": [
        {
            en: "Take a look :)",
            romanized: "herne? :)",
            devanagari: "हेर्ने? :)"
        },
        {
            en: "Pinterest board from Temu.",
            romanized: "Temu bata ko Pinterest board.",
            devanagari: "टेमुबाटको पिन्टेरेस्ट बोर्ड।"
        },
        {
            en: "I should really start taking more photos again.",
            romanized: "ma ta pheri photography garna start garu jastai lagchha kailekain...",
            devanagari: "म त फेरि फोटोग्राफी गर्न सुरु गरूँ जस्तो लाग्छ कहिलेकाहीँ..."
        }
    ],
    "works.html": [
        {
            en: "Too lazy to go to my GitHub? worth it, I promise.",
            romanized: "GitHub jane aalas? worth it chha, sachain.",
            devanagari: "गिटहब जाने आलस? worth it छ, साँचो।"
        },
        {
            en: "the commits tell the story.",
            romanized: "commits le nai katha bhandaichhan.",
            devanagari: "कमिट्सले नै कथा भन्दैछन्।"
        },
        {
            en: "green squares don't lie.",
            romanized: "green squares jhutho hundaina.",
            devanagari: "ग्रिन स्क्वेर्स झुटो हुँदैन।"
        }
    ],
    "journey.html": [
        {
            en: "The boy with no hometown...",
            romanized: "ghar nabhako keta...",
            devanagari: "घर नभएको केटा..."
        },
        {
            en: "11 cities. still counting.",
            romanized: "11 shahar. abhai counting.",
            devanagari: "११ शहर। अझै गन्दैछ।"
        },
        {
            en: "born in kathmandu, raised everywhere.",
            romanized: "Kathmandu ma janmyo, sarbatra huro.",
            devanagari: "काठमाण्डौमा जन्म्यो, सर्वत्र हुर्कियो।"
        }
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
    wireAnalyticsDashboard();

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

    function showNepaliLines(
        /** @type {string} */ romanized,
        /** @type {string} */ devanagari,
        /** @type {() => void} */ onDone
    ) {
        if (nepaliSubline) {
            nepaliSubline.textContent = romanized;
            nepaliSubline.classList.add("visible");
        }
        window.setTimeout(function () {
            if (nepaliDevanagari) {
                nepaliDevanagari.textContent = "(" + devanagari + ")";
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
            const entry = pool ? pool[Math.floor(Math.random() * pool.length)] : null;

            if (!entry) {
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
                typeTarget.textContent = entry.en;
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
                    typeTarget.textContent = entry.en.slice(0, index);
                    if (index >= entry.en.length) {
                        window.clearInterval(typeInterval);
                        showNepaliLines(entry.romanized, entry.devanagari, function () {
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

    appendBubble(
        chatMessages,
        "assistant",
        chatResponse.answer,
        chatResponse.sources,
        chatResponse.chatEventId
    );
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
            mode: typeof payload.mode === "string" ? payload.mode : "backend",
            chatEventId: typeof payload.chatEventId === "string" ? payload.chatEventId : ""
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

function appendBubble(container, role, message, sources, chatEventId) {
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

    if (role === "assistant" && chatEventId) {
        bubble.appendChild(createFeedbackControls(chatEventId));
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return bubble;
}

function createFeedbackControls(chatEventId) {
    const controls = document.createElement("div");
    controls.className = "feedback-controls";
    controls.setAttribute("aria-label", "Rate this answer");

    const positive = createFeedbackButton("positive", "Good answer", "+");
    const negative = createFeedbackButton("negative", "Needs work", "-");

    [positive, negative].forEach(function (button) {
        button.addEventListener("click", function () {
            submitFeedback(chatEventId, button.getAttribute("data-rating") || "", controls);
        });
        controls.appendChild(button);
    });

    return controls;
}

function createFeedbackButton(rating, label, symbol) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "feedback-btn";
    button.setAttribute("data-rating", rating);
    button.setAttribute("aria-label", label);
    button.textContent = symbol;
    return button;
}

async function submitFeedback(chatEventId, rating, controls) {
    if (!chatEventId || (rating !== "positive" && rating !== "negative")) {
        return;
    }

    controls.classList.add("is-submitted");
    controls.querySelectorAll("button").forEach(function (button) {
        button.setAttribute("disabled", "true");
    });

    try {
        const response = await fetch(resolveApiBaseUrl() + "/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chatEventId,
                rating
            })
        });
        if (!response.ok) {
            throw new Error("Feedback request failed.");
        }
        controls.setAttribute("data-status", "Feedback saved");
    } catch {
        controls.classList.remove("is-submitted");
        controls.setAttribute("data-status", "Feedback unavailable");
    }
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

function wireAnalyticsDashboard() {
    const status = document.getElementById("analyticsStatus");
    if (!status) {
        return;
    }

    loadAnalyticsDashboard();
}

async function loadAnalyticsDashboard() {
    const status = document.getElementById("analyticsStatus");

    try {
        const snapshot = await requestAnalyticsSnapshot();
        renderAnalyticsDashboard(snapshot);
        if (status) {
            status.textContent = "Updated " + formatTime(snapshot.generatedAt);
            status.classList.remove("is-error");
        }
    } catch {
        if (status) {
            status.textContent = "Backend analytics unavailable";
            status.classList.add("is-error");
        }
        renderEmptyAnalyticsState();
    }
}

async function requestAnalyticsSnapshot() {
    const apiBaseUrl = resolveApiBaseUrl();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(function () {
        controller.abort();
    }, API_TIMEOUT_MS);

    try {
        const response = await fetch(apiBaseUrl + "/api/analytics", {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error("Analytics response was not OK.");
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutHandle);
    }
}

function renderAnalyticsDashboard(snapshot) {
    const summary = snapshot.summary || {};
    const retention = snapshot.retention || {};

    setText("metricTotal", formatNumber(summary.totalMessages || 0));
    setText("metricLastDay", formatNumber(summary.last24Hours || 0) + " in the last 24h");
    setText("metricLatency", formatNumber(summary.averageLatencyMs || 0) + "ms");
    setText("metricP95", "p95 " + formatNumber(summary.p95LatencyMs || 0) + "ms");
    setText("metricSources", String(summary.averageSourcesPerAnswer || 0));
    setText("metricStored", formatNumber(retention.storedEvents || 0));
    setText("metricRetention", "of " + formatNumber(retention.maxEvents || 0) + " rolling events");
    setText(
        "promptPrivacyNote",
        retention.promptPreviewsEnabled ? "Prompt previews on" : "Prompt previews off"
    );

    renderTimelineChart("trafficChart", snapshot.timeline || []);
    renderBarChart("responseChart", snapshot.responseModes || {});
    renderBarChart("modeChart", snapshot.modes || {});
    renderBarChart("topicChart", snapshot.topics || {});
    renderBarChart("sourceChart", snapshot.sources || {});
    renderRecentEvents("recentEvents", snapshot.recent || [], retention.promptPreviewsEnabled);
}

function renderEmptyAnalyticsState() {
    renderTimelineChart("trafficChart", []);
    renderBarChart("responseChart", {});
    renderBarChart("modeChart", {});
    renderBarChart("topicChart", {});
    renderBarChart("sourceChart", {});
    renderRecentEvents("recentEvents", [], false);
}

function renderTimelineChart(targetId, timeline) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    target.innerHTML = "";

    if (!timeline.length) {
        appendEmptyState(target, "No traffic yet.");
        return;
    }

    const maxCount = Math.max(
        1,
        ...timeline.map(function (bucket) {
            return Number(bucket.count || 0);
        })
    );

    timeline.forEach(function (bucket) {
        const count = Number(bucket.count || 0);
        const column = document.createElement("div");
        column.className = "traffic-column";
        column.title = formatHour(bucket.hour) + ": " + count + " messages";

        const bar = document.createElement("span");
        bar.style.height = Math.max(6, (count / maxCount) * 100) + "%";

        const label = document.createElement("small");
        label.textContent = formatHour(bucket.hour);

        column.appendChild(bar);
        column.appendChild(label);
        target.appendChild(column);
    });
}

function renderBarChart(targetId, counts) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    target.innerHTML = "";

    const entries = Object.entries(counts)
        .filter(function ([, value]) {
            return Number(value) > 0;
        })
        .sort(function (a, b) {
            return Number(b[1]) - Number(a[1]);
        })
        .slice(0, 8);

    if (!entries.length) {
        appendEmptyState(target, "No data yet.");
        return;
    }

    const maxValue = Math.max(
        ...entries.map(function ([, value]) {
            return Number(value);
        })
    );

    entries.forEach(function ([label, value]) {
        const row = document.createElement("div");
        row.className = "bar-row";

        const rowHeader = document.createElement("div");
        rowHeader.className = "bar-label";

        const name = document.createElement("span");
        name.textContent = formatAnalyticsLabel(label);

        const number = document.createElement("strong");
        number.textContent = formatNumber(Number(value));

        const track = document.createElement("div");
        track.className = "bar-track";

        const fill = document.createElement("span");
        fill.style.width = Math.max(4, (Number(value) / maxValue) * 100) + "%";

        rowHeader.appendChild(name);
        rowHeader.appendChild(number);
        track.appendChild(fill);
        row.appendChild(rowHeader);
        row.appendChild(track);
        target.appendChild(row);
    });
}

function renderRecentEvents(targetId, events, promptPreviewsEnabled) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    target.innerHTML = "";

    if (!events.length) {
        appendEmptyState(target, "Recent chat events will appear here.");
        return;
    }

    events.forEach(function (event) {
        const row = document.createElement("article");
        row.className = "event-row";

        const header = document.createElement("div");
        header.className = "event-header";

        const title = document.createElement("strong");
        title.textContent = event.topic || "General";

        const time = document.createElement("span");
        time.textContent = formatTime(event.timestamp);

        const detail = document.createElement("p");
        detail.textContent =
            promptPreviewsEnabled && event.promptPreview
                ? event.promptPreview
                : "Prompt privacy is enabled. Tracking category, mode, latency, and sources only.";

        const meta = document.createElement("div");
        meta.className = "event-meta";
        [event.mode, event.responseMode, formatNumber(event.latencyMs || 0) + "ms"].forEach(
            function (item) {
                const chip = document.createElement("span");
                chip.textContent = formatAnalyticsLabel(item);
                meta.appendChild(chip);
            }
        );

        header.appendChild(title);
        header.appendChild(time);
        row.appendChild(header);
        row.appendChild(detail);
        row.appendChild(meta);
        target.appendChild(row);
    });
}

function appendEmptyState(target, message) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = message;
    target.appendChild(empty);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function formatAnalyticsLabel(value) {
    return String(value || "unknown")
        .replace(/-/g, " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}

function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "just now";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
}

function formatHour(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString([], {
        hour: "numeric"
    });
}

# Projects

## Simulant
Python, FastAPI, OpenAI API, Anthropic API, Gemini API, DeepSeek API — Mar 2026 – Present

Multi-agent simulation framework for studying AI model behavior in adversarial environments.

- Built a provider-agnostic adapter layer for 4 LLM providers (OpenAI, Anthropic, Gemini, DeepSeek) with rate limiting, exponential backoff, and reproducible hashed configs
- Developed a multi-agent accusation system with credibility scoring, democratic conviction logic, and structured JSONL logging to track agent state, decisions, and outcomes across 70+ simulation runs
- Analyzed simulation results to identify model-specific deception patterns, coalition behavior, and reasoning differences in adversarial multi-agent environments

## CryptoJar
Java, Spring Boot, Spring Security, JPA, React, Next.js, TypeScript, Mockito, Docker — Feb 2026 – Present

Full-stack payment platform converting USD invoices into blockchain payments across 6 chains.

- Supports BTC, LTC, ETH, SOL, AVAX, and XLM via the CoinGecko API
- RESTful backend APIs for invoice management, wallet routing, authentication, and role-based access control (Owner, Admin, User)
- Internal admin tooling for invoice approvals, user moderation, and account management
- Payment reconciliation pipelines to classify invoices as pending, paid, underpaid, or expired via scheduled backend services
- End-to-end encrypted messaging via Web Crypto API with live chat updates using server-sent events

## ayush.ai (This Website)
Node.js, Express, Python, OpenAI API, Docker — Ongoing

A personal website designed as a conversation-first portfolio rather than static pages.

- Chat-first homepage with dual modes: Professional (recruiter-focused) and Personal (interest-focused)
- AI layer using OpenAI embeddings for semantic retrieval and GPT-4o for answers
- Containerized with Docker, deployed via GitHub Pages (frontend) and Docker (backend)

## Photography Portfolio
Ongoing

A curated photo gallery with travel, astronomy, skyline, and aviation photography.

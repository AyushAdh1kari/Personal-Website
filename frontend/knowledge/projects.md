# Projects

## Simulant

**Stack:** Python, FastAPI, OpenAI API, Anthropic API, Gemini API, DeepSeek API, xAI API, Ollama
**Timeline:** Mar 2026-present

A multi-agent simulation framework for studying deception, coalition behavior, and reasoning differences across LLMs.

- Built a provider-agnostic adapter layer for 6 LLM providers with rate limiting, exponential backoff, and reproducible hashed configs
- Developed a multi-agent accusation system with credibility scoring, democratic conviction logic, and structured JSONL logging across 70+ simulation runs
- Analyzed results to identify model-specific deception patterns and reasoning differences in adversarial multi-agent environments

## CryptoJar

**Stack:** Java, Spring Boot, Spring Security, JPA, React, Next.js, TypeScript, Mockito, Docker
**Timeline:** Feb 2026-present

A full-stack payment platform converting USD invoices into blockchain payments across 6 chains (BTC, LTC, ETH, SOL, AVAX, XLM) via CoinGecko API.

- RESTful backend APIs for invoice management, wallet routing, authentication, and role-based access control (Owner, Admin, User)
- Internal admin tooling for invoice approvals, user moderation, and account management
- Payment reconciliation pipelines classifying invoices as pending, paid, underpaid, or expired via scheduled backend services
- End-to-end encrypted messaging via Web Crypto API with live chat updates using server-sent events

## ai.yush

**Stack:** Node.js, Express, Python, OpenAI API, Docker, Supabase/Postgres
**Timeline:** Ongoing

A chat-first personal portfolio site where visitors learn about Ayush through conversation rather than static scrolling. Backed by a private knowledge layer for personality-aware, grounded AI responses.

- Added a live AI analytics dashboard for chat volume, latency, response path, topics, and cited knowledge sources
- Added answer feedback capture and Supabase/Postgres persistence for future eval and model-quality workflows
- Prepared pgvector-backed knowledge chunk storage for semantic retrieval

## Photography Archive

A curated gallery of aviation, landscapes, travel, and atmospheric photography.

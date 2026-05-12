# ayush.ai Monorepo

This repository is split into:

- `frontend/`: static website (chat-first homepage + dedicated about page), assets, and knowledge docs
- `backend/`: Node API shell with a Python AI layer for chat responses

## Project Structure

```text
.
|- frontend/
|  |- app.js
|  |- styles.css
|  |- *.html
|  |- images/
|  |- pdfs/
|  |- knowledge/
|  `- scripts/build-static.mjs
|- backend/
|  |- src/server.js
|  `- ai/chat_engine.py
`- .github/workflows/
```

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+ (for AI layer)
- Docker Desktop (optional, for containers)

## Install Dependencies

From repo root:

```bash
npm install
```

## Local Development

Frontend:

```bash
npm run dev:frontend
```

Open `http://localhost:5500`.

Backend:

```bash
npm run dev:backend
```

Open health endpoint: `http://localhost:3001/api/health`.
Chat endpoint: `POST http://localhost:3001/api/chat`.
Analytics endpoint: `GET http://localhost:3001/api/analytics`.
Feedback endpoint: `POST http://localhost:3001/api/feedback`.
If Python is not available, backend chat falls back to Node-based responses.
Chat modes:

- `professional` (recruiter/collaborator context)
- `personal` (curiosity/personality context)

Both modes can access the full knowledge base, but prompt/model behavior differs.
Personal mode is tuned to speak more conversationally and can use private notes that stay on your machine.
Rate limiting is enabled on `/api/chat` (IP-based, configurable via env vars).
AI analytics are stored in memory unless Supabase is configured. The dashboard is available at
`frontend/analytics.html` locally and `analytics.html` in the static build. Prompt text is not stored
by default; prompts are hashed and only metadata is persisted.

## Database

Supabase/Postgres is optional locally, but enables persistent AI analytics, answer feedback, future
eval datasets, and pgvector-backed knowledge search.

1. Create a Supabase project.
2. Run `supabase/migrations/001_ai_platform.sql` in the Supabase SQL editor.
3. Set backend environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

4. Start the backend. Chat analytics and feedback will persist automatically.
5. Optional: sync markdown knowledge chunks and embeddings:

```bash
npm run sync:knowledge --workspace backend
```

The `knowledge_chunks` table is prepared for `text-embedding-3-small` dimensions. If you switch to an
embedding model with a different vector size, update the `vector(1536)` columns/functions in the SQL.

## Private Personal Context

If you want the chatbot to sound more like you and answer broader personal questions, add private markdown files in:

- `backend/private/`

Recommended setup:

```powershell
Copy-Item backend/private/profile.example.md backend/private/profile.md
```

Then fill `backend/private/profile.md` with anything you want the backend-only AI layer to know, such as:

- personal background
- values and motivations
- working style
- routines and current goals
- stories, preferences, and opinions

These files are ignored by Git and are loaded only by the backend.
By default, the backend reads:

- public knowledge from `frontend/knowledge/`
- private knowledge from `backend/private/`
- the main personal profile from `backend/private/profile.md`

## Quality Checks

Run all frontend + backend checks from root:

```bash
npm run check
```

This includes:

- Type checks
- ESLint checks
- Stylelint checks (frontend)
- HTMLHint checks (frontend)
- Prettier formatting checks

## Build

Run all builds from root:

```bash
npm run build
```

Frontend build output is generated at:

- `frontend/dist/`

## Docker

Build and run both services:

```bash
docker compose up --build
```

If port `8080` is already in use on your machine, this setup defaults the Docker frontend to `8081` instead.
You can also choose a different host port explicitly:

```bash
FRONTEND_PORT=8090 docker compose up --build
```

For local Docker runs, the backend container reads environment variables from `backend/.env`.
If you have not created it yet, copy `backend/.env.example` to `backend/.env` and add your real `OPENAI_API_KEY`.
Docker Compose also mounts `backend/private/` into the backend container so private personal notes remain available in container mode.

Services:

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:3001/api/health`

## CI/CD

GitHub Actions workflows:

- `CI`: runs root `npm ci`, `npm run check`, and `npm run build`
- `Deploy GitHub Pages`: deploys `frontend/dist` on `main`
- `Docker Validate`: validates both frontend and backend Docker builds

For GitHub setup steps, see:

- `.github/ENVIRONMENT.md`

## Environment Variables

Frontend template:

- `frontend/.env.example`

Backend template:

- `backend/.env.example`

Optional mode-specific model env vars:

- `OPENAI_CHAT_MODEL_PROFESSIONAL`
- `OPENAI_CHAT_MODEL_PERSONAL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_CHAT_MAX`
- `PRIVATE_KNOWLEDGE_DIR`
- `PERSONAL_PROFILE_PATH`
- `ANALYTICS_MAX_EVENTS`
- `ANALYTICS_INCLUDE_PROMPTS`
- `FEEDBACK_MAX_EVENTS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

If you want OpenAI-backed responses from the Python AI layer, install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

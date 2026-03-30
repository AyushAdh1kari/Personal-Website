# GitHub Configuration Checklist

## 1. Enable GitHub Pages deployment

1. Go to `Settings` -> `Pages`.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` and the `Deploy GitHub Pages` workflow will publish `frontend/dist/`.

## 2. Actions permissions

Go to `Settings` -> `Actions` -> `General`:

- Allow GitHub Actions to run.
- Set **Workflow permissions** to **Read and write permissions** (needed for Pages deploy action).

## 3. Optional secrets for backend integration

Go to `Settings` -> `Secrets and variables` -> `Actions` and add:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These are not required for the current static Pages deployment, but they are ready for the backend RAG/API phase.

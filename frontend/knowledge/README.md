# Knowledge Base

Update these files to keep ayush.ai responses accurate:

- `bio.md`
- `resume.md`
- `projects.md`
- `personality.md`
- `writing-style.md`

For future RAG integration:

1. Chunk each markdown file.
2. Generate embeddings with `text-embedding-3-small`.
3. Store chunks in Supabase vector table.
4. Retrieve top-k chunks before each chat completion.

Private personal knowledge files live in this folder.

Recommended setup:

1. Copy `profile.example.md` to `profile.md`.
2. Fill `profile.md` with personal context you do not want in GitHub.
3. Optionally add more `.md` files here for deeper memory, such as:
   - `about-me.md`
   - `values.md`
   - `stories.md`
   - `preferences.md`
   - `currently.md`

The backend loads markdown files from this folder automatically in local development and in Docker Compose.
These files are ignored by Git, except for this README and the example template.

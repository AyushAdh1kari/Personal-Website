import { constants } from "node:fs";
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.join(rootDir, "dist");

const staticEntries = [
    "index.html",
    "about.html",
    "projects.html",
    "resume.html",
    "photopage.html",
    "autocad.html",
    "mta.html",
    "styles.css",
    "app.js",
    "images",
    "pdfs",
    "knowledge"
];

const htmlEntries = staticEntries.filter((e) => e.endsWith(".html"));

async function pathExists(targetPath) {
    try {
        await access(targetPath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function injectApiBaseUrl(distPath, apiBaseUrl) {
    const raw = await readFile(distPath, "utf-8");
    const tag = `  <script>window.__AYUSH_API_BASE_URL = ${JSON.stringify(apiBaseUrl)};</script>\n`;
    const injected = raw.replace("</head>", `${tag}</head>`);
    await writeFile(distPath, injected, "utf-8");
}

async function build() {
    await rm(distDir, { recursive: true, force: true });
    await mkdir(distDir, { recursive: true });

    for (const entry of staticEntries) {
        const sourcePath = path.join(rootDir, entry);
        const destinationPath = path.join(distDir, entry);

        if (!(await pathExists(sourcePath))) {
            throw new Error(`Missing required asset: ${entry}`);
        }

        await cp(sourcePath, destinationPath, { recursive: true });
    }

    // Inject API base URL into all HTML files if provided via env var.
    // Set API_BASE_URL when building for production, e.g.:
    //   API_BASE_URL=https://your-backend.example.com npm run build
    const apiBaseUrl = (process.env.API_BASE_URL || "").trim();
    if (apiBaseUrl) {
        for (const entry of htmlEntries) {
            const destPath = path.join(distDir, entry);
            if (await pathExists(destPath)) {
                await injectApiBaseUrl(destPath, apiBaseUrl);
            }
        }
        console.log(`Injected API_BASE_URL: ${apiBaseUrl}`);
    }

    console.log("Build complete. Files copied to dist/.");
}

build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

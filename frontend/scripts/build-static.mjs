import { constants } from "node:fs";
import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.join(rootDir, "dist");

const staticEntries = [
    "index.html",
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

async function pathExists(targetPath) {
    try {
        await access(targetPath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
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

    console.log("Build complete. Files copied to dist/.");
}

build().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

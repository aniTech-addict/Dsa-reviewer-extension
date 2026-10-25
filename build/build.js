import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist");

const extensionFiles = [
  "index.html",
  "index.css",
  "index.js",
  "manifest.json",
  "constants",
  "images",
  "prompts",
  "content_script/content.js",
  "utils",
  "workers"
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const entry of extensionFiles) {
  const source = path.join(projectRoot, entry);
  const destination = path.join(outputDirectory, entry);
  fs.cpSync(source, destination, { recursive: true });
}

console.log(`Built extension in ${path.relative(projectRoot, outputDirectory)}/`);

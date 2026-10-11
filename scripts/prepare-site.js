import { copyFile, mkdir } from "node:fs/promises";

await mkdir("site", { recursive: true });
await copyFile("dist/mini-plots.js", "site/mini-plots.js");
console.log("Copied dist/mini-plots.js to site/mini-plots.js");

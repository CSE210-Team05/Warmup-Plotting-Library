import { access, readFile } from "node:fs/promises";

const expectedFiles = [
  "dist/mini-plots.js",
  "site/index.html",
  "site/mini-plots.js",
  "site/example.csv",
];

for (const file of expectedFiles) {
  await access(file);
}

const source = await readFile("dist/mini-plots.js", "utf8");
if (!source.includes("plotScatter") || !source.includes("plotLine")) {
  throw new Error("Library build does not contain both public plot exports");
}
if (/\bfrom\s+["']|\bimport\s*["']/.test(source)) {
  throw new Error("Library build contains an unresolved static import");
}

const library = await import(new URL("../dist/mini-plots.js", import.meta.url));
const exportNames = Object.keys(library).sort();
if (exportNames.join(",") !== "plotLine,plotScatter") {
  throw new Error(`Unexpected public exports: ${exportNames.join(", ")}`);
}

console.log(`Verified build artifacts: ${expectedFiles.join(", ")}`);
console.log(`Verified public exports: ${exportNames.join(", ")}`);

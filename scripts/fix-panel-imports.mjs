import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const panelImport =
  'import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  const broken = `import {\n${panelImport}`;
  const brokenType = `import type {\n${panelImport}`;
  if (!src.includes(broken) && !src.includes(brokenType)) continue;

  src = src.replaceAll(broken, `${panelImport}\nimport {`);
  src = src.replaceAll(brokenType, `${panelImport}\nimport type {`);

  // dedupe panel import if added twice
  const lines = src.split("\n");
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    if (line === panelImport) {
      if (seen.has(panelImport)) continue;
      seen.add(panelImport);
    }
    out.push(line);
  }

  fs.writeFileSync(file, out.join("\n"));
  fixed++;
  console.log(path.relative(root, file));
}
console.log("fixed", fixed);

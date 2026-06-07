import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skip = new Set(["node_modules", ".next", "ESKİ DERECEPANEL"]);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const importLine =
  'import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";';

let changed = 0;
for (const file of walk(root)) {
  if (file.includes(`${path.sep}lib${path.sep}panel-store${path.sep}`)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!/localStorage\.(getItem|setItem|removeItem)/.test(src)) continue;

  src = src.replace(/localStorage\.getItem\(/g, "panelGetItem(");
  src = src.replace(/localStorage\.setItem\(/g, "panelSetItem(");
  src = src.replace(/localStorage\.removeItem\(/g, "panelRemoveItem(");

  if (!src.includes("@/lib/panel-store")) {
    const lines = src.split("\n");
    let idx = 0;
    while (idx < lines.length && (lines[idx].startsWith("import ") || lines[idx].trim() === "")) {
      idx++;
    }
    lines.splice(idx, 0, importLine);
    src = lines.join("\n");
  }

  fs.writeFileSync(file, src);
  changed++;
  console.log(path.relative(root, file));
}

console.log("changed", changed);

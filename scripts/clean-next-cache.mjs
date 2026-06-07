import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

for (const dir of [".next", ".next-admin"]) {
  try {
    rmSync(resolve(root, dir), { recursive: true, force: true });
    console.log(`[clean] removed ${dir}`);
  } catch (err) {
    console.warn(`[clean] ${dir}:`, err.message);
  }
}

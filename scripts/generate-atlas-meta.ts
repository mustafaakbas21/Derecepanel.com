/**
 * Statik atlas meta — `node --import tsx scripts/generate-atlas-meta.ts`
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { buildAtlasMetaFromRaw } from "../lib/yks-sim/atlas-meta";

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  for (const level of ["lisans", "onlisans", "all"] as const) {
    const meta = await buildAtlasMetaFromRaw(level);
    const name = `yok-atlas-meta-${level}.json`;
    const out = path.join(dataDir, name);
    await writeFile(out, JSON.stringify(meta));
    console.log(`${name}: ${meta.total} program`);
  }
}

void main();

/**
 * @deprecated `npm run appwrite:bootstrap` kullanın.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve(import.meta.dirname, "bootstrap-appwrite.mjs");
const r = spawnSync(process.execPath, ["--env-file=.env.local", script], {
  stdio: "inherit",
  cwd: resolve(import.meta.dirname, ".."),
});
process.exit(r.status ?? 1);

/**
 * Kurucu-only dev sunucusu — ana `npm run dev` ile aynı anda çalışabilir.
 * Ayrı distDir (.next-admin) sayesinde Next.js kilidi çakışmaz.
 */
import { spawn } from "node:child_process";

const env = { ...process.env, ADMIN_PORTAL: "1" };
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";

const child = spawn(cmd, ["next", "dev"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));

import fs from "fs";

const js = fs.readFileSync("ESKİ DERECEPANEL/Derecepanel21/js/pazarlama.js", "utf8");

function extract(name) {
  const i = js.indexOf(`function ${name}`);
  if (i < 0) throw new Error(`missing ${name}`);
  let depth = 0;
  let started = false;
  let j = i;
  for (; j < js.length; j++) {
    if (js[j] === "{") {
      depth++;
      started = true;
    } else if (js[j] === "}") {
      depth--;
      if (started && depth === 0) {
        j++;
        break;
      }
    }
  }
  return js.slice(i, j);
}

const fns = [
  "templateMarkup",
  "buildLeaderboardRowHtml",
  "buildLeaderboardEmptyStateHtml",
  "renderTop10",
  "prevExamOf",
  "bestImprover",
  "renderStar",
  "renderCountdown",
  "waitForImages",
];

let out = `/* Ported from ESKİ Derecepanel21/js/pazarlama.js */
import type { BrandState, CountdownCustomState, TextState } from "../types";
import type { MergedExam } from "@/lib/exams/types";
import { getKurumAdi } from "../kurum";
import { resultsForExam, sortByNetDesc } from "../exams";
import { escapeHtml, clampInt, formatTrDate, initials, parseYmdLocal, clamp } from "../utils";
import { applyBrandToStory } from "../brand";

function $(id: string) {
  return document.getElementById(id);
}

function buildEmptyStateHtml() {
  return (
    '<div class="pm-empty" role="status" aria-live="polite">' +
    '<div class="pm-empty-ico" aria-hidden="true">⏳</div>' +
    "<h2>Sınav Sonuçları<br>Bekleniyor…</h2>" +
    "<p>Optik yüklemesi veya sonuç kaydı tamamlandığında<br>ilk 10 burada otomatik oluşur.</p>" +
    "</div>"
  );
}

`;

for (const fn of fns) {
  let body = extract(fn);
  body = body.replace(/^function /, "export function ");
  out += `${body}\n\n`;
}

fs.mkdirSync("lib/pazarlama/templates", { recursive: true });
fs.writeFileSync("lib/pazarlama/templates/engine-port.ts", out);
console.log("engine-port.ts", out.length, "bytes");

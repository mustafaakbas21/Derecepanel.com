import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { clampZorluk, type OnyxSolveStructured } from "@/lib/onyx/solve-types";

function sanitizeSolveMarkdownTurkish(text: string): string {
  let s = String(text || "");
  const pairs: [RegExp, string][] = [
    [/^#{1,3}\s*Problem Analysis\s*$/gim, "### Problem Analizi"],
    [/^#{1,3}\s*Problem Statement\s*$/gim, "### Soru"],
    [/^#{1,3}\s*Given\s*$/gim, "### Verilenler"],
    [/^#{1,3}\s*Solution\s*$/gim, "### Çözüm"],
    [/\bStep\s+(\d+)\s*:/gi, "$1. Adım:"],
    [/\bStep\s+(\d+)\b/gi, "$1. Adım"],
  ];
  for (const [re, rep] of pairs) {
    s = s.replace(re, rep);
  }
  return s;
}

export function formatSolveAsMarkdown(
  s: OnyxSolveStructured,
  role?: OnyxRole
): string {
  if (s.deepDiagnosis) {
    const d = s.deepDiagnosis;
    const on = d.soruOnAnalizi;
    const sebepler = on.yapamamaSebepleri.map((x) => `- ${x}`).join("\n");
    const zorlukLine = `**Zorluk:** ${on.zorlukSeviyesi}/5${on.zorlukNotu ? ` — ${on.zorlukNotu}` : ""}`;
    return `<!-- onyx-deep-error -->
## Soru Haritası
**${on.dersAdi}** · ${on.konuAdi} · *${on.kavramAdi}*
${zorlukLine}

### Yapamama sebepleri
${sebepler}

### ÖSYM profili (${on.osymAnalizi.durum})
${on.osymAnalizi.aciklama}${on.osymAnalizi.siklikNotu ? `\n_Sıklık: ${on.osymAnalizi.siklikNotu}_` : ""}

## Derin Hata Analizi — ${d.hataAnalizi.eksikKavram}
**${d.hataAnalizi.hataTipi}** · ${d.aksiyonPlani.tavsiyeEdilenAksiyon}`;
  }

  const stars = "★".repeat(clampZorluk(s.zorluk_seviyesi));
  const coachBlock =
    role === "coach" && s.coach_insight?.trim()
      ? `\n\n### Koç Teşhisi\n${s.coach_insight.trim()}`
      : role === "coach"
        ? `\n\n### Koç Teşhisi\nÖğrencinin bu soruda takılma sebebi büyük ihtimalle **${s.konu_basligi}** konusundaki eksikliğidir.`
        : "";

  return `## 💡 Konu: ${s.konu_basligi}

**Zorluk:** ${stars} (${clampZorluk(s.zorluk_seviyesi)}/5) · **Teşhis:** \`${s.hata_kodu}\`

${sanitizeSolveMarkdownTurkish(s.cozum.trim())}${coachBlock}`;
}

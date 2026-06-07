import type { VisionSkillData } from "@/lib/onyx/skill-types";

const STEP_HEADING_RE = /^#{2,3}\s*(\d+)\.\s*Adım\b/im;
const SOLVE_MARKERS = [
  /<!--\s*onyx-deep-error\s*-->/i,
  /^##\s*Soru Haritası/im,
  /^##\s*Soru Analizi/im,
  /^##\s*💡\s*Konu:/im,
  /^##\s*Tahta/im,
];

function mapHataKoduToTip(kod: string): string {
  const k = kod.trim().toUpperCase();
  if (k.includes("ISLEM")) return "İşlem Hatası";
  if (k.includes("DIKKAT")) return "Okuma/Dikkat Hatası";
  if (k.includes("KONU")) return "Bilgi Eksikliği";
  if (k.includes("KAVRAM")) return "Kavram Yanılgısı";
  return "Kavram Yanılgısı";
}

function splitCozumToSteps(cozum: string): string[] {
  const text = String(cozum ?? "").trim();
  if (!text) return [];

  const byNumberedLines = text
    .split(/\n(?=\d+\.\s)/)
    .map((chunk) => chunk.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  if (byNumberedLines.length >= 2) return byNumberedLines;

  const byParagraph = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return byParagraph.length ? byParagraph : [text];
}

function buildFallbackSoruOnAnalizi(konu: string): VisionSkillData["soruOnAnalizi"] {
  return {
    dersAdi: "TYT Matematik",
    konuAdi: konu,
    kavramAdi: konu,
    zorlukSeviyesi: 3,
    yapamamaSebepleri: [
      "Konu tekrarı veya kavram eşleştirmesi eksik olabilir.",
      "Soru kökündeki verilenler ile istenen karıştırılmış olabilir.",
    ],
    osymAnalizi: {
      durum: "kismen",
      aciklama:
        "Bu kazanım YKS müfredatında yer alır; ÖSYM benzer mantıkla sorabilir.",
    },
  };
}

/** Markdown / legacy çözüm metni — tek Vision kartına dönüştürülebilir mi? */
export function isMarkdownSolveReply(text: string): boolean {
  const t = String(text ?? "").trim();
  if (!t) return false;
  if (SOLVE_MARKERS.some((re) => re.test(t))) return true;

  const stepMatches = t.match(new RegExp(STEP_HEADING_RE.source, "gim"));
  return (stepMatches?.length ?? 0) >= 2;
}

/** Serbest markdown çözüm → VisionSkillData (Tahta kartı UI) */
export function markdownSolveReplyToVisionData(reply: string): VisionSkillData | null {
  const text = String(reply ?? "").trim();
  if (!isMarkdownSolveReply(text)) return null;

  const stepChunks = text.split(/(?=^#{2,3}\s*\d+\.\s*Adım\b)/im);
  const intro = stepChunks[0]?.trim() ?? "";
  const stepSections = stepChunks.slice(1);

  const cozum = stepSections
    .map((section) =>
      section
        .replace(/^#{2,3}\s*\d+\.\s*Adım[:\s-]*/i, "")
        .trim()
    )
    .filter(Boolean);

  const steps =
    cozum.length >= 2
      ? cozum
      : splitCozumToSteps(
          text
            .replace(/^##\s*Soru Analizi\s*/im, "")
            .replace(/^##\s*💡\s*Konu:[^\n]*\n*/im, "")
        );

  if (steps.length === 0) return null;

  const konuMatch =
    text.match(/^##\s*💡\s*Konu:\s*(.+)$/im) ??
    text.match(/\*\*([^*]+)\*\*\s*·/);
  const konu = konuMatch?.[1]?.trim() || "İlgili konu";

  const coachMatch = text.match(/###\s*Koç Teşhisi\s*\n([\s\S]*?)(?:\n##|\n###|$)/i);
  const hata =
    coachMatch?.[1]?.trim() ||
    intro.replace(/^##\s*Soru Analizi\s*/i, "").trim() ||
    "Bu soru tipinde verilenleri doğru okumak ve adım adım ilerlemek kritik.";

  return {
    soruOnAnalizi: buildFallbackSoruOnAnalizi(konu),
    cozum: steps,
    cozumDetay: {
      dersTipi: "sayisal",
      hocaAcilis:
        intro.replace(/^##\s*Soru Analizi\s*/i, "").trim().slice(0, 400) ||
        undefined,
      verilenler: [],
      osymTuzagi:
        "ÖSYM bu tip sorularda işaret, birim veya kavram karışıklığı tuzağı kullanabilir.",
      nihaiCevap: "—",
      dogrulama: "Çözüm adımlarını soru koşullarıyla karşılaştırarak kontrol edin.",
    },
    hata,
    hataTipi: mapHataKoduToTip("KAVRAM_YANILGISI"),
    eksikKavram: konu,
  };
}

import { getSubjects, getTopics } from "@/lib/mufredat";
import { loadStudentsFull } from "@/lib/students/storage";
import type { TMConfig } from "@/lib/test-maker/types";

/** Arşiv kaydından ders/konu etiketlerini müfredat id'lerine çöz */
export function resolveConfigFromLabels(
  dersLabel: string,
  konuLabel: string
): Pick<TMConfig, "dersId" | "dersLabel" | "konuId" | "konuLabel"> {
  const ders = (dersLabel || "").trim();
  const konu = (konuLabel || "").trim();
  const sub =
    getSubjects("ALL").find(
      (s) => s.name === ders || (ders && (s.name.includes(ders) || ders.includes(s.name)))
    ) ?? null;
  const dersId = sub?.id ?? "";
  let konuId = "";
  let resolvedKonu = konu;
  if (sub && konu) {
    const top = getTopics(sub.id).find(
      (t) => t.name === konu || t.name.includes(konu) || konu.includes(t.name)
    );
    if (top) {
      konuId = top.id;
      resolvedKonu = top.name;
    } else {
      const t0 = getTopics(sub.id)[0];
      if (t0) {
        konuId = t0.id;
        resolvedKonu = t0.name;
      }
    }
  }
  return {
    dersId,
    dersLabel: sub?.name ?? ders,
    konuId,
    konuLabel: resolvedKonu,
  };
}

export function mergeArchiveIntoConfig(
  base: TMConfig,
  archive: {
    ders?: string;
    konu?: string;
    kurum?: string;
    coverTitle?: string;
    name?: string;
  }
): TMConfig {
  const resolved = resolveConfigFromLabels(archive.ders ?? "", archive.konu ?? "");
  return {
    ...base,
    ...resolved,
    kurum: archive.kurum ?? base.kurum,
    coverTitle: archive.coverTitle ?? archive.name ?? base.coverTitle,
  };
}

export function findStudentIdByCanonical(label: string): string {
  if (!label?.trim() || typeof window === "undefined") return "";
  const students = loadStudentsFull();
  const needle = label.trim();
  const match = students.find((s) => {
    const code = s.studentCode || s.ogrenciId;
    return (
      needle === `${s.name} (${code})` ||
      needle === s.name ||
      (code && needle.includes(code))
    );
  });
  return match?.ogrenciId ?? "";
}

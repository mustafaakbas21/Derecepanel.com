import { getDerslerByTrack, getMufredatPack } from "@/lib/mufredat";
import type { MufredatDers, MufredatTrack } from "@/lib/mufredat/types";

import { topicKey } from "@/lib/konu-takip/storage";
import type { StudentTracking } from "@/lib/konu-takip/types";

export interface DersSummary {
  subjectId: string;
  subjectName: string;
  track: MufredatTrack;
  totalTopics: number;
  doneTopics: number;
  inProgressTopics: number;
  solved: number;
  /** 0–1 (bitti / toplam konu) */
  ratio: number;
}

export interface StudentSummary {
  totalTopics: number;
  doneTopics: number;
  inProgressTopics: number;
  solved: number;
  ratio: number;
  /** İçinde veri olan (durum/soru/not/hedef) konuların en yeni updatedAt değeri */
  lastActivity: string | null;
}

/** Bir öğrencinin tracking kayıtlarındaki en son güncelleme tarihi. */
export function lastActivityOf(tracking: StudentTracking): string | null {
  let latest: string | null = null;
  for (const p of Object.values(tracking)) {
    if (!p?.updatedAt) continue;
    const hasData =
      p.status !== "baslanmadi" ||
      (p.solved || 0) > 0 ||
      (p.bookIds?.length || 0) > 0 ||
      Boolean(p.note) ||
      Boolean(p.target);
    if (!hasData) continue;
    if (!latest || p.updatedAt > latest) latest = p.updatedAt;
  }
  return latest;
}

function trackOfDers(dersId: string): MufredatTrack {
  return getMufredatPack().TYT.some((d) => d.id === dersId) ? "TYT" : "AYT";
}

export function summarizeDers(
  tracking: StudentTracking,
  ders: MufredatDers
): DersSummary {
  let doneTopics = 0;
  let inProgressTopics = 0;
  let solved = 0;

  for (const konu of ders.konular) {
    const p = tracking[topicKey(ders.id, konu.id)];
    if (!p) continue;
    if (p.status === "bitti") doneTopics += 1;
    else if (p.status === "calisiliyor") inProgressTopics += 1;
    solved += p.solved || 0;
  }

  const totalTopics = ders.konular.length;
  return {
    subjectId: ders.id,
    subjectName: ders.dersAdi,
    track: trackOfDers(ders.id),
    totalTopics,
    doneTopics,
    inProgressTopics,
    solved,
    ratio: totalTopics > 0 ? doneTopics / totalTopics : 0,
  };
}

export function summarizeStudent(
  tracking: StudentTracking,
  track: MufredatTrack | "ALL" = "ALL"
): StudentSummary {
  const dersler = getDerslerByTrack(track);
  let totalTopics = 0;
  let doneTopics = 0;
  let inProgressTopics = 0;
  let solved = 0;

  for (const ders of dersler) {
    const s = summarizeDers(tracking, ders);
    totalTopics += s.totalTopics;
    doneTopics += s.doneTopics;
    inProgressTopics += s.inProgressTopics;
    solved += s.solved;
  }

  return {
    totalTopics,
    doneTopics,
    inProgressTopics,
    solved,
    ratio: totalTopics > 0 ? doneTopics / totalTopics : 0,
    lastActivity: lastActivityOf(tracking),
  };
}

import mufredatPack from "@/data/yks-mufredat.json";

import type {
  MufredatDers,
  MufredatKonu,
  MufredatSubjectRef,
  MufredatTopicRef,
  MufredatTrack,
  YksMufredatPack,
} from "@/lib/mufredat/types";

const pack = mufredatPack as YksMufredatPack;

export type { MufredatDers, MufredatKonu, MufredatTrack, MufredatSubjectRef, MufredatTopicRef };

export const YKS_MUFREDAT_PATH = "data/yks-mufredat.json";

export function getMufredatPack(): YksMufredatPack {
  return pack;
}

export function getDerslerByTrack(track: MufredatTrack | "ALL" = "ALL"): MufredatDers[] {
  if (track === "TYT") return pack.TYT ?? [];
  if (track === "AYT") return pack.AYT ?? [];
  return [...(pack.TYT ?? []), ...(pack.AYT ?? [])];
}

/** Tüm dersler (TYT + AYT) */
export function getSubjects(track: MufredatTrack | "ALL" = "ALL"): MufredatSubjectRef[] {
  return getDerslerByTrack(track).map((d) => ({
    id: d.id,
    name: d.dersAdi,
    track: (pack.TYT.some((t) => t.id === d.id) ? "TYT" : "AYT") as MufredatTrack,
  }));
}

export function getDersById(dersId: string): MufredatDers | undefined {
  return getDerslerByTrack("ALL").find((d) => d.id === dersId);
}

export function getTopics(dersId: string): MufredatTopicRef[] {
  const ders = getDersById(dersId);
  if (!ders) return [];
  const track = pack.TYT.some((t) => t.id === dersId) ? "TYT" : "AYT";
  return ders.konular.map((k) => ({
    id: k.id,
    name: k.ad,
    subjectId: ders.id,
    subjectName: ders.dersAdi,
    track,
  }));
}

export function getSubjectById(dersId: string): MufredatSubjectRef | undefined {
  return getSubjects("ALL").find((s) => s.id === dersId);
}

export function getTopicById(
  dersId: string,
  konuId: string
): MufredatTopicRef | undefined {
  return getTopics(dersId).find((t) => t.id === konuId);
}

export function getSubjectOptions(track: MufredatTrack | "ALL" = "ALL") {
  return getSubjects(track).map((s) => ({ id: s.id, label: s.name }));
}

export function getTopicOptions(dersId: string) {
  return getTopics(dersId).map((t) => ({ id: t.id, label: t.name }));
}

/** JSON'da ayrı kavram listesi yok; konu adını tek seçenek olarak sunar */
export function getConcepts(subjectId: string, topicId: string) {
  const topic = getTopicById(subjectId, topicId);
  if (!topic) return [];
  return [{ id: topic.id, name: topic.name }];
}

import { getDersById, getDerslerByTrack, getTopics } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat/types";
import { topicKey } from "@/lib/konu-takip/storage";
import type { StudentTracking, TopicProgress, TopicStatus } from "@/lib/konu-takip/types";

export type TopicListItem = {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  track: MufredatTrack;
  progress: TopicProgress;
};

function trackOfSubject(subjectId: string): MufredatTrack {
  return getDerslerByTrack("TYT").some((d) => d.id === subjectId) ? "TYT" : "AYT";
}

function iterTopics(track: MufredatTrack | "ALL"): TopicListItem[] {
  const items: TopicListItem[] = [];
  for (const ders of getDerslerByTrack(track)) {
    for (const konu of ders.konular) {
      items.push({
        subjectId: ders.id,
        subjectName: ders.dersAdi,
        topicId: konu.id,
        topicName: konu.ad,
        track: trackOfSubject(ders.id),
        progress: {
          status: "baslanmadi",
          solved: 0,
          bookIds: [],
          updatedAt: "",
        },
      });
    }
  }
  return items;
}

export function listTopicsWithProgress(
  tracking: StudentTracking,
  track: MufredatTrack | "ALL" = "ALL"
): TopicListItem[] {
  return iterTopics(track).map((item) => ({
    ...item,
    progress: tracking[topicKey(item.subjectId, item.topicId)] ?? item.progress,
  }));
}

const STATUS_RANK: Record<TopicStatus, number> = {
  calisiliyor: 0,
  baslanmadi: 1,
  bitti: 2,
};

export function listDeficitTopics(
  tracking: StudentTracking,
  track: MufredatTrack | "ALL" = "ALL",
  limit = 12
): TopicListItem[] {
  return listTopicsWithProgress(tracking, track)
    .filter((t) => t.progress.status !== "bitti")
    .sort((a, b) => {
      const sr = STATUS_RANK[a.progress.status] - STATUS_RANK[b.progress.status];
      if (sr !== 0) return sr;
      return (b.progress.updatedAt || "").localeCompare(a.progress.updatedAt || "");
    })
    .slice(0, limit);
}

export function listRecentTopics(
  tracking: StudentTracking,
  track: MufredatTrack | "ALL" = "ALL",
  limit = 8
): TopicListItem[] {
  return listTopicsWithProgress(tracking, track)
    .filter((t) => {
      const p = t.progress;
      return (
        Boolean(p.updatedAt) &&
        (p.status !== "baslanmadi" || p.solved > 0 || (p.bookIds?.length ?? 0) > 0)
      );
    })
    .sort((a, b) => b.progress.updatedAt.localeCompare(a.progress.updatedAt))
    .slice(0, limit);
}

export function countByStatus(tracking: StudentTracking, track: MufredatTrack | "ALL" = "ALL") {
  const topics = listTopicsWithProgress(tracking, track);
  let bitti = 0;
  let calisiliyor = 0;
  let baslanmadi = 0;
  for (const t of topics) {
    if (t.progress.status === "bitti") bitti += 1;
    else if (t.progress.status === "calisiliyor") calisiliyor += 1;
    else baslanmadi += 1;
  }
  return {
    total: topics.length,
    bitti,
    calisiliyor,
    baslanmadi,
  };
}

export function subjectExists(subjectId: string): boolean {
  return Boolean(getDersById(subjectId));
}

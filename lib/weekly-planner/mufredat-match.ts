import { getSubjects, getTopicOptions } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat";

export type MufredatMatch = {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
  track: MufredatTrack;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

/** MR etiketi: "TYT Türkçe — Sözcükte Anlam" → müfredat id */
export function matchMufredatFromInsightLabel(label: string): MufredatMatch | null {
  const raw = label.trim();
  if (!raw) return null;

  const parts = raw.split("—").map((p) => p.trim()).filter(Boolean);
  const subjectHint = parts[0] || raw;
  const topicHint = parts.length > 1 ? parts.slice(1).join(" — ") : "";

  const subjects = getSubjects("ALL");
  const subject =
    subjects.find((s) => norm(s.name) === norm(subjectHint)) ||
    subjects.find((s) => norm(subjectHint).includes(norm(s.name))) ||
    subjects.find((s) => norm(s.name).includes(norm(subjectHint))) ||
    subjects.find((s) => norm(raw).startsWith(norm(s.name)));

  if (!subject) return null;

  const topics = getTopicOptions(subject.id);
  if (!topicHint) {
    const first = topics[0];
    if (!first) return null;
    return {
      subjectId: subject.id,
      topicId: first.id,
      subjectName: subject.name,
      topicName: first.label,
      track: subject.track,
    };
  }

  const topic =
    topics.find((t) => norm(t.label) === norm(topicHint)) ||
    topics.find((t) => norm(topicHint).includes(norm(t.label))) ||
    topics.find((t) => norm(t.label).includes(norm(topicHint)));

  if (!topic) return null;

  return {
    subjectId: subject.id,
    topicId: topic.id,
    subjectName: subject.name,
    topicName: topic.label,
    track: subject.track,
  };
}

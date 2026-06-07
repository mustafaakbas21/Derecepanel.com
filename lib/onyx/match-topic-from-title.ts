import { resolveOfficialMufredatTopic } from "@/lib/onyx/curriculum-rag";

export type MatchedMufredatTopic = {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
};

/** AI konu_basligi veya eksikKavram metnini resmi müfredat konusuna eşler */
export function matchTopicFromTitle(hint: string): MatchedMufredatTopic | null {
  return resolveOfficialMufredatTopic(hint);
}

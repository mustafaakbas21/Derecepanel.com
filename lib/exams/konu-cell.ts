/** Matris konu hücresi: subjectId|topicId|conceptId veya subjectId|topicId veya subjectId */

export function encodeKonuCell(parts: {
  subjectId: string;
  topicId?: string;
  conceptId?: string;
}): string {
  const sid = String(parts.subjectId || "").trim();
  if (!sid) return "";
  const tid = String(parts.topicId || "").trim();
  const cid = String(parts.conceptId || "").trim();
  if (tid && cid) return `${sid}|${tid}|${cid}`;
  if (tid) return `${sid}|${tid}`;
  return sid;
}

export function decodeKonuCell(cell: string): {
  subjectId: string;
  topicId: string;
  conceptId: string;
} {
  const parts = String(cell || "").split("|");
  return {
    subjectId: parts[0] || "",
    topicId: parts[1] || "",
    conceptId: parts[2] || "",
  };
}

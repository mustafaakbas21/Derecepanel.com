import { getExamLayout } from "@/lib/exams/exam-layout";
import { findExamById, loadMergedExams } from "@/lib/exams/exam-storage";
import { netFromCorrectWrong } from "@/lib/scoring/score-calculator";
import type { ExamResultRow } from "@/lib/exams/types";
import type { KurumDeneme } from "@/lib/exams/types";
import { readExamResults } from "@/lib/exams/exam-results-storage";
import { readJsonArray } from "@/lib/exams/local-storage";
import { loadStudentsFull } from "@/lib/students/storage";

import type { NsBranchId, StudentTargetPayload, YksSimUser } from "@/lib/yks-sim/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export const TARGET_REV_KEY = "derece_student_target_rev";
export const TERCİH_FROM_PUAN_KEY = "derecepanel_tercih_from_puan_v1";

const NS_TO_SUBJECTS: Record<NsBranchId, string[]> = {
  tyt_tr: ["tyt-tr"],
  tyt_mat: ["tyt-mat", "tyt-geo"],
  tyt_fen: ["tyt-fiz", "tyt-kim", "tyt-biyo"],
  tyt_sos: ["tyt-tar", "tyt-cog", "tyt-fel", "tyt-din"],
  ayt_mat: ["ayt-mat", "ayt-geo"],
  ayt_fiz: ["ayt-fiz"],
  ayt_kim: ["ayt-kim"],
  ayt_bio: ["ayt-biyo"],
  ayt_edb: ["ayt-edeb"],
  ayt_tar1: ["ayt-tar1"],
  ayt_cog1: ["ayt-cog1"],
  ayt_tar2: ["ayt-tar2"],
  ayt_cog2: ["ayt-cog2"],
  ayt_dil: ["ydt"],
};

const STUDENTS_FULL_KEYS = ["derecepanel_students_full_v1", "students"];

function slugFromName(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCurrentUser(): YksSimUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = panelGetItem("currentUser");
    if (!raw) return null;
    return JSON.parse(raw) as YksSimUser;
  } catch {
    return null;
  }
}

export function catalogIdForUser(u: YksSimUser | null): string {
  if (!u) return "";
  const students = loadStudentsFull({ seedIfEmpty: false });
  const code = String(u.studentCode || "").trim();
  const name = String(u.name || "").trim();
  for (const s of students) {
    if (code && String(s.ogrenciId) === code) return s.ogrenciId;
    if (name && String(s.name).trim() === name) return s.ogrenciId;
  }
  return "";
}

export function studentCodeForUser(u: YksSimUser | null): string {
  if (!u) return "";
  const code = String(u.studentCode || "").trim();
  if (code) return code;
  return catalogIdForUser(u);
}

export function primaryWriteId(u: YksSimUser | null): string {
  if (!u) return "";
  return catalogIdForUser(u) || studentCodeForUser(u) || String(u.kullaniciAdi || "").trim();
}

export function storageKeyCandidates(u: YksSimUser | null): string[] {
  const out: string[] = [];
  const seen: Record<string, boolean> = {};
  const add = (k: string) => {
    k = String(k || "").trim();
    if (!k || seen[k]) return;
    seen[k] = true;
    out.push(k);
  };
  if (!u) return out;
  add(catalogIdForUser(u));
  add(studentCodeForUser(u));
  add(String(u.id || ""));
  add(String(u.ogrenciId || ""));
  add(String(u.kullaniciAdi || ""));
  add(String(u.username || ""));
  if (u.email) {
    const em = String(u.email).trim();
    add(em);
    const at = em.indexOf("@");
    if (at > 0) add(em.slice(0, at));
  }
  add(slugFromName(u.name || ""));
  if (!out.length) add(primaryWriteId(u));
  return out;
}

function sameStudent(rec: ExamResultRow, ids: string[], u: YksSimUser | null): boolean {
  const sid = String(rec.studentId || "").trim();
  const sc = String(rec.studentCode || "").trim();
  for (const id of ids) {
    if (id && (sid === id || sc === id)) return true;
  }
  const nm = String(rec.name || rec.studentName || "").trim();
  if (u && nm && nm === String(u.name || "").trim()) return true;
  return false;
}

export function readMergedExamResultsForStudent(u: YksSimUser | null): ExamResultRow[] {
  const ids = storageKeyCandidates(u);
  const byKey: Record<string, ExamResultRow> = {};

  const add = (rec: ExamResultRow) => {
    if (!rec?.examId) return;
    if (!sameStudent(rec, ids, u)) return;
    const k = String(rec.examId);
    const prev = byKey[k];
    if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) {
      byKey[k] = rec;
    }
  };

  ids.forEach((id) => {
    readJsonArray<ExamResultRow>(`examResults_${id}`).forEach(add);
  });
  readExamResults().forEach(add);

  return Object.values(byKey).sort((a, b) => {
    const ta = Date.parse(String(a.savedAt || "").slice(0, 19)) || 0;
    const tb = Date.parse(String(b.savedAt || "").slice(0, 19)) || 0;
    if (ta !== tb) return ta - tb;
    return String(a.examName || "").localeCompare(String(b.examName || ""), "tr");
  });
}

export function getLastExamRecord(u: YksSimUser | null): ExamResultRow | null {
  const rows = readMergedExamResultsForStudent(u);
  return rows.length ? rows[rows.length - 1]! : null;
}

function normalizeLetter(c: string): string {
  return (
    String(c || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "")
      .charAt(0) || ""
  );
}

function buildStudentAnswers(rec: ExamResultRow, n: number): string {
  const raw = String(rec.answers || "")
    .toUpperCase()
    .replace(/[^A-E]/g, "");
  return (raw + " ".repeat(n)).slice(0, n);
}

function buildKeyString(exam: KurumDeneme, n: number): string {
  const arr = exam.cevaplar || [];
  let s = "";
  for (let i = 0; i < n; i++) {
    const L = normalizeLetter(String(arr[i] || ""));
    s += L || " ";
  }
  return s.slice(0, n);
}

function dynNetFromIndices(ans: string, key: string, indices: number[]): number {
  let d = 0;
  let y = 0;
  for (const i of indices) {
    const k = key.charAt(i);
    const a = ans.charAt(i);
    if (!k || k === " ") continue;
    if (!a || a === " ") continue;
    if (a === k) d++;
    else y++;
  }
  return Math.round(netFromCorrectWrong(d, y) * 10) / 10;
}

function indicesForNsBranch(
  byIndex: { subjectId: string }[],
  branchId: NsBranchId
): number[] {
  const ids = NS_TO_SUBJECTS[branchId];
  if (!ids?.length) return [];
  const set = new Set(ids);
  const ix: number[] = [];
  byIndex.forEach((cell, i) => {
    if (set.has(cell.subjectId)) ix.push(i);
  });
  return ix;
}

export function computeNsBranchNetsFromRecord(
  rec: ExamResultRow | null
): Partial<Record<NsBranchId, number>> {
  const out: Partial<Record<NsBranchId, number>> = {};
  if (!rec?.examId) return out;

  const exam = findExamById(rec.examId) || loadMergedExams().find((e) => e.id === rec.examId);
  if (!exam) return out;

  let sinav = String(exam.sinav || "TYT").toUpperCase();
  if (sinav === "YKS" || sinav === "GENEL") sinav = "TYT";
  if (sinav !== "AYT" && sinav !== "YDT") sinav = "TYT";

  const layout = getExamLayout(sinav as "TYT" | "AYT" | "YDT");
  const n = layout.n;
  if (!n || !layout.byIndex?.length) return out;

  const keyStr = buildKeyString(exam as KurumDeneme, n);
  if (!keyStr.replace(/\s/g, "").length) return out;

  const ans = buildStudentAnswers(rec, n);
  const branchIds = Object.keys(NS_TO_SUBJECTS) as NsBranchId[];

  for (const bid of branchIds) {
    const ix = indicesForNsBranch(layout.byIndex, bid);
    if (!ix.length) continue;
    const net = dynNetFromIndices(ans, keyStr, ix);
    if (Number.isFinite(net)) out[bid] = net;
  }
  return out;
}

export function formatGoalLabelFromTarget(o: StudentTargetPayload | null): string {
  if (!o) return "";
  const uni = String(o.universite || o.university || "").trim();
  const bol = String(o.bolum || o.department || "").trim();
  if (!uni && !bol) return "";
  if (uni && bol) return `${uni} – ${bol}`;
  return uni || bol;
}

let targetRevisionCounter = "";

export function targetRevisionBump(): string {
  targetRevisionCounter = String(Date.now());
  return targetRevisionCounter;
}

export function readStudentTargetForUser(u: YksSimUser | null): StudentTargetPayload | null {
  if (typeof window === "undefined" || !u) return null;
  const tries = storageKeyCandidates(u);
  let best: StudentTargetPayload | null = null;
  let bestMs = 0;
  for (const kid of tries) {
    try {
      const raw = panelGetItem(`student_target_${kid}`);
      if (!raw?.trim()) continue;
      const o = JSON.parse(raw) as StudentTargetPayload;
      if (!o?.universite && !o?.bolum && !o?.university && !o?.department) continue;
      const ms = Date.parse(o.setAt || "") || 0;
      if (!best || ms >= bestMs) {
        best = o;
        bestMs = ms;
      }
    } catch {
      /* ignore */
    }
  }
  return best;
}

function notifyStudentTargetChanged(ids: string[]) {
  targetRevisionBump();
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("derece:student-target-changed", { detail: { ids } })
  );
  try {
    window.parent?.postMessage({ type: "derece-student-target-updated" }, "*");
  } catch {
    /* ignore */
  }
}

export function saveStudentTargetForUser(
  u: YksSimUser | null,
  hedefData: StudentTargetPayload
): boolean {
  if (typeof window === "undefined" || !u) return false;
  const uni = String(hedefData.universite || hedefData.university || "").trim();
  const bol = String(hedefData.bolum || hedefData.department || "").trim();
  if (!uni && !bol) return false;

  const payload: StudentTargetPayload = {
    ...hedefData,
    universite: uni,
    bolum: bol,
    setAt: hedefData.setAt || new Date().toISOString(),
  };

  const keys = storageKeyCandidates(u);
  if (!keys.length) return false;

  keys.forEach((kid) => {
    if (!kid) return;
    try {
      panelSetItem(`student_target_${kid}`, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  });

  const goalLabel = formatGoalLabelFromTarget(payload);
  try {
    const raw = panelGetItem("currentUser");
    if (raw) {
      const cu = JSON.parse(raw) as YksSimUser;
      cu.goal = goalLabel;
      panelSetItem("currentUser", JSON.stringify(cu));
    }
  } catch {
    /* ignore */
  }

  notifyStudentTargetChanged(keys);
  return true;
}

export function completedTopicsStorageKey(ogrenciId: string): string {
  return `completed_topics_${String(ogrenciId || "").trim()}`;
}

export function readCompletedTopicsMap(ogrenciId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(completedTopicsStorageKey(ogrenciId));
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, boolean>;
    return o && typeof o === "object" && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

export function setTopicCompleted(
  ogrenciId: string,
  topicTitle: string,
  done: boolean
): void {
  if (typeof window === "undefined" || !ogrenciId || !topicTitle) return;
  const map = readCompletedTopicsMap(ogrenciId);
  const k = String(topicTitle).trim();
  if (!k) return;
  if (done) map[k] = true;
  else delete map[k];
  try {
    panelSetItem(completedTopicsStorageKey(ogrenciId), JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Legacy DereceOgrenciSimBridge uyumlu export */
export const StudentSimBridge = {
  getCurrentUser,
  catalogIdForUser,
  primaryWriteId,
  storageKeyCandidates,
  readMergedExamResultsForStudent,
  getLastExamRecord,
  computeNsBranchNetsFromRecord,
  readStudentTargetForUser,
  saveStudentTargetForUser,
  formatGoalLabelFromTarget,
  targetRevisionBump,
  TARGET_REV_KEY,
  readCompletedTopicsMap,
  setTopicCompleted,
  completedTopicsStorageKey,
};

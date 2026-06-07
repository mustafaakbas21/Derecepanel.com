"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { hydrateFromLocalStorage } from "@/lib/analiz/hydrate";
import type { AnalizData, AnalizExamShell } from "@/lib/analiz/types";
import { syncAllExamMatricesFromCalendar } from "@/lib/exams/exam-matrix";
import {
  onExamMatrixChange,
  onExamResultsChange,
  onExamsChange,
} from "@/lib/exams/events";

export function useAnalizData() {
  const [data, setData] = useState<AnalizData>(() => ({
    exams: {},
    enrollmentTotal: 0,
    examList: [],
  }));
  const [examId, setExamId] = useState("");
  const [activeTab, setActiveTab] = useState("1");
  const [studentId, setStudentId] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const matrixSynced = useRef(false);

  const refresh = useCallback(() => {
    setData(hydrateFromLocalStorage());
  }, []);

  useEffect(() => {
    if (!matrixSynced.current) {
      matrixSynced.current = true;
      syncAllExamMatricesFromCalendar();
    }
    refresh();
    const off1 = onExamResultsChange(() => refresh());
    const off2 = onExamsChange(() => refresh());
    const off3 = onExamMatrixChange(() => refresh());
    const tick = setInterval(refresh, 1000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      off1();
      off2();
      off3();
      clearInterval(tick);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const currentExam: AnalizExamShell | null = examId ? data.exams[examId] ?? null : null;

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    if (!currentExam) return ["all"];
    currentExam.students.forEach((s) => {
      const c = String(s.meta || "Genel").split("·")[0]?.trim() || "Genel";
      set.add(c);
    });
    return ["all", ...Array.from(set).sort()];
  }, [currentExam]);

  const filteredStudents = useMemo(() => {
    if (!currentExam) return [];
    if (classFilter === "all") return currentExam.students;
    return currentExam.students.filter((s) => {
      const c = String(s.meta || "Genel").split("·")[0]?.trim() || "Genel";
      return c === classFilter;
    });
  }, [currentExam, classFilter]);

  const examMeta = useMemo(() => {
    const m: Record<string, { date?: string; name?: string }> = {};
    data.examList.forEach((e) => {
      m[e.id] = { date: e.date, name: e.name };
    });
    return m;
  }, [data.examList]);

  return {
    data,
    refresh,
    examId,
    setExamId,
    activeTab,
    setActiveTab,
    studentId,
    setStudentId,
    classFilter,
    setClassFilter,
    currentExam,
    classOptions,
    filteredStudents,
    examMeta,
  };
}

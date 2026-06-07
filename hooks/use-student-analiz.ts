"use client";

import { useEffect, useMemo, useState } from "react";

import {
  filterExamListForStudent,
  findStudentInExam,
  pickDefaultExamId,
  resolveStudentAnalizProfile,
  studentAnalizMatchIds,
} from "@/lib/student/student-analiz-scope";
import { useAnalizData } from "@/hooks/use-analiz-data";

const BOOT_DELAY_MS = 250;

export function useStudentAnaliz() {
  const analiz = useAnalizData();
  const [bootReady, setBootReady] = useState(false);

  const matchIds = useMemo(() => studentAnalizMatchIds(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootReady(true), BOOT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const studentExams = useMemo(
    () => filterExamListForStudent(analiz.data, matchIds),
    [analiz.data, matchIds]
  );

  const profile = useMemo(
    () => resolveStudentAnalizProfile(analiz.data, matchIds),
    [analiz.data, matchIds]
  );

  const resolvedStudentId = profile?.id ?? matchIds[0] ?? "";

  useEffect(() => {
    if (!studentExams.length) return;

    const examValid =
      analiz.examId && studentExams.some((exam) => exam.id === analiz.examId);
    if (!examValid) {
      const nextExam = pickDefaultExamId(studentExams, analiz.examId);
      if (nextExam) analiz.setExamId(nextExam);
    }
  }, [studentExams, analiz.examId, analiz.setExamId]);

  useEffect(() => {
    if (!resolvedStudentId || resolvedStudentId === analiz.studentId) return;
    analiz.setStudentId(resolvedStudentId);
  }, [resolvedStudentId, analiz.studentId, analiz.setStudentId]);

  const currentExam = analiz.examId ? analiz.data.exams[analiz.examId] ?? null : null;

  const selectedStudent = useMemo(
    () => findStudentInExam(currentExam, matchIds),
    [currentExam, matchIds]
  );

  const hydrated =
    bootReady &&
    (!matchIds.length ||
      studentExams.length === 0 ||
      (!!analiz.examId && !!selectedStudent));

  return {
    ...analiz,
    matchIds,
    studentExams,
    profile,
    resolvedStudentId,
    selectedStudent,
    currentExam,
    hydrated,
  };
}

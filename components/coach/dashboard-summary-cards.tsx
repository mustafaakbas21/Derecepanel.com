"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Layers, Users } from "lucide-react";

import { useLibrary } from "@/hooks/use-library";
import { useStudentsFull } from "@/lib/students/use-students-full";
import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import {
  ensureQuestionPoolInit,
  QUESTION_POOL_UPDATED_EVENT,
} from "@/lib/test-maker/question-pool";

async function readPoolCount(): Promise<number> {
  if (typeof window === "undefined") return 0;
  const list = await ensureQuestionPoolInit();
  return list.length;
}

export function DashboardSummaryCards() {
  const { students, hydrated: studentsHydrated } = useStudentsFull();
  const { books, hydrated: libHydrated } = useLibrary();
  const [poolCount, setPoolCount] = useState(0);
  const [poolHydrated, setPoolHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      void readPoolCount().then((n) => {
        setPoolCount(n);
        setPoolHydrated(true);
      });
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.questionPool || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    window.addEventListener(QUESTION_POOL_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(QUESTION_POOL_UPDATED_EVENT, refresh);
    };
  }, []);

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "aktif").length,
    [students]
  );

  const cards = [
    {
      key: "students",
      label: "Aktif Öğrenci",
      value: activeStudents,
      sublabel: "Şu an kayıtlı",
      icon: Users,
      ready: studentsHydrated,
    },
    {
      key: "pool",
      label: "Soru Havuzu",
      value: poolCount,
      sublabel: "Havuzdaki soru",
      icon: Layers,
      ready: poolHydrated,
    },
    {
      key: "books",
      label: "Kayıtlı Kitap",
      value: books.length,
      sublabel: "Kütüphanede",
      icon: BookOpen,
      ready: libHydrated,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.key}
            className="relative overflow-hidden rounded-[1.35rem] bg-white p-6"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-medium text-slate-500">{c.label}</p>
                <p
                  className="mt-2 text-[2.125rem] font-bold leading-none tracking-tight text-slate-900"
                  suppressHydrationWarning
                >
                  {c.ready ? c.value : "—"}
                </p>
                <p className="mt-2 text-[13px] text-slate-400">{c.sublabel}</p>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "#fff7ed" }}
              >
                <Icon className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  Globe2,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryEmptyState,
  LibraryFilterBar,
  LibraryInsights,
  LibraryPageHeader,
  LibrarySectionTitle,
} from "@/components/library/library-shell";
import { StudentExamCard, StudentExamHero } from "@/components/student/student-exam-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilteredStudentExams, useStudentExams } from "@/hooks/use-student-exams";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";
import type { StudentExamScope } from "@/lib/student/student-exams-scope";
import { cn } from "@/lib/utils";

type ScopeTab = StudentExamScope;

export function StudentExamsPage() {
  const { hydrated, upcoming, past, stats } = useStudentExams();
  const [scope, setScope] = useState<ScopeTab>("all");
  const [sinav, setSinav] = useState<"all" | "TYT" | "AYT" | "YDT">("all");
  const [search, setSearch] = useState("");

  const { filtered, groups } = useFilteredStudentExams(upcoming, scope, sinav, search);

  const scopeCounts = useMemo(
    () => ({
      all: upcoming.length,
      kurumsal: upcoming.filter((e) => !e.isGlobal).length,
      global: upcoming.filter((e) => e.isGlobal).length,
    }),
    [upcoming]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Kurumsal Denemeler"
        description="Koçunuzun planladığı kurum denemeleri ve global yayın takvimi tek ekranda. Denemeler koç paneli ile anlık senkronize olur."
        meta={
          stats.upcomingTotal
            ? `${stats.upcomingTotal} yaklaşan deneme · ${stats.kurumsalUpcoming} kurumsal · ${stats.globalUpcoming} global`
            : "Yaklaşan deneme bulunmuyor"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.global}>
                <Globe2 className="mr-2 h-4 w-4" />
                Global takvim
              </Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href={STUDENT_DENEME_ROUTES.sonuclar}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Sonuçlarım
              </Link>
            </Button>
          </div>
        }
      />

      <LibraryInsights
        metrics={[
          {
            label: "Yaklaşan",
            value: stats.upcomingTotal,
            sub: stats.nextExam ? stats.nextExam.countdownLabel : "Plan yok",
            icon: CalendarDays,
          },
          {
            label: "Kurumsal",
            value: stats.kurumsalUpcoming,
            sub: "Koç / kurum planı",
            icon: Building2,
          },
          {
            label: "Global",
            value: stats.globalUpcoming,
            sub: "Yayın evi takvimi",
            icon: Globe2,
          },
          {
            label: "Son net",
            value: stats.lastNet != null ? String(stats.lastNet) : "—",
            sub: stats.pastWithResult ? `${stats.pastWithResult} geçmiş sonuç` : "Henüz sonuç yok",
            icon: TrendingUp,
          },
        ]}
      />

      {stats.nextExam ? <StudentExamHero exam={stats.nextExam} /> : null}

      <div className="flex flex-wrap gap-2">
        <ScopeTabButton
          active={scope === "all"}
          onClick={() => setScope("all")}
          count={scopeCounts.all}
        >
          Tümü
        </ScopeTabButton>
        <ScopeTabButton
          active={scope === "kurumsal"}
          onClick={() => setScope("kurumsal")}
          count={scopeCounts.kurumsal}
        >
          Kurumsal
        </ScopeTabButton>
        <ScopeTabButton
          active={scope === "global"}
          onClick={() => setScope("global")}
          count={scopeCounts.global}
        >
          Global
        </ScopeTabButton>
      </div>

      <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
        <div className={LIBRARY_PANEL_INNER}>
          <LibraryFilterBar trailing={`${filtered.length} / ${upcoming.length} deneme`}>
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Deneme veya yayınevi ara…"
                className="pl-9"
              />
            </div>
            <Select value={sinav} onValueChange={(v) => setSinav(v as typeof sinav)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sınav" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm sınavlar</SelectItem>
                <SelectItem value="TYT">TYT</SelectItem>
                <SelectItem value="AYT">AYT</SelectItem>
                <SelectItem value="YDT">YDT</SelectItem>
              </SelectContent>
            </Select>
          </LibraryFilterBar>

          {filtered.length === 0 ? (
            <LibraryEmptyState
              title={
                upcoming.length === 0
                  ? "Yaklaşan deneme yok"
                  : "Filtreye uygun deneme yok"
              }
              description={
                upcoming.length === 0
                  ? "Koçunuz kurumsal deneme oluşturduğunda veya global takvime kayıt eklendiğinde burada görünür."
                  : "Arama veya filtreleri değiştirerek tekrar deneyin."
              }
              action={
                upcoming.length === 0 ? (
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" asChild>
                      <Link href={STUDENT_DENEME_ROUTES.global}>Global takvime git</Link>
                    </Button>
                    <Button variant="primary" asChild>
                      <Link href={STUDENT_DENEME_ROUTES.sonuclar}>Sonuçlarım</Link>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setSinav("all");
                      setScope("all");
                    }}
                  >
                    Filtreleri temizle
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.key}>
                  <LibrarySectionTitle title={group.label} subtitle={group.sub} />
                  <div className="mt-4 space-y-3">
                    {group.items.map((exam) => (
                      <StudentExamCard
                        key={exam.id}
                        exam={exam}
                        highlight={stats.nextExam?.id === exam.id}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {past.length > 0 ? (
        <div className={LIBRARY_PANEL_CLASS} style={{ boxShadow: "var(--card-shadow-sm)" }}>
          <div className={LIBRARY_PANEL_INNER}>
            <LibrarySectionTitle
              title="Geçmiş denemeler"
              subtitle="Tamamlanan tarihler — sonuç girilmiş denemeler vurgulanır"
            />
            <div className="mt-4 space-y-3">
              {past.map((exam) => (
                <StudentExamCard key={`past-${exam.id}`} exam={exam} />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={STUDENT_DENEME_ROUTES.sonuclar}>Tüm sonuçlarım</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScopeTabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
    >
      {children}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] tabular-nums",
          active ? "bg-white/15 text-white" : "bg-white text-slate-600"
        )}
      >
        {count}
      </span>
    </button>
  );
}

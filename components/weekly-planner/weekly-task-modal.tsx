"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getConcepts, getSubjectOptions, getTopicOptions } from "@/lib/mufredat";
import { filterInsightsBySubject } from "@/lib/weekly-planner/mr-engine-v3";
import type { AiSuggestion, ExamInsightsResult, GorevTipi, WeeklyTask } from "@/lib/weekly-planner/types";
import {
  type TaskFormPayload,
  weeklyTaskFromForm,
} from "@/lib/weekly-planner/task-build";
import { WEEK_DAY_LABELS } from "@/lib/weekly-planner/week-utils";
import { cn } from "@/lib/utils";

const GOREV_OPTIONS: { value: GorevTipi; label: string }[] = [
  { value: "konu_calisma", label: "Konu çalışması" },
  { value: "soru_cozme", label: "Soru çözümü" },
  { value: "deneme_cozme", label: "Deneme / analiz" },
  { value: "etut_mola", label: "Etüt / Mola" },
  { value: "tekrar", label: "Tekrar / pekiştirme" },
  { value: "video", label: "Video / dijital içerik" },
];

export type WeeklyTaskModalSubmit = {
  task: WeeklyTask;
  mode: "create" | "edit";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialDayIndex: number;
  defaultDateISO: string;
  editTask?: WeeklyTask | null;
  insights?: ExamInsightsResult | null;
  filterSubjectId?: string;
  initialSuggestion?: AiSuggestion | null;
  onSubmit: (payload: WeeklyTaskModalSubmit) => void;
};

function applySuggestionToForm(
  s: AiSuggestion,
  setters: {
    setTaskKind: (v: GorevTipi) => void;
    setSubjectId: (v: string) => void;
    setTopicId: (v: string) => void;
    setConcepts: (v: string[]) => void;
    setTargetQuestions: (v: string) => void;
    setDurationMin: (v: string) => void;
    setCoachNote: (v: string) => void;
  }
) {
  setters.setTaskKind(s.taskKind);
  if (s.subjectId) setters.setSubjectId(s.subjectId);
  if (s.topicId) {
    setters.setTopicId(s.topicId);
    if (s.topicName) setters.setConcepts([s.topicName]);
  }
  if (s.targetQuestions) setters.setTargetQuestions(s.targetQuestions);
  if (s.suggestedDurationMin) setters.setDurationMin(s.suggestedDurationMin);
  if (s.coachNote) setters.setCoachNote(s.coachNote);
}

export function WeeklyTaskModal({
  open,
  onOpenChange,
  mode,
  initialDayIndex,
  defaultDateISO,
  editTask,
  insights,
  filterSubjectId = "",
  initialSuggestion,
  onSubmit,
}: Props) {
  const [dayIndex, setDayIndex] = useState(initialDayIndex);
  const [taskKind, setTaskKind] = useState<GorevTipi>("konu_calisma");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [targetQuestions, setTargetQuestions] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [resource, setResource] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [coachNote, setCoachNote] = useState("");
  const [dateISO, setDateISO] = useState(defaultDateISO);

  const subjects = useMemo(() => getSubjectOptions("ALL"), []);
  const topics = useMemo(
    () => (subjectId ? getTopicOptions(subjectId) : []),
    [subjectId]
  );
  const conceptOpts = useMemo(
    () => (subjectId && topicId ? getConcepts(subjectId, topicId) : []),
    [subjectId, topicId]
  );

  const applySuggestion = useCallback(
    (s: AiSuggestion) => {
      applySuggestionToForm(s, {
        setTaskKind,
        setSubjectId,
        setTopicId,
        setConcepts,
        setTargetQuestions,
        setDurationMin,
        setCoachNote,
      });
    },
    []
  );

  const modalSuggestions = useMemo(() => {
    if (!insights) return [];
    if (!filterSubjectId) return insights.suggestions;
    return filterInsightsBySubject(insights, filterSubjectId).suggestions;
  }, [insights, filterSubjectId]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editTask) {
      setDayIndex(editTask.dayIndex);
      setTaskKind(editTask.taskKind);
      setSubjectId(editTask.subjectId || "");
      setTopicId(editTask.topicId || "");
      setConcepts(editTask.conceptNames || []);
      setTargetQuestions(editTask.targetQuestions || "");
      setDurationMin(editTask.durationMin || "");
      setResource(editTask.resource || "");
      setVideoUrl(editTask.videoUrl || "");
      setCoachNote(editTask.coachNote || "");
      setDateISO(editTask.dateISO || defaultDateISO);
    } else {
      setDayIndex(initialDayIndex);
      setTaskKind("konu_calisma");
      setSubjectId(filterSubjectId || "");
      setTopicId("");
      setConcepts([]);
      setTargetQuestions("");
      setDurationMin("");
      setResource("");
      setVideoUrl("");
      setCoachNote("");
      setDateISO(defaultDateISO);
      if (initialSuggestion) applySuggestion(initialSuggestion);
    }
  }, [
    open,
    mode,
    editTask,
    initialDayIndex,
    defaultDateISO,
    filterSubjectId,
    initialSuggestion,
    applySuggestion,
  ]);

  useEffect(() => {
    if (!subjectId) setTopicId("");
  }, [subjectId]);

  useEffect(() => {
    if (topicId && conceptOpts.length === 1 && concepts.length === 0) {
      setConcepts([conceptOpts[0].name]);
    }
  }, [topicId, conceptOpts, concepts.length]);

  const isMola = taskKind === "etut_mola";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMola && (!subjectId || !topicId)) return;
    if (!isMola && concepts.length === 0 && conceptOpts.length > 0) return;

    const subjectName = subjects.find((s) => s.id === subjectId)?.label || "";
    const topicName = topics.find((t) => t.id === topicId)?.label || "";

    const form: TaskFormPayload = {
      dayIndex,
      dateISO,
      taskKind,
      subjectId,
      subjectName,
      topicId,
      topicName,
      conceptNames: concepts,
      targetQuestions,
      durationMin,
      resource,
      videoUrl,
      coachNote,
    };

    const task = weeklyTaskFromForm(form, mode === "edit" ? editTask?.id : undefined);
    onSubmit({ task, mode });
    onOpenChange(false);
  };

  const toggleConcept = (name: string, checked: boolean) => {
    setConcepts((prev) =>
      checked ? [...new Set([...prev, name])] : prev.filter((c) => c !== name)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Görevi düzenle" : "Yeni ders / görev"}</DialogTitle>
          <p className="text-sm text-slate-500">
            {WEEK_DAY_LABELS[dayIndex]} · MR motoru öneriyi forma aktarır ·{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">yks-mufredat.json</code>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" && modalSuggestions.length > 0 && (
            <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">AI konu önerileri</p>
                  <p className="text-xs text-slate-500">
                    Son {insights?.examCount ?? 3} deneme MR analizi — karta tıklayınca form dolar
                  </p>
                </div>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {modalSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className={cn(
                      "w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-900 hover:shadow-md",
                      subjectId === s.subjectId &&
                        topicId === s.topicId &&
                        "border-slate-900 ring-1 ring-slate-900/20"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                          s.priority === "high"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {s.priority === "high" ? "Yüksek öncelik" : "Rutin"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{s.subtitle}</p>
                    {s.examBreakdown && (
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{s.examBreakdown}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      {s.subjectName && <span>{s.subjectName}</span>}
                      {s.topicName && <span>· {s.topicName}</span>}
                      {s.targetQuestions && <span>· {s.targetQuestions} soru</span>}
                      {s.suggestedDurationMin && <span>· {s.suggestedDurationMin} dk</span>}
                      {s.score != null && (
                        <span className="text-rose-600">· MR %{s.score}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "create" && insights?.emptyReason && modalSuggestions.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {insights.emptyReason}
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
            Ders ve konu müfredattan gelir. AI önerisi seçtiyseniz alanlar otomatik doldurulur;
            gerekirse düzenleyip kaydedin.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Gün</Label>
              <Select value={String(dayIndex)} onValueChange={(v) => setDayIndex(Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_DAY_LABELS.map((label, i) => (
                    <SelectItem key={label} value={String(i)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="wp-date">Tarih</Label>
              <Input
                id="wp-date"
                type="date"
                className="mt-1"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Görev tipi</Label>
            <Select value={taskKind} onValueChange={(v) => setTaskKind(v as GorevTipi)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOREV_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isMola && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>
                    Ders <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={subjectId || "_"} onValueChange={(v) => setSubjectId(v === "_" ? "" : v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Ders seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— Seçin —</SelectItem>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Konu <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={topicId || "_"}
                    onValueChange={(v) => {
                      setTopicId(v === "_" ? "" : v);
                      setConcepts([]);
                    }}
                    disabled={!subjectId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Konu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— Seçin —</SelectItem>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {topicId && conceptOpts.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>
                      Kavramlar <span className="text-rose-500">*</span>
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setConcepts(conceptOpts.map((c) => c.name))}
                      >
                        Hepsi
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setConcepts([])}
                      >
                        Hiçbiri
                      </Button>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "max-h-36 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3",
                      concepts.length === 0 && "border-amber-200 bg-amber-50/50"
                    )}
                  >
                    {conceptOpts.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                      >
                        <Checkbox
                          checked={concepts.includes(c.name)}
                          onCheckedChange={(ch) => toggleConcept(c.name, !!ch)}
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="wp-soru">Hedef soru</Label>
              <Input
                id="wp-soru"
                className="mt-1"
                placeholder="Örn. 40"
                value={targetQuestions}
                onChange={(e) => setTargetQuestions(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wp-sure">Süre (dk)</Label>
              <Input
                id="wp-sure"
                className="mt-1"
                placeholder="Örn. 45"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="wp-kaynak">Kaynak / materyal</Label>
            <Input
              id="wp-kaynak"
              className="mt-1"
              placeholder="Örn. 345 TYT Matematik"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="wp-video">Video linki</Label>
            <Input
              id="wp-video"
              type="url"
              className="mt-1"
              placeholder="https://…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="wp-not">
              {isMola ? "Etüt / mola notu" : "Koç notu"}
            </Label>
            <textarea
              id="wp-not"
              className="mt-1 flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
              rows={3}
              placeholder="Öğrenciye özel yönlendirme…"
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="primary">
              {mode === "edit" ? "Güncelle" : "Takvime ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

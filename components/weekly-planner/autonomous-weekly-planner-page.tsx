"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Printer,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Scissors,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/notify";

import { GuardedCoachLink } from "@/components/coach/guarded-coach-link";
import { QuickPresetPill } from "@/components/weekly-planner/quick-preset-pill";
import { StudentPickerBar } from "@/components/weekly-planner/student-picker-bar";
import { WeeklyLastExamPanel } from "@/components/weekly-planner/weekly-last-exam-panel";
import { WeeklyPlannerSidebar } from "@/components/weekly-planner/weekly-planner-sidebar";
import {
  WeeklyTaskModal,
  type WeeklyTaskModalSubmit,
} from "@/components/weekly-planner/weekly-task-modal";
import { useWeeklyPrint } from "@/components/weekly-planner/use-weekly-print";
import {
  WeeklyResetProgramDialog,
  WeeklySaveProgramDialog,
  WeeklyUnsavedLeaveDialog,
} from "@/components/weekly-planner/weekly-planner-dialogs";
import { Button } from "@/components/ui/button";
import { HAFTALIK_PROGRAM_ROUTES } from "@/lib/coach/haftalik-program-nav-config";
import {
  findStudentRecordForUser,
  getCurrentUser as getKonuTakipUser,
  resolveStudentTrackingId,
} from "@/lib/konu-takip/student-scope";
import { STUDENT_HAFTALIK_PROGRAM_ROUTES } from "@/lib/student/sidebar-nav-config";
import type { MufredatTrack } from "@/lib/mufredat";
import { buildSubjectCatalog } from "@/lib/weekly-planner/subject-catalog";
import { FIELD_LABELS } from "@/lib/students/constants";
import { STUDENTS_CHANGE_EVENT } from "@/lib/students/events";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import { loadStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";
import { buildExamInsightsForStudent } from "@/lib/weekly-planner/exam-insights";
import { buildWeeklyPrintSnapshot } from "@/lib/weekly-planner/print-snapshot";
import {
  getSavedWeeklyProgram,
  newSavedProgramId,
  upsertSavedWeeklyProgram,
} from "@/lib/weekly-planner/saved-programs";
import {
  findStudentPersonalForWeek,
  getStudentPersonalWeeklyProgram,
  newPersonalProgramId,
  upsertStudentPersonalWeeklyProgram,
} from "@/lib/weekly-planner/student-personal-programs";
import {
  registerWeeklyPlannerLeaveGuard,
  registerWeeklyPlannerLeaveModal,
} from "@/lib/weekly-planner/leave-guard";
import { clearWeeklyDraft } from "@/lib/weekly-planner/storage";
import {
  QUICK_PRESETS,
  weeklyTaskFromQuickPreset,
  type QuickPresetId,
} from "@/lib/weekly-planner/quick-presets";
import { weeklyTaskFromSuggestion } from "@/lib/weekly-planner/task-build";
import type { AiSuggestion, WeeklyTask } from "@/lib/weekly-planner/types";
import {
  formatWeekRangeTurkish,
  mondayOf,
  toISODate,
  todayDayIndex,
  WEEK_DAY_LABELS,
  WEEK_DAY_SHORT,
  dayDateForIndex,
} from "@/lib/weekly-planner/week-utils";
import { computeDayWorkloads, type DayWorkload } from "@/lib/weekly-planner/workload";
import { cn } from "@/lib/utils";

type DragSource =
  | { kind: "suggestion"; id: string }
  | { kind: "task"; id: string }
  | { kind: "preset"; id: QuickPresetId }
  | null;

type WeeklyPlannerDndContextValue = {
  activeDragId: string | null;
  setActiveDragId: (id: string | null) => void;
  dragOverDayId: string | null;
  setDragOverDayId: (id: string | null) => void;
  registerDroppable: (id: string, node: HTMLElement | null) => void;
  registerDraggable: (id: string, node: HTMLElement | null) => void;
};

const WeeklyPlannerDndContext = createContext<WeeklyPlannerDndContextValue | null>(null);

function useWeeklyPlannerDnd() {
  const ctx = useContext(WeeklyPlannerDndContext);
  if (!ctx) throw new Error("useWeeklyPlannerDnd must be used within provider");
  return ctx;
}

function WeeklyPlannerDndProvider({ children }: { children: ReactNode }) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);
  const droppableRefs = useRef<Record<string, HTMLElement | null>>({});
  const draggableRefs = useRef<Record<string, HTMLElement | null>>({});

  const registerDroppable = useCallback((id: string, node: HTMLElement | null) => {
    droppableRefs.current[id] = node;
  }, []);

  const registerDraggable = useCallback((id: string, node: HTMLElement | null) => {
    draggableRefs.current[id] = node;
  }, []);

  const value = useMemo(
    () => ({
      activeDragId,
      setActiveDragId,
      dragOverDayId,
      setDragOverDayId,
      registerDroppable,
      registerDraggable,
    }),
    [activeDragId, dragOverDayId, registerDroppable, registerDraggable]
  );

  return (
    <WeeklyPlannerDndContext.Provider value={value}>
      <div data-weekly-planner-dnd-root className="contents">
        {children}
      </div>
    </WeeklyPlannerDndContext.Provider>
  );
}

const TRANSITION = "transition-all duration-200 ease-out";

const ACCENT_BORDER: Record<WeeklyTask["accent"], string> = {
  math: "border-l-orange-500",
  turkish: "border-l-emerald-500",
  science: "border-l-sky-500",
  default: "border-l-stone-400",
};

const WORKLOAD_STYLES = {
  safe: { track: "bg-emerald-100/80", fill: "bg-emerald-500", text: "text-emerald-700" },
  warning: { track: "bg-amber-100/80", fill: "bg-amber-500", text: "text-amber-700" },
  danger: { track: "bg-rose-100/80", fill: "bg-rose-500", text: "text-rose-700" },
};

function DailyWorkloadMeter({ workload }: { workload: DayWorkload }) {
  const styles = WORKLOAD_STYLES[workload.level];
  return (
    <div className="mt-2 w-full px-1">
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className={cn("text-[9px] font-semibold uppercase tracking-wide", styles.text)}>
          Günlük yük
        </span>
        <span className="text-[9px] font-bold tabular-nums text-slate-500">%{workload.percent}</span>
      </div>
      <div className={cn("h-1 overflow-hidden rounded-full", styles.track)}>
        <div
          className={cn("h-full rounded-full", styles.fill, TRANSITION)}
          style={{ width: `${workload.percent}%` }}
        />
      </div>
      {workload.level === "danger" ? (
        <div className="group/tooltip relative mt-1 flex justify-center">
          <AlertTriangle className="h-3 w-3 text-rose-500" />
          <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white group-hover/tooltip:block">
            Bilişsel yük sınırı aşıldı
          </span>
        </div>
      ) : (
        <p className="mt-0.5 truncate text-center text-[9px] text-slate-400">{workload.label}</p>
      )}
    </div>
  );
}

function TaskCardQuickMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-lg border border-stone-200/90 bg-white/95 p-0.5 shadow-sm",
        "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
        TRANSITION
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="TestMaker"
        className="rounded-md p-1 text-orange-600 hover:bg-orange-50"
        onClick={() => toast.info("TestMaker entegrasyonu yakında")}
      >
        <Scissors className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="rounded-md p-1 text-slate-500 hover:bg-stone-100" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="rounded-md p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CalendarTaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
}: {
  task: WeeklyTask;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
}) {
  const { registerDraggable, setActiveDragId, activeDragId } = useWeeklyPlannerDnd();
  const isDragging = activeDragId === task.id;

  return (
    <article
      ref={(node) => registerDraggable(task.id, node)}
      draggable
      onDragStart={() => {
        setActiveDragId(task.id);
        onDragStart();
      }}
      onDragEnd={() => setActiveDragId(null)}
      className={cn(
        "group relative cursor-grab rounded-xl border border-stone-200/80 border-l-4 bg-white p-3 pr-8 shadow-sm active:cursor-grabbing",
        ACCENT_BORDER[task.accent],
        isDragging && "opacity-60 ring-2 ring-orange-300/50",
        TRANSITION
      )}
    >
      <TaskCardQuickMenu onEdit={onEdit} onDelete={onDelete} />
      <p className="text-sm font-semibold leading-snug text-slate-900">{task.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{task.meta}</p>
    </article>
  );
}

function DayColumn({
  dayIndex,
  label,
  shortLabel,
  tasks,
  workload,
  isToday,
  onDrop,
  onAddClick,
  onEditTask,
  onDeleteTask,
  onTaskDragStart,
}: {
  dayIndex: number;
  label: string;
  shortLabel: string;
  tasks: WeeklyTask[];
  workload: DayWorkload;
  isToday: boolean;
  onDrop: () => void;
  onAddClick: () => void;
  onEditTask: (t: WeeklyTask) => void;
  onDeleteTask: (id: string) => void;
  onTaskDragStart: (id: string) => void;
}) {
  const { registerDroppable, dragOverDayId, setDragOverDayId } = useWeeklyPlannerDnd();
  const droppableId = `day-${dayIndex}`;
  const isDragOver = dragOverDayId === droppableId;

  return (
    <div className="flex min-w-[9.5rem] flex-1 flex-col sm:min-w-0">
      <header
        className={cn(
          "mb-2 flex flex-col items-center rounded-xl px-2 py-2 text-center",
          isToday ? "bg-orange-50/90 ring-1 ring-orange-100" : "bg-white/60"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">
          {shortLabel}
        </span>
        <span className="text-xs font-bold text-slate-900 sm:text-sm">{label}</span>
        {isToday ? (
          <span className="mt-1 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
            Bugün
          </span>
        ) : null}
        <DailyWorkloadMeter workload={workload} />
      </header>

      <div
        ref={(node) => registerDroppable(droppableId, node)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDayId(droppableId);
        }}
        onDragLeave={() => setDragOverDayId(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverDayId(null);
          onDrop();
        }}
        className={cn(
          "flex min-h-[400px] flex-1 flex-col gap-2 rounded-2xl border border-dashed border-stone-200/90 bg-stone-50/50 p-2",
          isDragOver && "border-orange-300 bg-orange-50/50 ring-2 ring-orange-200/40",
          TRANSITION
        )}
      >
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={onAddClick}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-2 text-center text-[11px] text-slate-400 hover:border-stone-200 hover:bg-white/80 hover:text-slate-600"
          >
            Görev bırakın veya + ile ekleyin
          </button>
        ) : (
          tasks.map((t) => (
            <CalendarTaskCard
              key={t.id}
              task={t}
              onEdit={() => onEditTask(t)}
              onDelete={() => onDeleteTask(t.id)}
              onDragStart={() => onTaskDragStart(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

type PendingNav =
  | { kind: "route"; href: string }
  | { kind: "student"; id: string }
  | { kind: "week"; monday: Date };

function tasksSignature(tasks: WeeklyTask[]): string {
  return JSON.stringify(tasks);
}

type WeeklyPlannerMode = "coach" | "student";

function WeeklyPlannerPageInner({ mode = "coach" }: { mode?: WeeklyPlannerMode }) {
  const isStudentMode = mode === "student";
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadProgramId = searchParams.get("program");

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentId, setStudentId] = useState("");
  const [weekMonday, setWeekMonday] = useState(() => mondayOf(new Date()));
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const baselineTasksRef = useRef(tasksSignature([]));
  const pendingNavRef = useRef<PendingNav | null>(null);
  const [dragSource, setDragSource] = useState<DragSource>(null);
  const [distributing, setDistributing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialSuggestion, setModalInitialSuggestion] = useState<AiSuggestion | null>(
    null
  );
  const [trackFilter, setTrackFilter] = useState<MufredatTrack | "ALL">("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalDayIndex, setModalDayIndex] = useState(0);
  const [editTask, setEditTask] = useState<WeeklyTask | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saveOpenPrint, setSaveOpenPrint] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const { printing, openPrintPreview } = useWeeklyPrint();

  const syncBaseline = useCallback((next: WeeklyTask[]) => {
    baselineTasksRef.current = tasksSignature(next);
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    return tasksSignature(tasks) !== baselineTasksRef.current;
  }, [tasks]);

  const discardWorkspace = useCallback(() => {
    setTasks([]);
    syncBaseline([]);
    setEditingProgramId(null);
  }, [syncBaseline]);

  const applyPendingNav = useCallback(() => {
    const pending = pendingNavRef.current;
    pendingNavRef.current = null;
    if (!pending) return;
    if (pending.kind === "route") {
      router.push(pending.href);
      return;
    }
    if (pending.kind === "student") {
      setStudentId(pending.id);
      discardWorkspace();
      return;
    }
    setWeekMonday(pending.monday);
    discardWorkspace();
  }, [router, discardWorkspace]);

  const requestNav = useCallback(
    (next: PendingNav) => {
      if (!hasUnsavedChanges()) {
        if (next.kind === "route") router.push(next.href);
        else if (next.kind === "student") {
          setStudentId(next.id);
          discardWorkspace();
        } else {
          setWeekMonday(next.monday);
          discardWorkspace();
        }
        return;
      }
      pendingNavRef.current = next;
      setLeaveOpen(true);
    },
    [hasUnsavedChanges, router, discardWorkspace]
  );

  const weekMondayISO = toISODate(weekMonday);
  const todayIdx = todayDayIndex();

  const refreshStudents = useCallback(() => {
    if (isStudentMode) {
      const user = getKonuTakipUser();
      const sid = resolveStudentTrackingId(user);
      const rec = findStudentRecordForUser(user);
      setStudentId(sid);
      setStudents(rec ? [rec] : []);
      return;
    }
    const list = loadStudentsFull({ seedIfEmpty: true }).filter((s) => s.status === "aktif");
    setStudents(list);
    setStudentId((prev) => {
      if (prev && list.some((s) => s.ogrenciId === prev)) return prev;
      return list[0]?.ogrenciId ?? "";
    });
  }, [isStudentMode]);

  useEffect(() => {
    refreshStudents();
    const onChange = () => refreshStudents();
    window.addEventListener(STUDENTS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(STUDENTS_CHANGE_EVENT, onChange);
  }, [refreshStudents]);

  const selectedStudent = useMemo(() => {
    const fromList = students.find((s) => s.ogrenciId === studentId) ?? null;
    if (fromList) return fromList;
    if (!isStudentMode || !studentId) return null;
    const user = getKonuTakipUser();
    return {
      ogrenciId: studentId,
      coachId: "",
      name: user?.name?.trim() || "Öğrenci",
      sinifBranch: "",
      alan: "tyt",
      goal: "",
      status: "aktif",
      studentCode: user?.studentCode ?? "",
      kayitDate: "",
      parent: "",
      parentPhone: "",
    } as StudentRecord;
  }, [students, studentId, isStudentMode]);

  const insights = useMemo(
    () => buildExamInsightsForStudent(studentId),
    [studentId]
  );

  useEffect(() => {
    if (!loadProgramId) return;
    const program = isStudentMode
      ? getStudentPersonalWeeklyProgram(loadProgramId)
      : getSavedWeeklyProgram(loadProgramId);
    if (!program) {
      toast.error("Kayıtlı program bulunamadı");
      return;
    }
    setStudentId(program.studentId);
    setWeekMonday(mondayOf(new Date(`${program.weekMondayISO}T12:00:00`)));
    setTasks(program.tasks);
    syncBaseline(program.tasks);
    setEditingProgramId(program.id);
    toast.success("Kayıtlı program düzenleme için yüklendi");
  }, [loadProgramId, syncBaseline, isStudentMode]);

  useEffect(() => {
    if (!isStudentMode || !studentId || loadProgramId) return;
    const existing = findStudentPersonalForWeek(studentId, weekMondayISO);
    if (existing) {
      setTasks(existing.tasks);
      syncBaseline(existing.tasks);
      setEditingProgramId(existing.id);
    } else {
      setTasks([]);
      syncBaseline([]);
      setEditingProgramId(null);
    }
  }, [isStudentMode, studentId, weekMondayISO, loadProgramId, syncBaseline]);

  useEffect(() => {
    registerWeeklyPlannerLeaveGuard({
      hasUnsavedChanges,
      discardChanges: discardWorkspace,
    });
    registerWeeklyPlannerLeaveModal((href) => {
      pendingNavRef.current = { kind: "route", href };
      setLeaveOpen(true);
    });
    return () => {
      registerWeeklyPlannerLeaveGuard(null);
      registerWeeklyPlannerLeaveModal(null);
    };
  }, [hasUnsavedChanges, discardWorkspace]);

  const dayWorkloads = useMemo(() => computeDayWorkloads(tasks), [tasks]);
  const tasksByDay = useMemo(
    () => WEEK_DAY_LABELS.map((_, i) => tasks.filter((t) => t.dayIndex === i)),
    [tasks]
  );

  useEffect(() => {
    const cat = buildSubjectCatalog(trackFilter, insights, tasks);
    if (!cat.length) {
      setSelectedSubjectId("");
      return;
    }
    if (!cat.some((c) => c.id === selectedSubjectId)) {
      const pick = cat.find((c) => c.suggestionCount > 0) ?? cat[0];
      setSelectedSubjectId(pick?.id ?? "");
    }
  }, [trackFilter, insights, tasks, studentId, selectedSubjectId]);

  const openCreateModal = (dayIndex: number, suggestion?: AiSuggestion | null) => {
    setModalMode("create");
    setModalDayIndex(dayIndex);
    setEditTask(null);
    setModalInitialSuggestion(suggestion ?? null);
    setModalOpen(true);
  };

  const handleQuickAddSuggestion = useCallback(
    (s: AiSuggestion) => {
      const dateISO = toISODate(dayDateForIndex(weekMonday, todayIdx));
      const task = weeklyTaskFromSuggestion(s, todayIdx, dateISO);
      setTasks((prev) => {
        const without = prev.filter((t) => t.suggestionKey !== s.id);
        return [...without, task];
      });
      toast.success("Öneri takvime eklendi");
    },
    [weekMonday, todayIdx]
  );

  const openEditModal = (task: WeeklyTask) => {
    setModalMode("edit");
    setModalDayIndex(task.dayIndex);
    setEditTask(task);
    setModalOpen(true);
  };

  const handleModalSubmit = ({ task, mode }: WeeklyTaskModalSubmit) => {
    setTasks((prev) => {
      if (mode === "edit") return prev.map((t) => (t.id === task.id ? task : t));
      return [...prev, task];
    });
    toast.success(mode === "edit" ? "Görev güncellendi" : "Görev eklendi");
  };

  const handleDayDrop = useCallback(
    (dayIndex: number) => {
      if (!dragSource) return;

      const dateISO = toISODate(dayDateForIndex(weekMonday, dayIndex));

      if (dragSource.kind === "preset") {
        const task = weeklyTaskFromQuickPreset(dragSource.id, dayIndex, dateISO);
        if (!task) return;
        setTasks((prev) => [...prev, task]);
        const label = QUICK_PRESETS.find((p) => p.id === dragSource.id)?.label ?? "Görev";
        toast.success(`${label} eklendi (${task.targetQuestions} soru)`);
      } else if (dragSource.kind === "suggestion") {
        const suggestion = insights.suggestions.find((s) => s.id === dragSource.id);
        if (!suggestion) return;
        const task = weeklyTaskFromSuggestion(suggestion, dayIndex, dateISO);
        setTasks((prev) => {
          const without = prev.filter((t) => t.suggestionKey !== suggestion.id);
          return [...without, task];
        });
        toast.success("Öneri takvime eklendi");
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === dragSource.id
              ? {
                  ...t,
                  dayIndex,
                  dateISO,
                }
              : t
          )
        );
      }
      setDragSource(null);
    },
    [dragSource, insights.suggestions, weekMonday]
  );

  const handlePrint = useCallback(async () => {
    if (!selectedStudent) {
      toast.message("Yazdırmak için önce bir öğrenci seçin");
      return;
    }
    const snapshot = buildWeeklyPrintSnapshot(selectedStudent, weekMonday, tasks);
    const title = `Haftalık program — ${selectedStudent.name} — ${formatWeekRangeTurkish(weekMonday)}`;
    const ok = await openPrintPreview(snapshot, title);
    if (ok) toast.success("Yazdırma önizlemesi açıldı");
    else toast.error("Önizleme açılamadı — açılır pencere engellenmiş olabilir");
  }, [selectedStudent, weekMonday, tasks, openPrintPreview]);

  const handleSaveProgram = useCallback(async () => {
    if (!selectedStudent) return;
    if (tasks.length === 0) {
      toast.message("Kaydetmek için en az bir görev ekleyin");
      return;
    }
    setSaving(true);
    try {
      const id = editingProgramId ?? (isStudentMode ? newPersonalProgramId() : newSavedProgramId());
      const weekLabel = formatWeekRangeTurkish(weekMonday);

      if (isStudentMode) {
        upsertStudentPersonalWeeklyProgram({
          id,
          studentId,
          studentName: selectedStudent.name,
          weekMondayISO,
          weekRangeLabel: weekLabel,
          tasks,
          title: `${selectedStudent.name} — ${weekLabel}`,
        });
      } else {
        upsertSavedWeeklyProgram({
          id,
          studentId,
          studentName: selectedStudent.name,
          weekMondayISO,
          weekRangeLabel: weekLabel,
          tasks,
          title: `${selectedStudent.name} — ${weekLabel}`,
          status: "kayitli",
        });
      }

      setEditingProgramId(id);
      syncBaseline(tasks);
      clearWeeklyDraft(studentId, weekMondayISO);

      if (saveOpenPrint) {
        const snapshot = buildWeeklyPrintSnapshot(selectedStudent, weekMonday, tasks);
        const title = `Haftalık program — ${selectedStudent.name} — ${weekLabel}`;
        const ok = await openPrintPreview(snapshot, title);
        if (!ok) toast.message("Program kaydedildi; yazdırma önizlemesi açılamadı");
        else toast.success("Program kaydedildi — yazdırma önizlemesi açıldı");
      } else if (isStudentMode) {
        toast.success("Program kaydedildi — Bu Haftaki Program'da görünür");
      } else {
        toast.success("Program kaydedildi — öğrenci paneline anında yansıdı");
      }
      setSaveOpen(false);
      if (pendingNavRef.current) {
        applyPendingNav();
      }
    } finally {
      setSaving(false);
    }
  }, [
    selectedStudent,
    tasks,
    editingProgramId,
    studentId,
    weekMondayISO,
    weekMonday,
    saveOpenPrint,
    openPrintPreview,
    syncBaseline,
    applyPendingNav,
    isStudentMode,
  ]);

  const handleResetProgram = useCallback(() => {
    if (!studentId) return;
    clearWeeklyDraft(studentId, weekMondayISO);
    setTasks([]);
    syncBaseline([]);
    setEditingProgramId(null);
    toast.success("Hafta programı sıfırlandı");
  }, [studentId, weekMondayISO, syncBaseline]);

  const handleAutoDistribute = () => {
    if (!insights.suggestions.length) {
      toast.message("Dağıtılacak MR önerisi yok — önce deneme sonucu ve konu matrisi gerekli");
      return;
    }
    setDistributing(true);

    const bySubject = new Map<string, typeof insights.suggestions>();
    insights.suggestions.forEach((s) => {
      const sid = s.subjectId || "other";
      const list = bySubject.get(sid) ?? [];
      list.push(s);
      bySubject.set(sid, list);
    });
    const subjectIds = [...bySubject.keys()];
    const next: ReturnType<typeof weeklyTaskFromSuggestion>[] = [];
    let round = 0;
    let day = 0;
    const maxTasks = Math.min(insights.suggestions.length, 28);

    while (next.length < maxTasks) {
      let placed = false;
      for (const sid of subjectIds) {
        const list = bySubject.get(sid)!;
        if (round < list.length) {
          next.push(
            weeklyTaskFromSuggestion(
              list[round]!,
              day % 7,
              toISODate(dayDateForIndex(weekMonday, day % 7))
            )
          );
          placed = true;
          day++;
          if (next.length >= maxTasks) break;
        }
      }
      if (!placed) break;
      round++;
    }

    setTasks((prev) => {
      const manual = prev.filter((t) => !t.suggestionKey);
      return [...manual, ...next];
    });
    setTimeout(() => setDistributing(false), 1200);
    toast.success(
      `${next.length} MR önerisi ${insights.summary.subjectsWithSuggestions} dersten haftaya yayıldı`
    );
  };

  const shiftWeek = (delta: number) => {
    const n = new Date(weekMonday);
    n.setDate(n.getDate() + delta * 7);
    requestNav({ kind: "week", monday: mondayOf(n) });
  };

  const handleStudentSelect = (id: string) => {
    if (id === studentId) return;
    requestNav({ kind: "student", id });
  };

  return (
    <div className="min-h-full space-y-6 bg-[#FDFBF7]">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-orange-500">
              <Sparkles className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {isStudentMode
                  ? "Bireysel Haftalık Program · V4"
                  : "Otonom Haftalık Program · V4"}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isStudentMode ? "Kendi Hafta Planlayıcım" : "Akıllı Hafta Planlayıcı"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {isStudentMode
                ? "Deneme sonuçlarına göre AI önerileri alın, görevleri sürükleyip bırakın ve programınızı kaydedin."
                : "Son 3 denemedeki tüm hatalı sorular → tüm derslerden dengeli AI öneri ve haftalık dağıtım."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" asChild>
              {isStudentMode ? (
                <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireyselKayitli}>
                  <FolderOpen className="h-4 w-4" />
                  Kayıtlılar
                </Link>
              ) : (
                <GuardedCoachLink href={HAFTALIK_PROGRAM_ROUTES.kayitli}>
                  <FolderOpen className="h-4 w-4" />
                  Kayıtlılar
                </GuardedCoachLink>
              )}
            </Button>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200/80 bg-white px-3 py-2 shadow-sm">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] font-medium uppercase text-slate-400">Hafta</p>
                <p className="text-sm font-bold text-slate-900">{formatWeekRangeTurkish(weekMonday)}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            </div>
          </div>
        </div>

        {!isStudentMode ? (
          <StudentPickerBar
            students={students}
            selectedId={studentId}
            onSelect={handleStudentSelect}
          />
        ) : null}
      </header>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
        <aside className="flex w-full shrink-0 flex-col xl:w-[min(360px,34%)] xl:max-w-[400px]">
          <WeeklyPlannerSidebar
            trackFilter={trackFilter}
            onTrackFilterChange={setTrackFilter}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={setSelectedSubjectId}
            insights={insights}
            tasks={tasks}
            onSuggestionDragStart={(id) => setDragSource({ kind: "suggestion", id })}
            onSuggestionAdd={handleQuickAddSuggestion}
            onSuggestionOpenModal={(s) => openCreateModal(todayIdx, s)}
          />
          {selectedStudent && (
            <div className="mt-3 rounded-2xl border border-slate-200/60 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
              <span className="font-semibold text-slate-800">{selectedStudent.name}</span>
              {" · "}
              {selectedStudent.sinifBranch} ·{" "}
              {FIELD_LABELS[normalizeStudyField(selectedStudent.alan)]}
              {selectedStudent.goal ? ` · ${selectedStudent.goal}` : ""}
            </div>
          )}
        </aside>

        <section className="min-w-0 flex-1">
          <div className="rounded-3xl border border-stone-200/60 bg-[#FDFBF7] p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Akıllı Takvim</h2>
                <p className="text-xs text-slate-500">
                  Paragraf / Hazır Problem rozetlerini güne sürükleyin · modal açılmaz
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/80 px-2 py-1.5">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!studentId}
                    onClick={() => openCreateModal(todayIdx, null)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Yeni ders ekle
                  </Button>
                  {QUICK_PRESETS.map((preset) => (
                    <QuickPresetPill
                      key={preset.id}
                      preset={preset}
                      disabled={!studentId}
                      onDragStart={() => setDragSource({ kind: "preset", id: preset.id })}
                      onDragEnd={() => setDragSource(null)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={!studentId}
                  title="Tüm görevleri sil"
                  onClick={() => setResetOpen(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Sıfırla</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={!studentId || printing}
                  title="A4 yatay yazdırma önizlemesi (PDF için «PDF olarak kaydet»)"
                  onClick={() => void handlePrint()}
                >
                  {printing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Yazdır</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={!studentId || saving}
                  onClick={() => setSaveOpen(true)}
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Programı kaydet</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={!studentId || distributing}
                  onClick={handleAutoDistribute}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  AI Dağıtımı
                </Button>
              </div>
            </div>

            {!studentId ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500">
                {isStudentMode
                  ? "Öğrenci profili bulunamadı. Koç panelinde kayıtlı olduğunuzdan emin olun."
                  : "Planlamaya başlamak için üstten bir öğrenci seçin."}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {WEEK_DAY_LABELS.map((day, i) => (
                  <DayColumn
                    key={day}
                    dayIndex={i}
                    label={day}
                    shortLabel={WEEK_DAY_SHORT[i]}
                    tasks={tasksByDay[i]}
                    workload={dayWorkloads[i]}
                    isToday={i === todayIdx}
                    onDrop={() => handleDayDrop(i)}
                    onAddClick={() => openCreateModal(i)}
                    onEditTask={openEditModal}
                    onDeleteTask={(id) => {
                      setTasks((prev) => prev.filter((t) => t.id !== id));
                      toast.success("Görev silindi");
                    }}
                    onTaskDragStart={(id) => setDragSource({ kind: "task", id })}
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-right text-[11px] text-slate-400">
              {tasks.length} görev
              {hasUnsavedChanges() ? " · kaydedilmemiş değişiklikler" : ""}
              {editingProgramId ? (isStudentMode ? " · kaydedildi" : " · arşivde kayıtlı") : ""}
            </p>

            {studentId ? (
              <WeeklyLastExamPanel
                studentId={studentId}
                studentName={selectedStudent?.name ?? "Öğrenci"}
              />
            ) : null}
          </div>
        </section>
      </div>

      <WeeklyTaskModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setModalInitialSuggestion(null);
        }}
        mode={modalMode}
        initialDayIndex={modalDayIndex}
        defaultDateISO={toISODate(dayDateForIndex(weekMonday, modalDayIndex))}
        editTask={editTask}
        insights={insights}
        filterSubjectId={selectedSubjectId}
        initialSuggestion={modalInitialSuggestion}
        onSubmit={handleModalSubmit}
      />

      <WeeklySaveProgramDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        studentName={selectedStudent?.name ?? "Öğrenci"}
        weekLabel={formatWeekRangeTurkish(weekMonday)}
        taskCount={tasks.length}
        openPrintAfterSave={saveOpenPrint}
        onOpenPrintAfterSaveChange={setSaveOpenPrint}
        onConfirm={() => void handleSaveProgram()}
        saving={saving}
      />
      <WeeklyResetProgramDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        weekLabel={formatWeekRangeTurkish(weekMonday)}
        onConfirm={handleResetProgram}
      />

      <WeeklyUnsavedLeaveDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onDiscard={() => {
          applyPendingNav();
          setLeaveOpen(false);
        }}
        onSave={() => {
          setLeaveOpen(false);
          setSaveOpen(true);
        }}
      />
    </div>
  );
}

export function AutonomousWeeklyPlannerPage({ mode = "coach" }: { mode?: WeeklyPlannerMode }) {
  return (
    <WeeklyPlannerDndProvider>
      <WeeklyPlannerPageInner mode={mode} />
    </WeeklyPlannerDndProvider>
  );
}

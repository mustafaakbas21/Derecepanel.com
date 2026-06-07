"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import "@/components/siniflar/siniflar.css";
import { YksFieldPicker } from "@/components/siniflar/yks-field-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { classFieldCode } from "@/lib/classes/constants";
import type { ClassDraft, InstitutionClass } from "@/lib/classes/types";
import { FIELD_LABELS, getInitials } from "@/lib/students/constants";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  initial: InstitutionClass | null;
  initialTargetBooklet?: never;
  allStudents: StudentRecord[];
  onSave: (draft: ClassDraft) => void;
};

function emptyDraft(): ClassDraft {
  return {
    id: null,
    name: "",
    field: "sayisal",
    studentIds: [],
  };
}

function draftFromClass(c: InstitutionClass): ClassDraft {
  return {
    id: c.id,
    name: c.name,
    field: c.field,
    studentIds: [...c.studentIds],
  };
}

type StudentRowProps = {
  student: StudentRecord;
  action: "add" | "remove";
  onAction: () => void;
};

function StudentRow({ student, action, onAction }: StudentRowProps) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className="sinif-modal__row"
    >
      <span className="sinif-modal__avatar">{getInitials(student.name)}</span>
      <div className="sinif-modal__row-text">
        <p className="sinif-modal__row-name">{student.name}</p>
        <p className="sinif-modal__row-meta">
          {student.studentCode}
          {student.sinifBranch ? ` · ${student.sinifBranch}` : ""}
          {" · "}
          {FIELD_LABELS[normalizeStudyField(student.alan)]}
        </p>
      </div>
      <button
        type="button"
        className={cn(
          "sinif-modal__row-action",
          action === "add" ? "sinif-modal__row-action--add" : "sinif-modal__row-action--remove"
        )}
        aria-label={action === "add" ? "Sınıfa ekle" : "Sınıftan çıkar"}
        onClick={onAction}
      >
        {action === "add" ? (
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        ) : (
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
        )}
      </button>
    </motion.li>
  );
}

function PanelEmpty({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <li className="sinif-modal__empty list-none">
      <Icon className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
      <p className="sinif-modal__empty-title">{title}</p>
      <p className="sinif-modal__empty-hint">{hint}</p>
    </li>
  );
}

export function ClassAssignmentModal({
  open,
  onClose,
  initial,
  allStudents,
  onSave,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ClassDraft>(emptyDraft);
  const [poolSearch, setPoolSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    setDraft(initial ? draftFromClass(initial) : emptyDraft());
    setPoolSearch("");
    setClassSearch("");
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initial]);

  const inClassSet = useMemo(() => new Set(draft.studentIds), [draft.studentIds]);

  const inClassStudents = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    return allStudents
      .filter((s) => inClassSet.has(s.ogrenciId))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [allStudents, inClassSet, classSearch]);

  const poolStudents = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    return allStudents
      .filter((s) => !inClassSet.has(s.ogrenciId))
      .filter((s) => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [allStudents, inClassSet, poolSearch]);

  const poolTotal = allStudents.length - draft.studentIds.length;

  const assignStudent = useCallback((studentId: string) => {
    setDraft((d) => ({
      ...d,
      studentIds: d.studentIds.includes(studentId)
        ? d.studentIds
        : [...d.studentIds, studentId],
    }));
  }, []);

  const unassignStudent = useCallback((studentId: string) => {
    setDraft((d) => ({
      ...d,
      studentIds: d.studentIds.filter((id) => id !== studentId),
    }));
  }, []);

  const assignAllVisible = () => {
    setDraft((d) => {
      const ids = new Set(d.studentIds);
      poolStudents.forEach((s) => ids.add(s.ogrenciId));
      return { ...d, studentIds: [...ids] };
    });
  };

  const clearClass = () => {
    setDraft((d) => ({ ...d, studentIds: [] }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };

  if (!mounted || !open) return null;

  const isEdit = Boolean(initial);

  return createPortal(
    <div
      className="sinif-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sinif-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sinif-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sinif-modal__head">
          <div className="sinif-modal__head-text">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                <GraduationCap className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 id="sinif-modal-title" className="sinif-modal__title">
                  {isEdit ? "Sınıfı düzenle" : "Yeni sınıf oluştur"}
                </h2>
                <p className="sinif-modal__sub">
                  Öğrencileri ok ile taşıyın; liste ve Öğrencilerim kaydı anında
                  güncellenir.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sinif-modal__close"
            aria-label="Kapat"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="sinif-modal__content">
          <section className="sinif-modal__setup" aria-label="Sınıf bilgileri">
            <div className="sinif-modal__setup-grid">
              <div>
                <span className="sinif-modal__label">Sınıf adı</span>
                <Input
                  className="sinif-modal__input"
                  value={draft.name}
                  placeholder="Örn. 12-A, Mezun-MF"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
                <div className="sinif-modal__kpi lg:hidden">
                  <span className="sinif-modal__kpi-pill">
                    <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                    Boşta <span className="sinif-modal__kpi-num">{poolTotal}</span>
                  </span>
                  <span className="sinif-modal__kpi-pill sinif-modal__kpi-pill--active">
                    <Users className="h-3.5 w-3.5" />
                    Sınıfta{" "}
                    <span className="sinif-modal__kpi-num">{draft.studentIds.length}</span>
                  </span>
                </div>
              </div>

              <div>
                <span className="sinif-modal__label">YKS alan / puan türü</span>
                <p className="sinif-modal__field-hint">
                  TYT, MF, TM, TS, DİL — seçili:{" "}
                  <strong>{classFieldCode(draft.field)}</strong>
                </p>
                <YksFieldPicker
                  value={draft.field}
                  onChange={(field) => setDraft((d) => ({ ...d, field }))}
                />
              </div>

              <div className="sinif-modal__kpi hidden lg:flex">
                <span className="sinif-modal__kpi-pill">
                  <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                  Boşta <span className="sinif-modal__kpi-num">{poolTotal}</span>
                </span>
                <span className="sinif-modal__kpi-pill sinif-modal__kpi-pill--active">
                  <Users className="h-3.5 w-3.5" />
                  Bu sınıfta{" "}
                  <span className="sinif-modal__kpi-num">{draft.studentIds.length}</span>
                </span>
                <span className="sinif-modal__kpi-pill">
                  Toplam <span className="sinif-modal__kpi-num">{allStudents.length}</span>
                </span>
              </div>
            </div>
          </section>

          <section className="sinif-modal__assign" aria-label="Öğrenci atama">
            <div className="sinif-modal__panel sinif-modal__panel--left">
              <div className="sinif-modal__panel-head">
                <h3 className="sinif-modal__panel-title">
                  <Users className="h-4 w-4 text-slate-500" />
                  Boştaki öğrenciler
                </h3>
                <span className="sinif-modal__panel-badge">{poolStudents.length}</span>
              </div>
              <div className="sinif-modal__panel-tools">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="sinif-modal__search w-full pl-9"
                    placeholder="Ad veya kod ara…"
                    value={poolSearch}
                    onChange={(e) => setPoolSearch(e.target.value)}
                  />
                </div>
                {poolStudents.length > 0 ? (
                  <button
                    type="button"
                    className="sinif-modal__panel-action sinif-modal__panel-action--add"
                    onClick={assignAllVisible}
                  >
                    Görünenleri sınıfa ekle ({poolStudents.length})
                  </button>
                ) : null}
              </div>
              <ul className="sinif-modal__list" aria-label="Boştaki öğrenci listesi">
                <AnimatePresence mode="popLayout">
                  {poolStudents.map((s) => (
                    <StudentRow
                      key={s.ogrenciId}
                      student={s}
                      action="add"
                      onAction={() => assignStudent(s.ogrenciId)}
                    />
                  ))}
                </AnimatePresence>
                {!poolStudents.length ? (
                  <PanelEmpty
                    icon={UserPlus}
                    title="Tüm öğrenciler atandı"
                    hint="Bu sınıfa eklenecek boş öğrenci kalmadı veya arama sonucu yok."
                  />
                ) : null}
              </ul>
            </div>

            <div className="sinif-modal__panel">
              <div className="sinif-modal__panel-head">
                <h3 className="sinif-modal__panel-title">
                  <GraduationCap className="h-4 w-4 text-slate-500" />
                  Sınıftaki öğrenciler
                </h3>
                <span className="sinif-modal__panel-badge">{draft.studentIds.length}</span>
              </div>
              <div className="sinif-modal__panel-tools">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="sinif-modal__search w-full pl-9"
                    placeholder="Sınıfta ara…"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                  />
                </div>
                {inClassStudents.length > 0 ? (
                  <button
                    type="button"
                    className="sinif-modal__panel-action sinif-modal__panel-action--clear"
                    onClick={clearClass}
                  >
                    Tümünü sınıftan çıkar
                  </button>
                ) : null}
              </div>
              <ul className="sinif-modal__list" aria-label="Sınıftaki öğrenci listesi">
                <AnimatePresence mode="popLayout">
                  {inClassStudents.map((s) => (
                    <StudentRow
                      key={s.ogrenciId}
                      student={s}
                      action="remove"
                      onAction={() => unassignStudent(s.ogrenciId)}
                    />
                  ))}
                </AnimatePresence>
                {!inClassStudents.length ? (
                  <PanelEmpty
                    icon={UserMinus}
                    title="Henüz öğrenci yok"
                    hint="Soldaki listeden ok ile öğrenci ekleyin veya «Görünenleri sınıfa ekle» kullanın."
                  />
                ) : null}
              </ul>
            </div>
          </section>
        </div>

        <footer className="sinif-modal__footer">
          <p className="sinif-modal__footer-hint">
            Kayıt sonrası öğrencilerin <strong>Sınıf</strong> alanı bu sınıf adıyla
            eşleşir.
          </p>
          <div className="sinif-modal__footer-actions">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Vazgeç
            </Button>
            <Button
              type="button"
              variant="primary"
              className="rounded-xl"
              disabled={!draft.name.trim()}
              onClick={handleSave}
            >
              {isEdit ? "Değişiklikleri kaydet" : "Sınıfı oluştur"}
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

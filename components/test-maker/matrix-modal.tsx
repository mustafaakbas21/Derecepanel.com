"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Grid3X3,
  Info,
  Plus,
  Save,
  X,
} from "lucide-react";

import { getSubjects, getSubjectById, getTopicById, getTopics } from "@/lib/mufredat";
import {
  createMatrixExamKey,
  saveMatrixBundle,
} from "@/lib/test-maker/matrix-store";
import { tmToast } from "@/lib/test-maker/notify";
import type { MatrixQuestionRow } from "@/lib/test-maker/types";

import "@/styles/matrix-modal.css";

type MatrixModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultName: string;
  questionCount: number;
  onSaved?: (examKey: string) => void;
};

function emptyRow(qNo: number): MatrixQuestionRow {
  return {
    qNo,
    subjectId: "",
    subjectName: "",
    topicId: null,
    topicName: null,
  };
}

export function MatrixModal({
  open,
  onOpenChange,
  defaultName,
  questionCount,
  onSaved,
}: MatrixModalProps) {
  const [mounted, setMounted] = useState(false);
  const [examKey, setExamKey] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [qCount, setQCount] = useState(40);
  const [rows, setRows] = useState<MatrixQuestionRow[]>([]);
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(10);
  const [bulkDers, setBulkDers] = useState("");
  const [bulkKonu, setBulkKonu] = useState("");

  const subjects = useMemo(() => getSubjects("ALL"), []);
  const bulkTopics = useMemo(
    () => (bulkDers ? getTopics(bulkDers) : []),
    [bulkDers]
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const filled = rows.filter((r) => r.subjectId && r.topicId).length;
    const missing = total - filled;
    const cov = total ? Math.round((filled / total) * 100) : 0;
    return { total, filled, missing, cov };
  }, [rows]);

  const generateRows = useCallback(
    (count: number, prevRows: MatrixQuestionRow[]) => {
      const n = Math.max(1, Math.min(200, count));
      const next: MatrixQuestionRow[] = [];
      for (let i = 1; i <= n; i++) {
        const prev = prevRows.find((r) => r.qNo === i);
        next.push(prev ? { ...prev } : emptyRow(i));
      }
      setRows(next);
    },
    []
  );

  const initOnOpen = useCallback(() => {
    const count = Math.max(1, Math.min(200, questionCount || 40));
    setQCount(count);
    setExamName(defaultName.trim());
    setExamDate(new Date().toISOString().slice(0, 10));
    setRangeFrom(1);
    setRangeTo(Math.min(10, count));
    setBulkDers("");
    setBulkKonu("");
    setRows((prev) => {
      if (prev.length > 0) return prev;
      const initial: MatrixQuestionRow[] = [];
      for (let i = 1; i <= count; i++) initial.push(emptyRow(i));
      return initial;
    });
  }, [defaultName, questionCount]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    initOnOpen();
  }, [open, initOnOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  const updateRow = (qNo: number, patch: Partial<MatrixQuestionRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.qNo === qNo ? { ...r, ...patch } : r))
    );
  };

  const clearRow = (qNo: number) => {
    updateRow(qNo, {
      subjectId: "",
      subjectName: "",
      topicId: null,
      topicName: null,
    });
  };

  const handleGenerate = () => {
    const n = Math.max(1, Math.min(200, qCount));
    if (!n) {
      tmToast.error("Soru sayısı geçersiz");
      return;
    }
    generateRows(n, rows);
  };

  const applyRange = () => {
    if (!bulkDers) {
      tmToast.error("Önce ders seçin");
      return;
    }
    if (!rows.length) {
      tmToast.error("Önce matrix oluşturun");
      return;
    }
    const sub = getSubjectById(bulkDers);
    const top = bulkKonu ? getTopicById(bulkDers, bulkKonu) : null;
    if (!sub) return;

    const from = Math.max(1, rangeFrom);
    const to = Math.max(from, rangeTo);
    let n = 0;
    setRows((prev) =>
      prev.map((r) => {
        if (r.qNo < from || r.qNo > to) return r;
        n++;
        return {
          ...r,
          subjectId: sub.id,
          subjectName: sub.name,
          topicId: top?.id ?? null,
          topicName: top?.name ?? null,
        };
      })
    );
    tmToast.success(`${n} soruya atama yapıldı`);
  };

  const save = () => {
    if (!rows.length) {
      tmToast.error("Önce matrix oluşturun");
      return;
    }
    const key = examKey ?? createMatrixExamKey();
    const name =
      examName.trim() ||
      defaultName.trim() ||
      `Sınav · ${new Date().toLocaleDateString("tr-TR")}`;
    try {
      saveMatrixBundle({
        examKey: key,
        name,
        date: examDate || new Date().toISOString().slice(0, 10),
        questions: rows,
        savedAt: new Date().toISOString(),
      });
      setExamKey(key);
      tmToast.matrixSaved(stats.filled, stats.total);
      onSaved?.(key);
      onOpenChange(false);
    } catch (e) {
      tmToast.error(
        "Kaydedilemedi",
        e instanceof Error ? e.message : "Depolama hatası"
      );
    }
  };

  if (!open || !mounted) return null;

  const modal = (
    <div
      id="em-modal"
      className="em-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="em-title"
    >
      <button
        type="button"
        className="em-backdrop"
        aria-label="Kapat"
        onClick={() => onOpenChange(false)}
      />
      <div className="em-shell">
        <header className="em-head">
          <div className="em-head__brand">
            <span className="em-badge">
              <Grid3X3 className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <h3 id="em-title">Soru–Konu Matrix&apos;i</h3>
              <p>
                Her soru numarasına bir konu atayın · Analiz Merkezi kümüle istatistik için
                kullanır
              </p>
            </div>
          </div>
          <button
            type="button"
            className="em-icon-btn"
            aria-label="Kapat"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <section className="em-toolbar">
          <label className="em-field">
            <span>Sınav Adı</span>
            <input
              id="em-exam-name"
              type="text"
              placeholder="Örn: TYT Deneme #12"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
          </label>
          <label className="em-field">
            <span>Sınav Tarihi</span>
            <input
              id="em-exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </label>
          <label className="em-field em-field--sm">
            <span>Soru Sayısı</span>
            <input
              id="em-q-count"
              type="number"
              min={1}
              max={200}
              value={qCount}
              onChange={(e) => setQCount(Number(e.target.value) || 1)}
            />
          </label>
          <button
            id="em-generate"
            type="button"
            className="em-btn em-btn--primary"
            onClick={handleGenerate}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            Matrix Oluştur
          </button>
          <span className="em-toolbar-sep" />
          <label className="em-field em-field--sm">
            <span>Hızlı Atama — Aralık</span>
            <div className="em-range">
              <input
                id="em-range-from"
                type="number"
                min={1}
                placeholder="1"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(Number(e.target.value) || 1)}
              />
              <span>–</span>
              <input
                id="em-range-to"
                type="number"
                min={1}
                placeholder="10"
                value={rangeTo}
                onChange={(e) => setRangeTo(Number(e.target.value) || 1)}
              />
            </div>
          </label>
          <label className="em-field">
            <span>Ders</span>
            <select
              id="em-quick-subject"
              value={bulkDers}
              onChange={(e) => {
                setBulkDers(e.target.value);
                setBulkKonu("");
              }}
            >
              <option value="">Ders</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="em-field">
            <span>Konu</span>
            <select
              id="em-quick-topic"
              value={bulkKonu}
              disabled={!bulkDers}
              onChange={(e) => setBulkKonu(e.target.value)}
            >
              <option value="">Konu</option>
              {bulkTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button id="em-apply-range" type="button" className="em-btn" onClick={applyRange}>
            Aralığa Uygula
          </button>
        </section>

        <section className="em-stats">
          <div className="em-stat">
            <span>Toplam</span>
            <b id="em-st-total">{stats.total}</b>
          </div>
          <div className="em-stat">
            <span>Eşleşen</span>
            <b id="em-st-filled">{stats.filled}</b>
          </div>
          <div className="em-stat">
            <span>Eksik</span>
            <b id="em-st-missing">{stats.missing}</b>
          </div>
          <div className="em-stat em-stat--cov">
            <span>Kapsam</span>
            <b id="em-st-cov">%{stats.cov}</b>
            <div className="em-stat-bar">
              <div id="em-st-bar" style={{ width: `${stats.cov}%` }} />
            </div>
          </div>
        </section>

        <section className="em-table-wrap">
          <table className="em-table" id="em-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>#</th>
                <th>Ders</th>
                <th>Konu</th>
                <th style={{ width: 54 }} />
              </tr>
            </thead>
            <tbody id="em-tbody">
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="em-empty">
                    Yukarıdan soru sayısını girip <b>Matrix Oluştur</b>&apos;a basın.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const topics = row.subjectId ? getTopics(row.subjectId) : [];
                  const missing = !row.subjectId || !row.topicId;
                  return (
                    <tr
                      key={row.qNo}
                      data-q={row.qNo}
                      className={missing ? "is-missing" : undefined}
                    >
                      <td>
                        <span className="em-qno">{row.qNo}</span>
                      </td>
                      <td>
                        <select
                          data-kind="subject"
                          value={row.subjectId}
                          onChange={(e) => {
                            const sub = getSubjectById(e.target.value);
                            updateRow(row.qNo, {
                              subjectId: e.target.value,
                              subjectName: sub?.name ?? "",
                              topicId: null,
                              topicName: null,
                            });
                          }}
                        >
                          <option value="">Ders</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          data-kind="topic"
                          value={row.topicId ?? ""}
                          disabled={!row.subjectId}
                          onChange={(e) => {
                            const top = e.target.value
                              ? getTopicById(row.subjectId, e.target.value)
                              : null;
                            updateRow(row.qNo, {
                              topicId: e.target.value || null,
                              topicName: top?.name ?? null,
                            });
                          }}
                        >
                          <option value="">
                            {row.subjectId ? "Konu" : "Önce ders"}
                          </option>
                          {topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="em-clear"
                          data-act="clear"
                          title="Temizle"
                          onClick={() => clearRow(row.qNo)}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <footer className="em-foot">
          <div className="em-foot__info">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              Bu matrix yalnızca <b>Test Oluşturucu</b> içindir; tarama analizi ayrı veri
              köprüsüyle çalışır.
            </span>
          </div>
          <div className="em-foot__actions">
            <button
              id="em-cancel"
              type="button"
              className="em-btn"
              onClick={() => onOpenChange(false)}
            >
              Vazgeç
            </button>
            <button id="em-save" type="button" className="em-btn em-btn--primary" onClick={save}>
              <Save className="h-3.5 w-3.5" />
              Matrix&apos;i Kaydet
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

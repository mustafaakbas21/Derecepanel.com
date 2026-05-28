"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, Plus } from "lucide-react";

import { QuestionPoolCard } from "@/components/test-maker/question-pool-card";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import {
  clearPool,
  deleteFromPool,
  getFiltered,
  loadQuestionPool,
  type PoolFilters,
  updateAnswer,
} from "@/lib/test-maker/question-pool";
import { getConcepts, getSubjects, getTopics } from "@/lib/mufredat";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { tmToast } from "@/lib/test-maker/notify";

function showShToast(msg: string) {
  tmToast.success(msg);
}

export function HavuzPage() {
  const [all, setAll] = useState<QuestionPoolItem[]>([]);
  const [shown, setShown] = useState<QuestionPoolItem[]>([]);
  const [dersId, setDersId] = useState("");
  const [konuId, setKonuId] = useState("");
  const [kavramId, setKavramId] = useState("");
  const [ansMode, setAnsMode] = useState<PoolFilters["answerMode"]>("all");

  const subjects = useMemo(() => getSubjects("ALL"), []);
  const topics = useMemo(() => (dersId ? getTopics(dersId) : []), [dersId]);
  const concepts = useMemo(
    () => (dersId && konuId ? getConcepts(dersId, konuId) : []),
    [dersId, konuId]
  );

  const dersName = subjects.find((s) => s.id === dersId)?.name ?? "";
  const konuName = topics.find((t) => t.id === konuId)?.name ?? "";
  const kavramName = concepts.find((c) => c.id === kavramId)?.name ?? "";

  const refreshAll = useCallback(() => {
    const list = loadQuestionPool();
    setAll(list);
    setShown(list);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const applyFilter = () => {
    const filters: PoolFilters = {
      dersName: dersName || undefined,
      konuName: konuName || undefined,
      kavramName: kavramName || undefined,
      answerMode: ansMode === "all" ? undefined : ansMode,
    };
    setShown(getFiltered(filters));
    tmToast.success(`${getFiltered(filters).length} soru gösteriliyor`);
  };

  const resetFilter = () => {
    setDersId("");
    setKonuId("");
    setKavramId("");
    setAnsMode("all");
    const list = loadQuestionPool();
    setShown(list);
  };

  const handleAnswer = async (uuid: string, answer: AnswerLetter | null) => {
    await updateAnswer(uuid, answer);
    refreshAll();
    setShown((prev) =>
      prev.map((q) => (q.uuid === uuid ? { ...q, answer } : q))
    );
    showShToast(answer ? `Cevap "${answer}" kaydedildi` : "Cevap kaldırıldı");
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("Bu soruyu havuzdan silmek istiyor musunuz?")) return;
    await deleteFromPool(uuid);
    refreshAll();
    setShown((prev) => prev.filter((q) => q.uuid !== uuid));
    showShToast("Soru silindi");
  };

  const handleClearAll = async () => {
    if (!confirm("Tüm soru havuzunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."))
      return;
    await clearPool();
    setAll([]);
    setShown([]);
    showShToast("Havuz temizlendi");
  };

  return (
    <div id="tw-scope" className="flex min-h-0 flex-1 overflow-hidden">
      <aside id="sh-left-panel" className="tm-filter-panel">
        <div id="sh-left-header" className="tm-panel-header">
          <h2>Filtrele & Görüntüle</h2>
          <p>YKS müfredatına göre sorularınızı bulun</p>
        </div>
        <div className="tm-filter-body">
          <label className="block">
            <span className="tm-field-label">Ders</span>
            <select
              id="sh-sel-ders"
              value={dersId}
              onChange={(e) => {
                setDersId(e.target.value);
                setKonuId("");
                setKavramId("");
              }}
              className="tm-field-select"
            >
              <option value="">Tümü</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} data-name={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="tm-field-label">Konu</span>
            <select
              id="sh-sel-konu"
              value={konuId}
              disabled={!dersId}
              onChange={(e) => {
                setKonuId(e.target.value);
                setKavramId("");
              }}
              className="tm-field-select"
            >
              <option value="">Tümü</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id} data-name={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="tm-field-label">Kavram</span>
            <select
              id="sh-sel-kavram"
              value={kavramId}
              disabled={!konuId}
              onChange={(e) => setKavramId(e.target.value)}
              className="tm-field-select"
            >
              <option value="">Tümü</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id} data-name={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="tm-field-label">Cevap</span>
            <select
              id="sh-sel-ans"
              value={ansMode ?? "all"}
              onChange={(e) =>
                setAnsMode(e.target.value as PoolFilters["answerMode"])
              }
              className="tm-field-select"
            >
              <option value="all">Tümü</option>
              <option value="answered">Cevabı Var</option>
              <option value="unanswered">Cevabı Yok</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </label>
          <div className="tm-divider" />
          <button
            id="sh-btn-filter"
            type="button"
            onClick={applyFilter}
            className="tm-btn-primary w-full py-2.5 text-sm"
          >
            Filtrele & Göster
          </button>
          <button
            id="sh-btn-all"
            type="button"
            onClick={resetFilter}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tüm Havuzu Göster
          </button>
          <button
            id="sh-btn-clear-all"
            type="button"
            onClick={handleClearAll}
            className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Tüm Havuzu Sil
          </button>
        </div>
      </aside>

      <main id="sh-main-panel" className="tm-workspace-panel">
        <div id="sh-top-bar" className="tm-toolbar-bar">
          <p id="sh-count-label" className="text-sm font-medium text-slate-700">
            <span id="sh-shown-count">{shown.length}</span> soru gösteriliyor · Toplam:{" "}
            <span id="sh-total-count">{all.length}</span>
          </p>
          <Link
            href={TEST_MAKER_ROUTES.kirpici}
            className="tm-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Soru Ekle
          </Link>
        </div>

        {shown.length === 0 ? (
          <div id="sh-empty" className="tm-empty-state">
            <div id="sh-empty-icon" className="tm-empty-icon-wrap">
              <ImageIcon className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-700">Henüz soru yok</p>
            <p className="max-w-sm text-sm text-slate-500">
              Otomatik Soru Kırpıcı ile PDF&apos;ten soru kırpın veya filtreleri sıfırlayın.
            </p>
            <Link
              href={TEST_MAKER_ROUTES.kirpici}
              className="tm-btn-primary px-5 py-2.5 text-sm"
            >
              Otomatik Kırpıcı&apos;ya Git
            </Link>
          </div>
        ) : (
          <div
            id="sh-grid"
            className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {shown.map((item) => (
              <QuestionPoolCard
                key={item.uuid}
                item={item}
                variant="havuz"
                onAnswer={(letter) => handleAnswer(item.uuid, letter)}
                onDelete={() => handleDelete(item.uuid)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

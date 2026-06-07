"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Filter, ImageIcon, Plus, Trash2 } from "lucide-react";

import { HavuzPoolCard } from "@/components/test-maker/havuz-pool-card";
import {
  TestMakerMetrics,
  TestMakerPageHeader,
  TM_PAGE_CLASS,
} from "@/components/test-maker/tm-ui";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { appToast } from "@/lib/notify";
import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";
import {
  clearPool,
  deleteFromPool,
  ensureQuestionPoolInit,
  getFiltered,
  loadQuestionPool,
  type PoolFilters,
  updateAnswer,
} from "@/lib/test-maker/question-pool";
import { getConcepts, getSubjects, getTopics } from "@/lib/mufredat";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

import "@/styles/havuz-studio.css";

export function HavuzPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const [all, setAll] = useState<QuestionPoolItem[]>([]);
  const [shown, setShown] = useState<QuestionPoolItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
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

  const refreshAll = useCallback(async () => {
    const list = await ensureQuestionPoolInit();
    setAll(list);
    setShown(list);
    setHydrated(true);
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const applyFilter = () => {
    const filters: PoolFilters = {
      dersName: dersName || undefined,
      konuName: konuName || undefined,
      kavramName: kavramName || undefined,
      answerMode: ansMode === "all" ? undefined : ansMode,
    };
    const next = getFiltered(filters);
    setShown(next);
    appToast.success(`${next.length} soru gösteriliyor`);
  };

  const resetFilter = () => {
    setDersId("");
    setKonuId("");
    setKavramId("");
    setAnsMode("all");
    const list = loadQuestionPool();
    setShown(list);
    appToast.info("Tüm havuz gösteriliyor");
  };

  const handleAnswer = async (uuid: string, answer: AnswerLetter | null) => {
    await updateAnswer(uuid, answer);
    const sync = (list: QuestionPoolItem[]) =>
      list.map((q) => (q.uuid === uuid ? { ...q, answer } : q));
    setAll(sync);
    setShown(sync);
    appToast.success(answer ? `Cevap "${answer}" kaydedildi` : "Cevap kaldırıldı");
  };

  const handleDelete = async (uuid: string) => {
    const ok = await confirm({
      title: "Soru silinsin mi?",
      description: "Bu soru havuzdan kaldırılır.",
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    await deleteFromPool(uuid);
    const list = await ensureQuestionPoolInit();
    setAll(list);
    setShown((prev) => prev.filter((q) => q.uuid !== uuid));
    appToast.success("Soru silindi");
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: "Tüm havuz temizlensin mi?",
      description: "Tüm sorular kalıcı olarak silinir. Bu işlem geri alınamaz.",
      confirmLabel: "Evet, temizle",
      destructive: true,
    });
    if (!ok) return;
    await clearPool();
    setAll([]);
    setShown([]);
    appToast.success("Havuz temizlendi");
  };

  const answeredCount = all.filter((q) => q.answer).length;

  if (!hydrated) {
    return (
      <div className={cn(TM_PAGE_CLASS, "p-6")}>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  return (
    <div
      id="tw-scope"
      className={cn(TM_PAGE_CLASS, "havuz-studio")}
    >
      <TestMakerPageHeader
        title="Soru Havuzu"
        description="Kırpılmış soruları müfredata göre filtreleyin, cevaplayın ve Test Oluşturucuya aktarın."
        action={
          <Button variant="primary" size="sm" asChild>
            <Link href={TEST_MAKER_ROUTES.kirpici}>
              <Plus className="h-4 w-4" />
              Soru ekle
            </Link>
          </Button>
        }
      />

      <TestMakerMetrics
        items={[
          { label: "Toplam", value: all.length, icon: Database },
          {
            label: "Gösterilen",
            value: shown.length,
            sub: "Aktif filtre",
            icon: Filter,
          },
          {
            label: "Cevaplı",
            value: answeredCount,
            sub: all.length ? `${Math.round((answeredCount / all.length) * 100)}%` : "—",
            icon: ImageIcon,
          },
          {
            label: "Cevapsız",
            value: Math.max(0, all.length - answeredCount),
            icon: Plus,
          },
        ]}
      />

      <div className="havuz-studio__body">
        <aside className="havuz-filters" aria-label="Filtreler">
          <div className="havuz-filters__head">
            <h2>Filtrele & görüntüle</h2>
            <p>YKS müfredatına göre sorularınızı bulun</p>
          </div>
          <div className="havuz-filters__scroll">
            <label className="havuz-field">
              <span className="havuz-field__label">Ders</span>
              <select
                className="havuz-field__input"
                value={dersId}
                onChange={(e) => {
                  setDersId(e.target.value);
                  setKonuId("");
                  setKavramId("");
                }}
              >
                <option value="">Tümü</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="havuz-field">
              <span className="havuz-field__label">Konu</span>
              <select
                className="havuz-field__input"
                value={konuId}
                disabled={!dersId}
                onChange={(e) => {
                  setKonuId(e.target.value);
                  setKavramId("");
                }}
              >
                <option value="">Tümü</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="havuz-field">
              <span className="havuz-field__label">Kavram</span>
              <select
                className="havuz-field__input"
                value={kavramId}
                disabled={!konuId}
                onChange={(e) => setKavramId(e.target.value)}
              >
                <option value="">Tümü</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="havuz-field">
              <span className="havuz-field__label">Cevap</span>
              <select
                className="havuz-field__input"
                value={ansMode ?? "all"}
                onChange={(e) =>
                  setAnsMode(e.target.value as PoolFilters["answerMode"])
                }
              >
                <option value="all">Tümü</option>
                <option value="answered">Cevabı var</option>
                <option value="unanswered">Cevabı yok</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </label>

            <Button variant="primary" className="mb-2 w-full" onClick={applyFilter}>
              Filtrele & göster
            </Button>
            <Button variant="outline" className="mb-2 w-full" onClick={resetFilter}>
              Tüm havuzu göster
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4" />
              Tüm havuzu sil
            </Button>
          </div>
        </aside>

        <section className="havuz-pool" aria-label="Soru listesi">
          <div className="havuz-pool__toolbar">
            <p className="text-sm font-medium text-slate-700">
              <strong className="text-slate-900">{shown.length}</strong> soru gösteriliyor
              <span className="text-slate-400"> · toplam {all.length}</span>
            </p>
            <Button variant="primary" size="sm" asChild>
              <Link href={TEST_MAKER_ROUTES.kirpici}>
                <Plus className="h-4 w-4" />
                Soru ekle
              </Link>
            </Button>
          </div>

          <div className="havuz-pool__scroll">
            {shown.length === 0 ? (
              <div className="havuz-pool__empty">
                <ImageIcon className="h-12 w-12 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">Henüz soru yok</p>
                <p className="max-w-sm text-sm text-slate-500">
                  Otomatik Soru Kırpıcı ile PDF&apos;ten soru kırpın veya filtreleri sıfırlayın.
                </p>
                <Button variant="primary" size="sm" asChild>
                  <Link href={TEST_MAKER_ROUTES.kirpici}>Kırpıcıya git</Link>
                </Button>
              </div>
            ) : (
              <div className="havuz-pool__grid">
                {shown.map((item) => (
                  <HavuzPoolCard
                    key={item.uuid}
                    item={item}
                    onAnswer={(letter) => handleAnswer(item.uuid, letter)}
                    onDelete={() => handleDelete(item.uuid)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {ConfirmHost}
    </div>
  );
}

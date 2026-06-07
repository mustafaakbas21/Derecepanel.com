"use client";

import { Megaphone } from "lucide-react";

import { usePazarlamaStudio } from "@/hooks/use-pazarlama-studio";

import { ControlPanel } from "./control-panel";
import { PazarlamaBetaModal } from "./pazarlama-beta-modal";
import { StoryPreview } from "./story-preview";

import "@/styles/pazarlama.css";
import "./pazarlama-panel.css";

export function PazarlamaPage() {
  const studio = usePazarlamaStudio();

  const handleRefresh = () => {
    studio.refreshExams();
    studio.renderFromSelection();
  };

  const needsExam = studio.kind !== "countdown";
  const missingExam = needsExam && !studio.examId;

  if (!studio.mounted) {
    return <div className="py-12 text-center text-slate-500">Yükleniyor…</div>;
  }

  return (
    <div id="pm-scope" className="space-y-6 pb-8">
      <PazarlamaBetaModal />

      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
          <Megaphone className="h-3 w-3" aria-hidden />
          Beta
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pazarlama Asistanı
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Deneme sonuçlarından Instagram Story (1080×1920) görselleri oluşturun ve PNG olarak
          indirin.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <ControlPanel
          exams={studio.exams}
          kind={studio.kind}
          style={studio.style}
          styleOptions={studio.styleOptions}
          examId={studio.examId}
          meta={studio.meta}
          brand={studio.brand}
          textState={studio.textState}
          customState={studio.customState}
          missingExam={missingExam}
          onKindChange={studio.setKind}
          onStyleChange={studio.setStyle}
          onExamChange={studio.setExamId}
          onTextChange={studio.updateText}
          onCustomChange={studio.updateCustom}
          onApplyPalette={studio.applyPalette}
          onAccentChange={(accent) => studio.updateBrand({ accent })}
          onLogoChange={(logoDataUrl) => studio.updateBrand({ logoDataUrl })}
          onClearLogo={() => studio.updateBrand({ logoDataUrl: "" })}
          onRefresh={handleRefresh}
          onFit={studio.fitPreview}
        />

        <StoryPreview
          onDownload={studio.exportPng}
          onRefresh={handleRefresh}
          onFit={studio.fitPreview}
          downloading={studio.exporting}
          missingExam={missingExam}
        />
      </div>

      <div className="sr-only" aria-hidden="true">
        <button type="button" id="pm-btn-refresh">
          refresh
        </button>
        <button type="button" id="pm-btn-download">
          download
        </button>
        <button type="button" id="pm-btn-download-panel">
          download panel
        </button>
        <button type="button" id="pm-btn-fit">
          fit
        </button>
      </div>
    </div>
  );
}

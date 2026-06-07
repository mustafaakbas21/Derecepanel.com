"use client";

import { AlertCircle, Download, Maximize2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TemplateHost } from "./template-host";

type Props = {
  onDownload: () => void;
  onRefresh: () => void;
  onFit: () => void;
  downloading: boolean;
  missingExam: boolean;
};

export function StoryPreview({
  onDownload,
  onRefresh,
  onFit,
  downloading,
  missingExam,
}: Props) {
  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Canlı önizleme</h2>
          <p className="mt-0.5 text-xs text-slate-500">Instagram Story · 9:16</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
            id="pm-preview-scale"
          >
            —
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onFit} className="gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            Sığdır
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Yenile
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            id="pm-btn-download"
            disabled={downloading}
            onClick={onDownload}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {downloading ? "Oluşturuluyor…" : "PNG İndir"}
          </Button>
        </div>
      </div>

      <div
        id="pm-preview"
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center p-6",
          missingExam && "bg-amber-50/30"
        )}
      >
        {missingExam && (
          <div className="mb-4 flex max-w-sm items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>Sol panelden bir deneme seçin; aksi halde story boş kalır.</p>
          </div>
        )}

        <div className="flex w-full justify-center">
          <div
            id="pm-canvas"
            className="grid place-items-center overflow-hidden"
            aria-label="9:16 önizleme alanı"
          >
            <div id="pm-preview-inner">
              <div id="pm-story-root" aria-label="Instagram story şablonu">
                <TemplateHost />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

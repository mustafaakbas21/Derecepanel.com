"use client";

import { Button } from "@/components/ui/button";
import { Maximize2, RefreshCw } from "lucide-react";

type Props = {
  onFit: () => void;
  onRefresh: () => void;
};

export function ExportPanel({ onFit, onRefresh }: Props) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-slate-600">
        İndirilen dosya her zaman <strong className="font-semibold text-slate-800">1080×1920 px</strong>{" "}
        PNG formatındadır. PNG indirme ve ölçek bilgisi sağdaki önizleme başlığındadır.
      </p>

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          id="pm-btn-fit"
          onClick={onFit}
        >
          <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
          Önizlemeyi sığdır
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          id="pm-btn-refresh-panel"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          Şablonu yenile
        </Button>
      </div>
    </div>
  );
}

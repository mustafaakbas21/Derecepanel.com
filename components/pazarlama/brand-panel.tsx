"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PALETTE_PRESETS } from "@/lib/pazarlama/brand";
import { getKurumAdi } from "@/lib/pazarlama/kurum";
import type { BrandState } from "@/lib/pazarlama/types";
import { initials } from "@/lib/pazarlama/utils";
import { toast } from "@/lib/notify";

type Props = {
  brand: BrandState;
  onApplyPalette: (id: string) => void;
  onAccentChange: (accent: string) => void;
  onLogoChange: (dataUrl: string) => void;
  onClearLogo: () => void;
};

const PALETTE_META: { id: string; name: string; desc: string }[] = [
  { id: "lavender", name: "Pastel Lavanta", desc: "Lila · Şeftali" },
  { id: "mint", name: "Pastel Mint", desc: "Nane · Buz Mavi" },
  { id: "roseSand", name: "Gül & Kum", desc: "Pudra · Bej" },
  { id: "minimalIce", name: "Minimal Buz", desc: "Kırık Beyaz · Gri" },
];

export function BrandPanel({
  brand,
  onApplyPalette,
  onAccentChange,
  onLogoChange,
  onClearLogo,
}: Props) {
  const kurum = getKurumAdi();

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!/image\/png/i.test(file.type) && !/\.png$/i.test(file.name)) {
      toast.message("Lütfen PNG logo yükleyin.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onLogoChange(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-4">
      <div
        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
        aria-label="Marka önizleme"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-white bg-white text-sm font-bold text-slate-700 shadow-sm"
            id="pm-brandPreviewLogo"
          >
            {brand.logoDataUrl ? (
              <img
                id="pm-brandPreviewImg"
                src={brand.logoDataUrl}
                alt="Logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <span id="pm-brandPreviewFallback">{initials(kurum)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900" id="pm-brandPreviewName">
              {kurum}
            </div>
            <p className="text-xs text-slate-500">Tema ve logo story çıktısına uygulanır.</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Marka
        </span>
      </div>

      <div>
        <Label className="text-xs text-slate-600">Hazır paletler</Label>
        <div className="pm-palettes mt-2" aria-label="Hazır renk paletleri">
          {PALETTE_META.map((p) => {
            const preset = PALETTE_PRESETS[p.id];
            const bg = preset
              ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,.65) 0%, transparent 55%), linear-gradient(135deg, ${preset.bgFrom}, ${preset.bgTo})`
              : undefined;
            return (
              <div key={p.id} className="pm-paletteItem">
                <button
                  type="button"
                  className="pm-palette"
                  data-palette={p.id}
                  aria-label={p.name}
                  title={p.name}
                  style={bg ? { background: bg } : undefined}
                  onClick={() => onApplyPalette(p.id)}
                />
                <div className="pm-paletteMeta">
                  <div className="pm-paletteName">{p.name}</div>
                  <div className="pm-paletteDesc">{p.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pm-logo-upload">Logo (PNG)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="pm-logo-upload"
            className="inline-flex h-9 cursor-pointer items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            PNG yükle
          </label>
          <input
            type="file"
            id="pm-logo-upload"
            accept="image/png"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" size="sm" id="pm-btn-clear-logo" onClick={onClearLogo}>
            Kaldır
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pm-accent-color">Vurgu rengi</Label>
        <input
          type="color"
          id="pm-accent-color"
          className="h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white"
          value={brand.accent}
          onChange={(e) => onAccentChange(e.target.value)}
        />
      </div>
    </div>
  );
}

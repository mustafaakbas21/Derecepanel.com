"use client";

import { useCallback, useEffect, useRef } from "react";
import Sortable from "sortablejs";
import {
  ArrowDown,
  ArrowUp,
  ChevronFirst,
  GripVertical,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/notify";

import { Button } from "@/components/ui/button";
import { bursDisplayLabel } from "@/lib/yks-sim/atlas-enrich";
import { bolumDiliLabel } from "@/lib/yks-sim/atlas-program-display";
import { formatAtlasSira, formatAtlasTaban } from "@/lib/format/numbers";
import {
  moveTercihListEntry,
  moveTercihListToFirst,
  removeFromTercihList,
  reorderTercihList,
  type TercihListItem,
} from "@/lib/yks-sim/tercih-list-storage";
import type { YksSimUser } from "@/lib/yks-sim/types";
import { cn } from "@/lib/utils";

type Props = {
  items: TercihListItem[];
  simUser: YksSimUser | null;
  onChange: () => void;
  variant?: "cards" | "table";
  /** Kart görünümünde max yükseklik (px); tablo modunda yok sayılır */
  maxHeight?: number;
  showActions?: boolean;
};

function collectIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-tercih-id]"))
    .map((el) => el.getAttribute("data-tercih-id"))
    .filter(Boolean) as string[];
}

export function TercihSortableList({
  items,
  simUser,
  onChange,
  variant = "cards",
  maxHeight = 420,
  showActions = true,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const applyReorder = useCallback(() => {
    if (!simUser) return;
    const container = variant === "table" ? tbodyRef.current : listRef.current;
    if (!container) return;
    const ids = collectIds(container);
    if (ids.length !== items.length) return;
    if (ids.every((id, i) => id === items[i]?.id)) return;
    if (reorderTercihList(simUser, ids)) onChange();
  }, [simUser, items, onChange, variant]);

  useEffect(() => {
    const container = variant === "table" ? tbodyRef.current : listRef.current;
    if (!container || !items.length || !simUser) return;

    const sortable = Sortable.create(container, {
      animation: 160,
      handle: ".tercih-drag-handle",
      ghostClass: "opacity-40",
      dragClass: "shadow-md",
      onEnd: () => setTimeout(applyReorder, 0),
    });

    return () => sortable.destroy();
  }, [items.length, simUser, variant, applyReorder]);

  if (!items.length) return null;

  if (variant === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-0 text-sm">
          <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-2 py-2.5" aria-label="Sürükle" />
              <th className="w-14 px-3 py-2.5">Sıra</th>
              <th className="px-3 py-2.5">Program</th>
              <th className="w-[120px] px-3 py-2.5">Şehir</th>
              <th className="px-3 py-2.5 text-right">Taban</th>
              <th className="px-3 py-2.5 text-right">Sıra</th>
              {showActions ? <th className="w-[220px] px-3 py-2.5 text-right">İşlem</th> : null}
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                data-tercih-id={item.id}
                className={cn(
                  "border-t border-slate-100",
                  item.sira === 1 && "bg-emerald-50/60"
                )}
              >
                <td className="px-2 py-3">
                  <button
                    type="button"
                    className="tercih-drag-handle flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
                    aria-label="Sürükleyerek sırala"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold tabular-nums",
                      item.sira === 1
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {item.sira}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.puanTipi ? (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        {item.puanTipi}
                      </span>
                    ) : null}
                    {item.sira === 1 ? (
                      <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        1. tercih
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-semibold text-slate-900">{item.bolum}</p>
                  <p className="text-xs text-slate-500">
                    {item.universiteDisplay ?? item.universite}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 md:hidden">
                    {item.sehir} ·{" "}
                    {bolumDiliLabel((item.bolumDili as "turkce" | "ingilizce") ?? "turkce")} ·{" "}
                    {bursDisplayLabel(item.bursTuru || "Burssuz")}
                  </p>
                </td>
                <td className="px-3 py-3 text-slate-600">{item.sehir ?? "—"}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {formatAtlasTaban(item.taban)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                  {formatAtlasSira(item.basari)}
                </td>
                {showActions && simUser ? (
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        title="1. sıraya al"
                        disabled={item.sira === 1}
                        onClick={() => {
                          if (moveTercihListToFirst(simUser, item.id)) onChange();
                        }}
                      >
                        <ChevronFirst className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={idx === 0}
                        onClick={() => {
                          if (moveTercihListEntry(simUser, item.id, "up")) onChange();
                        }}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={idx === items.length - 1}
                        onClick={() => {
                          if (moveTercihListEntry(simUser, item.id, "down")) onChange();
                        }}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (removeFromTercihList(simUser, item.id)) {
                            toast.success("Tercih listeden çıkarıldı");
                            onChange();
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="space-y-2 overflow-y-auto pr-1"
      style={maxHeight ? { maxHeight } : undefined}
    >
      {items.map((item) => (
        <div
          key={item.id}
          data-tercih-id={item.id}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-2 py-2.5",
            item.sira === 1
              ? "border-emerald-200/80 bg-emerald-50/50"
              : "border-slate-100 bg-slate-50/60"
          )}
        >
          <button
            type="button"
            className="tercih-drag-handle flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-white/80 hover:text-slate-600 active:cursor-grabbing"
            aria-label="Sürükleyerek sırala"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              item.sira === 1 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-800"
            )}
          >
            {item.sira}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{item.universite}</p>
            <p className="truncate text-xs text-slate-500">{item.bolum}</p>
          </div>
          <div className="shrink-0 text-right text-xs tabular-nums text-slate-600">
            <p>{formatAtlasTaban(item.taban)}</p>
            <p className="text-slate-400">{formatAtlasSira(item.basari)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

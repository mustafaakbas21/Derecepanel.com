"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

type HavuzModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pool: QuestionPoolItem[];
  onConfirm: (items: QuestionPoolItem[]) => void;
};

export function HavuzModal({ open, onOpenChange, pool, onConfirm }: HavuzModalProps) {
  const [search, setSearch] = useState("");
  const [ders, setDers] = useState("");
  const [konu, setKonu] = useState("");
  const [answerFilter, setAnswerFilter] = useState<
    "all" | "marked" | "unmarked" | "A" | "B" | "C" | "D" | "E"
  >("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const dersler = useMemo(
    () => [...new Set(pool.map((p) => p.ders))].sort(),
    [pool]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pool.filter((item) => {
      if (ders && item.ders !== ders) return false;
      if (konu && item.konu !== konu) return false;
      if (answerFilter === "marked" && !item.answer) return false;
      if (answerFilter === "unmarked" && item.answer) return false;
      if (["A", "B", "C", "D", "E"].includes(answerFilter) && item.answer !== answerFilter)
        return false;
      if (!q) return true;
      return (
        item.kavram.toLowerCase().includes(q) ||
        item.konu.toLowerCase().includes(q) ||
        item.ders.toLowerCase().includes(q)
      );
    });
  }, [pool, ders, konu, search, answerFilter]);

  const toggle = (uuid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(uuid)) n.delete(uuid);
      else n.add(uuid);
      return n;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Soru havuzundan seç</DialogTitle>
          <DialogDescription>Çoklu seçim — teste eklenir</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 px-6 py-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="h-10 rounded-xl border border-slate-200 px-2 text-sm"
            value={ders}
            onChange={(e) => setDers(e.target.value)}
          >
            <option value="">Tüm dersler</option>
            {dersler.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <Input placeholder="Konu filtresi" value={konu} onChange={(e) => setKonu(e.target.value)} />
          <select
            className="h-10 rounded-xl border border-slate-200 px-2 text-sm"
            value={answerFilter}
            onChange={(e) =>
              setAnswerFilter(e.target.value as typeof answerFilter)
            }
          >
            <option value="all">Tüm cevaplar</option>
            <option value="marked">İşaretli</option>
            <option value="unmarked">İşaretsiz</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </div>
        <ul className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto px-6 pb-4 sm:grid-cols-3">
          {filtered.map((item) => {
            const isSel = selected.has(item.uuid);
            return (
              <li key={item.uuid}>
                <button
                  type="button"
                  onClick={() => toggle(item.uuid)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-xl border text-left",
                    isSel ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.dataUrl} alt="" className="aspect-[4/3] w-full bg-slate-100 object-contain" />
                  <p className="p-2 text-[10px] text-slate-500">
                    {item.ders} · {item.konu}
                  </p>
                  {isSel && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button
            className="bg-slate-900 text-white"
            disabled={selected.size === 0}
            onClick={() => {
              onConfirm(pool.filter((p) => selected.has(p.uuid)));
              setSelected(new Set());
              onOpenChange(false);
            }}
          >
            {selected.size} soruyu ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

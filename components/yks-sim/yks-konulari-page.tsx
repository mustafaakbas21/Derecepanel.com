"use client";

import { useMemo, useState } from "react";

import { YksSimShell } from "@/components/yks-sim/yks-sim-shell";
import { Checkbox } from "@/components/ui/checkbox";
import { getDerslerByTrack } from "@/lib/mufredat";
import {
  getCurrentUser,
  primaryWriteId,
  readCompletedTopicsMap,
  setTopicCompleted,
} from "@/lib/yks-sim/student-sim-bridge";

type Props = { mode?: "coach" | "student" };

export function YksKonulariPage({ mode = "coach" }: Props) {
  const [track, setTrack] = useState<"TYT" | "AYT">("TYT");
  const [, bump] = useState(0);

  const writeId = useMemo(() => {
    const u = getCurrentUser();
    return primaryWriteId(u) || "demo-student";
  }, []);

  const completed = readCompletedTopicsMap(writeId);
  const dersler = getDerslerByTrack(track);

  const toggle = (title: string, checked: boolean) => {
    setTopicCompleted(writeId, title, checked);
    bump((n) => n + 1);
  };

  const doneCount = Object.keys(completed).filter((k) => completed[k]).length;

  return (
    <YksSimShell
      mode={mode}
      title="YKS Konuları"
      subtitle={`Müfredat takibi — ${doneCount} konu tamamlandı (localStorage)`}
    >
      <div className="flex gap-2">
        {(["TYT", "AYT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              track === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => setTrack(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {dersler.map((d) => (
          <details
            key={d.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
            open
          >
            <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-900">
              {d.dersAdi}
              <span className="ml-2 text-xs font-normal text-slate-500">
                ({d.konular.length} konu)
              </span>
            </summary>
            <ul className="border-t border-slate-100 px-4 py-2">
              {d.konular.map((k) => (
                <li key={k.id} className="flex items-start gap-3 py-2">
                  <Checkbox
                    id={`topic-${k.id}`}
                    checked={!!completed[k.ad]}
                    onCheckedChange={(v) => toggle(k.ad, v === true)}
                  />
                  <label htmlFor={`topic-${k.id}`} className="text-sm text-slate-700">
                    {k.ad}
                  </label>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </YksSimShell>
  );
}

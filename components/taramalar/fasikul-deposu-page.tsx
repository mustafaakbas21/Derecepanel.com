"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, FileText, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "@/lib/notify";

import {
  TrEmptyState,
  TrField,
  TrKpiCard,
  TrKpiGrid,
  TrPanel,
  TrShell,
  trInputClass,
} from "@/components/taramalar/tr-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FASCICLE_ASSIGNED_EVENT,
  FASCICLE_RESULT_EVENT,
} from "@/lib/taramalar/constants";
import { listAllAssignedFascicles } from "@/lib/taramalar/fascicle-index";
import type { FascicleDepotRow, FascicleSource } from "@/lib/taramalar/types";
import { removeAssigned } from "@/lib/test-maker/fascicle";
import { loadStudentsFull } from "@/lib/students/storage";

const SOURCE_LABELS: Record<FascicleSource, string> = {
  test_maker_send: "Test Maker",
  tarama_deposu: "Tarama depo",
  tarama_deposu_send: "Tarama gönder",
  fasikul_wizard: "Fasikül sihirbazı",
};

export function FasikulDeposuPage() {
  const { confirm, ConfirmHost } = useConfirm();
  const [rows, setRows] = useState<FascicleDepotRow[]>([]);
  const [q, setQ] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [resultRow, setResultRow] = useState<FascicleDepotRow | null>(null);

  const refresh = useCallback(() => {
    const students = loadStudentsFull({ seedIfEmpty: true });
    setRows(listAllAssignedFascicles(students));
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(FASCICLE_ASSIGNED_EVENT, onChange);
    window.addEventListener(FASCICLE_RESULT_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(FASCICLE_ASSIGNED_EVENT, onChange);
      window.removeEventListener(FASCICLE_RESULT_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (studentFilter && r.studentId !== studentFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (sourceFilter && r.source !== sourceFilter) return false;
      if (!query) return true;
      const hay = [r.title, r.studentName, r.studentCode].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [rows, q, studentFilter, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "bekliyor").length;
    const done = rows.filter((r) => r.status === "tamamlandi").length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = rows.filter(
      (r) => new Date(r.assignedAt).getTime() >= monthStart.getTime()
    ).length;
    const byStudent: Record<string, number> = {};
    rows.forEach((r) => {
      byStudent[r.studentId] = (byStudent[r.studentId] ?? 0) + 1;
    });
    const topStudent =
      Object.entries(byStudent).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const topName = rows.find((r) => r.studentId === topStudent)?.studentName ?? "—";
    return { total, pending, done, thisMonth, topName };
  }, [rows]);

  const students = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.studentId, r.studentName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "tr"));
  }, [rows]);

  const handleDelete = async (row: FascicleDepotRow) => {
    const ok = await confirm({
      title: `"${row.title}" ataması silinsin mi?`,
      confirmLabel: "Sil",
      destructive: true,
    });
    if (!ok) return;
    if (removeAssigned(row.studentId, row.fascicleId)) {
      toast.success("Atama silindi");
      refresh();
    } else {
      toast.error("Silinemedi");
    }
  };

  const handlePdf = (row: FascicleDepotRow) => {
    if (!row.pdf_file_id) {
      toast.info("Bu fasikül için bulut PDF kaydı yok");
      return;
    }
    toast.info(`PDF dosya ID: ${row.pdf_file_id} — Test Maker bulut indirme ile açılabilir`);
  };

  return (
    <TrShell
      title="Fasikül Deposu"
      description="Tüm öğrencilere gönderilen dijital fasiküller — aggregate görünüm (localStorage)."
    >
      <TrKpiGrid>
        <TrKpiCard label="Toplam gönderilen" value={stats.total} />
        <TrKpiCard label="Bekleyen / tamamlanan" value={`${stats.pending} / ${stats.done}`} />
        <TrKpiCard label="Bu ay gönderilen" value={stats.thisMonth} />
        <TrKpiCard label="En çok atanan" value={stats.topName} hint="öğrenci" />
      </TrKpiGrid>

      <TrPanel>
        <div className="tr-filter-bar tr-no-print">
          <TrField label="Ara">
            <input
              className={trInputClass}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Başlık, öğrenci…"
            />
          </TrField>
          <TrField label="Öğrenci">
            <select
              className={trInputClass}
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              {students.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </TrField>
          <TrField label="Durum">
            <select
              className={trInputClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="bekliyor">Bekliyor</option>
              <option value="tamamlandi">Tamamlandı</option>
            </select>
          </TrField>
          <TrField label="Kaynak">
            <select
              className={trInputClass}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              {(Object.keys(SOURCE_LABELS) as FascicleSource[]).map((k) => (
                <option key={k} value={k}>
                  {SOURCE_LABELS[k]}
                </option>
              ))}
            </select>
          </TrField>
        </div>

        {!rows.length ? (
          <TrEmptyState
            title="Henüz fasikül gönderilmedi"
            description="Test Oluşturucu, Tarama Deposu veya Fasikül Oluşturma sihirbazından öğrenciye gönderim yapın."
          />
        ) : !filtered.length ? (
          <TrEmptyState title="Eşleşen kayıt yok" description="Filtreleri gevşetin." />
        ) : (
          <div className="tr-table-wrap mt-4">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Fasikül</th>
                  <th>Öğrenci</th>
                  <th>Atama</th>
                  <th>Durum</th>
                  <th>Kaynak</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={`${row.studentId}-${row.fascicleId}-${row.assignedAt}`}>
                    <td>
                      <p className="font-semibold text-slate-900">{row.title}</p>
                      <p className="text-xs text-slate-500">{row.questionCount} soru</p>
                    </td>
                    <td>
                      {row.studentName}
                      {row.studentCode ? (
                        <span className="block text-xs text-slate-500">{row.studentCode}</span>
                      ) : null}
                    </td>
                    <td className="text-xs text-slate-600">
                      {new Date(row.assignedAt).toLocaleString("tr-TR")}
                    </td>
                    <td>
                      <span
                        className={`tr-pill ${row.status === "tamamlandi" ? "tr-pill--ok" : "tr-pill--warn"}`}
                      >
                        {row.status === "tamamlandi" ? "Tamamlandı" : "Bekliyor"}
                        {row.accuracyPct != null ? ` · %${row.accuracyPct}` : ""}
                      </span>
                    </td>
                    <td>
                      <span className="tr-pill tr-pill--muted">{SOURCE_LABELS[row.source]}</span>
                    </td>
                    <td>
                      <div className="tr-actions">
                        <Button type="button" size="sm" variant="outline" onClick={() => handlePdf(row)}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          PDF
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setResultRow(row)}>
                          Sonuç
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => toast.info("Hatırlatma — Faz 2 (bildirim)")}
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TrPanel>

      <Dialog open={Boolean(resultRow)} onOpenChange={(o) => !o && setResultRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sonuç detayı</DialogTitle>
          </DialogHeader>
          {resultRow ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>{resultRow.title}</strong> · {resultRow.studentName}
              </p>
              <p>
                Durum: {resultRow.status}
                {resultRow.accuracyPct != null ? ` · Doğruluk %${resultRow.accuracyPct}` : ""}
              </p>
              {resultRow.lastResultTitle ? (
                <p>Son sonuç: {resultRow.lastResultTitle}</p>
              ) : (
                <p className="text-slate-500">fascicle_results_* kaydı henüz yok.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      {ConfirmHost}
    </TrShell>
  );
}

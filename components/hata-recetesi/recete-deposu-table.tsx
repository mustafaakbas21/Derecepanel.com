"use client";

import { Eye, FileText, Pencil, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";
import { cn } from "@/lib/utils";

type Props = {
  rows: RecipeArchiveRecord[];
  onPreview: (rec: RecipeArchiveRecord) => void;
  onEdit: (rec: RecipeArchiveRecord) => void;
  onSend: (rec: RecipeArchiveRecord) => void;
  onDelete: (rec: RecipeArchiveRecord) => void;
  onPdf?: (rec: RecipeArchiveRecord) => void;
};

function fmtDate(ts?: number) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function ReceteDeposuTable({
  rows,
  onPreview,
  onEdit,
  onSend,
  onDelete,
  onPdf,
}: Props) {
  if (!rows.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Filtreye uygun reçete bulunamadı.
      </p>
    );
  }

  return (
    <div className="hr-table-wrap">
      <table className="hr-table">
        <thead>
          <tr>
            <th>Kapak</th>
            <th>Reçete</th>
            <th>Ders & konu</th>
            <th>Soru</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th className="text-right">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((rec) => {
            const thumb = rec.thumbs?.[0] || rec.questions?.[0]?.imageDataUrl;
            const sent = rec.status === "gonderildi";
            return (
              <tr key={rec.id}>
                <td>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="hr-table__thumb" />
                  ) : (
                    <span className="hr-table__thumb hr-table__thumb--empty">—</span>
                  )}
                </td>
                <td className="max-w-[220px]">
                  <p className="font-semibold text-slate-900">{rec.name}</p>
                  <p className="truncate text-xs text-slate-500">{rec.studentCanonical || "—"}</p>
                </td>
                <td className="text-slate-600">
                  <span className="line-clamp-2 text-sm">
                    {rec.ders}
                    {rec.konu ? ` · ${rec.konu}` : ""}
                  </span>
                </td>
                <td>
                  <span className="font-semibold tabular-nums text-slate-800">
                    {rec.questionCount}
                  </span>
                </td>
                <td className="whitespace-nowrap text-slate-600">{fmtDate(rec.createdAt)}</td>
                <td>
                  <span
                    className={cn(
                      "hr-status-pill",
                      sent && "hr-status-pill--sent"
                    )}
                  >
                    {rec.status ?? "arsiv"}
                  </span>
                </td>
                <td>
                  <div className="hr-table__actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Önizle"
                      onClick={() => onPreview(rec)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {rec.pdf_file_id && onPdf ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="PDF"
                        onClick={() => onPdf(rec)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Düzenle"
                      onClick={() => onEdit(rec)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Öğrenciye gönder"
                      onClick={() => onSend(rec)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Sil"
                      onClick={() => onDelete(rec)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

export type ImportResultSummary = {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

type ImportResultPanelProps = {
  result: ImportResultSummary;
};

export function ImportResultPanel({ result }: ImportResultPanelProps) {
  const { imported, skipped, errors } = result;

  if (errors.length === 0 && imported > 0) return null;

  return (
    <div
      className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3"
      role="region"
      aria-label="İçe aktarma sonuç detayı"
    >
      <p className="mb-2 text-[13px] font-semibold text-slate-700">
        {imported > 0
          ? `${imported} kayıt eklendi${skipped > 0 ? `, ${skipped} satır atlandı` : ""}.`
          : "İçe aktarma tamamlanamadı."}
      </p>
      {errors.length > 0 && (
        <table className="w-full text-left text-[12px] text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400">
              <th className="pb-1.5 pr-3 font-semibold">Satır</th>
              <th className="pb-1.5 font-semibold">Sebep</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, i) => (
              <tr key={`${err.row}-${i}`} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-3 font-medium text-slate-800">
                  {err.row > 0 ? err.row : "—"}
                </td>
                <td className="py-1.5">{err.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

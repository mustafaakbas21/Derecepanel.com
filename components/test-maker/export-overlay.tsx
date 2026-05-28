"use client";

type ExportOverlayProps = {
  visible: boolean;
  message: string;
};

export function ExportOverlay({ visible, message }: ExportOverlayProps) {
  if (!visible) return null;
  return (
    <div
      id="tm-pdf-cloud-overlay"
      className="fixed inset-0 z-[20060] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl bg-white px-8 py-6 shadow-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        <p className="text-center text-sm font-semibold text-slate-800">{message}</p>
      </div>
    </div>
  );
}

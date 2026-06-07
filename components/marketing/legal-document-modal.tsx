"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LegalDocument } from "@/lib/marketing/legal-content";

function LegalDocumentBody({ doc }: { doc: LegalDocument }) {
  return (
    <div className="max-h-[min(60vh,520px)] space-y-6 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-600">
      <p>{doc.intro}</p>
      {doc.sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-2 text-[15px] font-bold text-slate-900">{section.title}</h3>
          <div className="space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
      <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">
        Son güncelleme: {doc.updated}
      </p>
    </div>
  );
}

export function LegalDocumentModal({
  doc,
  triggerLabel,
  triggerClassName,
}: {
  doc: LegalDocument;
  triggerLabel: string;
  triggerClassName?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "rounded-sm transition-colors hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          }
        >
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Yasal</p>
          <DialogTitle className="text-xl">{doc.title}</DialogTitle>
          <DialogDescription className="sr-only">{doc.intro}</DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <LegalDocumentBody doc={doc} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

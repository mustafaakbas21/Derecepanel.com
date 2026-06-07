"use client";

import { useState } from "react";
import { Expand } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function OnyxChatImagePreview({
  src,
  alt = "Soru görseli",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative block overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md",
          className
        )}
        aria-label="Görseli büyüt"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-52 w-full object-contain sm:max-h-56"
        />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-900/75 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Expand size={12} aria-hidden />
          Büyüt
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto border-slate-200 p-2 sm:p-3">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="mx-auto max-h-[80vh] w-full rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

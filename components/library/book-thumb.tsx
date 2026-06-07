"use client";

import { BookOpen } from "lucide-react";

import type { LibraryBook } from "@/lib/library/types";
import { cn } from "@/lib/utils";

type Props = {
  book: LibraryBook;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  xs: "h-12 w-9",
  sm: "h-20 w-full aspect-[3/4] max-h-24",
  md: "h-24 w-[4.5rem] shrink-0",
  lg: "h-36 w-full aspect-[3/4]",
};

export function BookThumb({ book, size = "md", className }: Props) {
  if (book.coverDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.coverDataUrl}
        alt=""
        className={cn(
          "rounded-lg object-cover shadow-sm ring-1 ring-slate-200/80",
          sizeMap[size],
          className
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/80 text-slate-400 ring-1 ring-slate-200/80",
        sizeMap[size],
        className
      )}
    >
      <BookOpen className={size === "xs" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6"} />
    </div>
  );
}

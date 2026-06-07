"use client";

import { ListOrdered, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  listCount: number;
  onOpenList: () => void;
  onClearList: () => void;
  clearDisabled?: boolean;
  className?: string;
  size?: "sm" | "default";
};

/** Tercih listesi + temizle — yan yana */
export function TercihListActions({
  listCount,
  onOpenList,
  onClearList,
  clearDisabled,
  className,
  size = "sm",
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button type="button" variant="primary" size={size} onClick={onOpenList}>
        <ListOrdered className="mr-1.5 h-4 w-4" />
        Tercih listesi
        {listCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs tabular-nums">
            {listCount}
          </span>
        ) : null}
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={clearDisabled ?? listCount === 0}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={onClearList}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Tercih listesini temizle
      </Button>
    </div>
  );
}

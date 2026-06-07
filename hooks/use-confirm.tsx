"use client";

import { useCallback, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/** Tarayıcı `confirm` yerine — `const ok = await confirm({ title: "..." })` */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ title: "" });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOpts(options);
      setOpen(true);
    });
  }, []);

  const finish = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
  };

  const ConfirmHost = (
    <ConfirmDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) finish(false);
        else setOpen(true);
      }}
      title={opts.title}
      description={opts.description}
      confirmLabel={opts.confirmLabel}
      cancelLabel={opts.cancelLabel}
      destructive={opts.destructive}
      onConfirm={() => finish(true)}
    />
  );

  return { confirm, ConfirmHost };
}

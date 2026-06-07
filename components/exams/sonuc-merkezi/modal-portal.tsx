"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Modalları scroll kabuğunun dışına taşır — tam ekran fixed + doğru z-index */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

"use client";

import type { ReactNode } from "react";

import { PanelBootstrap } from "@/components/providers/panel-bootstrap";
import { AppToaster } from "@/components/providers";

/** Sonner — dashboard scale dışında, tüm rotalarda görünür */
export function AppRootProviders({ children }: { children: ReactNode }) {
  return (
    <PanelBootstrap>
      {children}
      <AppToaster />
    </PanelBootstrap>
  );
}

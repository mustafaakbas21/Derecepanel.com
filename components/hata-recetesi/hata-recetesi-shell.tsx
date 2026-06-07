"use client";

import type { ReactNode } from "react";

import { HrPageHeader, HR_PAGE_CLASS } from "@/components/hata-recetesi/hr-ui";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

/** Sayfa başlığı + içerik — alt menü layout’ta */
export function HataRecetesiShell({ title, description, action, children }: Props) {
  return (
    <div className={HR_PAGE_CLASS}>
      <HrPageHeader title={title} description={description} action={action} />
      {children}
    </div>
  );
}

"use client";

import { LegalDocumentModal } from "@/components/marketing/legal-document-modal";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/marketing/legal-content";

export function LandingFooterLegal() {
  return (
    <div className="flex gap-6 text-xs font-medium text-slate-500">
      <LegalDocumentModal doc={PRIVACY_POLICY} triggerLabel="Gizlilik" />
      <LegalDocumentModal doc={TERMS_OF_SERVICE} triggerLabel="Şartlar" />
    </div>
  );
}

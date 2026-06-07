"use client";

import { cn } from "@/lib/utils";

type Props = {
  deneme: boolean;
  soruBankasi: boolean;
  onChange: (next: { deneme: boolean; soru_bankasi: boolean }) => void;
  className?: string;
};

export function HataKaynagiToggle({ deneme, soruBankasi, onChange, className }: Props) {
  return (
    <div className={cn("hr-source-toggle", className)} role="group" aria-label="Hata kaynağı">
      <button
        type="button"
        className={cn("hr-source-toggle__btn", deneme && "hr-source-toggle__btn--on")}
        aria-pressed={deneme}
        onClick={() => onChange({ deneme: !deneme, soru_bankasi: soruBankasi })}
      >
        Deneme
      </button>
      <button
        type="button"
        className={cn(
          "hr-source-toggle__btn",
          soruBankasi && "hr-source-toggle__btn--on"
        )}
        aria-pressed={soruBankasi}
        onClick={() => onChange({ deneme, soru_bankasi: !soruBankasi })}
      >
        Soru bankası
      </button>
    </div>
  );
}

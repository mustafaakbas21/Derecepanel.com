"use client";

import type { GalleryCropItem } from "@/lib/test-maker/use-pdf-cropper";
import { cn } from "@/lib/utils";

type FastAnswerPanelProps = {
  items: GalleryCropItem[];
  activeIndex: number;
  stripRef: React.RefObject<HTMLDivElement | null>;
  onSelectIndex: (index: number) => void;
};

export function FastAnswerPanel({
  items,
  activeIndex,
  stripRef,
  onSelectIndex,
}: FastAnswerPanelProps) {
  return (
    <div
      className="kirpici-fast-answer"
      aria-label="Hızlı cevap paneli"
    >
      <div className="kirpici-fast-answer__head">
        <p className="kirpici-fast-answer__title">Hızlı Cevap Paneli</p>
        <p className="kirpici-fast-answer__hint">A–E ile cevapla · Backspace ile geri al</p>
      </div>

      <div ref={stripRef} id="hizliCevapSeridi" className="kirpici-fast-answer__strip">
        {items.length === 0 ? (
          <span className="kirpici-fast-answer__placeholder">
            Kırpılan sorular burada numaralı cevap kutucukları olarak görünecek
          </span>
        ) : (
          items.map((item, index) => {
            const isActive = index === activeIndex;
            const answer = item.answer ? item.answer.toUpperCase() : "";
            return (
              <button
                key={item.id}
                type="button"
                data-fast-index={index}
                aria-label={`Soru ${index + 1}, cevap ${answer || "boş"}${isActive ? ", aktif" : ""}`}
                aria-pressed={isActive}
                onClick={() => onSelectIndex(index)}
                className={cn(
                  "kirpici-fast-answer__cell",
                  isActive && "kirpici-fast-answer__cell--active",
                  !isActive && answer && "kirpici-fast-answer__cell--answered",
                  !isActive && !answer && "kirpici-fast-answer__cell--empty"
                )}
              >
                <span className="leading-none">{index + 1}</span>
                <span
                  className={cn(
                    "mt-0.5 text-[10px] leading-none",
                    isActive ? "text-slate-300" : "text-slate-400"
                  )}
                >
                  {answer || "—"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

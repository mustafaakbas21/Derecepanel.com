"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { applyTemplate } from "@/lib/test-maker/templates";
import type { TemplateId } from "@/lib/test-maker/types";

type CardDef = { tpl: TemplateId; name: string; subtitle: string };

const PRIMARY: CardDef[] = [
  { tpl: "derece", name: "Derece Kurumsal", subtitle: "Serif · Çift çizgi · Klasik" },
  { tpl: "uc-boyutlu", name: "Üç Boyutlu Vizyon", subtitle: "Kalın çizgi · Siyah rozet" },
  { tpl: "sarmal", name: "Sarmal Dinamik", subtitle: "Kesik çizgi · Turuncu rozet" },
  { tpl: "yeni-nesil", name: "Yeni Nesil 3-4-5", subtitle: "Minimal · İnce · Modern" },
];

const OTHER: CardDef[] = [
  { tpl: "limitless", name: "Limitless Format", subtitle: "Siyah · Geniş aralık" },
  { tpl: "hiz-renk", name: "Hız ve Renk Tarzı", subtitle: "Kırmızı · Dinamik" },
  { tpl: "orijinal-mat", name: "Orijinal Mat", subtitle: "Koyu gri · Sade" },
  { tpl: "karekök", name: "Karekök Klasik", subtitle: "Yeşil · Serif başlık" },
  { tpl: "aydinlik", name: "Aydınlık Sayfalar", subtitle: "Açık · Ferah · Mavi" },
  { tpl: "paraf", name: "Paraf Özel", subtitle: "Mor · Serif başlık" },
];

type Props = {
  activeTpl: TemplateId;
  activeName: string;
  onSelect: (tpl: TemplateId, name: string) => void;
};

function PreviewThumb({ tpl }: { tpl: TemplateId }) {
  const hdr: Record<TemplateId, string> = {
    derece: "#0d47a1",
    "uc-boyutlu": "#1e293b",
    sarmal: "#e65100",
    "yeni-nesil": "#374151",
    limitless: "#212121",
    "hiz-renk": "#c62828",
    "orijinal-mat": "#37474f",
    "karekök": "#2e7d32",
    aydinlik: "#f5f5f5",
    paraf: "#4a148c",
  };
  return (
    <div
      style={{
        width: 30,
        height: 38,
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
        flexShrink: 0,
        background: "#fff",
      }}
    >
      <div style={{ height: 10, background: hdr[tpl] }} />
      <div style={{ padding: "2px 3px" }}>
        <div style={{ height: 2, background: "#e2e8f0", borderRadius: 1, margin: "2px 0" }} />
        <div style={{ height: 2, background: "#f1f5f9", borderRadius: 1, margin: "2px 0", width: "70%" }} />
      </div>
    </div>
  );
}

function TplCard({
  card,
  active,
  onPick,
}: {
  card: CardDef;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="tm-tpl-card"
      data-tpl={card.tpl}
      data-name={card.name}
      role="option"
      aria-selected={active}
      onClick={onPick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: "7px 8px",
        border: "1.5px solid",
        borderColor: active ? "#0f172a" : "transparent",
        background: active ? "#f1f5f9" : "transparent",
        borderRadius: 9,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <PreviewThumb tpl={card.tpl} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{card.name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 9, color: "#94a3b8", lineHeight: 1.4 }}>
          {card.subtitle}
        </p>
      </div>
    </button>
  );
}

export function TemplatePopover({ activeTpl, activeName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const positionPopover = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    let left = r.left;
    if (left + 232 > window.innerWidth - 8) left = window.innerWidth - 240;
    setPos({ top: r.bottom + 6, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    positionPopover();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, positionPopover]);

  const pick = (card: CardDef) => {
    applyTemplate(card.tpl, card.name);
    onSelect(card.tpl, card.name);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id="tm-btn-sablon"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        onClick={(e) => {
          e.stopPropagation();
          if (open) setOpen(false);
          else {
            positionPopover();
            setOpen(true);
          }
        }}
      >
        Şablon: <span id="tm-tpl-active-name">{activeName}</span>
      </button>
      {open && (
        <div
          ref={popRef}
          id="tm-tpl-popover"
          role="listbox"
          aria-label="Şablon seçimi"
          style={{
            display: "block",
            position: "fixed",
            zIndex: 9500,
            top: pos.top,
            left: pos.left,
            width: 232,
            borderRadius: 14,
            background: "#fff",
            boxShadow:
              "0 20px 50px -8px rgba(0,0,0,.2), 0 0 0 1px rgba(0,0,0,.06)",
            padding: 6,
            overflowY: "auto",
            maxHeight: "min(520px, 80vh)",
          }}
        >
          <p
            style={{
              padding: "8px 10px 4px",
              margin: 0,
              fontSize: 9.5,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            Şablon Motoru
          </p>
          {PRIMARY.map((c) => (
            <TplCard key={c.tpl} card={c} active={activeTpl === c.tpl} onPick={() => pick(c)} />
          ))}
          <div style={{ height: 1, background: "#f1f5f9", margin: "5px 2px" }} />
          <p
            style={{
              padding: "4px 10px 2px",
              margin: 0,
              fontSize: 9,
              fontWeight: 700,
              color: "#cbd5e1",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Diğer Şablonlar
          </p>
          {OTHER.map((c) => (
            <TplCard key={c.tpl} card={c} active={activeTpl === c.tpl} onPick={() => pick(c)} />
          ))}
        </div>
      )}
    </>
  );
}

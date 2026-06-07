"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { applyTemplate } from "@/lib/test-maker/templates";
import {
  getTemplatesByGroup,
  type TemplateDefinition,
} from "@/lib/test-maker/template-registry";
import type { TemplateId } from "@/lib/test-maker/types";

const PRIMARY = getTemplatesByGroup("primary");
const OTHER = getTemplatesByGroup("other");

const POPOVER_W = 232;
const POPOVER_GAP = 6;

type Props = {
  activeTpl: TemplateId;
  activeName: string;
  onSelect: (tpl: TemplateId, name: string) => void;
};

function PreviewThumb({ def }: { def: TemplateDefinition }) {
  const hdr = def.preview.headerColor;
  const isLight = def.id === "aydinlik";
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
      <div style={{ height: 10, background: hdr }} />
      <div style={{ padding: "2px 3px" }}>
        <div
          style={{
            height: 2,
            background: isLight ? "#94a3b8" : "#e2e8f0",
            borderRadius: 1,
            margin: "2px 0",
          }}
        />
        <div
          style={{
            height: 2,
            background: "#f1f5f9",
            borderRadius: 1,
            margin: "2px 0",
            width: "70%",
          }}
        />
      </div>
    </div>
  );
}

function TplCard({
  def,
  active,
  onPick,
}: {
  def: TemplateDefinition;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="tm-tpl-card"
      data-tpl={def.id}
      data-name={def.name}
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
      <PreviewThumb def={def} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{def.name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 9, color: "#94a3b8", lineHeight: 1.4 }}>
          {def.subtitle}
        </p>
      </div>
    </button>
  );
}

export function TemplatePopover({ activeTpl, activeName, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const positionPopover = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const maxH = Math.min(520, window.innerHeight * 0.8);

    let left = r.left;
    if (left + POPOVER_W > window.innerWidth - 8) {
      left = window.innerWidth - POPOVER_W - 8;
    }
    if (left < 8) left = 8;

    let top = r.bottom + POPOVER_GAP;
    if (top + maxH > window.innerHeight - 8) {
      top = Math.max(8, r.top - POPOVER_GAP - maxH);
    }

    setPos({ top, left });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    positionPopover();
    const onScrollOrResize = () => positionPopover();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
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
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, positionPopover]);

  const pick = (def: TemplateDefinition) => {
    applyTemplate(def.id, def.name);
    onSelect(def.id, def.name);
    setOpen(false);
  };

  const popover =
    open && mounted ? (
      <div
        ref={popRef}
        id="tm-tpl-popover"
        role="listbox"
        aria-label="Şablon seçimi"
        style={{
          display: "block",
          position: "fixed",
          zIndex: 100000,
          top: pos.top,
          left: pos.left,
          width: POPOVER_W,
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
        {PRIMARY.map((def) => (
          <TplCard
            key={def.id}
            def={def}
            active={activeTpl === def.id}
            onPick={() => pick(def)}
          />
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
        {OTHER.map((def) => (
          <TplCard
            key={def.id}
            def={def}
            active={activeTpl === def.id}
            onPick={() => pick(def)}
          />
        ))}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id="tm-btn-sablon"
        className="tm-toolbar-btn tm-toolbar-btn--secondary !min-h-10 !px-3.5 !text-sm"
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
      {popover ? createPortal(popover, document.body) : null}
    </>
  );
}

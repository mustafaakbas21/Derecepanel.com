"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GalleryCropItem } from "@/lib/test-maker/use-pdf-cropper";
import type { AnswerLetter } from "@/lib/test-maker/types";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toUpperCase();
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

type UseFastAnswersOptions = {
  items: GalleryCropItem[];
  onSetAnswer: (index: number, answer: AnswerLetter | null) => void;
  keyboardEnabled?: boolean;
};

export function useFastAnswers({
  items,
  onSetAnswer,
  keyboardEnabled = true,
}: UseFastAnswersOptions) {
  const [activeIndex, setActiveIndexState] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, Math.max(0, items.length - 1))),
    [items.length]
  );

  useEffect(() => {
    setActiveIndexState((current) => clampIndex(current));
  }, [items.length, clampIndex]);

  const scrollStripCell = useCallback((index: number) => {
    requestAnimationFrame(() => {
      const btn = stripRef.current?.querySelector<HTMLElement>(
        `[data-fast-index="${index}"]`
      );
      btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }, []);

  const setActiveIndex = useCallback(
    (index: number, scrollStrip = false) => {
      const next = clampIndex(index);
      setActiveIndexState(next);
      if (scrollStrip) scrollStripCell(next);
    },
    [clampIndex, scrollStripCell]
  );

  const scrollToCard = useCallback((itemId: string) => {
    cardRefs.current.get(itemId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, []);

  const setAnswer = useCallback(
    (index: number, answer: AnswerLetter | null) => {
      if (index < 0 || index >= items.length) return;
      onSetAnswer(index, answer);
    },
    [items.length, onSetAnswer]
  );

  const activateAndScroll = useCallback(
    (index: number) => {
      setActiveIndex(index, true);
      const item = items[index];
      if (item) scrollToCard(item.id);
    },
    [items, scrollToCard, setActiveIndex]
  );

  const registerCardRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!keyboardEnabled || items.length === 0) return;

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const key = e.key.toUpperCase();
      if (LETTERS.includes(key as AnswerLetter)) {
        e.preventDefault();
        const idx = clampIndex(activeIndex);
        setAnswer(idx, key as AnswerLetter);
        setActiveIndex(Math.min(idx + 1, items.length - 1), true);
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        const idx = clampIndex(activeIndex);
        const clearIndex = items[idx]?.answer ? idx : Math.max(idx - 1, 0);
        setAnswer(clearIndex, null);
        setActiveIndex(Math.max(idx - 1, 0), true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboardEnabled, items, activeIndex, clampIndex, setAnswer, setActiveIndex]);

  return {
    activeIndex,
    setActiveIndex,
    activateAndScroll,
    setAnswer,
    stripRef,
    registerCardRef,
  };
}

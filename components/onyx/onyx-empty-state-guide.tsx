"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  getOnyxWelcomeSkills,
  type OnyxEmptyStateActionId,
  type OnyxWelcomeSkill,
} from "@/lib/onyx/empty-state-actions";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { cn } from "@/lib/utils";

export type { OnyxEmptyStateActionId };

export function EmptyStateWelcome({
  role,
  disabled = false,
  onAction,
  className,
}: {
  role: OnyxRole;
  disabled?: boolean;
  onAction: (action: OnyxEmptyStateActionId) => void;
  className?: string;
}) {
  const skills = useMemo(() => getOnyxWelcomeSkills(role), [role]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<OnyxWelcomeSkill | null>(
    null
  );
  const menuRootRef = useRef<HTMLDivElement>(null);

  const pickSkill = useCallback(
    (skill: OnyxWelcomeSkill) => {
      if (disabled) return;
      setSelectedSkill(skill);
      setIsMenuOpen(false);
      onAction(skill.id);
    },
    [disabled, onAction]
  );

  const toggleMenu = useCallback(() => {
    if (disabled) return;
    setIsMenuOpen((open) => !open);
  }, [disabled]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (
        menuRootRef.current &&
        !menuRootRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={cn(
        "onyx-empty-state-in mx-auto flex w-full max-w-3xl flex-col items-center px-4 sm:mt-4",
        className
      )}
    >
      <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-slate-100 p-3 text-slate-700">
        <span className="text-3xl" aria-hidden>
          ✨
        </span>
      </div>
      <h1 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-slate-800 md:text-4xl">
        Onyx YZ: Kişisel Eğitim Klonun
      </h1>
      <p className="mb-2 max-w-2xl text-center text-base leading-relaxed text-slate-600 md:text-lg">
        Sadece soru çözmekle kalma; videoları özetle, kariyerini planla,
        verilerini analiz et ve kriz anlarında mental destek al.
      </p>

      <div
        ref={menuRootRef}
        className="relative mt-8 mb-4 inline-block w-full max-w-3xl text-left"
      >
        <button
          type="button"
          disabled={disabled}
          onClick={toggleMenu}
          aria-haspopup="listbox"
          aria-expanded={isMenuOpen}
          aria-label="Onyx yetenek seçici"
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all",
            "hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="text-2xl shrink-0" aria-hidden>
              {selectedSkill?.icon ?? "✨"}
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-bold text-slate-800">
                {selectedSkill?.title ?? "Onyx Asistanı"}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {selectedSkill?.shortDesc ?? "Bir yetenek seçmek için tıklayın"}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-400 transition-transform",
              isMenuOpen && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {isMenuOpen ? (
          <div
            role="listbox"
            aria-label="Yetenekler"
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="max-h-[min(450px,70vh)] overflow-y-auto p-2">
              {skills.map((skill) => {
                const isSelected = selectedSkill?.id === skill.id;
                const isDark = skill.variant === "dark";
                return (
                  <button
                    key={skill.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => pickSkill(skill)}
                    className={cn(
                      "group flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all",
                      isSelected
                        ? "border-slate-200 bg-slate-50"
                        : "border-transparent hover:bg-slate-50",
                      isDark && !isSelected && "hover:bg-slate-100"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl shadow-sm transition-transform group-hover:scale-105",
                        isDark
                          ? "border-slate-600 bg-slate-800"
                          : "border-slate-100 bg-white"
                      )}
                      aria-hidden
                    >
                      {skill.icon}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold text-slate-800">
                        {skill.title}
                      </span>
                      <span className="mb-2 block text-sm font-medium text-slate-500">
                        {skill.shortDesc}
                      </span>

                      <span className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500 md:grid-cols-2">
                        <span>
                          <span className="font-semibold text-slate-700">
                            Nasıl:{" "}
                          </span>
                          {skill.howItWorks}
                        </span>
                        <span>
                          <span className="font-semibold text-slate-700">
                            Sonuç:{" "}
                          </span>
                          {skill.whatItDoes}
                        </span>
                      </span>

                      {skill.extra ? (
                        <span className="mt-2 block text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Ekstra:{" "}
                          </span>
                          {skill.extra}
                        </span>
                      ) : null}
                    </span>

                    {isSelected ? (
                      <Check
                        className="mt-2 h-6 w-6 shrink-0 text-slate-800"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** @deprecated `EmptyStateWelcome` kullanın */
export function OnyxEmptyStateGuide(props: {
  role: OnyxRole;
  className?: string;
  disabled?: boolean;
  onAction: (action: OnyxEmptyStateActionId) => void;
}) {
  return <EmptyStateWelcome {...props} />;
}

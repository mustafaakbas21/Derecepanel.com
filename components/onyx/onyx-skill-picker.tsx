"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Sparkles, X } from "lucide-react";

import {
  filterWelcomeSkills,
  getOnyxWelcomeSkills,
  type OnyxEmptyStateActionId,
} from "@/lib/onyx/empty-state-actions";
import {
  ONYX_MODE_OPTIONS,
  ONYX_MODE_SELECTOR_PLACEHOLDER,
  type OnyxModeOption,
} from "@/lib/onyx/mode-selector";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { cn } from "@/lib/utils";

export const ONYX_SKILL_PICKER_DEFAULT_LABEL = "Onyx Asistanı";

export type OnyxSkillPickerProps = {
  role: OnyxRole;
  disabled?: boolean;
  isLoading?: boolean;
  selectedModeLabel: string;
  onSelectMode: (mode: OnyxModeOption) => void;
  onSelectSkill: (actionId: OnyxEmptyStateActionId) => void;
  className?: string;
};

function normalizeTr(s: string): string {
  return s.toLocaleLowerCase("tr").trim();
}

function stripLeadingEmoji(label: string): string {
  return (
    label
      .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s]+/u, "")
      .trim() || label
  );
}

function filterModeOptions(query: string): OnyxModeOption[] {
  const q = normalizeTr(query);
  if (!q) return ONYX_MODE_OPTIONS;
  return ONYX_MODE_OPTIONS.filter((m) => {
    const hay = normalizeTr(`${m.label} ${m.description}`);
    return hay.includes(q);
  });
}

export function OnyxSkillPicker({
  role,
  disabled = false,
  isLoading = false,
  selectedModeLabel,
  onSelectMode,
  onSelectSkill,
  className,
}: OnyxSkillPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const welcomeSkills = useMemo(() => getOnyxWelcomeSkills(role), [role]);

  const filteredSkills = useMemo(
    () => filterWelcomeSkills(welcomeSkills, searchQuery),
    [welcomeSkills, searchQuery]
  );

  const filteredModes = useMemo(
    () => filterModeOptions(searchQuery),
    [searchQuery]
  );

  const modeActive = selectedModeLabel !== ONYX_MODE_SELECTOR_PLACEHOLDER;
  const triggerLabel = modeActive
    ? stripLeadingEmoji(selectedModeLabel)
    : ONYX_SKILL_PICKER_DEFAULT_LABEL;

  const close = useCallback(() => {
    setOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
      }
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, close]);

  const handleModeSelect = useCallback(
    (mode: OnyxModeOption) => {
      close();
      onSelectMode(mode);
    },
    [close, onSelectMode]
  );

  const handleSkillSelect = useCallback(
    (id: OnyxEmptyStateActionId) => {
      close();
      onSelectSkill(id);
    },
    [close, onSelectSkill]
  );

  const hasResults = filteredSkills.length > 0 || filteredModes.length > 0;

  return (
    <div ref={rootRef} className={cn("onyx-skill-picker relative shrink-0", className)}>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Onyx yetenek seç"
        className={cn(
          "onyx-skill-picker__trigger",
          open && "onyx-skill-picker__trigger--open",
          modeActive && "onyx-skill-picker__trigger--active"
        )}
      >
        <Sparkles className="onyx-skill-picker__trigger-icon" aria-hidden />
        <span className="onyx-skill-picker__trigger-label">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "onyx-skill-picker__trigger-chevron",
            open && "onyx-skill-picker__trigger-chevron--open"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="onyx-skill-picker__panel" role="listbox" aria-label="Onyx yetenekleri">
          <div className="onyx-skill-picker__search-wrap">
            <Search className="onyx-skill-picker__search-icon" size={16} aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Yetenek veya mod ara…"
              aria-label="Yetenek ara"
              className="onyx-skill-picker__search"
              autoFocus
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="onyx-skill-picker__search-clear"
                aria-label="Aramayı temizle"
              >
                <X size={14} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="onyx-skill-picker__scroll">
            {filteredSkills.length > 0 ? (
              <section className="onyx-skill-picker__section">
                <p className="onyx-skill-picker__section-label">Yetenekler</p>
                <ul className="onyx-skill-picker__list">
                  {filteredSkills.map((skill) => (
                    <li key={skill.id}>
                      <button
                        type="button"
                        role="option"
                        onClick={() => handleSkillSelect(skill.id)}
                        className="onyx-skill-picker__option"
                      >
                        <span className="onyx-skill-picker__option-icon" aria-hidden>
                          {skill.icon}
                        </span>
                        <span className="onyx-skill-picker__option-body">
                          <span className="onyx-skill-picker__option-title">
                            {skill.title}
                          </span>
                          <span className="onyx-skill-picker__option-desc">
                            {skill.shortDesc}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {filteredModes.length > 0 ? (
              <section className="onyx-skill-picker__section">
                <p className="onyx-skill-picker__section-label">Modlar</p>
                <ul className="onyx-skill-picker__list">
                  {filteredModes.map((mode) => {
                    const selected = mode.label === selectedModeLabel;
                    return (
                      <li key={mode.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => handleModeSelect(mode)}
                          className={cn(
                            "onyx-skill-picker__option",
                            selected && "onyx-skill-picker__option--selected"
                          )}
                        >
                          <span className="onyx-skill-picker__option-body">
                            <span className="onyx-skill-picker__option-title">
                              {stripLeadingEmoji(mode.label)}
                            </span>
                            <span className="onyx-skill-picker__option-desc">
                              {mode.description}
                            </span>
                          </span>
                          {selected ? (
                            <Check
                              className="onyx-skill-picker__option-check"
                              size={16}
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {searchQuery.trim() && !hasResults ? (
              <p className="onyx-skill-picker__empty">Sonuç bulunamadı.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

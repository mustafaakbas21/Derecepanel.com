"use client";

import { useMemo } from "react";

import { HrField, hrInputClass } from "@/components/hata-recetesi/hr-ui";
import { getConcepts, getSubjects, getTopics } from "@/lib/mufredat";
import { cn } from "@/lib/utils";

type Props = {
  dersName: string;
  konuName: string;
  kavramName: string;
  onDersChange: (name: string) => void;
  onKonuChange: (name: string) => void;
  onKavramChange: (name: string) => void;
  showKavram?: boolean;
  idPrefix?: string;
};

export function MufredatFilters({
  dersName,
  konuName,
  kavramName,
  onDersChange,
  onKonuChange,
  onKavramChange,
  showKavram = true,
  idPrefix = "hr",
}: Props) {
  const subjects = useMemo(() => getSubjects("ALL"), []);
  const dersId = subjects.find((s) => s.name === dersName)?.id ?? "";
  const topics = useMemo(() => (dersId ? getTopics(dersId) : []), [dersId]);
  const konuId = topics.find((t) => t.name === konuName)?.id ?? "";
  const concepts = useMemo(
    () => (dersId && konuId ? getConcepts(dersId, konuId) : []),
    [dersId, konuId]
  );

  return (
    <>
      <HrField label="Ders" htmlFor={`${idPrefix}-ders`}>
        <select
          id={`${idPrefix}-ders`}
          className={hrInputClass}
          value={dersName}
          onChange={(e) => {
            onDersChange(e.target.value);
            onKonuChange("");
            onKavramChange("");
          }}
        >
          <option value="">Tümü</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </HrField>
      <HrField label="Konu" htmlFor={`${idPrefix}-konu`}>
        <select
          id={`${idPrefix}-konu`}
          className={cn(hrInputClass, !dersName && "opacity-60")}
          value={konuName}
          disabled={!dersName}
          onChange={(e) => {
            onKonuChange(e.target.value);
            onKavramChange("");
          }}
        >
          <option value="">Tümü</option>
          {topics.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </HrField>
      {showKavram ? (
        <HrField label="Kavram" htmlFor={`${idPrefix}-kavram`}>
          <select
            id={`${idPrefix}-kavram`}
            className={cn(hrInputClass, !konuName && "opacity-60")}
            value={kavramName}
            disabled={!konuName}
            onChange={(e) => onKavramChange(e.target.value)}
          >
            <option value="">Tümü</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </HrField>
      ) : null}
    </>
  );
}

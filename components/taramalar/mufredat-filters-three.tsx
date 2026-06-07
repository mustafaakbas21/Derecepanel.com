"use client";

import { useMemo } from "react";

import { TrField, trInputClass } from "@/components/taramalar/tr-ui";
import { getConcepts, getSubjects, getTopics } from "@/lib/mufredat";

type Props = {
  dersName: string;
  konuName: string;
  kavramName: string;
  onDersChange: (name: string) => void;
  onKonuChange: (name: string) => void;
  onKavramChange: (name: string) => void;
  idPrefix?: string;
};

export function MufredatFiltersThree({
  dersName,
  konuName,
  kavramName,
  onDersChange,
  onKonuChange,
  onKavramChange,
  idPrefix = "tr",
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
      <TrField label="Ders" htmlFor={`${idPrefix}-ders`}>
        <select
          id={`${idPrefix}-ders`}
          className={trInputClass}
          value={dersName}
          onChange={(e) => {
            onDersChange(e.target.value);
            onKonuChange("");
            onKavramChange("");
          }}
        >
          <option value="">— Hepsi —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </TrField>
      <TrField label="Konu" htmlFor={`${idPrefix}-konu`}>
        <select
          id={`${idPrefix}-konu`}
          className={trInputClass}
          value={konuName}
          disabled={!dersName}
          onChange={(e) => {
            onKonuChange(e.target.value);
            onKavramChange("");
          }}
        >
          <option value="">— Hepsi —</option>
          {topics.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </TrField>
      <TrField label="Kavram" htmlFor={`${idPrefix}-kavram`}>
        <select
          id={`${idPrefix}-kavram`}
          className={trInputClass}
          value={kavramName}
          disabled={!konuName}
          onChange={(e) => onKavramChange(e.target.value)}
        >
          <option value="">— Hepsi —</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </TrField>
    </>
  );
}

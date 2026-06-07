import { getSubjectById, getSubjects, getTopicById, getTopics } from "@/lib/mufredat";
import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { TMConfig } from "@/lib/test-maker/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export function defaultTMConfig(): TMConfig {
  const ders = getSubjects("ALL")[0];
  const konu = ders ? getTopics(ders.id)[0] : undefined;
  let kurum = "Derece Koçluk";
  if (typeof window !== "undefined") {
    kurum = panelGetItem(STORAGE_KEYS.institutionBrief) || kurum;
  }
  return {
    dersId: ders?.id ?? "",
    dersLabel: ders?.name ?? "",
    konuId: konu?.id ?? "",
    konuLabel: konu?.name ?? "",
    kurum,
    coverTitle: "KURUMSAL DENEME SINAVI",
    ogrenciId: "",
  };
}

export function syncTMConfig(config: TMConfig): TMConfig {
  const ders = getSubjectById(config.dersId);
  const konu = getTopicById(config.dersId, config.konuId);
  return {
    ...config,
    dersLabel: ders?.name ?? config.dersLabel,
    konuLabel: konu?.name ?? config.konuLabel,
  };
}

export function cacheKurum(kurum: string) {
  if (typeof window !== "undefined" && kurum) {
    panelSetItem(STORAGE_KEYS.institutionBrief, kurum);
  }
}

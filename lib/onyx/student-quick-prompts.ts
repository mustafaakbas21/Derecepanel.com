import { Camera, MessageCircleQuestion } from "lucide-react";

import type { OnyxQuickPrompt } from "@/lib/onyx/quick-prompts";

/** Öğrenci Onyx — hızlı aksiyonlar */
export const ONYX_STUDENT_QUICK_PROMPTS: OnyxQuickPrompt[] = [
  {
    id: "soru-fotografi",
    label: "Soru Fotoğrafı Yükle",
    promptText: "Soru fotoğrafı yükle",
    icon: Camera,
  },
  {
    id: "soru-metin",
    label: "Yazılı Soru Sor",
    promptText:
      "Aşağıdaki soruyu ÖSYM formatında adım adım çöz ve akademik çözüm şablonunu kullan.",
    icon: MessageCircleQuestion,
  },
];

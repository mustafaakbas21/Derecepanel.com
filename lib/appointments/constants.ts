import type { AppointmentStatus, AppointmentTip } from "@/lib/appointments/types";

export const APPOINTMENTS_KEY = "appointments";
export const LEGACY_APPOINTMENTS_KEY = "derecepanel_randevular_v2";
export const CURRENT_USER_KEY = "currentUser";

export const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
export const DAY_LONG = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export const MONTH_SHORT_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

export const DURATION_OPTIONS = [30, 45, 60, 90] as const;

export const TIP_OPTIONS: { value: AppointmentTip; label: string }[] = [
  { value: "yuz_yuze", label: "Yüz yüze" },
  { value: "online", label: "Online" },
  { value: "telefon", label: "Telefon" },
];

export const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "bekliyor", label: "Bekliyor" },
  { value: "tamamlandi", label: "Tamamlandı" },
  { value: "iptal", label: "İptal" },
];

export const STATUS_FILTER_OPTIONS: { value: import("@/lib/appointments/types").StatusFilterKey; label: string }[] =
  [
    { value: "all", label: "Tümü" },
    { value: "upcoming", label: "Yaklaşanlar" },
    { value: "done", label: "Tamamlananlar" },
    { value: "cancelled", label: "İptal" },
  ];

export const TYPE_FILTER_OPTIONS: { value: import("@/lib/appointments/types").TypeFilterKey; label: string }[] =
  [
    { value: "all", label: "Tümü" },
    { value: "yuz_yuze", label: "Yüz yüze" },
    { value: "online", label: "Online" },
  ];

export const APPOINTMENTS_CHANGE_EVENT = "appointments:change";

export const WA_TEST_NUMBER = "905000000000";

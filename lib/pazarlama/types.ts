import type { MergedExam } from "@/lib/exams/types";

export type StoryKind = "leaderboard" | "star" | "countdown";

export type BrandState = {
  themeId: string;
  bgFrom: string;
  bgTo: string;
  cardBg: string;
  textMain: string;
  textMuted: string;
  accent: string;
  logoDataUrl: string;
};

export type LeaderboardText = {
  title: string;
  badge: string;
  boardTitle: string;
  metric: string;
  footRight: string;
};

export type StarText = {
  badge: string;
  kickerBase: string;
  kickerEmpty: string;
  title: string;
  sub: string;
};

export type CountdownText = {
  badge: string;
  label: string;
  subMsg: string;
  quote: string;
  totalDays: number;
  footLeft: string;
};

export type TextState = {
  leaderboard: LeaderboardText;
  star: StarText;
  countdown: CountdownText;
};

export type CountdownCustomState = {
  targetDate: string;
  headline: string;
  subMsg: string;
  quote: string;
  totalDays: number;
};

export type TemplateStyleMap = Partial<Record<StoryKind, string>>;

export type PazarlamaExam = MergedExam;

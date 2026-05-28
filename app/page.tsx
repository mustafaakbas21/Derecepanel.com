"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Play,
  ArrowRight,
  BarChart3,
  Target,
  Users,
  CheckCircle2,
  Star,
  Hexagon,
  Triangle,
  Pentagon,
  Diamond,
  Octagon,
  LayoutDashboard,
  BookOpen,
  Settings,
  Bell,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Phone,
  Scissors,
  Zap,
  Activity,
  RadioTower,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ─────────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.1 },
  }),
};

/* ─────────────────────────────────────────────────
   Features Showcase — Bento Grid (Rootly-Tier v3)
───────────────────────────────────────────────── */

const BENTO_RADIUS = "2.5rem";
const bentoBorder = "1px solid rgba(215,220,224,0.55)";
const bentoShadow = "0 2px 20px -4px rgba(15,23,42,0.05)";

/* ── Chart Data ────────────────────────────────── */
const netChartData = [
  { ay: "Oca", tyt: 62, ayt: 34 },
  { ay: "Şub", tyt: 65, ayt: 37 },
  { ay: "Mar", tyt: 67, ayt: 40 },
  { ay: "Nis", tyt: 71, ayt: 43 },
  { ay: "May", tyt: 68, ayt: 42 },
  { ay: "Haz", tyt: 74, ayt: 48 },
  { ay: "Tem", tyt: 78, ayt: 53 },
  { ay: "Ağu", tyt: 82, ayt: 57 },
  { ay: "Eyl", tyt: 86, ayt: 62 },
];

const heatmapRows = [
  { s: "Mat", v: [0.28, 0.35, 0.42, 0.50, 0.55, 0.60, 0.65, 0.68, 0.72, 0.78, 0.82, 0.88] },
  { s: "Fiz", v: [0.50, 0.48, 0.55, 0.58, 0.60, 0.65, 0.70, 0.72, 0.76, 0.80, 0.84, 0.86] },
  { s: "Kim", v: [0.72, 0.70, 0.68, 0.74, 0.78, 0.82, 0.80, 0.85, 0.88, 0.90, 0.92, 0.94] },
  { s: "Bio", v: [0.65, 0.70, 0.74, 0.78, 0.82, 0.85, 0.88, 0.90, 0.88, 0.92, 0.94, 0.96] },
  { s: "Trk", v: [0.82, 0.84, 0.86, 0.85, 0.88, 0.90, 0.88, 0.92, 0.90, 0.88, 0.90, 0.93] },
  { s: "Tar", v: [0.45, 0.50, 0.52, 0.55, 0.60, 0.62, 0.65, 0.70, 0.68, 0.72, 0.74, 0.78] },
  { s: "Coğ", v: [0.55, 0.58, 0.62, 0.65, 0.70, 0.72, 0.75, 0.78, 0.80, 0.82, 0.84, 0.86] },
  { s: "Fel", v: [0.76, 0.78, 0.80, 0.82, 0.85, 0.86, 0.88, 0.90, 0.88, 0.92, 0.90, 0.94] },
];

function heatColor(v: number): string {
  if (v > 0.85) return "#c2410c";
  if (v > 0.70) return "#ea580c";
  if (v > 0.55) return "#fdba74";
  if (v > 0.40) return "#fed7aa";
  if (v > 0.25) return "#ffedd5";
  return "#fff7ed";
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="h-1.5 w-4 rounded-full" style={{ background: p.color }} />
          <span className="text-xs font-bold text-slate-700">
            {p.dataKey === "tyt" ? "TYT" : "AYT"}: <span style={{ color: p.color }}>{p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* Card 1 ── Smart Session Room (Top-left, organic shape) */
function Card1SessionRoom() {
  return (
    <motion.div
      className="relative flex flex-col overflow-hidden"
      style={{
        gridColumn: "1",
        gridRow: "1",
        borderRadius: BENTO_RADIUS,
        border: bentoBorder,
        boxShadow: bentoShadow,
        background: "linear-gradient(170deg, #fff8f1 0%, #ffffff 40%, #ffffff 100%)",
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-7 pt-9 pb-5">
        <div className="flex items-center gap-1.5 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: "#ea580c" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#ea580c" }} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#ea580c" }}>Aktif Görüşme</span>
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <svg viewBox="0 0 120 120" className="h-[115px] w-[115px]" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
            <defs>
              <linearGradient id="sessTimerG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#sessTimerG)" strokeWidth="4.5" strokeDasharray="326.7" strokeDashoffset="98" strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[28px] font-black text-slate-800 tabular-nums leading-none tracking-tight">25:00</span>
            <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-[0.12em]">dakika</span>
          </div>
        </div>

        <div className="flex items-center mb-5">
          {[
            { init: "AK", color: "#ea580c" },
            { init: "ZA", color: "#c2410c" },
            { init: "MÖ", color: "#9a3412" },
          ].map(({ init, color }, i) => (
            <div
              key={init}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-extrabold text-white ring-2 ring-white"
              style={{ background: color, marginLeft: i > 0 ? "-5px" : 0, zIndex: 3 - i }}
            >
              {init}
            </div>
          ))}
          <span className="ml-2 text-[10px] text-slate-400 font-medium">3 katılımcı</span>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold text-white"
          style={{
            background: "#ea580c",
            borderRadius: "1.1rem",
            boxShadow: "0 4px 14px rgba(234,88,12,0.25)",
          }}
        >
          <Play className="h-3 w-3 fill-white" />
          Görüşmeyi Başlat
        </button>
      </div>

      <div className="px-7 py-5" style={{ borderTop: "1px solid rgba(226,232,240,0.5)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "#ea580c" }}>Görüşme Odası</p>
        <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight mb-1">Smart Session Room</h3>
        <p className="text-[13px] text-slate-400 leading-relaxed">Zamanlayıcılı koçluk seansları ve katılımcı takibi.</p>
      </div>
    </motion.div>
  );
}

/* Card 2 ── Otonom Soru Kırpıcı (Bottom-left, serif accent) */
function Card2QuestionClipper() {
  return (
    <motion.div
      className="relative flex flex-col overflow-hidden"
      style={{
        gridColumn: "1",
        gridRow: "2",
        borderRadius: BENTO_RADIUS,
        border: bentoBorder,
        boxShadow: bentoShadow,
        background: "linear-gradient(170deg, #fffbf4 0%, #ffffff 40%, #ffffff 100%)",
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-7 pt-8 pb-5">
        <div className="flex items-end justify-center gap-5 mb-6">
          {[
            { label: "TYT", color: "#ea580c" },
            { label: "AYT", color: "#c2410c" },
            { label: "DEN", color: "#9a3412" },
          ].map((doc, idx) => (
            <div key={doc.label} className="relative flex flex-col items-center gap-1.5">
              <div className="relative" style={{ width: 40, height: 52 }}>
                {[2, 1, 0].map((z) => (
                  <div
                    key={z}
                    className="absolute"
                    style={{
                      width: 40 - z * 3,
                      height: 52 - z * 3,
                      top: z * 3,
                      left: z * 1.5,
                      background: z === 0 ? "#fff" : `${doc.color}08`,
                      border: `1.5px solid ${z === 0 ? doc.color + "20" : doc.color + "0a"}`,
                      borderRadius: 10,
                      boxShadow: z === 0 ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      zIndex: 3 - z,
                    }}
                  >
                    {z === 0 && (
                      <div className="pt-2.5 px-2 space-y-1.5">
                        {[80, 55, 72].map((w, li) => (
                          <div key={li} className="h-[2px] rounded-full" style={{ background: doc.color + "18", width: `${w}%` }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: doc.color }}>{doc.label}</span>
              {idx < 2 && (
                <div className="absolute -right-5 top-5 z-10">
                  <Scissors className="h-3.5 w-3.5" style={{ color: "#c2410c" }} strokeWidth={2.5} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{
              background: "rgba(234,88,12,0.05)",
              border: "1.5px solid rgba(234,88,12,0.15)",
              borderRadius: "1rem",
              boxShadow: "0 0 20px rgba(234,88,12,0.06)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#ea580c", boxShadow: "0 0 6px #ea580c" }} />
            <span className="text-[13px] font-bold" style={{ color: "#9a3412" }}>PDF&apos;ten Test Üret</span>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#ea580c" }} />
          </div>
          <div className="flex gap-1.5">
            {["12 Soru", "TYT Karma", "45 dk"].map((tag) => (
              <span key={tag} className="text-[9px] font-semibold text-slate-400 rounded-full px-2.5 py-0.5" style={{ background: "#f8fafc", border: "1px solid rgba(226,232,240,0.7)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-7 py-5" style={{ borderTop: "1px solid rgba(226,232,240,0.5)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "#ea580c" }}>Yapay Zeka</p>
        <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Otonom Soru Kırpıcı
        </h3>
        <p className="text-[13px] text-slate-400 leading-relaxed" style={{ fontFamily: "'Playfair Display', serif" }}>
          Kaynaklardan zayıf konulara göre otomatik test oluştur.
        </p>
      </div>
    </motion.div>
  );
}

/* Card 3 ── Acil Müdahale Matrisi (Hero — Right, spans 2 rows) */
function Card3Triage() {
  return (
    <motion.div
      className="relative flex overflow-visible"
      style={{
        gridColumn: "2 / span 2",
        gridRow: "1 / span 2",
        borderRadius: BENTO_RADIUS,
        border: bentoBorder,
        boxShadow: bentoShadow,
        background: "linear-gradient(170deg, #ffffff 0%, #fafbfc 100%)",
        minHeight: 520,
      }}
      initial={{ opacity: 0, x: 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(153,27,27,0.03) 0%, transparent 65%)" }}
      />

      <div className="flex h-full">
        {/* Left: Content */}
        <div className="flex flex-col justify-between p-10 flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-7">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ background: "rgba(153,27,27,0.05)", border: "1px solid rgba(153,27,27,0.12)", color: "#991b1b" }}
              >
                <RadioTower className="h-3 w-3" />
                Canlı Triage
              </span>
            </div>

            <h3
              className="font-extrabold text-slate-800 tracking-tight leading-[1.06] mb-4"
              style={{ fontSize: "clamp(26px, 2.6vw, 36px)" }}
            >
              Acil Müdahale<br />
              <span style={{ color: "#991b1b" }}>Matrisi</span>
              {" "}
              <span className="text-slate-300 font-bold">(Triage)</span>
            </h3>

            <p className="text-slate-400 text-[14px] leading-relaxed mb-7 max-w-[300px]">
              Son 2 denemede neti %15 düşen veya risk grubunda olan öğrencileri anında tespit edin, otonom hata reçeteleriyle krizleri yönetin.
            </p>

            <div className="space-y-2">
              {[
                { label: "Kritik", desc: "Matematik neti düştü", count: 2, color: "#991b1b", bg: "rgba(153,27,27,0.03)", border: "rgba(153,27,27,0.08)" },
                { label: "Dikkat", desc: "Türkçe stabil değil", count: 4, color: "#92400e", bg: "rgba(146,64,14,0.03)", border: "rgba(146,64,14,0.08)" },
                { label: "Normal", desc: "Hedef yolunda", count: 18, color: "#065f46", bg: "rgba(6,95,70,0.03)", border: "rgba(6,95,70,0.08)" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "1.1rem" }}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.label}</span>
                    <span className="text-[12px] text-slate-400 ml-2">{s.desc}</span>
                  </div>
                  <span
                    className="text-[10px] font-extrabold rounded-full h-5 w-5 flex items-center justify-center text-white shrink-0"
                    style={{ background: s.color }}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-white"
              style={{ background: "#991b1b", borderRadius: "1.1rem", boxShadow: "0 4px 14px rgba(153,27,27,0.2)" }}
            >
              <Zap className="h-3.5 w-3.5" />
              Müdahale Et
            </button>
            <button className="text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
              Matrisi Görüntüle →
            </button>
          </div>
        </div>

        {/* Right: Dark Mobile Mockup — tilted, overlapping edge */}
        <div
          className="relative shrink-0 flex items-center justify-center overflow-visible"
          style={{ width: 228 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            whileInView={{ opacity: 1, y: -10, rotate: 7 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 1.0, type: "spring", stiffness: 55 }}
            className="relative z-10"
            style={{
              width: 198,
              borderRadius: "2.5rem",
              background: "linear-gradient(180deg, #0a0f1e 0%, #111827 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "-20px 8px 60px rgba(0,0,0,0.3), 0 0 40px rgba(153,27,27,0.06)",
              overflow: "hidden",
              marginRight: -32,
            }}
          >
            <div className="flex justify-center pt-3 pb-1.5">
              <div className="h-[3px] w-14 rounded-full bg-white/[0.06]" />
            </div>

            <div className="px-4 pb-5 space-y-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">DerecePanel</span>
                <Activity className="h-3 w-3 text-red-500/60" />
              </div>

              <div
                className="p-3"
                style={{
                  borderRadius: "1.2rem",
                  background: "linear-gradient(145deg, rgba(153,27,27,0.16), rgba(153,27,27,0.05))",
                  border: "1px solid rgba(153,27,27,0.2)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest">Kırmızı Alarm</span>
                </div>
                <p className="text-[12px] font-bold text-white leading-snug mb-3">
                  Matematik neti düşüşte
                </p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { l: "Önceki Net", v: "26.5", c: "#94a3b8" },
                    { l: "Son Net",    v: "17.0", c: "#ef4444" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <p className="text-[7px] text-white/20 mb-0.5">{s.l}</p>
                      <p className="text-[14px] font-extrabold leading-none" style={{ color: s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full rounded-xl py-1.5 text-[10px] font-bold text-white" style={{ background: "#991b1b" }}>
                  Hemen Müdahale Et
                </button>
              </div>

              {/* Student shortcuts */}
              {[
                { init: "AK", name: "Ahmet Kaya",  delta: "−9.5 net", c: "#ef4444" },
                { init: "MÖ", name: "Mert Öztürk", delta: "−4.0 net", c: "#f97316" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-2"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                    style={{ background: s.c + "38", border: `1px solid ${s.c}50` }}
                  >
                    {s.init}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-white/65 truncate">{s.name}</p>
                  </div>
                  <span className="text-[9px] font-bold shrink-0" style={{ color: s.c }}>{s.delta}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* Card 4 ── Bireysel Net Analizi + Heatmap (Wide bottom card) */
function Card4Analytics() {
  return (
    <motion.div
      className="relative overflow-hidden"
      style={{
        gridColumn: "1 / -1",
        gridRow: "3",
        borderRadius: BENTO_RADIUS,
        border: bentoBorder,
        boxShadow: bentoShadow,
        background: "linear-gradient(170deg, #ffffff 0%, #fafbfc 100%)",
      }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* ── Left: Area Chart ──────────────── */}
        <div className="flex-1 p-10 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "#ea580c" }}>Gelişim Trendi</p>
          <h3 className="text-[20px] font-extrabold text-slate-800 tracking-tight leading-tight mb-1.5">
            Bireysel Net Analizi ve Gelişim Heatmap&apos;i
          </h3>
          <p className="text-[13px] text-slate-400 leading-relaxed mb-6 max-w-[300px]">
            Haftalık net değişimini izleyin ve kırılma noktalarını tespit edin.
          </p>

          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-5 rounded-full" style={{ background: "#ea580c" }} />
              <span className="text-[11px] font-semibold text-slate-500">TYT Net</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-[3px] w-5 rounded-full" style={{ background: "#475569" }} />
              <span className="text-[11px] font-semibold text-slate-500">AYT Net</span>
            </div>
          </div>

          {/* Recharts AreaChart */}
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netChartData} margin={{ top: 5, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="tytFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ea580c" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="aytFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#475569" stopOpacity={0.10} />
                    <stop offset="100%" stopColor="#475569" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 5" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="ay"
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  domain={[20, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="tyt"
                  stroke="#ea580c" strokeWidth={2.5}
                  fill="url(#tytFill)" dot={false}
                  activeDot={{ r: 4, fill: "#ea580c", stroke: "#fff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone" dataKey="ayt"
                  stroke="#475569" strokeWidth={2}
                  fill="url(#aytFill)" dot={false}
                  activeDot={{ r: 4, fill: "#475569", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hidden lg:block w-px self-stretch my-8" style={{ background: "rgba(226,232,240,0.5)" }} />

        {/* ── Right: Heatmap ──────────────── */}
        <div className="lg:w-[460px] p-10 pb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "#c2410c" }}>Konu Başarısı</p>
              <p className="text-[14px] font-semibold text-slate-700">Gelişim Heatmap&apos;i · Son 12 Hafta</p>
            </div>
            <div className="flex items-center gap-1">
              {["#fff7ed", "#fed7aa", "#fdba74", "#ea580c", "#c2410c"].map((c) => (
                <div key={c} className="h-3 w-4 rounded-[3px]" style={{ background: c }} />
              ))}
              <span className="ml-1.5 text-[8px] font-semibold text-slate-300 whitespace-nowrap">Az → Çok</span>
            </div>
          </div>

          {/* Week header */}
          <div className="flex items-center ml-8 mb-2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[8px] font-semibold text-slate-300">H{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          <div className="space-y-[5px]">
            {heatmapRows.map(({ s, v }) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 w-7 shrink-0 text-right">{s}</span>
                <div className="flex flex-1 gap-[4px]">
                  {v.map((val, wi) => (
                    <div
                      key={wi}
                      className="flex-1 rounded-[4px] transition-transform hover:scale-110 cursor-default"
                      style={{ height: 22, background: heatColor(val) }}
                      title={`${s} H${wi + 1}: %${Math.round(val * 100)}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary stat chips */}
          <div className="mt-6 flex gap-3">
            {[
              { label: "En İyi", value: "Kimya", sub: "94% başarı",  color: "#ea580c" },
              { label: "Gelişen", value: "Matematik", sub: "+60 puan", color: "#c2410c" },
              { label: "Dikkat",  value: "Tarih",  sub: "78% hedef",  color: "#9a3412" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl px-3 py-2.5"
                style={{ background: stat.color + "08", border: `1px solid ${stat.color}18` }}
              >
                <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: stat.color }}>{stat.label}</p>
                <p className="text-[13px] font-extrabold text-slate-800 leading-none">{stat.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturesShowcase() {
  return (
    <section
      className="relative z-10"
      style={{ background: "#F4F7F6", paddingTop: 24, paddingBottom: 96 }}
    >
      {/* Connector wire + badge */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-px" style={{ height: 100, background: "linear-gradient(to bottom, transparent 0%, #fed7aa 40%, #ea580c 100%)" }} />
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex rounded-full animate-ping" style={{ background: "rgba(234,88,12,0.15)", width: 66, height: 66 }} />
          <div className="absolute rounded-full" style={{ width: 56, height: 56, background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.15)" }} />
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-full z-10"
            style={{ background: "#ea580c", boxShadow: "0 6px 24px rgba(234,88,12,0.35)" }}
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Section heading */}
      <div className="text-center px-6 mt-9 mb-14">
        <h2
          className="font-extrabold text-slate-800 tracking-tight mb-4"
          style={{ fontSize: "clamp(26px, 4vw, 48px)", letterSpacing: "-0.025em", lineHeight: 1.08 }}
        >
          Operasyonel Yükü Sıfırlayan<br />Ekosistem.
        </h2>
        <p className="text-slate-400 text-[17px] max-w-lg mx-auto leading-relaxed">
          Kurumunuzun tüm akademik süreçlerini tek çatı altında otonomlaştırın.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="mx-auto px-6" style={{ maxWidth: 1180 }}>
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1.15fr)",
            gridTemplateRows: "auto auto auto",
          }}
        >
          <Card1SessionRoom />
          <Card2QuestionClipper />
          <Card3Triage />
          <Card4Analytics />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   Social Proof — Logo şeridi
───────────────────────────────────────────────── */
function SocialProof() {
  const logos = [
    { Icon: Hexagon,  name: "Fen Akademi"    },
    { Icon: Triangle, name: "Koç Atölyesi"   },
    { Icon: Pentagon, name: "TYT Merkezi"    },
    { Icon: Diamond,  name: "Net Artı"       },
    { Icon: Octagon,  name: "Hedef Eğitim"   },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mt-14 mb-0"
    >
      <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400/70 mb-6">
        Türkiye'nin önde gelen eğitim kurumlarının tercihi
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {logos.map(({ Icon, name }) => (
          <div
            key={name}
            className="flex items-center gap-2 opacity-40 hover:opacity-65 transition-opacity cursor-default"
          >
            <Icon className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-slate-500 tracking-tight">{name}</span>
          </div>
        ))}
      </div>

      {/* İnce ayırıcı çizgi */}
      <div className="mt-12 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   Product Showcase — Web + Mobile Overlapping
───────────────────────────────────────────────── */
function ProductShowcase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.15, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16"
      /* sağdaki mobil mockup taşacak → overflow visible */
      style={{ maxWidth: 940, paddingBottom: 72, paddingRight: 16 }}
    >
      {/* ── Arkadaki derin glow ── */}
      <div
        className="pointer-events-none absolute inset-x-24 -bottom-8 h-52 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(99,102,241,0.28) 0%, rgba(249,115,22,0.12) 50%, transparent 75%)",
          filter: "blur(32px)",
        }}
      />

      {/* ══════ ANA WEB MOCKUP ══════ */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow:
            "0 0 0 1px rgba(249,115,22,0.06), 0 40px 100px rgba(249,115,22,0.18), 0 16px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          background: "#ffffff",
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}
        >
          <div className="flex gap-1.5">
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div
            className="mx-auto flex items-center gap-1.5 rounded-md px-4 py-1 text-[11px] text-slate-400"
            style={{ background: "#edf2f7", border: "1px solid #e2e8f0" }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            derecepanel.com/dashboard
          </div>
          <Bell className="h-3.5 w-3.5 text-slate-300" />
        </div>

        {/* App içeriği */}
        <div className="flex" style={{ minHeight: 420 }}>

          {/* ── Sidebar ── */}
          <div
            className="flex flex-col gap-0.5 shrink-0 py-4 px-3"
            style={{ width: 196, borderRight: "1px solid #f1f5f9", background: "#fafbfc" }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 pb-4 mb-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}>
                <GraduationCap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[12px] font-bold text-slate-700">DerecePanel</span>
            </div>

            {/* Nav items */}
            {[
              { Icon: LayoutDashboard, label: "Panel", active: true },
              { Icon: Users,           label: "Öğrenciler", active: false },
              { Icon: BarChart3,       label: "Analizler", active: false },
              { Icon: Target,          label: "Hedefler", active: false },
              { Icon: BookOpen,        label: "Takvim", active: false },
              { Icon: Settings,        label: "Ayarlar", active: false },
            ].map(({ Icon, label, active }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors"
                style={{
                  background: active ? "rgba(249,115,22,0.1)" : "transparent",
                  color: active ? "#f97316" : "#94a3b8",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[12px] font-semibold">{label}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />}
              </div>
            ))}
          </div>

          {/* ── Ana içerik ── */}
          <div className="flex-1 p-5 space-y-4 overflow-hidden">
            {/* Üst bar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Mayıs 2026</p>
                <p className="text-[15px] font-extrabold text-slate-800">Koç Paneli</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold"
                  style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#f97316" }} />
                  Tüm Sistemler Normal
                </div>
              </div>
            </div>

            {/* Stat kartları */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { l: "Toplam Öğrenci", v: "24", d: "+2", color: "#f97316", bg: "#fff7ed" },
                { l: "TYT Ort. Net",   v: "78.4", d: "+4.1", color: "#f97316", bg: "#fff7ed" },
                { l: "AYT Ort. Net",   v: "54.2", d: "+2.8", color: "#c2410c", bg: "#fff8f1" },
                { l: "Hedef Başarı",   v: "%94",  d: "Bu yıl", color: "#ea580c", bg: "#fff7ed" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl p-3"
                  style={{ background: s.bg, border: `1px solid ${s.color}20` }}
                >
                  <p className="text-[9px] text-slate-500 mb-2 leading-tight">{s.l}</p>
                  <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.v}</p>
                  <p className="text-[9px] mt-1 font-semibold" style={{ color: s.color }}>{s.d}</p>
                </div>
              ))}
            </div>

            {/* Chart + tablo grid */}
            <div className="grid grid-cols-5 gap-3">
              {/* Chart alanı */}
              <div
                className="col-span-3 rounded-xl p-4"
                style={{ border: "1px solid #f1f5f9", background: "#fafbfc" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-slate-600">Net Trendi</p>
                  <div className="flex gap-1">
                    {["1H", "1A", "3A"].map((t, i) => (
                      <span key={t} className="text-[9px] font-semibold rounded px-1.5 py-0.5 cursor-pointer"
                        style={{ background: i === 1 ? "#f97316" : "#f1f5f9", color: i === 1 ? "#fff" : "#94a3b8" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-1.5 h-20">
                  {[42, 51, 48, 60, 65, 72, 78, 85, 80, 88].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${(h / 100) * 100}%`,
                          background:
                            i === 9
                              ? "linear-gradient(to top, #f97316, #fdba74)"
                              : i >= 7
                              ? "rgba(249,115,22,0.35)"
                              : "rgba(249,115,22,0.12)",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* X axis */}
                <div className="flex items-center justify-between mt-2">
                  {["Şub","Mar","Nis","May"].map((m) => (
                    <span key={m} className="text-[8px] text-slate-300 font-medium">{m}</span>
                  ))}
                </div>
              </div>

              {/* Mini öğrenci listesi */}
              <div
                className="col-span-2 rounded-xl p-3 space-y-0.5"
                style={{ border: "1px solid #f1f5f9", background: "#fafbfc" }}
              >
                <p className="text-[10px] font-bold text-slate-500 mb-3">Son Aktivite</p>
                {[
                  { init: "AK", name: "Ahmet Kaya",   action: "Deneme girdi",    t: "2d önce", c: "#f97316" },
                  { init: "ZA", name: "Zeynep Arslan", action: "Görüşme yapıldı", t: "4s önce", c: "#f97316" },
                  { init: "MÖ", name: "Mert Öztürk",   action: "Hedef güncellendi",t:"1g önce", c: "#ea580c" },
                  { init: "EY", name: "Elif Yıldız",   action: "Rapor alındı",    t: "3g önce", c: "#c2410c" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white transition-colors cursor-pointer">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-extrabold text-white shrink-0"
                      style={{ background: s.c }}
                    >
                      {s.init}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-slate-700 truncate">{s.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{s.action}</p>
                    </div>
                    <span className="text-[8px] text-slate-300 shrink-0">{s.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ MOBİL MOCKUP — Karanlık, sağ alta taşan ══════ */}
      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.55, duration: 0.8, type: "spring", stiffness: 80 }}
        className="absolute"
        style={{
          width: 188,
          right: -20,
          bottom: -8,
          zIndex: 20,
          borderRadius: "2.5rem",
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.3), 0 32px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3), -8px 0 32px rgba(249,115,22,0.08)",
          overflow: "hidden",
          padding: "0",
        }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-16 rounded-full bg-white/10" />
        </div>

        {/* İçerik padding */}
        <div className="px-4 pb-6 pt-2 space-y-4">
          {/* Status header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">DerecePanel</span>
            <div className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#f97316", boxShadow: "0 0 6px #f97316" }}
              />
              <span className="text-[9px] font-semibold" style={{ color: "#fb923c" }}>Canlı</span>
            </div>
          </div>

          {/* Ana bildirim kartı */}
          <div
            className="rounded-2xl p-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.1))",
              border: "1px solid rgba(249,115,22,0.25)",
            }}
          >
            <div className="flex items-start gap-2.5 mb-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
              >
                AK
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight">Ali</p>
                <p className="text-[10px] text-orange-300/80 mt-0.5">Görüşme Başladı</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-3">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: "#f97316", boxShadow: "0 0 5px #f97316" }}
              />
              <span className="text-[9px] font-semibold" style={{ color: "#fb923c" }}>Az önce başladı · Canlı</span>
            </div>
            <button
              className="w-full rounded-xl py-2 text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              Görüşmeye Katıl
            </button>
          </div>

          {/* Mini istatistikler */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "TYT Net", v: "87.5", c: "#fb923c" },
              { l: "AYT Net", v: "64.0", c: "#fb923c" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl p-2.5 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[9px] text-white/30 mb-1">{s.l}</p>
                <p className="text-sm font-extrabold" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Alt quick actions */}
          <div className="space-y-1.5">
            {[
              { Icon: MessageSquare, label: "Mesaj Gönder" },
              { Icon: Phone,         label: "Ara" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Icon className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[11px] text-white/40 font-medium">{label}</span>
                <ChevronRight className="h-3 w-3 text-white/20 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Alt fade maskesi */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-48 h-24 rounded-b-3xl"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(244,247,246,0.95))" }}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   Rootly-style Nav
───────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Ürün", href: "#özellikler", dropdown: true },
  { label: "Kaynaklar", href: "#", dropdown: true },
  { label: "Fiyatlandırma", href: "#fiyatlandırma", dropdown: false },
  { label: "Müşteriler", href: "#", dropdown: true },
] as const;

function DereceLogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="6" r="2.2" fill="#F97316" />
      <circle cx="20.5" cy="9" r="2" fill="#FB923C" />
      <circle cx="22.5" cy="14" r="2.2" fill="#F97316" />
      <circle cx="20" cy="19.5" r="2" fill="#EA580C" />
      <circle cx="14" cy="22" r="2.2" fill="#F97316" />
      <circle cx="8" cy="19.5" r="2" fill="#FB923C" />
      <circle cx="5.5" cy="14" r="2.2" fill="#F97316" />
      <circle cx="7.5" cy="9" r="2" fill="#EA580C" />
      <circle cx="14" cy="14" r="2.8" fill="#F97316" />
    </svg>
  );
}

function RootlyNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      {/* Tam genişlik: logo sol kenar, nav viewport ortası, CTA sağ kenar */}
      <div className="relative flex h-[80px] w-full items-center px-5 sm:px-8 lg:px-10 xl:px-14">
        {/* Sol — logo */}
        <div className="flex flex-1 items-center justify-start min-w-0 z-10">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <DereceLogoMark />
            <span className="text-[17px] font-bold text-slate-900 tracking-[-0.02em] lowercase">
              derecepanel
            </span>
          </Link>
        </div>

        {/* Orta — sayfanın tam ortasında (viewport merkezi) */}
        <nav
          className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-3 py-2 z-20"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 2px 20px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03)",
          }}
        >
          {NAV_LINKS.map(({ label, href, dropdown }) => (
            <a
              key={label}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {label}
              {dropdown && <ChevronDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.5} />}
            </a>
          ))}
        </nav>

        {/* Sağ — CTA grubu */}
        <div className="flex flex-1 items-center justify-end min-w-0 gap-3 sm:gap-4 z-10">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 transition-colors"
          >
            Giriş
          </Link>
          <Link
            href="/dashboard"
            className="hidden md:inline-flex items-center rounded-full px-5 py-2.5 text-[13px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/90 transition-colors"
          >
            Ücretsiz Deneme
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full px-6 py-3 text-[13px] font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm whitespace-nowrap"
          >
            Demo Talep Et
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────
   SAYFA
───────────────────────────────────────────────── */
export default function LandingPage() {

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#F4F7F6]">

      {/* Hafif, sıcak off-white arka plan — yapay gradient yok */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F4F7F6]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.9) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(241,245,249,0.6) 0%, transparent 50%)",
          }}
        />
      </div>

      <RootlyNav />

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative z-10 pt-32 pb-12 px-6 sm:pt-36 sm:pb-16">
        <div className="mx-auto max-w-4xl text-center">

          {/* Ana başlık — ferah satır aralığı */}
          <div
            className="font-extrabold text-slate-900 tracking-tight mb-12 space-y-5 sm:space-y-6"
            style={{
              fontSize: "clamp(36px, 5.5vw, 72px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.18,
            }}
          >
            <motion.div
              className="flex flex-wrap items-center justify-center gap-x-3"
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={fadeUp} custom={0}>
                Eğitim koçluğunda
              </motion.span>
              <motion.span variants={fadeUp} custom={1}>
                otonom
              </motion.span>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-x-3"
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={fadeUp} custom={2}>
                ve veriye dayalı koçluk
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-orange-600">dönemi başlıyor.</span>
            </motion.div>
          </div>

          {/* Alt açıklama */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-[1.75] mb-12"
          >
            YKS öğrencilerinin deneme analizini, konu eksiklerini ve hedef puana
            mesafeyi tek panelden yönetin. Koçluk artık sezgiden değil, veriden besleniyor.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-[15px] font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-sm transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              Platformu İncele
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
            >
              Kurumsal Demo
            </Link>
          </motion.div>

          {/* İstatistikler */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-16 sm:mt-20"
          >
            {[
              { v: "2.400+", l: "Aktif Öğrenci" },
              { v: "240+", l: "Koç & Danışman" },
              { v: "%94", l: "Hedef Başarısı" },
            ].map((s, i) => (
              <div key={s.l} className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-900">{s.v}</p>
                  <p className="text-[11px] text-slate-400">{s.l}</p>
                </div>
                {i < 2 && <div className="h-5 w-px bg-slate-200" />}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Sosyal kanıt */}
        <SocialProof />

        {/* Web + Mobil çakışan mockup */}
        <ProductShowcase />
      </section>

      {/* ══════════════ FEATURES SHOWCASE — Bento Grid ══════════════ */}
      <FeaturesShowcase />

      {/* ══════════════ ÖZELLIK 1 — beyaz bg ══════════════ */}
      <section id="özellikler" className="relative z-10 py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">Deneme Analizi</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.07] mb-5">
              Neti giriyorsun,<br />geri kalanını<br />panel hallediyor.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              TYT ve AYT denemelerini konu konu kaydet. Sistem otomatik olarak hata haritasını,
              haftalık trendi ve karşılaştırmalı grafikleri üretir.
            </p>
            <div className="space-y-2.5 mb-8">
              {["Konu bazlı hata dağılımı", "Haftalık ve aylık trend grafikleri", "Otomatik zayıf konu tespiti", "Öğrenci bazlı detay arşivi"].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-slate-700 text-sm">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:gap-3 transition-all">
              Analiz panelini gör <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-slate-400 mb-1">TYT Matematik · Son Deneme</p>
                <p className="text-2xl font-extrabold text-slate-900">26.5 <span className="text-sm font-semibold text-orange-600 ml-1">+3.2 ↑</span></p>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-1.5">Mayıs 2026</span>
            </div>
            <div className="flex items-end gap-2 h-24 mb-5 bg-white rounded-xl p-3 border border-slate-100">
              {[14, 17, 19, 21, 20, 23, 27].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${(h / 30) * 100}%`, background: i === 6 ? "#f97316" : "#ffedd5" }} />
                  <span className="text-[9px] text-slate-300">D{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Konu Hata Dağılımı</p>
            {[{ k: "Türev & İntegral", h: 8 }, { k: "Sayılar", h: 4 }, { k: "Trigonometri", h: 6 }].map((item) => (
              <div key={item.k} className="flex items-center gap-3 mb-2.5">
                <span className="text-xs text-slate-500 w-36 shrink-0">{item.k}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${(item.h / 10) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 w-12 text-right">{item.h} hata</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════ ÖZELLIK 2 — gri bg ══════════════ */}
      <section className="relative z-10 py-28 bg-slate-50 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Öğrenci Listesi</p>
            {[
              { ad: "Ahmet Kaya", hedef: "Boğaziçi / BM", net: 87.5, durum: "iyi", init: "AK" },
              { ad: "Zeynep Arslan", hedef: "ODTÜ / End.", net: 74.0, durum: "orta", init: "ZA" },
              { ad: "Mert Öztürk", hedef: "İTÜ / Mak.", net: 61.5, durum: "dikkat", init: "MÖ" },
              { ad: "Elif Yıldız", hedef: "Hacettepe / Tıp", net: 92.0, durum: "iyi", init: "EY" },
              { ad: "Can Şahin", hedef: "Bilkent / İİBF", net: 55.0, durum: "dikkat", init: "CŞ" },
            ].map((o) => {
              const c = o.durum === "iyi"
                ? { bg: "#f0fdf4", text: "#15803d", label: "Yolunda" }
                : o.durum === "orta"
                ? { bg: "#fefce8", text: "#854d0e", label: "Takipte" }
                : { bg: "#fef2f2", text: "#b91c1c", label: "Dikkat" };
              return (
                <div key={o.ad} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}>
                    {o.init}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{o.ad}</p>
                    <p className="text-[11px] text-slate-400 truncate">{o.hedef}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{o.net}</span>
                  <span className="text-[10px] font-semibold rounded-md px-2 py-0.5 shrink-0" style={{ background: c.bg, color: c.text }}>{c.label}</span>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-4 block">Öğrenci Yönetimi</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.07] mb-5">
              24 öğrenciyi<br />aklında taşıma.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Her öğrencinin durumu tek bakışta. Kim yolunda, kim dikkat gerektiriyor —
              bilgi sende, zaman sende.
            </p>
            <div className="space-y-2.5 mb-8">
              {["Anlık durum etiketleri", "Görüşme notları ve hatırlatıcılar", "Hedef bölüm ve puan profili", "Geçmiş deneme arşivi"].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-slate-700 text-sm">{f}</span>
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="group inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:gap-3 transition-all">
              Öğrenci panelini gör <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ REFERANSLAR ══════════════ */}
      <section className="relative z-10 py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Referanslar</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Koçlar ne diyor?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { init: "KD", name: "Kaan Demir", role: "Fizik & Matematik Koçu · Ankara", text: "Öğrencimin fizik konularında nerede takıldığını artık sayıyla gösterebiliyorum. Tahmin etmiyorum, biliyorum." },
              { init: "MA", name: "Merve Aydın", role: "YKS Matematik Koçu · İstanbul", text: "Veliler 'başka koçlarda böyle rapor görmemiştik' diyor. Panel bana ciddi bir profesyonellik katıyor." },
              { init: "SÇ", name: "Selin Çelik", role: "TYT Türkçe Koçu · İzmir", text: "Öğrencimle birlikte panele baktığımızda 'işte burada takılıyoruz' diyebiliyorum. Bu netlik çok değerli." },
            ].map((r) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}>
                    {r.init}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ SON CTA ══════════════ */}
      <section className="relative z-10 border-t border-slate-200/70 bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-center mb-8">
              <DereceLogoMark />
            </div>
            <h2
              className="font-extrabold text-slate-900 tracking-tight mb-5"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.15 }}
            >
              Koçluğunu ölçmeye<br />başlamaya hazır mısın?
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10 max-w-md mx-auto">
              Kayıt gerekmez. Paneli açtık, içine gir.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 transition-colors"
            >
              Panele Giriş Yap
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-[#F4F7F6] py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <DereceLogoMark />
            <span className="text-sm font-bold text-slate-900 lowercase tracking-tight">derecepanel</span>
          </Link>
          <p className="text-xs text-slate-400 text-center order-3 sm:order-none">
            © 2026 DerecePanel — YKS Koçluk Platformu
          </p>
          <div className="flex gap-6 text-xs font-medium text-slate-500">
            {["Gizlilik", "Şartlar", "İletişim"].map((l) => (
              <a key={l} href="#" className="hover:text-slate-800 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

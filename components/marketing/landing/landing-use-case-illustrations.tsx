/** Premium hand-drawn style SVG illustrations for use-case blocks */

import type { ReactNode } from "react";

const SKETCH = {
  ink: "#1e293b",
  inkLight: "#64748b",
  orange: "#f97316",
  orangeSoft: "#ffedd5",
  blue: "#3b82f6",
  blueSoft: "#dbeafe",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  amber: "#f59e0b",
  paper: "#fafafa",
};

function IllustrationFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-1 rounded-[1.75rem] bg-gradient-to-br from-orange-100/40 via-white to-blue-100/30 blur-sm" />
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-50/90 via-white to-orange-50/20 p-4 ring-1 ring-slate-200/60 sm:p-5">
        {/* sketch paper texture dots */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]"
          aria-hidden
        >
          {Array.from({ length: 18 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 47) % 100 + "%"}
              cy={(i * 31) % 100 + "%"}
              r="0.6"
              fill="#cbd5e1"
            />
          ))}
        </svg>
        {children}
      </div>
    </div>
  );
}

function CoachIllustration() {
  return (
    <IllustrationFrame>
      <svg viewBox="0 0 360 260" className="relative z-10 h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="coach-desk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="100%" stopColor="#ffedd5" />
          </linearGradient>
          <linearGradient id="coach-screen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* floating dashboard card — sketchy */}
        <g transform="translate(188, 18) rotate(2)">
          <rect x="0" y="0" width="148" height="108" rx="14" fill="white" stroke={SKETCH.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <path d="M12 28 H136" stroke={SKETCH.inkLight} strokeWidth="1" strokeDasharray="3 4" />
          <text x="14" y="20" fill={SKETCH.inkLight} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="600">Net trend</text>
          <path
            d="M18 88 Q38 72 58 78 T98 52 T128 42"
            fill="none"
            stroke={SKETCH.orange}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="128" cy="42" r="3.5" fill={SKETCH.orange} />
          <rect x="18" y="94" width="28" height="6" rx="3" fill={SKETCH.emeraldSoft} stroke={SKETCH.emerald} strokeWidth="0.8" />
          <rect x="52" y="94" width="28" height="6" rx="3" fill={SKETCH.blueSoft} stroke={SKETCH.blue} strokeWidth="0.8" />
        </g>

        {/* desk */}
        <path
          d="M24 198 Q48 188 90 192 Q140 196 180 190 Q240 182 290 188 Q320 192 336 198 L336 210 Q300 206 180 208 Q60 210 24 214 Z"
          fill="url(#coach-desk)"
          stroke={SKETCH.ink}
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* laptop */}
        <g transform="translate(108, 148)">
          <path d="M8 42 Q60 36 112 42 L118 8 Q60 2 2 8 Z" fill="url(#coach-screen)" stroke={SKETCH.ink} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M0 42 H120 Q60 50 0 42" fill="#e2e8f0" stroke={SKETCH.ink} strokeWidth="1.2" />
          <path d="M20 22 Q40 18 60 22 T100 20" fill="none" stroke={SKETCH.orange} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="92" cy="16" r="5" fill={SKETCH.orangeSoft} stroke={SKETCH.orange} strokeWidth="1" />
          <path d="M90 16 L92 14 L94 16 L92 18 Z" fill={SKETCH.orange} />
        </g>

        {/* coach figure — hand-drawn */}
        <g transform="translate(200, 92)">
          {/* hair */}
          <path
            d="M20 8 Q34 -4 52 6 Q64 14 58 28 Q54 38 42 36 Q28 34 22 24 Q16 14 20 8"
            fill="#fde68a"
            stroke={SKETCH.ink}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* face */}
          <ellipse cx="40" cy="38" rx="22" ry="24" fill="#fde68a" stroke={SKETCH.ink} strokeWidth="1.4" />
          <path d="M32 36 Q40 42 48 36" fill="none" stroke={SKETCH.ink} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="33" cy="32" r="1.8" fill={SKETCH.ink} />
          <circle cx="47" cy="32" r="1.8" fill={SKETCH.ink} />
          {/* body */}
          <path
            d="M18 62 Q40 58 62 62 L68 108 Q40 114 12 108 Z"
            fill="#0f172a"
            stroke={SKETCH.ink}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* arm */}
          <path d="M62 72 Q88 68 96 88 Q82 92 68 86" fill="#fde68a" stroke={SKETCH.ink} strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* coffee cup doodle */}
        <g transform="translate(72, 168)">
          <path d="M0 16 Q8 4 16 16 L16 28 Q8 32 0 28 Z" fill="white" stroke={SKETCH.ink} strokeWidth="1.2" />
          <path d="M16 20 Q24 18 24 24 Q24 28 16 26" fill="none" stroke={SKETCH.ink} strokeWidth="1" />
          <path d="M6 8 Q8 2 10 8" fill="none" stroke={SKETCH.inkLight} strokeWidth="0.8" strokeLinecap="round" />
        </g>

        {/* Onyx sparkle badge */}
        <g transform="translate(28, 36)">
          <rect x="0" y="0" width="72" height="28" rx="14" fill={SKETCH.ink} />
          <text x="12" y="18" fill="white" fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="700">Onyx AI</text>
          <path d="M58 10 L60 6 L62 10 L60 14 Z" fill={SKETCH.orange} />
        </g>

        {/* sketch squiggles */}
        <path d="M300 220 Q310 210 318 222" fill="none" stroke={SKETCH.inkLight} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <path d="M48 48 Q52 42 56 48" fill="none" stroke={SKETCH.orange} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    </IllustrationFrame>
  );
}

function InstitutionIllustration() {
  return (
    <IllustrationFrame>
      <svg viewBox="0 0 360 260" className="relative z-10 h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id="inst-chart" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
        </defs>

        {/* building sketch */}
        <g transform="translate(24, 48)">
          <path
            d="M0 140 L0 40 Q60 20 120 40 L120 140 Z"
            fill="#f8fafc"
            stroke={SKETCH.ink}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M60 16 L72 8 L84 16" fill="none" stroke={SKETCH.ink} strokeWidth="1.2" strokeLinejoin="round" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={22 + col * 28}
                y={52 + row * 28}
                width="18"
                height="18"
                rx="2"
                fill="white"
                stroke={SKETCH.inkLight}
                strokeWidth="0.9"
              />
            ))
          )}
        </g>

        {/* analytics board */}
        <g transform="translate(148, 24) rotate(-1)">
          <rect x="0" y="0" width="188" height="120" rx="16" fill="white" stroke={SKETCH.ink} strokeWidth="1.4" />
          <text x="14" y="22" fill={SKETCH.ink} fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="700">Şube karşılaştırma</text>
          {[48, 72, 58, 88, 64].map((h, i) => (
            <g key={i} transform={`translate(${24 + i * 30}, ${100 - h * 0.55})`}>
              <rect
                x="0"
                y="0"
                width="18"
                height={h * 0.55}
                rx="4"
                fill={i === 3 ? SKETCH.orange : "url(#inst-chart)"}
                stroke={SKETCH.ink}
                strokeWidth="0.6"
                opacity={i === 3 ? 1 : 0.85}
              />
            </g>
          ))}
          <path d="M14 108 H174" stroke={SKETCH.inkLight} strokeWidth="0.8" strokeDasharray="2 3" />
        </g>

        {/* three people — sketch style */}
        {[
          { x: 56, skin: "#fde68a", shirt: "#bfdbfe", h: 0 },
          { x: 96, skin: "#fcd34d", shirt: "#fed7aa", h: 8 },
          { x: 136, skin: "#fde68a", shirt: "#bbf7d0", h: 4 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${156 - p.h})`}>
            <circle cx="16" cy="12" r="11" fill={p.skin} stroke={SKETCH.ink} strokeWidth="1.2" />
            <path d="M6 24 Q16 20 26 24 L28 48 Q16 52 4 48 Z" fill={p.shirt} stroke={SKETCH.ink} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M10 30 Q16 34 22 30" fill="none" stroke={SKETCH.ink} strokeWidth="0.8" opacity="0.4" />
          </g>
        ))}

        {/* optical scan paper doodle */}
        <g transform="translate(228, 168) rotate(3)">
          <rect x="0" y="0" width="88" height="56" rx="8" fill="white" stroke={SKETCH.ink} strokeWidth="1.2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="10" y={10 + i * 8} width={56 - i * 6} height="3" rx="1.5" fill="#e2e8f0" />
          ))}
          <circle cx="72" cy="40" r="10" fill={SKETCH.emeraldSoft} stroke={SKETCH.emerald} strokeWidth="1" />
          <path d="M68 40 L71 43 L76 36" fill="none" stroke={SKETCH.emerald} strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <path d="M20 230 Q80 222 140 228 T260 224" fill="none" stroke={SKETCH.inkLight} strokeWidth="1" strokeDasharray="4 5" opacity="0.45" />
      </svg>
    </IllustrationFrame>
  );
}

function StudentIllustration() {
  return (
    <IllustrationFrame>
      <svg viewBox="0 0 360 260" className="relative z-10 h-auto w-full" aria-hidden>
        {/* desk surface */}
        <path
          d="M20 200 Q100 188 180 194 Q260 200 340 192 L340 220 Q180 228 20 224 Z"
          fill="#fff7ed"
          stroke={SKETCH.ink}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* student */}
        <g transform="translate(130, 72)">
          <path
            d="M36 6 Q52 -6 68 8 Q78 20 72 34 Q66 44 52 42 Q36 40 30 26 Q24 14 36 6"
            fill="#1e293b"
            stroke={SKETCH.ink}
            strokeWidth="1.2"
          />
          <ellipse cx="52" cy="44" rx="24" ry="26" fill="#fde68a" stroke={SKETCH.ink} strokeWidth="1.4" />
          <circle cx="44" cy="40" r="2" fill={SKETCH.ink} />
          <circle cx="60" cy="40" r="2" fill={SKETCH.ink} />
          <path d="M46 50 Q52 56 58 50" fill="none" stroke={SKETCH.ink} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M24 70 Q52 64 80 70 L86 118 Q52 126 18 118 Z" fill={SKETCH.orange} stroke={SKETCH.ink} strokeWidth="1.3" strokeLinejoin="round" />
          {/* headphones doodle */}
          <path d="M18 38 Q8 38 8 48 Q8 58 18 56" fill="none" stroke={SKETCH.ink} strokeWidth="2" strokeLinecap="round" />
          <path d="M86 38 Q96 38 96 48 Q96 58 86 56" fill="none" stroke={SKETCH.ink} strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* tablet / book */}
        <g transform="translate(108, 148)">
          <rect x="0" y="0" width="96" height="64" rx="10" fill="white" stroke={SKETCH.ink} strokeWidth="1.4" />
          <rect x="8" y="8" width="80" height="48" rx="6" fill="#f0fdf4" stroke={SKETCH.emerald} strokeWidth="0.8" />
          <path d="M16 40 Q40 28 64 36 T80 32" fill="none" stroke={SKETCH.emerald} strokeWidth="1.8" strokeLinecap="round" />
          <text x="14" y="24" fill={SKETCH.emerald} fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="700">+12 net</text>
        </g>

        {/* gamification stars */}
        {[
          { x: 48, y: 40, s: 14 },
          { x: 280, y: 56, s: 12 },
          { x: 300, y: 120, s: 10 },
        ].map(({ x, y, s }, i) => (
          <g key={i} transform={`translate(${x}, ${y})`}>
            <path
              d={`M${s / 2} 0 L${s * 0.62} ${s * 0.38} L${s} ${s * 0.38} L${s * 0.72} ${s * 0.6} L${s * 0.82} ${s} L${s / 2} ${s * 0.75} L${s * 0.18} ${s} L${s * 0.28} ${s * 0.6} L0 ${s * 0.38} L${s * 0.38} ${s * 0.38} Z`}
              fill={SKETCH.amber}
              stroke={SKETCH.ink}
              strokeWidth="0.7"
              opacity="0.9"
            />
          </g>
        ))}

        {/* task checklist card */}
        <g transform="translate(220, 148) rotate(-2)">
          <rect x="0" y="0" width="108" height="72" rx="12" fill="white" stroke={SKETCH.ink} strokeWidth="1.3" />
          <text x="12" y="20" fill={SKETCH.ink} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="600">Bugünkü görevler</text>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(12, ${28 + i * 14})`}>
              <rect x="0" y="0" width="10" height="10" rx="2" fill={i < 2 ? SKETCH.emeraldSoft : "white"} stroke={i < 2 ? SKETCH.emerald : SKETCH.inkLight} strokeWidth="0.8" />
              {i < 2 && (
                <path d="M2 5 L4 7 L8 3" fill="none" stroke={SKETCH.emerald} strokeWidth="1.2" strokeLinecap="round" />
              )}
              <rect x="16" y="3" width={60 - i * 12} height="4" rx="2" fill="#f1f5f9" />
            </g>
          ))}
        </g>

        {/* pencil doodle */}
        <g transform="translate(52, 168) rotate(-18)">
          <rect x="0" y="0" width="8" height="48" rx="2" fill={SKETCH.amber} stroke={SKETCH.ink} strokeWidth="0.8" />
          <path d="M0 44 L4 52 L8 44" fill="#fde68a" stroke={SKETCH.ink} strokeWidth="0.6" />
        </g>

        <path d="M24 60 Q32 52 40 60" fill="none" stroke={SKETCH.orange} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      </svg>
    </IllustrationFrame>
  );
}

export function UseCaseIllustration({ type }: { type: "coach" | "institution" | "student" }) {
  if (type === "coach") return <CoachIllustration />;
  if (type === "institution") return <InstitutionIllustration />;
  return <StudentIllustration />;
}

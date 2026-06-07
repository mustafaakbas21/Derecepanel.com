/** Premium hero illustration — koç, öğrenci ve veri katmanı */

const SK = {
  ink: "#0f172a",
  inkMid: "#334155",
  inkLight: "#64748b",
  orange: "#f97316",
  orangeSoft: "#ffedd5",
  slate: "#94a3b8",
  emerald: "#10b981",
  blue: "#3b82f6",
};

export function LandingHeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden>
      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-8 top-8 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-6 bottom-16 h-36 w-36 rounded-full bg-blue-200/35 blur-3xl" />

      <svg viewBox="0 0 520 420" className="relative z-10 h-auto w-full drop-shadow-sm">
        <defs>
          <linearGradient id="hero-card" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="hero-glass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(248,250,252,0.88)" />
          </linearGradient>
          <linearGradient id="hero-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="hero-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Background arc — hedef yolu */}
        <path
          d="M40 340 Q260 180 480 300"
          fill="none"
          stroke="url(#hero-path)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 8"
          opacity="0.35"
        />

        {/* Floating net card */}
        <g transform="translate(32, 48) rotate(-3)" filter="url(#hero-soft)">
          <rect x="0" y="0" width="128" height="88" rx="16" fill="url(#hero-card)" stroke={SK.ink} strokeWidth="1.2" opacity="0.95" />
          <text x="14" y="22" fill={SK.inkLight} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="600">
            TYT Net trend
          </text>
          <path
            d="M16 68 Q36 52 56 58 T96 38 T112 32"
            fill="none"
            stroke={SK.orange}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="112" cy="32" r="4" fill={SK.orange} />
          <text x="14" y="78" fill={SK.emerald} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="800">
            +6.4 ↑
          </text>
        </g>

        {/* Onyx chat bubble */}
        <g transform="translate(368, 28) rotate(2)" filter="url(#hero-soft)">
          <rect x="0" y="0" width="132" height="76" rx="18" fill={SK.ink} />
          <text x="14" y="22" fill={SK.orange} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="700">
            Onyx AI
          </text>
          <text x="14" y="40" fill="#e2e8f0" fontSize="8.5" fontFamily="system-ui,sans-serif">
            Fizikte kuvvet konusu
          </text>
          <text x="14" y="54" fill="#e2e8f0" fontSize="8.5" fontFamily="system-ui,sans-serif">
            zayıf — 2 saat tekrar öner
          </text>
          <path d="M20 72 L28 76 L24 68 Z" fill={SK.ink} />
        </g>

        {/* Central platform card — dashboard silhouette */}
        <g transform="translate(108, 108)" filter="url(#hero-soft)">
          <rect x="0" y="0" width="304" height="196" rx="20" fill="url(#hero-glass)" stroke={SK.ink} strokeWidth="1.4" />
          {/* sidebar */}
          <rect x="12" y="12" width="56" height="172" rx="10" fill="#f1f5f9" stroke={SK.slate} strokeWidth="0.6" opacity="0.8" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x="20"
              y={28 + i * 28}
              width="40"
              height="8"
              rx="4"
              fill={i === 0 ? SK.orange : "#cbd5e1"}
              opacity={i === 0 ? 0.35 : 0.5}
            />
          ))}
          {/* stats row */}
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${84 + i * 72}, 28)`}>
              <rect x="0" y="0" width="60" height="44" rx="10" fill="white" stroke={SK.slate} strokeWidth="0.7" />
              <rect x="8" y="10" width="24" height="4" rx="2" fill="#e2e8f0" />
              <rect x="8" y="22" width="36" height="8" rx="3" fill={i === 1 ? SK.orange : SK.ink} opacity={i === 1 ? 0.7 : 0.15} />
            </g>
          ))}
          {/* chart area */}
          <rect x="84" y="84" width="208" height="88" rx="12" fill="#f8fafc" stroke={SK.slate} strokeWidth="0.6" />
          {[38, 52, 46, 58, 54, 68, 62, 74, 70, 82].map((h, i) => (
            <rect
              key={i}
              x={96 + i * 18}
              y={160 - h * 0.7}
              width="10"
              height={h * 0.7}
              rx="3"
              fill={i >= 7 ? SK.orange : SK.blue}
              opacity={i >= 7 ? 0.85 : 0.45}
            />
          ))}
        </g>

        {/* Coach figure */}
        <g transform="translate(388, 200)">
          <ellipse cx="36" cy="28" rx="20" ry="22" fill="#fde68a" stroke={SK.ink} strokeWidth="1.3" />
          <path
            d="M18 8 Q32 -6 48 4 Q58 14 52 26 Q46 34 36 32 Q24 30 18 20 Q14 12 18 8"
            fill="#fde68a"
            stroke={SK.ink}
            strokeWidth="1.2"
          />
          <circle cx="28" cy="26" r="2" fill={SK.ink} />
          <circle cx="44" cy="26" r="2" fill={SK.ink} />
          <path d="M30 34 Q36 38 42 34" fill="none" stroke={SK.ink} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M14 50 Q36 44 58 50 L64 96 Q36 104 8 96 Z" fill={SK.ink} stroke={SK.ink} strokeWidth="1.2" />
          <path d="M58 58 Q78 52 86 72 Q72 78 60 70" fill="#fde68a" stroke={SK.ink} strokeWidth="1.1" />
          {/* tablet */}
          <rect x="72" y="64" width="36" height="48" rx="6" fill="white" stroke={SK.ink} strokeWidth="1.1" />
          <rect x="78" y="72" width="24" height="3" rx="1.5" fill={SK.orange} opacity="0.6" />
          <rect x="78" y="80" width="18" height="2" rx="1" fill="#e2e8f0" />
        </g>

        {/* Student figure */}
        <g transform="translate(48, 248)">
          <ellipse cx="32" cy="24" rx="18" ry="20" fill="#fcd34d" stroke={SK.ink} strokeWidth="1.2" />
          <path
            d="M16 6 Q28 -8 42 2 Q50 10 46 20 Q42 28 32 26 Q20 24 16 16 Q12 10 16 6"
            fill="#1e293b"
            stroke={SK.ink}
            strokeWidth="1.1"
          />
          <circle cx="26" cy="22" r="1.8" fill={SK.ink} />
          <circle cx="38" cy="22" r="1.8" fill={SK.ink} />
          <path d="M12 44 Q32 38 52 44 L56 88 Q32 94 8 88 Z" fill={SK.orange} stroke={SK.ink} strokeWidth="1.1" />
          {/* book */}
          <rect x="-8" y="58" width="28" height="36" rx="4" fill="white" stroke={SK.ink} strokeWidth="1" />
          <path d="M-8 58 L6 52 L20 58" fill={SK.orangeSoft} stroke={SK.orange} strokeWidth="0.8" />
        </g>

        {/* Session room badge */}
        <g transform="translate(168, 318) rotate(-1)" filter="url(#hero-soft)">
          <rect x="0" y="0" width="116" height="36" rx="18" fill="white" stroke={SK.ink} strokeWidth="1.1" />
          <circle cx="18" cy="18" r="6" fill={SK.emerald} opacity="0.85" />
          <circle cx="18" cy="18" r="3" fill="white" />
          <text x="32" y="22" fill={SK.inkMid} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="700">
            Canlı görüşme
          </text>
        </g>

        {/* Konu takip chip */}
        <g transform="translate(300, 332) rotate(2)">
          <rect x="0" y="0" width="96" height="28" rx="14" fill={SK.orangeSoft} stroke={SK.orange} strokeWidth="0.9" />
          <text x="14" y="18" fill="#c2410c" fontSize="8.5" fontFamily="system-ui,sans-serif" fontWeight="700">
            Konu %72 ✓
          </text>
        </g>

        {/* Decorative stars */}
        <path d="M460 120 L462 114 L464 120 L462 126 Z" fill={SK.orange} opacity="0.7" />
        <path d="M72 180 L74 176 L76 180 L74 184 Z" fill={SK.blue} opacity="0.5" />
        <circle cx="420" cy="360" r="2" fill={SK.slate} opacity="0.4" />
        <circle cx="96" cy="120" r="1.5" fill={SK.orange} opacity="0.5" />
      </svg>
    </div>
  );
}

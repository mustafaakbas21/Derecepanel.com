import { cn } from "@/lib/utils";

/** Kompakt giriş sayfası illüstrasyonu — koç paneli + öğrenci kartı. */

const SK = {
  ink: "#0f172a",
  inkLight: "#64748b",
  orange: "#f97316",
  emerald: "#10b981",
  slate: "#94a3b8",
};

export function GirisHeroIllustration({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className="pointer-events-none absolute -left-4 top-2 h-24 w-24 rounded-full bg-orange-200/35 blur-2xl" />
      <div className="pointer-events-none absolute -right-2 bottom-4 h-20 w-20 rounded-full bg-blue-200/30 blur-2xl" />

      <svg viewBox="0 0 320 220" className="relative z-10 mx-auto h-auto w-full max-w-[320px] drop-shadow-sm">
        <defs>
          <linearGradient id="giris-card" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="giris-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="giris-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.07" />
          </filter>
        </defs>

        <path
          d="M24 180 Q160 100 296 160"
          fill="none"
          stroke="url(#giris-path)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 7"
          opacity="0.4"
        />

        {/* Koç paneli kartı */}
        <g transform="translate(16, 24) rotate(-2)" filter="url(#giris-soft)">
          <rect x="0" y="0" width="148" height="108" rx="14" fill="url(#giris-card)" stroke={SK.ink} strokeWidth="1.1" />
          <rect x="10" y="10" width="36" height="88" rx="8" fill="#f1f5f9" stroke={SK.slate} strokeWidth="0.5" opacity="0.85" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x="16"
              y={22 + i * 22}
              width="24"
              height="6"
              rx="3"
              fill={i === 0 ? SK.orange : "#cbd5e1"}
              opacity={i === 0 ? 0.4 : 0.55}
            />
          ))}
          <text x="54" y="24" fill={SK.inkLight} fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="600">
            Koç paneli
          </text>
          <rect x="54" y="32" width="78" height="28" rx="6" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.6" />
          <text x="62" y="50" fill={SK.orange} fontSize="11" fontFamily="system-ui,sans-serif" fontWeight="800">
            48 öğrenci
          </text>
          <rect x="54" y="68" width="36" height="28" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="0.5" />
          <text x="60" y="86" fill={SK.emerald} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="700">
            +6.4 net
          </text>
          <rect x="96" y="68" width="36" height="28" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" />
          <text x="102" y="86" fill={SK.ink} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="700">
            12 deneme
          </text>
        </g>

        {/* Öğrenci kartı */}
        <g transform="translate(168, 52) rotate(2)" filter="url(#giris-soft)">
          <rect x="0" y="0" width="136" height="96" rx="14" fill={SK.ink} />
          <text x="14" y="22" fill={SK.orange} fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="700">
            Öğrenci paneli
          </text>
          <text x="14" y="40" fill="#e2e8f0" fontSize="8" fontFamily="system-ui,sans-serif">
            Haftalık program
          </text>
          <text x="14" y="54" fill="#94a3b8" fontSize="7.5" fontFamily="system-ui,sans-serif">
            3 görev tamamlandı
          </text>
          <rect x="14" y="64" width="108" height="6" rx="3" fill="#334155" />
          <rect x="14" y="64" width="72" height="6" rx="3" fill={SK.orange} opacity="0.85" />
          <circle cx="118" cy="18" r="10" fill={SK.orange} opacity="0.2" />
          <text x="114" y="22" fill={SK.orange} fontSize="9" fontFamily="system-ui,sans-serif" fontWeight="800">
            %
          </text>
        </g>

        {/* Bağlantı noktaları */}
        <circle cx="160" cy="118" r="5" fill="#fff" stroke={SK.orange} strokeWidth="2" />
        <circle cx="160" cy="118" r="2" fill={SK.orange} />
      </svg>
    </div>
  );
}

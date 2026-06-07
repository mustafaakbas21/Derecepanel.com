/** Giriş sayfası arka planı — landing hero ile aynı görsel dil. */
export function GirisPageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #f8fafc 0%, #ffffff 35%, #fff7ed 70%, #f1f5f9 100%)",
        }}
      />

      <svg className="absolute inset-0 h-full w-full opacity-[0.45]" aria-hidden>
        <defs>
          <pattern id="giris-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="#cbd5e1" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#giris-dots)" />
      </svg>

      <div
        className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,146,60,0.22) 0%, transparent 65%)" }}
      />
      <div
        className="absolute -right-24 top-20 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(15,23,42,0.08) 0%, transparent 60%)" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[360px] w-[600px] -translate-x-1/2 opacity-40 blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)" }}
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />

      <div className="absolute left-8 top-32 hidden h-24 w-24 border-l border-t border-slate-200/60 lg:block" />
      <div className="absolute bottom-24 right-8 hidden h-24 w-24 border-b border-r border-orange-200/50 lg:block" />
    </div>
  );
}

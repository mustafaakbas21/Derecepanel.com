"""Generate Coming Soon pages for Test Maker (single source)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "pages"

# test-olusturucu.html ile aynı: yalnızca bu üç öğe (derecepanel-sidebar.js ile senkron).
SIDEBAR_TM_LINKS = """
              <a href="test-olusturucu.html" class="nav-sub{active0}">Test Oluşturucu</a>
              <a href="otomatik-soru-kirpici.html" class="nav-sub{active1}">Otomatik Soru Kırpıcı</a>
              <a href="soru-havuzu.html" class="nav-sub{active2}">Soru Havuzu</a>
"""

# Coming-soon şablonu üretimi varsayılan olarak kapalı; tam uygulama sayfalarının üzerine yazılmasın.
PAGES = []  # (dosya, başlık, aktif alt menü indeksi 0..2); boş = üretim yok


def active_classes(idx: int) -> list[str]:
    return [(" nav-sub--active" if idx == i else "") for i in range(3)]


TEMPLATE = """<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script src="../js/theme-boot.js"></script>
    <link rel="stylesheet" href="../css/style.css" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {{
        important: "#tw-scope",
        corePlugins: {{ preflight: false }},
        darkMode: ["selector", '[data-theme="dark"]'],
        theme: {{ extend: {{ fontFamily: {{ sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] }} }} }},
      }};
    </script>
  </head>
  <body>
    <div class="app">
      <aside class="sidebar" aria-label="Ana menü">
        <div class="sidebar__brand">
          <div class="sidebar__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="sidebar__title">Derecepanel</span>
        </div>
        <nav class="sidebar__nav">
          <a href="../koc-paneli.html" class="nav-item">
            <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            Dashboard
          </a>
          <a href="ogrencilerim.html" class="nav-item">
            <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            Öğrencilerim
          </a>
          <a href="koclar.html" class="nav-item">
            <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16 3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01-.665-6.479L12 14z" />
            </svg>
            Koçlar
          </a>
          <a href="randevular.html" class="nav-item">
            <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Randevular
          </a>
          <div class="nav-group" data-nav-group>
            <button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="nav-den-sub-cs">
              <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Denemeler
              <svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div class="nav-group__sub" id="nav-den-sub-cs" role="group" aria-label="Denemeler alt menü">
              <a href="denemeler-global-takvim.html" class="nav-sub">Global Deneme Takvimi</a>
              <a href="kurum-deneme-takvimi.html" class="nav-sub">Kurum Deneme Takvimi</a>
              <a href="deneme-sonuclari-yukleme.html" class="nav-sub">Deneme Sonuçları Yükleme</a>
              <a href="deneme-sonuclari-olustur.html" class="nav-sub">Optik Okuyucu</a>
            </div>
          </div>
          <div class="nav-group" data-nav-group>
            <button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="nav-wp-sub-cs">
              <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Haftalık Program
              <svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div class="nav-group__sub" id="nav-wp-sub-cs" role="group" aria-label="Haftalık Program alt menü">
              <a href="haftalik-program-olusturucu.html" class="nav-sub">Haftalık Program Oluşturucu</a>
              <a href="kayitli-haftalik-programlar.html" class="nav-sub">Kayıtlı Haftalık Programlar</a>
            </div>
          </div>
          <div class="nav-group" data-nav-group>
            <button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="nav-mr-sub-cs">
              <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              MR
              <svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div class="nav-group__sub" id="nav-mr-sub-cs" role="group" aria-label="MR alt menü">
              <a href="konu-mr.html" class="nav-sub">Konu MR</a>
              <a href="soru-mr.html" class="nav-sub">Soru MR</a>
              <a href="deneme-mr.html" class="nav-sub">Deneme MR</a>
            </div>
          </div>
          <div class="nav-group" data-nav-group>
            <button type="button" class="nav-item nav-group__trigger" aria-expanded="false" aria-controls="nav-kitap-sub-cs">
              <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              Kitap Kütüphanesi
              <svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div class="nav-group__sub" id="nav-kitap-sub-cs" role="group" aria-label="Kitap Kütüphanesi alt menü">
              <a href="kitaplar.html" class="nav-sub">Kitap Listesi &amp; Kayıt</a>
              <a href="kaynak-atama.html" class="nav-sub">Kaynak Atama</a>
            </div>
          </div>
          <div class="nav-group nav-group--open" data-nav-group>
            <button type="button" class="nav-item nav-group__trigger" aria-expanded="true" aria-controls="nav-tm-sub-cs">
              <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test Maker
              <svg class="nav-item__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div class="nav-group__sub" id="nav-tm-sub-cs" role="group" aria-label="Test Maker alt menü">
{tm_links}
            </div>
          </div>
        </nav>
        <div class="theme-switcher" role="group" aria-label="Görünüm teması">
          <span class="theme-switcher__label">Tema</span>
          <div class="theme-switcher__swatches">
            <button type="button" class="theme-swatch theme-swatch--dark" data-theme="dark" aria-pressed="false" aria-label="Koyu tema"></button>
            <button type="button" class="theme-swatch theme-swatch--light" data-theme="light" aria-pressed="false" aria-label="Açık tema"></button>
            <button type="button" class="theme-swatch theme-swatch--blue" data-theme="blue" aria-pressed="false" aria-label="Okyanus teması"></button>
            <button type="button" class="theme-swatch theme-swatch--orange" data-theme="orange" aria-pressed="false" aria-label="Gün batımı teması"></button>
          </div>
        </div>
        <div class="sidebar__logout">
          <button type="button" class="btn-logout">
            Çıkış
            <span class="btn-logout__arrow" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          </button>
        </div>
      </aside>
      <main class="main min-h-0">
        <header class="topbar">
          <div class="topbar__left">
            <a href="../koc-paneli.html" class="btn-icon" aria-label="Geri">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </a>
            <div class="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input type="search" placeholder="Ara…" aria-label="Genel arama" />
            </div>
          </div>
          <div class="topbar__actions">
            <img class="avatar" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop" width="44" height="44" alt="Profil" />
          </div>
        </header>
        <div id="tw-scope" class="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-12 text-slate-800">
          <div class="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white px-8 py-12 text-center shadow-xl shadow-slate-300/40 ring-1 ring-slate-100/80">
            <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/35">
              <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Coming soon</p>
            <h1 class="mt-2 text-2xl font-bold tracking-tight text-slate-900">Çok Yakında</h1>
            <p class="mt-3 text-sm leading-relaxed text-slate-500">Bu Test Maker ekranı hazırlanıyor. Yakında burada olacak.</p>
            <a href="test-olusturucu.html" class="mt-8 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Test Oluşturucu’ya dön</a>
          </div>
        </div>
      </main>
    </div>
    <script src="../js/theme.js" defer></script>
    <script src="../js/app.js" defer></script>
  </body>
</html>
"""


def main() -> None:
    for fname, title, active_idx in PAGES:
        a = active_classes(active_idx)
        tm_links = SIDEBAR_TM_LINKS.format(active0=a[0], active1=a[1], active2=a[2])
        html = TEMPLATE.format(title=title, tm_links=tm_links)
        (ROOT / fname).write_text(html, encoding="utf-8")
        print("wrote", fname)


if __name__ == "__main__":
    main()

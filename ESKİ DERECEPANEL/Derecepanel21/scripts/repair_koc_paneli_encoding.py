# -*- coding: utf-8 -*-
"""Repair UTF-8 / Turkish text in koc-paneli.html"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KOC = ROOT / "koc-paneli.html"
REF = ROOT / "pages" / "ogrencilerim.html"

koc = KOC.read_text(encoding="utf-8", errors="replace")
ref = REF.read_text(encoding="utf-8")

# --- Sidebar from clean reference ---
m_aside = re.search(r"<aside class=\"sidebar\".*?</aside>", ref, re.DOTALL)
if not m_aside:
    raise SystemExit("aside not found in ogrencilerim.html")
aside = m_aside.group(0)

# paths: pages/*.html from coach panel root
def fix_href(html: str) -> str:
    def repl(m):
        h = m.group(1)
        if h.startswith("pages/") or h == "koc-paneli.html" or h.startswith("#") or "://" in h:
            return m.group(0)
        if h.startswith("../"):
            return f'href="{h[3:]}"'
        return f'href="pages/{h}"'

    return re.sub(r'href="([^"]+)"', repl, html)


aside = fix_href(aside)
aside = aside.replace(
    'href="koc-paneli.html" class="nav-item"',
    'href="koc-paneli.html" class="nav-item nav-item--active"',
)
aside = aside.replace(
    'href="pages/ogrencilerim.html" class="nav-item nav-item--active"',
    'href="pages/ogrencilerim.html" class="nav-item"',
)

# Pazarlama (only on koc dashboard nav)
pazarlama = """
          <a href="pages/pazarlama.html" class="nav-item nav-item--marketing-beta">
            <svg class="nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M3 11v2a1 1 0 0 0 1 1h2l9 4V6L6 10H4a1 1 0 0 0-1 1z" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M15 10.5a4 4 0 0 1 0 3" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M18 9a7 7 0 0 1 0 6" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 14.5V19a2 2 0 0 0 2 2h1" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="nav-analiz-beta">
              <span class="nav-analiz-beta__row1">Pazarlama</span>
              <span class="nav-analiz-beta__row2">
                <span class="nav-analiz-beta__suffix">Asistanı</span>
                <span class="nav-analiz-beta__pill">BETA</span>
              </span>
            </span>
          </a>
"""
aside = aside.replace(
    'href="pages/randevular.html" class="nav-item">',
    pazarlama + '\n          <a href="pages/randevular.html" class="nav-item">',
    1,
)

# root-specific nav ids (match original koc-paneli)
aside = aside.replace('nav-gorusme-sub-coach', 'nav-gorusme-sub-root')
aside = aside.replace('nav-gorusme-btn-coach', 'nav-gorusme-btn-root')
aside = aside.replace('id="nav-yks-sub"', 'id="nav-yks-sub-root"')
aside = aside.replace('id="nav-yks-btn"', 'id="nav-yks-btn-root"')
aside = aside.replace('aria-controls="nav-yks-sub"', 'aria-controls="nav-yks-sub-root"')

koc, n = re.subn(r"<aside class=\"sidebar\".*?</aside>", aside, koc, count=1, flags=re.DOTALL)
print("aside replaced:", n)

# --- Header strings from reference topbar ---
m_header = re.search(
    r"<header class=\"dp-topbar-sheet\".*?</header>",
    ref,
    re.DOTALL,
)
if m_header:
    header = m_header.group(0)
    koc, n2 = re.subn(
        r"<header class=\"dp-topbar-sheet\".*?</header>",
        header,
        koc,
        count=1,
        flags=re.DOTALL,
    )
    print("header replaced:", n2)

# --- Dashboard content fixes ---
fixes = [
    ("Ã¶ÄŸrencilerim", "Öğrencilerim"),
    ("Ã¶ÄŸrenci", "Öğrenci"),
    ("Ã¶ÄŸrenciye", "Öğrenciye"),
    ("koÃ§", "koç"),
    ("KoÃ§", "Koç"),
    ("KayÄ±tlÄ±", "Kayıtlı"),
    ("kayÄ±tlÄ±", "kayıtlı"),
    ("kayï¿½tlar", "kayıtlar"),
    ("tarayÄ±cÄ±", "tarayıcı"),
    ("sayfasÄ±ndan", "sayfasından"),
    ("YÃ¼kleniyorï¿½", "Yükleniyor…"),
    ("YÃ¼kleniyor", "Yükleniyor"),
    ("Gï¿½rï¿½ï¿½me", "Görüşme"),
    ("Odasï¿½", "Odası"),
    ("menï¿½", "menü"),
    ("Arï¿½ivi", "Arşivi"),
    ("Asistanï¿½", "Asistanı"),
    ("Simï¿½lasyon", "Simülasyon"),
    ("Sihirbazï¿½", "Sihirbazı"),
    ("Konularï¿½", "Konuları"),
    ("Sonuï¿½", "Sonuç"),
    ("Sonuï¿½larï¿½", "Sonuçları"),
    ("Yï¿½kleme", "Yükleme"),
    ("Haftalï¿½k", "Haftalık"),
    ("Oluï¿½turucu", "Oluşturucu"),
    ("Oluï¿½turma", "Oluşturma"),
    ("Kayï¿½tlï¿½", "Kayıtlı"),
    ("gï¿½nder", "gönder"),
    ("Kï¿½tï¿½phanesi", "Kütüphanesi"),
    ("Kayï¿½t", "Kayıt"),
    ("Kï¿½rpï¿½cï¿½", "Kırpıcı"),
    ("Reï¿½etesi", "Reçetesi"),
    ("Reï¿½ete", "Reçete"),
    ("Hatalï¿½", "Hatalı"),
    ("Fasikï¿½ller", "Fasiküller"),
    ("Fasikï¿½l", "Fasikül"),
    ("Yakï¿½nda", "Yakında"),
    ("Gï¿½rï¿½nï¿½m", "Görünüm"),
    ("temasï¿½", "teması"),
    ("Aï¿½ï¿½k", "Açık"),
    ("GÃ¼n batï¿½mï¿½", "Gün batımı"),
    ("batï¿½mï¿½", "batımı"),
    ("ï¿½ï¿½kï¿½ï¿½ yap", "Çıkış yap"),
    ("ï¿½ï¿½kï¿½ï¿½", "Çıkış"),
    ("deï¿½iï¿½tir", "değiştir"),
    ("Dï¿½zenle", "Düzenle"),
    ("sonuï¿½larï¿½", "sonuçları"),
    ("Yaklaï¿½an", "Yaklaşan"),
    ("sayï¿½sï¿½", "sayısı"),
    ("daï¿½ï¿½lï¿½mï¿½", "dağılımı"),
    ("daï¿½ï¿½lï¿½m", "dağılım"),
    ("Seï¿½enekler", "Seçenekler"),
    ("alanlarï¿½na", "alanlarına"),
    ("gï¿½re", "göre"),
    ("kayï¿½tlarï¿½na", "kayıtlarına"),
    ("hesaplanï¿½r", "hesaplanır"),
    ("grafiï¿½i", "grafiği"),
    ("yï¿½zde", "yüzde"),
    ("ï¿½nceki ay", "Önceki ay"),
    ("gï¿½nleri", "günleri"),
    ("yï¿½net", "yönet"),
    ('aria-label="ï¿½"', 'aria-label="—"'),
    (">ï¿½</p>", ">—</p>"),
    (">ï¿½</span>", ">—</span>"),
    (">ï¿½</button>", ">‹</button>"),
    ('aria-label="Sonraki ay">ï¿½</button>', 'aria-label="Sonraki ay">›</button>'),
    ("Toplam kayıtlı öğrenci", "Toplam kayıtlı öğrenci"),
    ("öğrencilerim ile", "Öğrencilerim ile"),
    ("Öğrenci dağılımı", "Öğrenci dağılımı"),
]

for bad, good in fixes:
    koc = koc.replace(bad, good)

# Ensure em dash in YKS remain if broken
koc = koc.replace('data-yks-remain="tyt">â€"</p>', 'data-yks-remain="tyt">—</p>')
koc = koc.replace('data-yks-remain="ayt">â€"</p>', 'data-yks-remain="ayt">—</p>')

KOC.write_text(koc, encoding="utf-8", newline="\n")
remaining = len(re.findall(r"ï¿½|Ã.|Ä.|â€", koc))
print("OK — remaining suspicious sequences:", remaining)

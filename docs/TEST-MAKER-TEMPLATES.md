# Test Oluşturucu — Şablon motoru

Tek kaynak: `lib/test-maker/template-registry.ts`  
CSS motoru: `styles/test-maker-templates.css`  
ESKİ referans: `ESKİ DERECEPANEL/Derecepanel21/pages/test-olusturucu.html`

## Mimari

Şablon = `#tm-a4-page[data-tpl]` + CSS değişkenleri (`--tm-hdr-bg`, `--tm-q-gap`, …) + sabit sınıflar (`.tm-tpl-hdr-bg`, `.tm-q-num`, `#tm-cover-footer`).

React `template` state → `A4Document` prop + `applyTemplate()` (popover kart vurgusu).

## Katalog (10 şablon)

| `TemplateId` | Görünen ad | Grup |
|--------------|------------|------|
| `derece` | Derece Kurumsal | primary |
| `uc-boyutlu` | Üç Boyutlu Vizyon | primary |
| `sarmal` | Sarmal Dinamik | primary |
| `yeni-nesil` | Yeni Nesil 3-4-5 | primary |
| `limitless` | Limitless Format | other |
| `hiz-renk` | Hız ve Renk Tarzı | other |
| `orijinal-mat` | Orijinal Mat | other |
| `karekök` | Karekök Klasik | other |
| `aydinlik` | Aydınlık Sayfalar | other |
| `paraf` | Paraf Özel | other |

**Not:** `karekök` id’si Unicode `ö` içerir; ASCII `karekok` yapılmaz (ESKİ arşiv `layout.sablon` uyumu).

## DOM sözleşmesi (`a4-document.tsx`)

```html
<div id="tm-a4-page" data-tpl="{templateId}">
  <section id="tm-sheet-cover">… #live-cover-title, #tm-cover-student-form, #tm-cover-footer</section>
  <section id="tm-sheet-questions" class="tm-a4-sheet">
    <div class="tm-tpl-hdr-bg">…</div>
    <div class="tm-tpl-divider">… #tm-sh-q-ders, #tm-sh-q-konu</div>
    <ul class="tm-strict-grid tm-tpl-gap"> → .tm-q-item, .tm-q-num, .tm-q-meta</ul>
    <div class="tm-q-footer tm-tpl-hdr-bg">…</div>
  </section>
</div>
```

Senkron: `.tm-sync-institution` → `config.kurum`.

## API

| Fonksiyon | Dosya |
|-----------|--------|
| `TEMPLATE_REGISTRY` | `template-registry.ts` |
| `getTemplateById`, `getTemplateName`, `resolveTemplateId` | `template-registry.ts` |
| `applyTemplate`, `saveLastTemplate`, `loadLastTemplate` | `templates.ts` |
| `TEMPLATES[]` | `constants.ts` (registry türevi) |

## Arşiv

| Akış | Alan |
|------|------|
| Tarama | `layout.sablon` → `resolveTemplateId` |
| Reçete | `layout.sablon` |
| Fascicle | `template` (id veya ad) |

Bilinmeyen şablon → `derece`.

## Stil import sırası

```ts
import "@/styles/test-maker-theme.css";
import "@/styles/test-maker-studio.css";
import "@/styles/test-maker.css";
import "@/styles/test-maker-templates.css";
```

## Yeni şablon checklist

1. `types.ts` → `TemplateId`
2. `template-registry.ts` → kayıt
3. `test-maker-templates.css` → `[data-tpl="…"]`
4. Ekran + print QA
5. Tarama kaydet / yükle

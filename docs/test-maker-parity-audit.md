# Test Maker Parity Audit — Oluşturucu (kırpma + şablon)

Tarih: 2026-05-27  
Kaynak: `ESKİ DERECEPANEL/Derecepanel21/pages/test-olusturucu.html` (satır 227–624 CSS, 2514–2686 popover), `js/test-olusturucu.js` (kırpma ~1017–2015, şablon ~2232–2303)

## A — Envanter

| ESKİ | Yeni |
|------|------|
| `test-olusturucu.html` | `app/(coach)/dashboard/test-maker/olusturucu/page.tsx` |
| `test-olusturucu.js` | `components/test-maker/test-maker-page.tsx` + `lib/test-maker/*` |
| Şablon `<style>` 227–624 | `styles/test-maker-templates.css` (birebir kopya) |
| `#tm-tpl-popover` | `components/test-maker/template-popover.tsx` |
| `extractPdfRegionToDataUrlExt` | `lib/test-maker/pdf-crop.ts` |
| `initCropMode` | `lib/test-maker/use-pdf-crop.ts` + `pdf-panel.tsx` |
| `initCropStudio` | `crop-studio-modal.tsx` |
| `applyTemplate` | `lib/test-maker/templates.ts` |

## B — Bulunan hatalar ve kök neden

| # | Sorun | Kök neden | Düzeltme |
|---|--------|-----------|----------|
| 1 | Kırpılan alan kayık / boş | Sadece `fallbackCrop` (canvas buffer), `renderFinalScale`/`dpr` yok | `extractPdfRegionToDataUrlExt` HI_SCALE=3 port |
| 2 | Zoom sonrası kayma | CSS `transform: scale` veya eksik render meta | PDF.js yeniden render + `pdfRenderFinalScale` saklama |
| 3 | Tamam sonrası sıfır rect | `hidePdfCropUi` sonra `getBoundingClientRect` | `frozenRect` önce alınıyor (`use-pdf-crop`) |
| 4 | Şablonlar görünmüyor | `test-maker.css` içinde eksik subset | Tam CSS `test-maker-templates.css` |
| 5 | Kapak/footer şablonu uygulanmıyor | `#tm-cover-footer`, `.tm-q-footer` id eksik | `a4-document.tsx` yapısal id’ler |

## C — Kırpma kontrol listesi (ESKİ tuzaklar)

| # | Kontrol | Durum |
|---|---------|--------|
| 1 | frozenRect UI gizlenmeden önce | ✅ |
| 2 | pdfRenderFinalScale + dpr her render | ✅ `renderPdfPageToCanvas` |
| 3 | Marquee pan-inner koordinatı | ✅ |
| 4 | Crop açılınca pan kapatılır | ✅ |
| 5 | renderGen stale iptal | ✅ |
| 6 | crop drag sırasında resize skip | ✅ `dragActiveRef` |
| 7 | hidden canvas → null + toast | ✅ |
| 8 | Seçim &lt; 12px → hide + ipucu | ✅ |
| 9 | #tm-pdf-crop-ok letter olmadan disabled | ✅ |
| 10 | scaleX/Y buffer/CSS | ✅ |

## D — Şablon kontrol listesi

| Şablon | data-tpl | CSS katmanı | Popover kart |
|--------|----------|-------------|--------------|
| Derece Kurumsal | derece | ✅ | ✅ |
| Üç Boyutlu Vizyon | uc-boyutlu | ✅ | ✅ |
| Sarmal Dinamik | sarmal | ✅ | ✅ |
| Yeni Nesil | yeni-nesil | ✅ | ✅ |
| Limitless | limitless | ✅ | ✅ |
| Hız ve Renk | hiz-renk | ✅ | ✅ |
| Orijinal Mat | orijinal-mat | ✅ | ✅ |
| Karekök | karekök | ✅ | ✅ |
| Aydınlık | aydinlik | ✅ | ✅ |
| Paraf | paraf | ✅ | ✅ |

Varsayılan yükleme: `applyTemplate("derece", "Derece Kurumsal")` — hydrate sonrası.

## E — Manuel test (yerel doğrulama)

- [ ] PDF yükle → kırp → A4’te doğru görsel
- [ ] Zoom %150 → kırp → kayma yok
- [ ] Geniş ekran kırp → aynı kalite
- [ ] Şablon derece / uc-boyutlu / sarmal anında değişir
- [ ] Yazdır/export şablon stillerini korur

## F — Dosya değişiklikleri (özet)

- `styles/test-maker-templates.css` — ESKİ satır 227–624
- `lib/test-maker/pdf-crop.ts` — HI_SCALE motoru
- `lib/test-maker/pdf-document.ts` — DPR render parity
- `lib/test-maker/use-pdf-crop.ts` — inline kırpma
- `components/test-maker/pdf-panel.tsx` — DOM id parity
- `components/test-maker/crop-studio-modal.tsx` — studio pipeline
- `components/test-maker/template-popover.tsx` — 10 şablon
- `components/test-maker/a4-document.tsx` — kapak/footer id’leri

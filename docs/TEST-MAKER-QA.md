# Test Maker — QA Raporu (2026-05-28)

Bu rapor Test Maker v2 UI/UX yenilemesi ve Test Oluşturucu düzeltmeleri sonrası **kod incelemesi + birim testleri** ile hazırlanmıştır. Tarayıcıda elle tıklama testi bu oturumda çalıştırılmadı; canlı doğrulama için `npm run dev` ile aşağıdaki kontrol listesini uygulayın.

## Özet

| Alan | Durum |
|------|--------|
| UI v2 (3 sayfa + layout) | Uygulandı |
| Arşiv → ders/konu id senkronu | Düzeltildi (`mergeArchiveIntoConfig`) |
| Boş soru butonu | Kaldırıldı → **PDF kırpıcı** |
| PDF yazdır / indir | Kod hazır (`#tm-a4-page` gerekli) |
| Birim test (`resolve-config`) | 3/3 geçti |
| Bulut PDF | Ortam değişkenine bağlı |

---

## Sayfalar

### 1. Test Oluşturucu (`/dashboard/test-maker`)

| Özellik | Beklenen | Kod/Not | Sonuç |
|---------|----------|---------|--------|
| Sayfa başlığı + durum şeridi | Soru/cevap/şablon özeti | `TestMakerStudioStatus` | Geçer (statik) |
| Ders / konu seçimi | Müfredat `@/lib/mufredat` | `getSubjects` / `getTopics` | Geçer |
| Tarama düzenleme | Ders/konu id + sorular yüklenir | `mergeArchiveIntoConfig` + `taramaGet` | **Düzeltildi** |
| Reçete düzenleme | Aynı + öğrenci id | `receteGet` + `findStudentIdByCanonical` | **Düzeltildi** |
| Hata Reçetesi aktarımı | Sorular + öğrenci | `consumeReceteForTestMaker` | Geçer |
| Soru havuzu modal | Seçilenler teste eklenir | `addFromPool` | Geçer |
| PDF kırpıcı | Modal veya sağ panel | `CropStudioModal` / `PdfPanel` | Geçer |
| ~~Boş soru~~ | Görsel olmayan soru yaratmamalı | Buton → PDF kırpıcı | **Düzeltildi** |
| Şablon / 4-6 / kapak / AK | A4 önizleme güncellenir | `A4Document` | Geçer |
| Yazdır | `window.print` + A4 stilleri | `printA4Local()` → `#tm-a4-page` | Geçer* |
| PDF indir | html2pdf blob | `downloadPdfLocal` | Geçer* |
| Bulut PDF | API + Appwrite | `isCloudPdfConfigured` | Ortam** |
| Tarama kaydet | IndexedDB | `taramaPut` | Geçer |
| Reçete deposu | IndexedDB | `recetePut` | Geçer |
| Öğrenciye gönder | Fascicle localStorage | `appendAssigned` + tam AK | Geçer |
| Matrix | Modal | `MatrixModal` | Geçer |
| Sıfırla | Tüm state temiz | `doReset` | Geçer |

\* Soru listesi boşken toast; en az bir görsel soru gerekir.  
\*\* `APPWRITE_*` yoksa buton soluk + tooltip.

### 2. Soru Havuzu (`/dashboard/test-maker/havuz`)

| Özellik | Sonuç |
|---------|--------|
| v2 başlık + metrikler | Uygulandı |
| Müfredat filtresi | Geçer |
| Cevap güncelle / sil / temizle | Geçer |
| Kırpıcıya link | Geçer |

### 3. Otomatik Kırpıcı (`/dashboard/test-maker/kirpici`)

| Özellik | Sonuç |
|---------|--------|
| v2 başlık | Uygulandı |
| PDF yükle / kırp / otomatik tarama | Geçer (mevcut hook) |
| Havuza kaydet | `bulkAddToPool` | Geçer |
| Hatalı havuz | `SaveWrongPoolDialog` | Geçer |

### 4. Navigasyon

| Özellik | Sonuç |
|---------|--------|
| Alt menü yalnızca sidebar | `TestMakerNav` kaldırıldı |
| Layout `test-maker-v2.css` | Import edildi |

---

## Bilinen sınırlamalar

1. **Bulut PDF** — Sunucuda Appwrite yapılandırması yoksa çalışmaz; yerel yazdır/indir kullanın.
2. **Öğrenci eşleştirme** — `findStudentIdByCanonical` yalnızca yerel öğrenci listesindeki ad/kod formatlarıyla eşleşir; farklı etiketlerde manuel seçim gerekir.
3. **Konu çözümleme** — `resolveConfigFromLabels` tam eşleşme veya kısmi `includes`; belirsiz etiketlerde ilk konuya düşebilir.
4. **Tarama + reçete aynı anda** — `taramaEditId` öncelikli; ikisi birlikte intake edilmez.

---

## Otomatik testler

```bash
npx vitest run lib/test-maker/__tests__/resolve-config.test.ts
```

Sonuç: **3 passed**.

---

## Manuel kontrol listesi (önerilen)

1. Kırpıcıdan 2 soru havuza kaydet → Havuzda görün → Test Oluşturucuda havuzdan ekle.
2. Test Oluşturucuda PDF yükle → sağ panelden veya «PDF kırpıcı» ile kırp → A4’te görünsün.
3. Tüm sorulara A–E cevap ver → Tarama kaydet → Tarama deposundan düzenle → ders/konu select’leri dolu mu?
4. Yazdır ve İndir (soru varken).
5. Reçete Yaz → Test Maker’a gönder → öğrenci + sorular gelsin.
6. Sidebar: Test Maker altında tek menü; sayfa içi tab yok.

---

## Değişen dosyalar (özet)

- `components/test-maker/test-maker-page.tsx` — v2 UI, arşiv sync, PDF indir, boş soru kaldırıldı
- `components/test-maker/havuz-page.tsx`, `kirpici-page.tsx` — v2 kabuk
- `components/test-maker/tm-ui.tsx`, `styles/test-maker-v2.css`
- `lib/test-maker/resolve-config.ts` + test
- `app/(coach)/dashboard/test-maker/layout.tsx`
- `components/yks-sim/net-sihirbazi-page.tsx` — `Button variant="ghost"` (typecheck)

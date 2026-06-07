# Hata Reçetesi modülü

Koç panelinde üç sayfa: **Hatalı Soru Havuzu**, **Reçete Yaz**, **Reçete Deposu**.

## Rotalar

Navigasyon **yalnızca koç sidebar** alt menüsündedir; sayfa içinde üst sekme yok.

| Sayfa | Rota |
|--------|------|
| Hatalı Soru Havuzu | `/dashboard/hata-recetesi/havuz` |
| Reçete Yaz | `/dashboard/hata-recetesi/recete-yaz` |
| Reçete Deposu | `/dashboard/hata-recetesi/recete-deposu` |

## Veri kaynakları

| Veri | Depo | Anahtar / DB |
|------|------|----------------|
| Hatalı sorular | localStorage | `derece_hatali_soru_havuzu` |
| Reçete → Test Maker | localStorage (tek kullanım) | `aktarilanReceteSorulari`, `receteOgrenciAdi` |
| Görüşme handoff | sessionStorage | `aktarilanOgrenci` |
| Reçete arşivi | IndexedDB | `derece_recete_deposu` / `receteler` |
| Öğrenciye gönderim | localStorage | `assigned_fascicles_{ogrenciId}` |
| Müfredat | `data/yks-mufredat.json` | `@/lib/mufredat` |
| Öğrenciler | — | `@/lib/students/storage` |

## Kod yapısı

- `lib/hata-recetesi/` — types, storage, transfer, recete-db, filters, stats
- `components/hata-recetesi/` — sayfalar ve paylaşılan UI
- Test Maker: **Reçete deposuna kaydet**, reçete transfer intake, kırpıcı → hatalı havuz

## Test Maker köprüsü

1. Reçete Yaz → seçili sorular → `saveReceteToTestMaker` → `/dashboard/test-maker/olusturucu`
2. Test Oluşturucu → **Reçete deposuna kaydet** → IndexedDB
3. Reçete Deposu → Düzenle → `transfer_recete_edit` → Test Maker yükler

## Faz 2 (yapılmadı)

- Deneme/MR'den otomatik havuza ekleme
- Reçete Yaz “Son 3 deneme” filtresi (`examId`)

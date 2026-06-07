# Kurumsal Deneme Modülü

Kurum içi deneme yönetimi (`scope: "kurumsal"`). Global deneme takvimi ayrı epic’tir.

## Rotalar

| Rota | Yetki |
|------|--------|
| `/dashboard/denemeler/kurumsal` | Koç / admin |
| `/ogrenci/kurum-denemeler` | Öğrenci (salt okunur) |

## Veri (MVP)

- **localStorage:** `kurum_denemeler_v1` (birincil), `kurumsalExams` (alias)
- **Legacy merge:** `exams` havuzundan global olmayan kayıtlar `loadExamsBuckets()` ile birleştirilir
- **Sonuçlar:** `examResults` — silme cascade yok

## API (doğrulama + sözleşme)

| Method | Path |
|--------|------|
| GET | `/api/exams/kurumsal?search=&durum=&sinav=` |
| POST | `/api/exams/kurumsal` |
| GET/PATCH/DELETE | `/api/exams/kurumsal/:id` |
| GET | `/api/exams/kurumsal/upcoming` |
| GET | `/api/exams/kurumsal/excel-template?sinav=TYT` |

Kalıcı yazma MVP’de istemci `upsertKurumDeneme` ile yapılır; API zenginleştirilmiş gövde döner.

## Durum kuralları

- `matrixPct` = dolu cevap / `soruSayisi`
- `pdfYuklu` = `pdfUrl` veya `pdfName`
- `aktif` = %100 matris + PDF
- `taslak` = aksi
- `tamamlandi` = açıkça işaretlenmişse

## Ortam / storage (ileri faz)

```env
# Örnek — Appwrite veya S3 entegrasyonu için
NEXT_PUBLIC_APPWRITE_ENDPOINT=
APPWRITE_API_KEY=
APPWRITE_BUCKET_DENEME=deneme_deposu
```

PDF yükleme: `POST /api/exams/kurumsal/:id/pdf` (henüz MVP’de data URL).

## Migrasyon

Üç kaynak birleştirilir: `lib/exams/migrate-kurum.ts` → `loadKurumDenemelerMerged()`.

## İlgili modüller

- **Sonuç yükleme:** `loadExamsBuckets()` → optgroup “Kurumsal Denemeler”
- **Analiz / MR:** `konu[]` matrisi

## Test

```bash
npm run test -- lib/exams/enrich-exam.test.ts
```

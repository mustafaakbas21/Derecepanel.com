# Sonuç Merkezi

Koç/admin operasyonel sonuç paneli. Derin analiz **Analiz Merkezi** modülündedir.

## Rotalar

| Rota | Yetki |
|------|--------|
| `/dashboard/denemeler/sonuc-merkezi` | Koç / admin |
| `/dashboard/denemeler/sonuc-merkezi?examId=kd-123` | Deep link — accordion açık |
| `/ogrenci/deneme-sonuclari` | Öğrenci |

## Veri bağımlılıkları

1. **Kurumsal / Global takvim** — `loadMergedExams()`
2. **Sonuç yükleme** — `examResults` (`examResults:change` event)
3. **Karne** — `lib/karne/*` (tek kaynak, koç + öğrenci)

## API (MVP sözleşmesi)

- `GET /api/sonuc-merkezi/exams`
- `GET /api/sonuc-merkezi/kpis`

Kalıcı veri istemci `localStorage`; API doğrulama + şekil.

## Modüller

| Paket | Rol |
|--------|-----|
| `lib/scoring/four-areas.ts` | Dört alan D-Y-Net |
| `lib/scoring/score-calculator.ts` | TYT puan |
| `lib/scoring/rankings.ts` | Sıralama |
| `lib/karne/*` | Karne + sıralı liste HTML |
| `lib/export/csv-exam-results.ts` | UTF-8 BOM CSV |
| `lib/messaging/whatsapp-veli.ts` | Veli mesajı |

## Print

`public/styles/sonuc-merkezi-print.css` — karne ve sıralı liste yazdırma.

## Test

```bash
npm run test -- lib/scoring/scoring.test.ts
```

# Global Deneme Takvimi

## Rotalar

| URL | Yetki |
|-----|--------|
| `/dashboard/denemeler/global-takvim` | Koç / admin |
| `/dashboard/global-deneme-takvim` | Redirect → global-takvim |
| `/ogrenci/global-deneme` | Öğrenci (salt okunur) |

## Kurumsal farkı

| | Kurumsal | Global |
|--|----------|--------|
| UI | Yönetim listesi | Takvim kokpiti + yaklaşan tablo |
| Storage | `kurum_denemeler_v1` | `global_exams_live` (+ mirror) |
| ID | `kd-*` | `gd-*` |
| Katılımcı | examResults sayımı | **0 sabit** |
| Excel (wizard) | Aktif | **Gizli** (referans parity) |

## Veri

`persistGlobalExams` üç anahtarı yazar:

- `global_exams_live` (canonical)
- `global_denemeler_v1`
- `globalExams`

Event: `globalDenemeler:updated`

## API

- `GET /api/exams/global`
- `PUT /api/exams/global` — body: `GlobalExam[]`

## Wizard

`KurumDenemeWizardModal` + `context="global"` — `data-dnm-context="global"`.

## Downstream

`loadMergedExams()` — upload, analiz, sonuç merkezi.

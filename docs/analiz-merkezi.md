# Analiz ve Raporlama Merkezi (BETA)

## Rota

| URL | Yetki |
|-----|--------|
| `/dashboard/analiz-merkezi` | Koç / admin |
| `?examId=kd-123` | Deep link — sınav seçili |
| `?examId=kd-123&tab=2` | Bireysel sekme |
| `exam` alias | `examId` ile aynı |

## Sonuç Merkezi farkı

| | Analiz Merkezi | Sonuç Merkezi |
|--|----------------|---------------|
| Amaç | Dashboard, trend, otonom | Tablo, karne, sıralı liste |
| BETA modal | Her ziyaret (dismiss yok) | Yok |
| Export | Yazdır / PDF (Sonuç Merkezi modal motoru) | Yazdır / PDF + CSV sınav sonuçları |

## Veri

- `hydrateFromLocalStorage()` — `kurum` + `global` merged exams + `examResults`
- `AnalizMerkeziLS` — trend, tahmin +3
- `buildPriorityList` — sınıf doğru oranı < %50
- `buildStudentSubjectBreakdown` — Tab2 konu bar + drill-down
- `calculateSubjectMastery` + `summarizeCrossMastery` — Tab5 cross
- Matrix: `derece_exam_matrix_v1`, `derece_exam_results_matrix_v1`
- Canlı yenileme: `examResults:change`, `onExamsChange`, 1 sn interval, focus/visibility

## Grafik envanteri (Recharts)

| # | Grafik | Tab | Bileşen | Container ID |
|---|--------|-----|---------|--------------|
| 1 | Stacked bar şube | 1 | `ClassBarChart` | `am-chart-classes` |
| 2 | Gauge list | 1 | CSS progress | `am-chart-gauges` |
| 3 | Vertical bar konu | 2 | `SubjectVerticalBarChart` | `am-chart-subjects` |
| 4 | Radar yetkinlik | 2 | `CompetencyRadarChart` + `VersusPills` | `am-chart-radar` |
| 5 | Line trend+forecast | 2 | `TrendLineChart` | `am-chart-trend` |
| 6 | Heatmap grid | 4 | CSS grid | `am-heatmap` |
| 7 | Cross radar | 5 | `CrossRadarChart` | `am-chart-cross-radar` |
| 8 | Cross subjects bar | 5 | `CrossSubjectsBarChart` | `am-chart-cross-subjects` |

## BETA UX

1. Sidebar: iki satır + amber pill (`NavAnalizBetaLink`)
2. Hero rozeti + H1
3. Modal: mount + `pageshow` (BFCache), **localStorage dismiss yok**

## Test checklist

- [ ] Her girişte BETA modal; refresh tekrar
- [ ] BFCache geri → modal
- [ ] Sınav yok → empty
- [ ] Tab 1 skeleton 1.5s → KPI + grafikler
- [ ] Tab 2 versus pill + konu drill-down
- [ ] Tab 3 yalnız <%50; kritik satır renkleri
- [ ] Tab 4 öğrenci yok → uyarı; heatmap renkleri
- [ ] Tab 5 cross KPI badge + radar + bar + geniş tablo
- [ ] `?examId=&tab=2`
- [ ] Upload sonrası pano güncellenir (1 sn içinde)

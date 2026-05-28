# Randevular modülü

Koç ve öğrenci panellerinde görüşme planlama; veri `localStorage` üzerinde, ESKİ Derecepanel ile uyumlu.

## Depolama

| Anahtar | Açıklama |
|---------|----------|
| `appointments` | Ana randevu dizisi (JSON) |
| `derecepanel_randevular_v2` | Legacy; ilk okumada `appointments`’a migrate edilir |
| `student_notifications_{studentId}` | Öğrenci bildirimleri |
| `currentUser` | Öğrenci oturumu (öğrenci sayfası) |

Değişiklik sonrası: `window.dispatchEvent(new CustomEvent("appointments:change"))`.

## Veri modeli (`Appointment`)

- `id`: `rnd-{timestamp}`
- `studentId`: öğrenci kataloğu ile eşleşen stabil kimlik
- `ogrenci`: görünen ad (snapshot)
- `tarih`: ISO `YYYY-MM-DD`
- `saat`: `HH:mm`
- `sure`: 30 \| 45 \| 60 \| 90 (varsayılan 45)
- `tip`: `yuz_yuze` \| `online` \| `telefon`
- `status`: `bekliyor` \| `tamamlandi` \| `iptal`
- `konu`, `notlar` (yalnızca koç), `yer` (adres veya meeting link)
- `ts`: başlangıç zamanı (ms)

## Durum (UI)

- `iptal` → İptal
- `tamamlandi` → Tamamlandı
- `bekliyor` + `ts < now` → efektif tamamlandı, rozet **Geçmiş**
- `bekliyor` + `ts >= now` → Bekliyor / Yaklaşan filtrede

Haftalık grafik: iptal hariç; hafta Pazartesi 00:00 – Pazar 23:59.

## Rotalar

| Rol | Route |
|-----|--------|
| Koç | `/dashboard/randevular` |
| Öğrenci | `/ogrenci/randevular` |

## Kod yapısı

- `lib/appointments/` — tipler, storage, utils, `useAppointments()`
- `components/appointments/` — koç ve öğrenci UI
- `components/coach/upcoming-appointments-card.tsx` — ana panel KPI

## Öğrenci eşleştirme

`currentUser` alanları + katalog id + normalize edilmiş `ogrenci` adı ile `appointments` filtrelenir.

## WhatsApp

- Form önizleme: test numara `905000000000`
- Kart / toplu: öğrenci `phone` \| `telefon` \| `gsm` \| `parentPhone` (TR `90…` normalize)

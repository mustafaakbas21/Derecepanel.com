# YKS Simülasyon Modülü

## Rotalar (koç)

| Sayfa | URL |
|--------|-----|
| Tercih Sihirbazı | `/dashboard/yks-sim/tercih-sihirbazi` |
| Net Sihirbazı | `/dashboard/yks-sim/net-sihirbazi` |
| Puan Hesaplama | `/dashboard/yks-sim/puan-hesaplama` |
| YKS Konuları | `/dashboard/yks-sim/yks-konulari` |

## Rotalar (öğrenci)

`/ogrenci/yks-sim/…` — aynı dört sayfa.

## Veri

`lib/yks-sim/data-provider.ts` — `data/` → `ESKİ DERECEPANEL/Derecepanel21/` → kök JSON.

## Köprü

`lib/yks-sim/student-sim-bridge.ts` — `StudentSimBridge` / legacy `DereceOgrenciSimBridge` uyumlu API.

## Puan Hesaplama

Atlas JSON **okunmaz**; yalnızca scoring modülleri + UI config.

| Dosya | Rol |
|--------|-----|
| `lib/scoring/score-calculator.ts` | Net, TYT/AYT ham, OBP, yerleştirme (0,40 / 0,60) |
| `lib/scoring/rank-curves.ts` | Tahmini sıra eğrileri (resmi ÖSYM değil) |
| `lib/yks-sim/puan-hesaplama-config.ts` | `PH_CARDS` — ders satırları, `data-w` / `data-q` |
| `lib/yks-sim/puan-hesaplama-engine.ts` | `computePuanHesaplama` — saf hesap motoru |
| `components/yks-sim/puan-hesaplama-page.tsx` | 5 kart giriş + 5 çıktı kutusu |

**TYT sırası:** Türkçe → Matematik → Sosyal → Fen (`calculateTYTScore` ile uyumlu).

**Çıktılar:** TYT (ham+OBP), SAY/EA/SÖZ/DİL (yerleştirme). `pickPrimaryTipi` en yüksek yerleştirmeyi seçer.

**Tercih köprüsü:** `localStorage` anahtarı `derecepanel_tercih_from_puan_v1`

```json
{
  "v": 1,
  "ts": 1730000000000,
  "primaryPuanTipi": "SAY",
  "obpContribution": 48,
  "puanlar": { "TYT": 350, "SAY": 420, "EA": null, "SÖZ": null, "DİL": null },
  "ham": { "tyt": 99, "say": 180, "ea": null, "soz": null, "ydt": null }
}
```

Tercih Sihirbazı: `consumeTercihFromPuanPayload()` → puan tipi + banner.

## API

`GET /api/yks-sim/atlas` — program arama (koç + öğrenci okuma).

## RBAC

- Koç/admin: `sessionStorage.dp_auth_role` ≠ student
- Öğrenci: `role=student` + `localStorage.currentUser` zorunlu

# Kitap Kütüphanesi

## Rotalar

| Sayfa | URL |
|--------|-----|
| Kitap listesi & kayıt | `/dashboard/kutuphane/kitaplar` |
| Kaynak atama | `/dashboard/kutuphane/atama` |

Sidebar: **Kitap Kütüphanesi** grubu (Kitap Listesi & Kayıt, Kaynak Atama).

## Veri (localStorage)

- `derecepanel.library.books.v1` — kitap kataloğu
- `derecepanel.library.assignments.v1` — öğrenci atamaları
- Olay: `derece:library-changed`

Eski DerecePanel ile aynı anahtarlar; mevcut tarayıcı verisi taşınabilir.

## Müfredat

Ders/konu seçimi yalnızca `@/lib/mufredat` (`data/yks-mufredat.json`).

## Kaynak atama akışı

1. Öğrenci listesinde arama
2. Satıra tıklayınca modal:
   - **Sol:** Mevcut kaynaklar (ilerleme %, kaldır)
   - **Sağ:** Kütüphaneden yeni kaynak (arama, tür, ders filtresi) + hedef tarih / not

Görüşme odası handoff: `sessionStorage.aktarilanOgrenci` → atama sayfasında öğrenci ön seçilir.

## Kod

- `lib/library/*` — tipler, depolama
- `hooks/use-library.ts`
- `components/library/*`

## UI

- Birincil butonlar: `<Button variant="primary">` (slate-900). “Yeni kitap ekle” doğrudan `BookFormDialog` açar.
- Kurallar: `.cursor/rules/button-design.mdc`

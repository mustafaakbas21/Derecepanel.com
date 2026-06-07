# Deneme Sonuçları Yükleme

Route: `/dashboard/denemeler/yukleme`

## Stack

- Next.js App Router, TypeScript
- shadcn/ui + mevcut coach shell
- MVP depolama: `localStorage` (`examResults`, `examResults_{id}`, `derece_exam_matrix_v1`)
- API: sunucu tarafı ACL doğrulama + istemci persist

## API

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/exams?scope=all` | MVP stub (liste istemcide) |
| GET | `/api/students` | MVP stub |
| GET | `/api/optical-templates` | Varsayılan şablon |
| POST | `/api/optical-templates` | `.fmt` parse → JSON |
| POST | `/api/exam-results/import` | ACL + satır doğrulama |

Auth header'ları (istemci `sessionStorage` ile uyumlu):

- `x-dp-auth-role`: `coach` | `admin` | `student`
- `x-dp-auth-user-id`: koç kullanıcı id

## Ortam

Ek env gerekmez (MVP). Appwrite bağlandığında `requireCoachAuth` cookie/session ile güncellenir.

## FMT yükleme

1. Sayfada şablon kütüphanesi (Library ikonu)
2. `.fmt` dosyası yükle → IndexedDB `derecepanel_db.fmt_templates`
3. Veya `fixtures/exam-upload/sample.fmt` örneğini kullanın

## Test

```bash
npm run test
```

Fixture: `fixtures/exam-upload/tabbed-sample.txt`

## Akış

1. Hedef deneme + şablon seç
2. TXT/DAT/PRN yükle → parse (windows-1254)
3. Önizleme → eşleştir → **Kaydet** (API + localStorage + ExamMatrix)

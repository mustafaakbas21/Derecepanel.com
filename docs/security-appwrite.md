# Appwrite güvenlik kontrol listesi (üretim)

## API anahtarı

- `APPWRITE_API_KEY` yalnızca sunucu ortamında (Vercel secret); istemciye asla gönderilmez.
- Anahtar scope'ları minimum tutulmalı: `databases.read/write`, `users.read/write`, `sessions.write`, ilgili `storage` bucket'ları.
- `SESSION_SIGNING_SECRET` ayrı bir değer olmalı; `APPWRITE_API_KEY` ile paylaşılmamalı.

## Koleksiyon izinleri

- `students`, `users`, `panel_store` vb. koleksiyonlarda **client SDK doğrudan yazma** kapalı olmalı.
- Tüm veri erişimi Next.js API route'ları üzerinden (`node-appwrite` + API key).
- `scripts/bootstrap-appwrite.mjs` geniş `Role.users()` izinlerini üretimde gözden geçirin; gerekirse sıkılaştırın.

## Storage

- Yeni yüklemeler `owner:{userId}/` dosya adı öneki ile kaydedilir (`lib/appwrite/storage-server.ts`).
- `/api/storage/file` indirmeden önce sahiplik kontrolü yapar.
- Bucket'lar public read olmamalı.

## Oturum

- Üretimde `SESSION_SIGNING_SECRET` zorunlu.
- `ALLOW_BUILTIN_ADMIN_LOGIN` kullanmayın; kurucu girişi yalnızca `admin.derecepanel.com` subdomain üzerinden.
- Öğrenci `panelSifre` alanları bcrypt hash — migration: `npm run appwrite:migrate-passwords -- --dry-run` sonra canlı çalıştırma.

## Rate limiting

- Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) üretimde önerilir.
- Redis yoksa geliştirme ortamında bellek içi fallback kullanılır.

# Vercel ortam değişkenleri — Appwrite uyumu

Vercel Dashboard → **Project → Settings → Environment Variables** bölümüne aşağıdaki değerleri ekleyin.  
**Production** ve **Preview** için aynı Appwrite projesini kullanın.

## Appwrite Console'dan alınacaklar

1. [Appwrite Cloud](https://cloud.appwrite.io/) → proje **Derecepanel**
2. **Settings → API Credentials**
   - **Project ID** → `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - **API Endpoint** → `NEXT_PUBLIC_APPWRITE_ENDPOINT` (ör. `https://fra.cloud.appwrite.io/v1`)
3. **API Keys → Create API Key** (Server key)
   - Scopes (hepsini işaretleyin veya aşağıdaki minimum):
     - `databases.read`
     - `databases.write`
     - `users.read`
     - `users.write`
     - `sessions.write`
   - `storage.read`
   - `storage.write`
   - Anahtar `standard_...` ile başlar → `APPWRITE_API_KEY` (sadece Server, **asla** `NEXT_PUBLIC_` öneki yok)

4. **Databases** → veritabanı kimliği → `NEXT_PUBLIC_APPWRITE_DATABASE_ID` (varsayılan: `derece_panel`)

5. **Storage** → bucket kimlikleri:
   - `soru_havuzu`, `deneme_deposu` → `APPWRITE_BUCKET_ID=deneme_deposu`

## Vercel'e yapıştırılacak tablo

| Değişken | Örnek değer | Vercel tipi |
|----------|-------------|-------------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `https://fra.cloud.appwrite.io/v1` | Production, Preview |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | `derecepanel` | Production, Preview |
| `NEXT_PUBLIC_APPWRITE_PROJECT_NAME` | `Derecepanel` | Production, Preview |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | `derece_panel` | Production, Preview |
| `NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST` | `login.derecepanel.com` | Production, Preview |
| `APPWRITE_API_KEY` | `standard_...` (Appwrite'tan) | Production, Preview — **Encrypted** |
| `APPWRITE_BUCKET_ID` | `deneme_deposu` | Production, Preview |
| `SESSION_SIGNING_SECRET` | rastgele 64+ karakter | Production, Preview — **Encrypted** |
| `GROQ_API_KEY` | Groq anahtarı | Production, Preview — Encrypted |

### Önemli kurallar

- `APPWRITE_API_KEY` ve `SESSION_SIGNING_SECRET` **sunucu sırrı** — `NEXT_PUBLIC_` ile başlamamalı.
- Değerlerde **tırnak** (`"` veya `'`) kullanmayın; Vercel'e düz metin yapıştırın.
- Boş `UPSTASH_REDIS_REST_URL=""` gibi satırları Vercel'e eklemeyin; ya gerçek değer ya hiç eklemeyin.
- Env değiştirdikten sonra **Redeploy** gerekir.

## Oturum imzalama

`SESSION_SIGNING_SECRET` için terminalde:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Çıkan değeri Vercel'e `SESSION_SIGNING_SECRET` olarak ekleyin.  
Tanımlı değilse uygulama `APPWRITE_API_KEY` türevi kullanır (geçici çözüm); üretimde ayrı secret önerilir.

## Giriş e-postası host

Koç/öğrenci Appwrite hesapları şu formatta oluşturulur:

```
{kullaniciAdi}@login.derecepanel.com
```

`NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST` mutlaka `login.derecepanel.com` olmalı (`.local` veya `localhost` kullanmayın).

## Doğrulama

Yerel:

```bash
npm run appwrite:check
```

Deploy sonrası:

```
GET https://derecepanel.com/api/health/appwrite
GET https://admin.derecepanel.com/api/health/appwrite
```

Beklenen: `{ "ok": true, "configured": true, ... }`

## İlk kurulum (bir kez)

```bash
npm run appwrite:bootstrap
npm run appwrite:migrate-passwords -- --dry-run
```

Bootstrap koleksiyon ve bucket'ları Appwrite'da oluşturur; Vercel env'leri yukarıdaki tabloyla eşleşmelidir.

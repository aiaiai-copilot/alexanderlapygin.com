# `.htaccess` for Beget — Implementation Plan

> **⚠️ SUPERSEDED (2026-05-15, поздняя сессия).** План реализован, коммит `7c2b3ee feat(deploy): add public/.htaccess for Beget Apache hosting` — но под неверную предпосылку (Beget shared / Apache). Реальный хостинг — Beget VPS с Nginx; `.htaccess` молча игнорируется. Файл `public/.htaccess` удалён, конфигурация переведена в `deploy/nginx/` (см. runbook §4 и §2.5). Документ сохранён как исторический record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Положить `public/.htaccess` для Beget shared-хостинга, доставляющий security-заголовки, CSP, кэш статики, HTTPS- и www→apex-редиректы, clean URLs под `trailingSlash:'never'`, gzip/brotli и кастомную 404.

**Architecture:** Один файл `public/.htaccess` в репозитории. Astro при `astro build` копирует `public/*` в `dist/` дословно — `.htaccess` оказывается в корне deploy-артефакта и подхватывается Apache на Beget. Локально не тестируется (Vite-сервер `.htaccess` не читает); верификация — `curl -I` после деплоя.

**Tech Stack:** Apache 2.4+, mod_rewrite, mod_headers, mod_setenvif, mod_deflate, mod_brotli (опционально). Build — Astro 6.

**Source of truth:** [`docs/superpowers/specs/2026-05-15-htaccess-beget-design.md`](../specs/2026-05-15-htaccess-beget-design.md)

---

## Files

- **Create:** `public/.htaccess`
- **Modify:** `docs/spec/runbook.md` §4 — заменить пример Cloudflare `_headers` на ссылку на `public/.htaccess` как единственный источник правды.

Тестов нет: `.htaccess` исполняется только Apache, локального Apache в стеке нет. Эквивалент тестов — `curl -I` против прод-URL по списку spec §7, после первого деплоя на Beget.

---

### Task 1: Создать `public/.htaccess`

**Files:**
- Create: `/Users/alexanderlapygin/Projects/alexanderlapygin.com/public/.htaccess`

- [ ] **Step 1: Создать файл с полным содержимым**

Записать в `public/.htaccess` ровно следующее (полная финальная версия — она склеена из секций spec §5.1–§5.7):

```apache
# alexanderlapygin.com — Apache config for Beget shared hosting
# Source of truth: docs/superpowers/specs/2026-05-15-htaccess-beget-design.md
# Don't edit hosting-panel settings; this file owns all web config.

# --- 1. Options & DirectoryIndex ----------------------------------------

Options -Indexes -MultiViews +SymLinksIfOwnerMatch
DirectoryIndex index.html

# --- 2. Redirects -------------------------------------------------------

RewriteEngine On

# HTTP -> HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# www -> apex
RewriteCond %{HTTP_HOST} ^www\.alexanderlapygin\.com$ [NC]
RewriteRule ^(.*)$ https://alexanderlapygin.com/$1 [R=301,L]

# --- 3. Clean URLs (trailingSlash: 'never') -----------------------------
# Astro generates /path/index.html but emits links as /path (no slash).
# Default Apache mod_dir would 301 /path -> /path/. Block that and serve
# index.html internally:

DirectorySlash Off
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.+?)/?$ $1/index.html [L]

# --- 4. Security headers ------------------------------------------------

<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://mc.yandex.ru https://mc.yandex.com https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com; connect-src 'self' https://mc.yandex.ru https://mc.yandex.com; frame-src https://mc.yandex.ru https://mc.yandex.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"
</IfModule>

# --- 5. Cache -----------------------------------------------------------

SetEnvIf Request_URI "^/_astro/" LONG_CACHE
SetEnvIf Request_URI "^/fonts/" LONG_CACHE

<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable" env=LONG_CACHE
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>

# --- 6. Compression -----------------------------------------------------

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/xml text/plain \
    application/javascript application/json application/xml \
    image/svg+xml font/ttf application/x-font-ttf
</IfModule>

<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/xml text/plain \
    application/javascript application/json application/xml \
    image/svg+xml font/ttf application/x-font-ttf
</IfModule>

# --- 7. Error documents -------------------------------------------------

ErrorDocument 404 /404.html
```

- [ ] **Step 2: Прогнать сборку**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
npm run build
```

Expected: сборка успешна, ~20 страниц, без ошибок.

- [ ] **Step 3: Проверить, что `.htaccess` попал в `dist/`**

```bash
ls -la /Users/alexanderlapygin/Projects/alexanderlapygin.com/dist/.htaccess
diff /Users/alexanderlapygin/Projects/alexanderlapygin.com/public/.htaccess \
     /Users/alexanderlapygin/Projects/alexanderlapygin.com/dist/.htaccess
```

Expected: файл существует, `diff` пустой (Astro копирует `public/*` дословно).

- [ ] **Step 4: Прогнать typecheck (на регрессии не связанные)**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
npm run check
```

Expected: 0 errors, 0 warnings. `.htaccess` `astro check` не валидирует, но не должен сломаться.

- [ ] **Step 5: Базовая локальная валидация синтаксиса (опционально, если есть `httpd`)**

```bash
which httpd && httpd -t -f /Users/alexanderlapygin/Projects/alexanderlapygin.com/public/.htaccess 2>&1 || echo "httpd не установлен — пропускаем"
```

Expected: либо `Syntax OK`, либо «не установлен — пропускаем». Это не блокер; реальная проверка — post-deploy `curl -I`.

---

### Task 2: Обновить runbook §4 — заменить Cloudflare `_headers` на Apache `.htaccess`

**Files:**
- Modify: `/Users/alexanderlapygin/Projects/alexanderlapygin.com/docs/spec/runbook.md` §4

- [ ] **Step 1: Прочитать текущий §4**

```bash
sed -n '134,166p' /Users/alexanderlapygin/Projects/alexanderlapygin.com/docs/spec/runbook.md
```

Expected: показывает блок `_headers` для Cloudflare Pages — это исходный текст для замены.

- [ ] **Step 2: Заменить §4 на Apache-вариант**

Заменить **полный** блок §4 (от заголовка `## 4. Заголовки безопасности и CSP` до строки `---` перед `## 5. Деплой и откат`) на:

```markdown
## 4. Заголовки безопасности и CSP

Механизм доставки — Apache `.htaccess` (Beget shared, runbook §2.1). Единственный источник правды — файл [`public/.htaccess`](../../public/.htaccess) в репозитории; правки в панели хостинга **не делать**, конфигурация живёт в git.

Что доставляется:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()`
- `Content-Security-Policy` (полный текст — см. §14)
- Cache-Control для `/_astro/*` и `/fonts/*` — `public, max-age=31536000, immutable`
- Cache-Control для `*.html` — `no-cache`

Дополнительно `.htaccess` делает: HTTP→HTTPS-редирект, www→apex-редирект, внутренний rewrite для clean URLs под `trailingSlash:'never'`, gzip/brotli-компрессию, `ErrorDocument 404 /404.html`.

Дизайн файла со всеми обоснованиями — [`docs/superpowers/specs/2026-05-15-htaccess-beget-design.md`](../superpowers/specs/2026-05-15-htaccess-beget-design.md).

**Проверка после деплоя:**

```bash
curl -I https://alexanderlapygin.com/
# В ответе должны присутствовать все шесть security-заголовков
curl -I http://alexanderlapygin.com/
# 301 на https://alexanderlapygin.com/
curl -I https://www.alexanderlapygin.com/
# 301 на https://alexanderlapygin.com/
curl -I https://alexanderlapygin.com/contact
# 200 (не 301 на /contact/)
curl -I https://alexanderlapygin.com/_astro/<hash>.js
# Cache-Control: public, max-age=31536000, immutable; Content-Encoding: gzip|br
curl -I https://alexanderlapygin.com/garbage
# 404; тело — содержимое /404.html
```

Полный список верификаций — spec §7.
```

- [ ] **Step 3: Проверить, что файл корректно собирается в Markdown**

```bash
grep -n "^##\|^###" /Users/alexanderlapygin/Projects/alexanderlapygin.com/docs/spec/runbook.md | head -20
```

Expected: §4 на своём месте, заголовки последующих секций (§5, §6, …) не сдвинулись и не дублируются.

---

### Task 3: Коммит

- [ ] **Step 1: Посмотреть статус и diff**

```bash
git status
git diff --stat
```

Expected: два изменения — `public/.htaccess` (новый) и `docs/spec/runbook.md` (изменённый §4). Никаких других файлов.

- [ ] **Step 2: Закоммитить**

```bash
git add public/.htaccess docs/spec/runbook.md
git commit -m "$(cat <<'EOF'
feat(deploy): add public/.htaccess for Beget Apache hosting

Доставляет security-заголовки (HSTS/CSP/X-Frame-Options/X-Content-Type-Options/
Referrer-Policy/Permissions-Policy), HTTPS- и www→apex-редиректы, clean URLs
под trailingSlash:'never', path-based long-cache для /_astro/ и /fonts/,
gzip/brotli, ErrorDocument 404. CSP — без webvisor (decisions §5.2).

Runbook §4 обновлён: Cloudflare _headers заменён на ссылку на public/.htaccess
как единственный источник правды для web-конфигурации.

Дизайн: docs/superpowers/specs/2026-05-15-htaccess-beget-design.md
EOF
)"
```

Expected: один новый коммит, рабочее дерево чистое (кроме HANDOFF.md, который изменён ранее и не входит в этот скоуп).

---

## Что не входит в этот план (отдельные задачи)

- Приведение runbook §14 в соответствие с §4 (убрать webvisor-домены из длинного CSP).
- Настройка деплоя на Beget (FTP/SSH-публикация `dist/`, привязка домена, выпуск HTTPS-сертификата).
- Прогон верификаций (`curl -I`) — это уже **после** деплоя, фиксируется в HANDOFF.
- Подача уведомления в РКН (ст. 22 152-ФЗ).
- Создание счётчика Яндекс Метрики и заполнение `PUBLIC_METRIKA_ID`.

---

## Self-review summary

- ✅ Все 7 секций spec (§5.1–§5.7) присутствуют в Task 1, Step 1 единым блоком.
- ✅ WOFF2 не в списках mod_deflate/mod_brotli (spec §5.6).
- ✅ Path-based кэш через `SetEnvIf` (spec §5.5).
- ✅ `DirectorySlash Off` + rewrite (spec §5.3).
- ✅ Apex как канонический (spec §5.2; матч `astro.config.mjs`).
- ✅ Runbook §4 обновлён — Cloudflare-пример удалён, ссылка на `.htaccess` добавлена.
- ✅ Все типы директив и имена путей консистентны в Task 1 и Task 2.
- ✅ Нет placeholder’ов «TODO/TBD/добавить позже».

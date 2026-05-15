# Дизайн `.htaccess` для Beget

**Дата:** 2026-05-15
**Скоуп:** один файл `public/.htaccess`, который после `astro build` оказывается в корне `dist/` и публикуется на Beget shared-хостинге как Apache-конфигурация docroot.

## 1. Контекст

Прототип жил на Cloudflare Pages, где security-заголовки и кэш доставлялись через `public/_headers` (см. runbook §4). Прод-хостинг зафиксирован — **Beget shared** (runbook §2.1). На Beget веб-конфигурация задаётся через `.htaccess` (Apache; внутри у Beget типично Nginx-фронт + Apache-бэк, но контракт для разработчика — `.htaccess`). До появления `.htaccess` деплой на Beget разрешать нельзя (статика без CSP/HSTS/X-Frame-Options).

## 2. Цели

1. Доставить полный набор security-заголовков и CSP из runbook §4.
2. Привести URL-каноникализацию: HTTPS + apex-домен.
3. Сохранить декларированную в `astro.config.mjs` схему `trailingSlash: 'never'` (URL без слэша на конце).
4. Кастомная 404-страница.
5. Долгий immutable-кэш для хешированной статики; `no-cache` для HTML.
6. Gzip/Brotli-компрессия.
7. Конфигурация — единственная копия в git; никаких ручных правок в панели Beget.

## 3. Non-goals

- HSTS preload-list — отказались (decisions §3.3).
- `/.well-known/security.txt` — отказались (decisions §3.3).
- Приведение runbook §14 (длинный CSP с webvisor) в соответствие с §4 (без webvisor) — отдельная задача, оформляется одновременно или сразу после.
- Любая server-side логика (PHP, Node, обработка форм) — не входит в архитектуру (decisions §1.1).
- Содержимое настроек панели Beget — этот файл закрывает всю веб-конфигурацию.

## 4. Расположение и build-flow

- Исходник: `public/.htaccess`.
- `astro build` копирует `public/*` в корень `dist/` дословно → `dist/.htaccess`.
- Деплой публикует `dist/` в docroot Beget — `.htaccess` рядом с `index.html`.
- Локальный dev (`astro dev`) использует Vite-сервер, который `.htaccess` не читает. Это ОК — поведение проверяется только smoke-тестом против прод-URL.

## 5. Структура файла

Один `.htaccess`, top-to-bottom по логике запроса:

| Блок | Назначение | Источник правды |
|---|---|---|
| 5.1 Options | `-Indexes -MultiViews +SymLinksIfOwnerMatch`, `DirectoryIndex index.html` | — |
| 5.2 Redirects | `RewriteEngine On`; HTTP→HTTPS; www→apex | runbook §3 |
| 5.3 Clean URLs | `DirectorySlash Off` + rewrite `/path` → `/path/index.html` | astro.config.mjs (`trailingSlash: 'never'`) |
| 5.4 Security headers | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP — `Header always set` | runbook §4, §11.6 spec |
| 5.5 Cache | `SetEnvIf Request_URI ^/_astro/` и `^/fonts/` → immutable; `<FilesMatch \.html$>` → no-cache | runbook §4; spec §9.4 |
| 5.6 Compression | `<IfModule mod_deflate>` + опционально `<IfModule mod_brotli>` | — |
| 5.7 ErrorDocument | `ErrorDocument 404 /404.html` | spec §4.8 |

### 5.1 Options

```apache
Options -Indexes -MultiViews +SymLinksIfOwnerMatch
DirectoryIndex index.html
```

- `-Indexes` — не показывать листинг директорий.
- `-MultiViews` — отключить content-negotiation, чтобы `/contact` не превратилось неожиданно в `contact.html` при появлении такого файла.
- `+SymLinksIfOwnerMatch` — требование mod_rewrite на Beget shared; безопасный аналог `FollowSymLinks`.

### 5.2 Redirects

```apache
RewriteEngine On

# HTTP -> HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# www -> apex
RewriteCond %{HTTP_HOST} ^www\.alexanderlapygin\.com$ [NC]
RewriteRule ^(.*)$ https://alexanderlapygin.com/$1 [R=301,L]
```

- Два правила вместо одного объединённого — читаемее. Лишний hop возникает только при первом визите `http://www.…`; HSTS убирает http полностью.
- Apex выбран каноническим (соответствует `site:` в `astro.config.mjs`).

### 5.3 Clean URLs

```apache
DirectorySlash Off
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.+?)/?$ $1/index.html [L]
```

- Astro emits ссылки как `/contact` (без слэша), физически кладёт `dist/contact/index.html`. Без этого блока mod_dir отдал бы 301 на `/contact/` и сломал канонический URL.
- Условие `%{REQUEST_FILENAME} -d` срабатывает только для существующих директорий. Файлы вроде `/_astro/abc.js` не задеваются; root `/` отдаётся через `DirectoryIndex`.
- Регулярка `^(.+?)/?$` — `+` гарантирует, что root `/` не матчит (пустая группа не должна попасть в rewrite).

### 5.4 Security headers

```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://mc.yandex.ru https://mc.yandex.com https://yastatic.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com; connect-src 'self' https://mc.yandex.ru https://mc.yandex.com; frame-src https://mc.yandex.ru https://mc.yandex.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests"
</IfModule>
```

- CSP — версия из runbook §4 (без webvisor). Webvisor выключен (decisions §5.2).
- `Header always set` — заголовки вешаются и на 301-редиректы, и на 4xx/5xx.
- `<IfModule mod_headers.c>` — если модуль вдруг отсутствует, Apache не упадёт с 500, а пропустит блок. Гарантия отсутствия молчаливой деградации — smoke-тест (`curl -I` ожидает все шесть, runbook §6).

### 5.5 Cache

```apache
SetEnvIf Request_URI "^/_astro/" LONG_CACHE
SetEnvIf Request_URI "^/fonts/" LONG_CACHE

<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable" env=LONG_CACHE
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
```

- Кэш привязан к **пути**, не к расширению. Это защищает `/favicon.ico` (без хеша) от случайного immutable-кэша. Файлы вне `/_astro/` и `/fonts/` не получают long-cache даже если у них `.js`/`.css`.
- HTML — `no-cache` (deploy сразу виден).
- Папка `/fonts/` сейчас пустая, но правило оставлено для будущих шрифтов (runbook §4).

### 5.6 Compression

```apache
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
```

- Используется `AddOutputFilterByType` (mod_filter-совместимый); не `SetOutputFilter`.
- WOFF2 не указан в списках типов — он уже сжат своим компрессором и через mod_deflate/mod_brotli не пройдёт.

### 5.7 ErrorDocument

```apache
ErrorDocument 404 /404.html
```

- `/404.html` существует в корне `dist/` (Astro 6 генерирует автоматически).
- 403/500 не переопределяем (нет реалистичных кейсов на статике).

## 6. Edge cases

- **Отсутствие mod_rewrite** — сайт сразу 500-ит на старте (нет `<IfModule>`-обёртки). Это намеренная "громкая" деградация: HTTPS-редирект, www-канонизация и clean URLs — критичны.
- **Отсутствие mod_headers** — `<IfModule>` пропустит блок; security-заголовки и cache-control исчезнут молча. Сигнал — smoke-тест после деплоя (runbook §6).
- **Отсутствие mod_deflate/mod_brotli** — `<IfModule>` пропустит. Сайт работает, страдает производительность; видно в Lighthouse-аудите (runbook §15).
- **Запрос `http://www.alexanderlapygin.com/`** — два 301-hop (http→https, www→apex). Однократно при первом визите; HSTS впоследствии устраняет http-hop.
- **Запрос к директории без `index.html`** — `-Indexes` гарантирует 403. На сегодня таких путей нет; ErrorDocument 403 не переопределяется.

## 7. Верификация после деплоя

```bash
# 1. HTTP → HTTPS
curl -I http://alexanderlapygin.com/
# Ожидание: 301, Location: https://alexanderlapygin.com/

# 2. www → apex
curl -I https://www.alexanderlapygin.com/
# Ожидание: 301, Location: https://alexanderlapygin.com/

# 3. Root + security headers + no-cache HTML
curl -I https://alexanderlapygin.com/
# Ожидание: 200; HSTS, XCTO, XFO, Referrer-Policy, Permissions-Policy, CSP; Cache-Control: no-cache

# 4. Clean URL (без 301 на /contact/)
curl -I https://alexanderlapygin.com/contact
# Ожидание: 200, не 301

# 5. Long-cache на хешированной статике
curl -I https://alexanderlapygin.com/_astro/<реальный-hash>.js
# Ожидание: 200; Cache-Control: public, max-age=31536000, immutable; Content-Encoding: gzip|br

# 6. 404
curl -I https://alexanderlapygin.com/garbage
curl https://alexanderlapygin.com/garbage | head -20
# Ожидание: 404; тело — содержимое /404.html (заголовок «Страница не найдена»)
```

Плюс прогон CSP через `csp-evaluator.withgoogle.com`: ожидается единственное предупреждение `style-src 'unsafe-inline'` (сознательный компромисс, decisions §3.2).

## 8. Что вне этого спека

- **Приведение runbook §14 к §4** (убрать webvisor-домены из §14 как «отложенное на возврат webvisor»). Отдельный коммит.
- **Подача уведомления в РКН по ст. 22 152-ФЗ** до публичного релиза (HANDOFF §3).
- **Создание счётчика Яндекс Метрики** и заполнение `PUBLIC_METRIKA_ID` (HANDOFF §3). Без него `trackGoal` — no-op; CSP уже разрешает Метрику.
- **Перенастройка CI** с `wrangler` на FTP/SSH-публикацию для Beget (HANDOFF §3).

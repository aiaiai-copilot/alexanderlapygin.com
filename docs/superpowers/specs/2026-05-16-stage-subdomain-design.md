# Design: `stage.alexanderlapygin.com` MVP

**Date:** 2026-05-16
**Status:** Approved (юзер подтвердил все 5 секций брейншторма)
**Scope:** MVP-stage. CI/CD на GitHub Actions, удаление `wrangler`/Cloudflare Pages, push коммитов в `origin/main` — out of scope этой итерации.

## Контекст и мотивация

В сессии 2026-05-15 был случайно публикован «полуфабрикат» (текущий `main` HEAD) на `https://alexanderlapygin.com/` и через ~20 минут откачен. После отката зафиксировано архитектурное решение (memory `staging-architecture`):
- Новый Astro-сайт развивается на отдельном subdomain'е `stage.alexanderlapygin.com`, поднятом на том же Beget VPS (`84.54.29.190`), что и prod.
- Cloudflare Pages-прототип выводится из эксплуатации (одно staging-окружение, не два). Удаление — отдельной итерацией.

Цели MVP-stage:
1. Дать публично доступный URL `https://stage.alexanderlapygin.com/` с текущим состоянием нового Astro-сайта.
2. Сохранить prod (`https://alexanderlapygin.com/` — старый React-сайт) полностью нетронутым.
3. Воспроизвести инфра-parity с prod: тот же nginx, тот же SBP-бэкенд (изолированный инстанс), тот же TLS-стек.
4. Гарантировать, что stage не попадает в поисковую индексацию.

Не-цели MVP-stage:
- Ограничение доступа (Basic Auth, IP-allowlist) — по решению юзера: noindex достаточно.
- Автоматизация деплоя (GitHub Actions). Первый деплой и последующие — ручные по runbook'у.
- Изоляция SBP-кода между prod и stage (общий `WorkingDirectory` и `dist/server.js`, разные `EnvironmentFile`'ы — единый код, разный env).
- Изменение Astro-build'а под stage URL — `SITE_URL` остаётся `https://alexanderlapygin.com`, canonical из stage указывают на prod (stage = «как будет в prod»; noindex покрывает SEO).
- Подача уведомления в РКН по ст. 22 152-ФЗ — этот шаг нужен только перед публичным cutover'ом stage→prod, когда `alexanderlapygin.com` начнёт принимать персональные данные через форму.

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| Subdomain под `alexanderlapygin.com` или другой root | `stage.alexanderlapygin.com` под apex | Решение `staging-architecture`, parity с prod |
| TLS cert: отдельный, SAN-expand, wildcard | **Отдельный (X1)** — `live/stage.alexanderlapygin.com/` | Изоляция renewal-сбоев; легко удалить cert при выводе stage |
| Без cert'а / HTTP-only stage | **Невозможно** | HSTS на apex с `includeSubDomains; max-age=63072000` записан в браузеры пользователей; HTTP-only stage будет блокирован клиентским HSTS-кэшем |
| Файловая структура nginx-конфигов | **A1** — отдельный sibling `deploy/nginx/alexanderlapygin-stage.conf` | Матчит nginx-конвенцию (1 файл = 1 сайт), независимый `nginx -t`, дублирование терпимое |
| Astro `SITE_URL` для stage-build'а | **B1** — тот же что у prod | Stage = preview of prod, единый артефакт, noindex покрывает SEO |
| Certbot sequencing | **C1** — DNS → минимальный HTTP-блок → `certbot --nginx` → подмена на полный vhost | Повторяет prod-флоу из runbook §2.5 |
| Stage protection | **noindex only** | По выбору юзера; нет webhooks-exception, нет htpasswd |
| SBP-бэкенд на stage | **Отдельный systemd-юнит** `sbp-backend-stage.service`, порт 3001, отдельный `EnvironmentFile` | Изоляция state; bundle-параметризация через env (бэкенд stateless, читает `PORT`/secrets из env) |
| Stage `EnvironmentFile` location | **`/etc/sbp-backend/stage.env`** | Вне WorkingDirectory, готовит почву к перетаскиванию prod .env туда же отдельной итерацией |
| Systemd units в репо | **F1** — `deploy/systemd/sbp-backend{,-stage}.service` в репо | Source-of-truth в git; sbp-backend.service также затягивается в репо параллельно (приведение асимметрии) |
| HTML cache-control fix в prod-конфиге | **D1** — применяется в этой же сессии параллельно | Минимальный риск, закрывает гэп найденный 2026-05-15 |
| Первый stage-деплой: rebuild vs reuse `releases/20260515T204033Z/` | **G1** — свежий `npm run build` | Доказывает что pipeline работает end-to-end |
| Stage release retention | **3 последних релиза** | Защита от бесконечного накопления; диск выдержит больше |

## Архитектура

### VPS-layout (после раскатки)

```
/var/www/alexanderlapygin.com/
├── html                           → releases/<prod-RELEASE>/        (prod, не трогаем)
├── stage-html                     → stage-releases/<stage-RELEASE>/  (НОВЫЙ симлинк)
├── releases/                                                         (prod release цепочка)
│   ├── 20260515T204033Z/                                              (артефакт несостоявшегося cutover'а — сохраняется как backup до 2026-05-17 21:04 UTC)
│   └── ...
├── stage-releases/                                                    (НОВАЯ цепочка)
│   └── <TS>/                                                           (первый stage-релиз)
└── legacy/showcase/                                                   (общий между prod и stage SBP-демо)
```

Цепочки `releases/` и `stage-releases/` независимы — никаких пересечений, разные release-tag namespace'ы.

### Сервисы

| Сервис | prod | stage |
|---|---|---|
| nginx vhost | `/etc/nginx/sites-available/alexanderlapygin.com.conf` | `/etc/nginx/sites-available/alexanderlapygin-stage.conf` |
| TLS cert | `live/alexanderlapygin.com/` (apex + www SAN) | `live/stage.alexanderlapygin.com/` (отдельный lineage) |
| SBP-backend unit | `sbp-backend.service` (порт 3000) | `sbp-backend-stage.service` (порт 3001) |
| SBP-backend `EnvironmentFile` | `/var/www/.../legacy/showcase/payments/sbp/backend/.env` | `/etc/sbp-backend/stage.env` |
| SBP-backend `WorkingDirectory` | `/var/www/.../legacy/showcase/payments/sbp/backend` | (тот же — общий код) |
| nginx security headers snippet | `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` | (тот же snippet, переиспользуется как есть) |

## Stage nginx vhost — детальная спека

Файл `deploy/nginx/alexanderlapygin-stage.conf` (новый в репо), деплоится в `/etc/nginx/sites-available/alexanderlapygin-stage.conf` + симлинк в `sites-enabled/`. Полный текст:

```nginx
# stage.alexanderlapygin.com — Nginx vhost (Beget VPS, 84.54.29.190)
# Source of truth: this file in repo. Установка на VPS — в
# /etc/nginx/sites-available/alexanderlapygin-stage.conf, симлинк в
# /etc/nginx/sites-enabled/. После правки — `nginx -t && nginx -s reload`.
#
# Stage — preview-окружение для новой Astro-версии сайта. Деплой через
# stage-releases/<TS>/ + stage-html симлинк. SBP-backend — отдельный
# инстанс на 127.0.0.1:3001 (юнит sbp-backend-stage.service).
#
# noindex на server-уровне (X-Robots-Tag) + повтор во всех location'ах со
# своим add_header (nginx-footgun: add_header в location полностью отменяет
# наследование add_header из родителя).

# --- HTTP → HTTPS redirect (stage) -------------------------------------
server {
    listen 80;
    server_name stage.alexanderlapygin.com;
    return 301 https://stage.alexanderlapygin.com$request_uri;
}

# --- Main HTTPS server (stage) -----------------------------------------
server {
    listen 443 ssl http2;
    server_name stage.alexanderlapygin.com;

    ssl_certificate     /etc/letsencrypt/live/stage.alexanderlapygin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stage.alexanderlapygin.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/alexanderlapygin.com/stage-html;
    index index.html;

    include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
    add_header X-Robots-Tag "noindex, nofollow" always;

    # HTML cache-control fix (отсутствует в prod-vhost'е, применяется здесь
    # сразу; в prod-vhost'е добавляется отдельным коммитом D1).
    add_header Cache-Control "no-cache" always;

    # --- SBP backend (stage instance, порт 3001) -----------------------
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    }

    # --- Legacy showcase (общий с prod /var/www/.../legacy/) -----------
    location ^~ /showcase/ {
        root /var/www/alexanderlapygin.com/legacy;
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header X-Robots-Tag "noindex, nofollow" always;

        location ~* /backend(/|$) { return 404; }

        location ~* "/assets/.+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|svg|png|jpe?g|webp|ico)$" {
            include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
            add_header X-Robots-Tag "noindex, nofollow" always;
            add_header Cache-Control "public, max-age=31536000, immutable" always;
            try_files $uri =404;
        }

        location ~ \.html$ {
            include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
            add_header X-Robots-Tag "noindex, nofollow" always;
            add_header Cache-Control "no-cache" always;
        }

        try_files $uri $uri/index.html =404;
    }

    location ~ ^/(_astro|fonts)/ {
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location ~ \.html$ {
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-cache" always;
    }

    location / {
        try_files $uri $uri/index.html =404;
    }

    error_page 404 /404.html;
    location = /404.html {
        internal;
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-cache" always;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        text/plain text/css text/xml application/xml application/json
        application/javascript application/x-javascript image/svg+xml
        font/ttf application/x-font-ttf;
}
```

### Ключевые отличия от prod-vhost'а

| Аспект | prod | stage |
|---|---|---|
| `server_name` | `alexanderlapygin.com` (+ блок www-redirect) | `stage.alexanderlapygin.com` (без www) |
| `root` | `/var/www/.../html` | `/var/www/.../stage-html` |
| `/api/` upstream | `127.0.0.1:3000` | `127.0.0.1:3001` |
| `/showcase/` root | `/var/www/.../legacy` | `/var/www/.../legacy` (общий) |
| HTML cache-control на server-level | добавляется коммитом D1 в этой же сессии | есть с самого начала |
| `X-Robots-Tag: noindex, nofollow` | нет | на server-level + во всех location со своим add_header |
| TLS-cert lineage | `live/alexanderlapygin.com/` | `live/stage.alexanderlapygin.com/` |
| Блок www-redirect | есть (`www.alexanderlapygin.com` → apex) | нет |

## D1: HTML cache-control fix для prod-vhost'а

Параллельно со stage в файле `deploy/nginx/alexanderlapygin.com.conf` (prod) добавляется `add_header Cache-Control "no-cache" always;` на server-уровне основного HTTPS-блока (после `include security-headers`), плюс **повтор в каждом location со своим add_header** (footgun-предупреждение).

Затронутые location'ы в prod-конфиге, где надо добавить `add_header Cache-Control "no-cache" always;` повторно (или соответствующий другой Cache-Control, как сейчас):
- `^~ /api/` — уже есть свой `add_header Cache-Control "no-cache, no-store, must-revalidate"` → ничего менять не надо.
- `^~ /showcase/` → внутри: `~* /assets/...` (уже свой immutable), `~ \.html$` (уже свой no-cache). На уровне самого `/showcase/` — добавить `add_header Cache-Control "no-cache" always;` (или оставить наследование, если он один; но безопаснее повторить).
- `~ ^/(_astro|fonts)/` — уже свой immutable, не трогаем.
- `~ \.html$` — уже свой no-cache.
- `= /404.html` — уже свой no-cache.

То есть фактически: добавить `add_header Cache-Control "no-cache" always;` (а) на server-уровне HTTPS-блока prod (после `include security-headers`, до первого `location` блока), (б) внутри `^~ /showcase/` (там сейчас только snippet-include, без cache-control на этом уровне — добавляется как «не-кешировать чистые URL вроде `/showcase/payments/sbp/`»). После применения: `/contact/`, `/projects/`, `/showcase/payments/sbp/` отдаются с `Cache-Control: no-cache`, как и положено.

**Причина, почему именно так:** nginx правило inheritance гласит, что `add_header` на уровне `server` НЕ наследуется в `location`, если у того есть собственный `add_header` (включая полученный через `include`). В prod-конфиге **все** location-блоки используют `include security-headers` (который содержит add_header'ы), поэтому server-level inheritance бьёт только тот location, который НЕ использует include — это `location /` (где `try_files`). Чистые URL ходят через `location /` → server-level cache-control сработает. Для `/showcase/payments/sbp/` request идёт через `^~ /showcase/` (с include) и try_files'ится в `index.html` — НЕ переключая location selector → нужен явный add_header внутри `^~ /showcase/`.

Smoke-проверка после деплоя D1:
```bash
curl -sSI https://alexanderlapygin.com/contact/   | grep -i cache-control
curl -sSI https://alexanderlapygin.com/projects/  | grep -i cache-control
curl -sSI https://alexanderlapygin.com/_astro/... | grep -i cache-control  # должен остаться immutable
curl -sSI https://alexanderlapygin.com/showcase/  | grep -i cache-control
```

## Stage SBP backend — детальная спека

### Systemd unit

Файл в репо: `deploy/systemd/sbp-backend-stage.service`. Деплоится в `/etc/systemd/system/sbp-backend-stage.service` на VPS.

```ini
[Unit]
Description=SBP Payment Demo - Backend API (STAGE)
Documentation=https://github.com/aiaiai-copilot/showcase-sbp-payment-fullstack
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/alexanderlapygin.com/legacy/showcase/payments/sbp/backend
ExecStart=/usr/local/bin/node dist/server.js

Restart=always
RestartSec=10

Environment=NODE_ENV=production
EnvironmentFile=/etc/sbp-backend/stage.env

StandardOutput=journal
StandardError=journal
SyslogIdentifier=sbp-backend-stage

LimitNOFILE=4096

[Install]
WantedBy=multi-user.target
```

Отличия от prod-юнита: `Description (STAGE)`, `EnvironmentFile=/etc/sbp-backend/stage.env`, `SyslogIdentifier=sbp-backend-stage`. `WorkingDirectory` тот же (один код).

Параллельно в репо затаскивается копия `deploy/systemd/sbp-backend.service` (с VPS) — приведение source-of-truth к F1.

### Stage `.env`

Путь на VPS: `/etc/sbp-backend/stage.env` (вне репо — секреты не в git, даже test-mode).

```bash
PORT=3001
NODE_ENV=production
YOOKASSA_SHOP_ID=<тот же, что в /var/www/.../legacy/showcase/payments/sbp/backend/.env>
YOOKASSA_SECRET_KEY=<тот же test_... ключ, что в prod .env>
FRONTEND_URL=https://stage.alexanderlapygin.com
LOG_LEVEL=info
```

Отличия от prod `.env`: `PORT=3001`, `FRONTEND_URL=https://stage.alexanderlapygin.com`. YooKassa-ключи общие — это тестовый режим (бесплатный sandbox), реального движения денег нет. Реальные значения берутся из prod `.env` на VPS на момент развёртывания и в этот документ не выносятся.

Создание директории и файла:
```bash
install -d -m 750 -o root -g www-data /etc/sbp-backend
# Содержимое stage.env подаётся inline / через cat <<EOF (см. этап F runbook'а ниже)
chown root:www-data /etc/sbp-backend/stage.env
chmod 640 /etc/sbp-backend/stage.env
```

### Состояние, изоляция, co-existence

- Backend **stateless** — все платежи идут в YooKassa API. Никаких локальных файлов state/БД (`fs.write/mkdir` в bundled `dist/server.js` встречаются только в sonic-boom logger, который пишет в STDOUT через `StandardOutput=journal`).
- Поэтому два инстанса с одним YOOKASSA_SHOP_ID не конфликтуют — нет общего write-target'а.
- Webhook'и YooKassa возвращаются на URL, который каждый инстанс сам указал при `createPayment` (через `confirmation.return_url`), поэтому разводка корректная.
- При обновлении кода (новая версия `dist/server.js`) перезапустятся оба unit'а через `systemctl restart sbp-backend.service sbp-backend-stage.service` — общая `WorkingDirectory` обязывает к симметричному обновлению. Если в будущем понадобится разный код на prod и stage — будем разделять `WorkingDirectory`. Сейчас scope этого не требует.

## Release-структура и процедура деплоя

### Атомарный switch симлинка stage-html

```
/var/www/alexanderlapygin.com/stage-html → stage-releases/<RELEASE>/
```

`RELEASE` — UTC timestamp в формате `YYYYMMDDTHHMMSSZ` (по `date -u +%Y%m%dT%H%M%SZ`). Своя цепочка, не пересекается с prod `releases/`.

### Деплой-процедура (повторяемая, 5 шагов)

```bash
# 1. Локально: чистый build
npm run build                                                                 # → dist/

# 2. Локально: tarball
RELEASE=$(date -u +%Y%m%dT%H%M%SZ)
tar -czf /tmp/stage-${RELEASE}.tar.gz -C dist .

# 3. На VPS: создать release-директорию, развернуть
ssh root@84.54.29.190 "install -d -o www-data -g www-data /var/www/alexanderlapygin.com/stage-releases/${RELEASE}"
scp /tmp/stage-${RELEASE}.tar.gz root@84.54.29.190:/tmp/
ssh root@84.54.29.190 "tar -xzf /tmp/stage-${RELEASE}.tar.gz -C /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/ && chown -R www-data:www-data /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/"

# 4. Atomic switch симлинка stage-html
ssh root@84.54.29.190 "cd /var/www/alexanderlapygin.com && ln -sfn stage-releases/${RELEASE} stage-html.new && mv -T stage-html.new stage-html"

# 5. Smoke
ssh root@84.54.29.190 "ls -la /var/www/alexanderlapygin.com/stage-html"
curl -sSI https://stage.alexanderlapygin.com/ | head -20      # 200, X-Robots-Tag, Cache-Control
curl -s     https://stage.alexanderlapygin.com/ | grep -c '<html'   # ≥1
```

`nginx -s reload` не нужен — vhost root указывает на симлинк, nginx читает таргет при каждом запросе.

`mv -T` (POSIX rename) — атомарная замена симлинка. Между состояниями `stage-html → old` и `stage-html → new` нет промежуточного отсутствия `stage-html`.

### Smoke-набор для stage (после каждого деплоя)

```bash
curl -sSI https://stage.alexanderlapygin.com/             | grep -iE 'HTTP|x-robots|cache-control'
curl -sSI https://stage.alexanderlapygin.com/contact/     | grep -iE 'HTTP|cache-control'
curl -sSI https://stage.alexanderlapygin.com/_astro/...   # любой ассет, expect 200/404
curl -sSI https://stage.alexanderlapygin.com/showcase/    # legacy frontend, expect 200/301
curl -sS  https://stage.alexanderlapygin.com/api/health 2>&1 | head -5    # или любой реальный route
```

Браузер-проверка: открыть stage в браузере, в DevTools убедиться что `X-Robots-Tag: noindex, nofollow` и `Cache-Control: no-cache` присутствуют на HTML-страницах.

### Retention

Хранить **3 последних stage-релиза** (текущий + два предыдущих для отката). Cleanup при N+1-м деплое:

```bash
ssh root@84.54.29.190 "cd /var/www/alexanderlapygin.com/stage-releases && ls -1t | tail -n +4 | xargs -r rm -rf"
```

## Последовательность шагов (от DNS до зелёного stage)

### Этап A — DNS (действие пользователя, может занять часы)

1. **Пользователь:** в Beget DNS-панели для зоны `alexanderlapygin.com` добавить:
   ```
   stage    A    84.54.29.190    TTL: 300 (или default)
   ```
2. **Проверка:**
   ```bash
   dig stage.alexanderlapygin.com +short                # → 84.54.29.190
   dig @8.8.8.8 stage.alexanderlapygin.com +short       # из внешнего резолвера
   ```
   Ждать пока обе команды возвращают `84.54.29.190`.

**Блокатор:** этапы C-G требуют DNS. Этап B можно делать параллельно.

### Этап B — Подготовка артефактов в репо (параллельно с A)

3. Коммит 1: `deploy/nginx/alexanderlapygin-stage.conf` (новый файл, секция 2 этого spec'а).
4. Коммит 2: `deploy/nginx/alexanderlapygin.com.conf` (правка по D1 — добавить `add_header Cache-Control "no-cache" always;` на server-уровне + в `^~ /showcase/`).
5. Коммит 3: `deploy/systemd/sbp-backend-stage.service` (новый) и `deploy/systemd/sbp-backend.service` (копия с VPS).
6. Коммит 4: правка `docs/spec/runbook.md` — добавить раздел про stage-деплой (5 шагов из секции 4 spec'а) и retention.

Локальные коммиты на `main`, без push в `origin/main` (придержано из HANDOFF; добавится 4 коммита к существующим 18).

### Этап C — VPS: минимальный stage HTTP vhost для ACME (требует DNS)

7. Создать на VPS временный минимальный HTTP-only stage-vhost через heredoc:
   ```bash
   ssh root@84.54.29.190 'cat > /etc/nginx/sites-available/alexanderlapygin-stage.conf <<EOF
   server {
       listen 80;
       server_name stage.alexanderlapygin.com;
       location / { return 200 "stage-bootstrap\n"; }
   }
   EOF
   ln -sf /etc/nginx/sites-available/alexanderlapygin-stage.conf /etc/nginx/sites-enabled/
   nginx -t && nginx -s reload'
   ```
8. Smoke: `curl -sS http://stage.alexanderlapygin.com/` → `stage-bootstrap`. Если 502/connection refused — DNS ещё не дошёл, ждём.

### Этап D — certbot (требует C)

9. ```bash
   certbot --nginx -d stage.alexanderlapygin.com \
       --non-interactive --agree-tos -m alexanderlapygin@gmail.com \
       --redirect
   ```
10. Проверка:
    ```bash
    certbot certificates | grep -A4 stage
    curl -sSI https://stage.alexanderlapygin.com/      # 200 "stage-bootstrap"
    ```
11. `certbot renew --dry-run` — обе lineage (apex+www и stage) проходят.

### Этап E — Подмена временного vhost'а на полный (требует D)

12. Загрузить полный `deploy/nginx/alexanderlapygin-stage.conf`:
    ```bash
    scp deploy/nginx/alexanderlapygin-stage.conf \
        root@84.54.29.190:/etc/nginx/sites-available/alexanderlapygin-stage.conf
    ssh root@84.54.29.190 "nginx -t && nginx -s reload"
    ```
13. Прокатить D1-фикс prod-vhost'а:
    ```bash
    scp deploy/nginx/alexanderlapygin.com.conf \
        root@84.54.29.190:/etc/nginx/sites-available/alexanderlapygin.com.conf
    ssh root@84.54.29.190 "nginx -t && nginx -s reload"
    ```
14. Smoke stage: `curl -sSI https://stage.alexanderlapygin.com/` → 404 (нет ещё контента) **с правильными headers** (`X-Robots-Tag`, `Cache-Control: no-cache`, `Strict-Transport-Security`).
15. Smoke prod (нет регресса от D1): `curl -sSI https://alexanderlapygin.com/contact/` → теперь `Cache-Control: no-cache` есть.

### Этап F — SBP backend stage (требует E)

16. Установка + создание .env + старт:
    ```bash
    ssh root@84.54.29.190 "install -d -m 750 -o root -g www-data /etc/sbp-backend"
    scp deploy/systemd/sbp-backend-stage.service \
        root@84.54.29.190:/etc/systemd/system/
    # Берём YOOKASSA_SHOP_ID/SECRET_KEY из prod .env прямо на VPS (test-mode, общие)
    ssh root@84.54.29.190 'YK_SHOP=$(grep ^YOOKASSA_SHOP_ID /var/www/alexanderlapygin.com/legacy/showcase/payments/sbp/backend/.env | cut -d= -f2)
    YK_KEY=$(grep ^YOOKASSA_SECRET_KEY /var/www/alexanderlapygin.com/legacy/showcase/payments/sbp/backend/.env | cut -d= -f2)
    cat > /etc/sbp-backend/stage.env <<EOF
    PORT=3001
    NODE_ENV=production
    YOOKASSA_SHOP_ID=${YK_SHOP}
    YOOKASSA_SECRET_KEY=${YK_KEY}
    FRONTEND_URL=https://stage.alexanderlapygin.com
    LOG_LEVEL=info
    EOF
    chown root:www-data /etc/sbp-backend/stage.env
    chmod 640 /etc/sbp-backend/stage.env'
    ssh root@84.54.29.190 "systemctl daemon-reload && systemctl enable --now sbp-backend-stage.service"
    ssh root@84.54.29.190 "systemctl status sbp-backend-stage.service --no-pager | head -20"
    ssh root@84.54.29.190 "curl -sSI http://127.0.0.1:3001/ 2>&1 | head -10"
    ```
17. Проверка независимости: `systemctl status sbp-backend.service` (prod) — всё ещё active, не задели.

### Этап G — Первый stage-деплой (G1, требует E и F)

18. Все 5 шагов из «Деплой-процедуры» выше. `npm run build` локально, scp, atomic switch, smoke.

### Этап H — Финальная проверка

19. В браузере: `https://stage.alexanderlapygin.com/` — Astro-страничка, в DevTools `X-Robots-Tag: noindex, nofollow` и `Cache-Control: no-cache`.
20. `https://stage.alexanderlapygin.com/showcase/payments/sbp/` — SPA загружается, тест-платёж через test-mode YooKassa проходит, `/api/...` отвечает (3001).
21. `https://alexanderlapygin.com/` — старый React-сайт не задет; на чистых URL'ах теперь `Cache-Control: no-cache`.
22. Обновление HANDOFF (закрытие пункта «развернуть stage» и пункта «HTML cache-control fix» из «осталось недоделанным»).

## Точки риска и митигации

| Риск | Митигация |
|---|---|
| DNS лаг — может задержать сессию на десятки минут | Пользователь добавляет A-запись сразу; этапы B (репо) идут параллельно |
| certbot rate limit (5 cert'ов/FQDN/неделя) | Stage — первый раз, лимит не активен; не делать «drop & retry» без необходимости, использовать `--cert-name --force-renewal` если нужно |
| CSP `connect-src` блокирует прямые вызовы к YooKassa из SBP-frontend'а | Snippet включает `mc.yandex.ru` но не `api.yookassa.ru`; prod работает на этом же snippet'е, так что вероятно не блокирует. Митигация: проверить в DevTools на этапе H; при необходимости — отдельная правка snippet'а |
| nginx `add_header` footgun — забыть повторить snippet в location'е со своим add_header | В секции 2 vhost'а все повторения учтены; smoke-проверки в этапе E (`curl -sSI` каждой группы routes) ловят пропуски |
| Состояние SBP-бэкенда между prod и stage конфликтует | Backend stateless — нет общего write-target'а. Идентифицировано на этапе разведки |
| Общий `WorkingDirectory` — нельзя обновить код на stage без обновления на prod | По решению: вне scope. При необходимости разделения — отдельная итерация (копия `legacy/showcase/` под stage) |
| Push в `origin/main` — придержан | Не нарушаем; коммиты добавляются локально, push когда юзер скажет |
| Удаление артефактов несостоявшегося cutover'а (`releases/20260515T204033Z/`, `html-old-...`, tarball'ы) | Вне scope этой итерации; сохраняем до 2026-05-17 21:04 UTC минимум |
| YooKassa webhook'и от sandbox'а пытаются попасть на stage URL до того, как `stage.alexanderlapygin.com` существует | До этапа A любой webhook на `stage.` упадёт в DNS NXDOMAIN. Это безопасно. После — webhook'и обработает stage-instance |

## Что НЕ делается в этой итерации

- GitHub Actions workflow на push в `main` → деплой на stage.
- Удаление `wrangler` из `devDependencies` (package.json).
- Удаление/архивация Cloudflare Pages-проекта `alexanderlapygin-prototype.pages.dev`.
- Push 18+4 коммитов в `origin/main`.
- Уведомление в РКН по ст. 22 152-ФЗ (требуется только перед публичным cutover'ом stage→prod).
- Удаление артефактов несостоявшегося cutover'а (`html-old-20260515T204033Z/`, `releases/20260515T204033Z/`, локальный tarball в `backups/`).
- Изоляция SBP-кода между prod и stage (отдельная `WorkingDirectory`).
- Применение прочих nginx/CSP правок, не относящихся к stage и к D1.

Каждый из этих пунктов — самостоятельная задача, может быть взята отдельной сессией; список переходит в следующий HANDOFF.

## Готовность к фазе writing-plans

Этот spec определяет:
- WHAT — stage.alexanderlapygin.com c TLS, отдельный SBP-backend, изолированная release-цепочка, фикс HTML cache-control в prod-vhost'е.
- WHY — `staging-architecture` решение + рекомендации этого спека по каждой развилке.
- HOW — этапы A-H с конкретными командами.

Следующая фаза — `writing-plans`: разложить этапы A-H в последовательность задач с deps и checkpoint'ами, оформить как имплементационный план в `docs/superpowers/plans/`.

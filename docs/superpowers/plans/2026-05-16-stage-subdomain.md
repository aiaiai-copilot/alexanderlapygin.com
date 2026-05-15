# stage.alexanderlapygin.com MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запустить `https://stage.alexanderlapygin.com/` на том же Beget VPS, где живёт прод, с отдельным TLS-cert'ом, изолированным инстансом SBP-backend'а (порт 3001) и независимой release-цепочкой. Параллельно закрыть HTML cache-control gap в prod-vhost'е.

**Architecture:** Отдельный nginx vhost (`alexanderlapygin-stage.conf`) с отдельным cert lineage (`certbot --nginx -d stage.alexanderlapygin.com`), отдельный systemd-юнит SBP-backend'а с общим `WorkingDirectory` но изолированным `EnvironmentFile` (`/etc/sbp-backend/stage.env`), отдельная release-цепочка (`stage-releases/<TS>/` + симлинк `stage-html`). SBP-backend stateless (только YooKassa API) — два инстанса на одних test-mode ключах безопасны.

**Tech Stack:** Astro 6.3 (статика), nginx, Let's Encrypt (certbot --nginx HTTP-01), systemd, Node.js SBP-backend (на VPS), YooKassa test API.

**Spec:** `docs/superpowers/specs/2026-05-16-stage-subdomain-design.md` — там зафиксированы все архитектурные выборы и пояснения «почему».

**Prereqs до старта плана:**
- `git status` чистый, на ветке `main`. Локальная ветка `main` опережает `origin/main` на 19 коммитов (включая spec этой итерации) — push в `origin/main` придержан до отдельной отмашки.
- SSH работает: `ssh root@84.54.29.190 echo ok` → `ok`. Ключ `~/.ssh/id_ed25519`, hostkey в known_hosts (см. memory `vps-ssh-access`).
- Локально установлен Node + npm (для `npm run build`).

---

## Task 1: Создать stage nginx vhost в репо

**Files:**
- Create: `deploy/nginx/alexanderlapygin-stage.conf`

- [ ] **Step 1: Проверить, что файла ещё нет**

```bash
test ! -f deploy/nginx/alexanderlapygin-stage.conf && echo "OK, doesn't exist"
```
Expected: `OK, doesn't exist`

- [ ] **Step 2: Создать файл с полным содержимым**

Создать `deploy/nginx/alexanderlapygin-stage.conf` со следующим содержимым:

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

- [ ] **Step 3: Sanity-check содержимого**

```bash
grep -c 'server_name stage.alexanderlapygin.com' deploy/nginx/alexanderlapygin-stage.conf
grep -c 'X-Robots-Tag' deploy/nginx/alexanderlapygin-stage.conf
grep -c 'Cache-Control' deploy/nginx/alexanderlapygin-stage.conf
grep -c '127.0.0.1:3001' deploy/nginx/alexanderlapygin-stage.conf
```
Expected: `2`, `>=6` (на server + во всех location), `>=6`, `1`. nginx -t полноценно не запустить локально (нет certs, нет snippet'а) — финальная синтаксическая проверка будет на VPS в Task 7.

- [ ] **Step 4: Commit**

```bash
git add deploy/nginx/alexanderlapygin-stage.conf
git commit -m "$(cat <<'EOF'
feat(deploy/nginx): add stage vhost for stage.alexanderlapygin.com

Отдельный server-блок (HTTP → HTTPS redirect + main HTTPS) для stage-сабдомена.
SBP-backend на 127.0.0.1:3001 (отдельный systemd-юнит, см. следующий коммит).
root → /var/www/alexanderlapygin.com/stage-html.
noindex (X-Robots-Tag) на server-level + повтор во всех location'ах со своим
add_header (nginx-footgun: add_header в location отменяет наследование).
HTML cache-control применён сразу на server-level.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Применить D1 cache-control fix в prod nginx vhost

**Files:**
- Modify: `deploy/nginx/alexanderlapygin.com.conf`

- [ ] **Step 1: Найти точку вставки на server-level**

```bash
grep -n 'include /etc/nginx/snippets/alexanderlapygin-security-headers.conf' deploy/nginx/alexanderlapygin.com.conf | head -5
```
Expected: первая строка с этим include в HTTPS-блоке prod — то место, после которого вставляется server-level cache-control.

- [ ] **Step 2: Добавить `add_header Cache-Control "no-cache" always;` на server-level**

Найти в `deploy/nginx/alexanderlapygin.com.conf` блок (примерно строки 55-60):

```nginx
    # Security & CSP headers — на серверном уровне.
    # Будут перекрыты в любом location, где есть собственный add_header
    # (см. snippet — нужно include повторно).
    include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
```

Сразу после `include` строки добавить:

```nginx

    # HTML cache-control на server-уровне. Применяется к `location /`
    # (чистые URL `/contact/`, `/projects/` и т.п.). Location'ы с собственным
    # add_header (включая полученный через `include`) сбрасывают наследование
    # и должны повторять Cache-Control явно.
    add_header Cache-Control "no-cache" always;
```

Должно получиться:

```nginx
    # Security & CSP headers — на серверном уровне.
    # Будут перекрыты в любом location, где есть собственный add_header
    # (см. snippet — нужно include повторно).
    include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;

    # HTML cache-control на server-уровне. Применяется к `location /`
    # (чистые URL `/contact/`, `/projects/` и т.п.). Location'ы с собственным
    # add_header (включая полученный через `include`) сбрасывают наследование
    # и должны повторять Cache-Control явно.
    add_header Cache-Control "no-cache" always;

    # --- SBP Payment Demo backend (showcase/payments/sbp) ---------------
```

- [ ] **Step 3: Добавить cache-control внутри `^~ /showcase/`**

Найти блок (примерно строки 81-105):

```nginx
    location ^~ /showcase/ {
        root /var/www/alexanderlapygin.com/legacy;
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;

        # backend/ под любым демо — серверный код, наружу не отдаём.
```

После `include` строки добавить `add_header Cache-Control "no-cache" always;`:

```nginx
    location ^~ /showcase/ {
        root /var/www/alexanderlapygin.com/legacy;
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        # Прямые showcase URL (`/showcase/payments/sbp/` → index.html через
        # try_files) — request stays in this location, не переключается
        # на `~ \.html$`; явный no-cache нужен здесь.
        add_header Cache-Control "no-cache" always;

        # backend/ под любым демо — серверный код, наружу не отдаём.
```

- [ ] **Step 4: Verify diff**

```bash
git diff deploy/nginx/alexanderlapygin.com.conf
```
Expected: ровно две добавленные группы строк (server-level + showcase-level), оба с `add_header Cache-Control "no-cache" always;`. Никаких других изменений.

- [ ] **Step 5: Commit**

```bash
git add deploy/nginx/alexanderlapygin.com.conf
git commit -m "$(cat <<'EOF'
fix(deploy/nginx): close HTML cache-control gap on clean URLs

Чистые URL (/contact/, /projects/) ходят через location / + try_files
$uri/index.html — request stays в location /, не переключается на
~ \.html$ → HTML отдавался без Cache-Control, browser применял
heuristic caching. Аналогично /showcase/payments/sbp/ (через ^~ /showcase/
+ try_files в index.html — не матчит ~ \.html$).

Фикс: add_header Cache-Control "no-cache" always; на server-level
(подхватывается location / благодаря отсутствию у него собственного
add_header) и внутри ^~ /showcase/ (там есть свой include → наследование
от server сбрасывается).

Найдено и идентифицировано в сессии 2026-05-15 (см. HANDOFF.md тогда).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Затащить в репо оба systemd unit-файла

**Files:**
- Create: `deploy/systemd/sbp-backend.service` (копия с VPS)
- Create: `deploy/systemd/sbp-backend-stage.service` (новый)

- [ ] **Step 1: Создать директорию**

```bash
mkdir -p deploy/systemd
```

- [ ] **Step 2: Затащить prod-юнит с VPS**

```bash
scp root@84.54.29.190:/etc/systemd/system/sbp-backend.service deploy/systemd/sbp-backend.service
cat deploy/systemd/sbp-backend.service | head -30
```
Expected: содержимое prod-юнита с `WorkingDirectory=/var/www/alexanderlapygin.com/legacy/showcase/payments/sbp/backend`, `EnvironmentFile=` указывающий на `.env` рядом, `SyslogIdentifier=sbp-backend`.

- [ ] **Step 3: Создать stage-юнит**

Создать `deploy/systemd/sbp-backend-stage.service` со следующим содержимым:

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

- [ ] **Step 4: Sanity check**

```bash
grep '^EnvironmentFile=' deploy/systemd/sbp-backend.service             # prod: путь в legacy/.../.env
grep '^EnvironmentFile=' deploy/systemd/sbp-backend-stage.service       # stage: /etc/sbp-backend/stage.env
grep '^SyslogIdentifier=' deploy/systemd/*.service                       # prod: sbp-backend, stage: sbp-backend-stage
```
Expected: пути и идентификаторы отличаются ровно по этим строкам; `WorkingDirectory` совпадает (один код).

- [ ] **Step 5: Commit**

```bash
git add deploy/systemd/sbp-backend.service deploy/systemd/sbp-backend-stage.service
git commit -m "$(cat <<'EOF'
feat(deploy/systemd): track sbp-backend units in repo

Затащен в репо source-of-truth для обоих systemd-юнитов SBP-бэкенда:
- sbp-backend.service (prod, скопирован с VPS — был только там, теперь и тут)
- sbp-backend-stage.service (stage, новый: порт 3001 через
  EnvironmentFile=/etc/sbp-backend/stage.env, тот же WorkingDirectory)

Деплой на VPS — `install -m 644 deploy/systemd/<file> /etc/systemd/system/`,
далее systemctl daemon-reload.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Дополнить runbook процедурой stage-деплоя

**Files:**
- Modify: `docs/spec/runbook.md`

- [ ] **Step 1: Найти точку вставки**

```bash
grep -n '^## ' docs/spec/runbook.md | head -20
```
Expected: видим заголовки разделов. Найти раздел §2.5 (prod cutover) и точку сразу после него — там вставляется §2.6 (stage deploy).

- [ ] **Step 2: Добавить новый раздел `## 2.6 Stage-деплой` после §2.5**

Найти конец раздела §2.5 (последняя его строка перед началом следующего `## ` заголовка) и вставить:

```markdown
## 2.6 Stage-деплой (`stage.alexanderlapygin.com`)

Stage живёт на том же VPS (`84.54.29.190`), своя release-цепочка
(`stage-releases/<TS>/` + симлинк `stage-html`), не пересекается с prod.
SBP-backend — отдельный инстанс на порту 3001 (юнит `sbp-backend-stage.service`).

Полная архитектура и обоснование развилок: `docs/superpowers/specs/2026-05-16-stage-subdomain-design.md`.

### Деплой нового билда на stage (5 шагов, повторяемая процедура)

```bash
# 1. Локально: чистый build
npm run build

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
curl -sSI https://stage.alexanderlapygin.com/ | head -20      # 200 + X-Robots-Tag + Cache-Control
curl -s     https://stage.alexanderlapygin.com/ | grep -c '<html'   # ≥1
```

`nginx -s reload` не нужен — vhost root указывает на симлинк, nginx читает таргет при каждом запросе.

`mv -T` — атомарная замена симлинка через POSIX rename.

### Retention

Хранить 3 последних релиза:

```bash
ssh root@84.54.29.190 "cd /var/www/alexanderlapygin.com/stage-releases && ls -1t | tail -n +4 | xargs -r rm -rf"
```

### Smoke-набор для stage

```bash
curl -sSI https://stage.alexanderlapygin.com/             | grep -iE 'HTTP|x-robots|cache-control'
curl -sSI https://stage.alexanderlapygin.com/contact/     | grep -iE 'HTTP|cache-control'
curl -sSI https://stage.alexanderlapygin.com/_astro/...   # любой ассет
curl -sSI https://stage.alexanderlapygin.com/showcase/    # legacy frontend
curl -sS  https://stage.alexanderlapygin.com/api/health 2>&1 | head -5
```
```

- [ ] **Step 3: Проверить, что разметка не сломалась**

```bash
grep -c '^## 2\.' docs/spec/runbook.md
```
Expected: число подсекций §2.x увеличилось на 1 относительно состояния до правки. Если в файле не было §2.6 раньше — теперь есть.

- [ ] **Step 4: Commit**

```bash
git add docs/spec/runbook.md
git commit -m "$(cat <<'EOF'
docs(runbook): add §2.6 stage deploy procedure

Документирует повторяемую процедуру деплоя билда на
stage.alexanderlapygin.com (5 шагов: build → tarball → scp → atomic
symlink switch → smoke), retention 3 релиза, smoke-набор. Архитектура и
обоснование развилок — в docs/superpowers/specs/2026-05-16-stage-subdomain-design.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Запросить DNS A-запись у пользователя и дождаться propagation

**Files:** (none — внешнее действие)

- [ ] **Step 1: Спросить пользователя добавить A-запись**

Сообщить пользователю:

> Зайди в Beget DNS-панель для зоны `alexanderlapygin.com` и добавь:
> ```
> stage    A    84.54.29.190    TTL: 300
> ```
> Сообщи когда добавишь — буду проверять propagation. Beget обычно секунды-минуты, редко больше 15 минут.

- [ ] **Step 2: Дождаться подтверждения от пользователя**

После сообщения пользователя «добавил» — перейти к Step 3.

- [ ] **Step 3: Проверить propagation**

```bash
dig stage.alexanderlapygin.com +short
dig @8.8.8.8 stage.alexanderlapygin.com +short
```
Expected: обе команды возвращают `84.54.29.190`. Если возвращают пусто — подождать минуту, повторить. Если через 15 минут всё ещё пусто — попросить пользователя проверить запись в Beget-панели.

- [ ] **Step 4: Sanity-check, что VPS отвечает по этому имени на HTTP-port**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://stage.alexanderlapygin.com/ --connect-timeout 5
```
Expected: `404` (default-server nginx ответит «no host»; конкретный код может быть `400`/`404`/`200` — нам нужен сам факт ответа, не конкретный статус). Если `Connection refused` или timeout — DNS ведёт на правильный IP, но что-то не так с маршрутизацией; чинить до продолжения.

---

## Task 6: Развернуть bootstrap HTTP-only stage vhost на VPS

**Files:** (VPS-only)
- Create on VPS: `/etc/nginx/sites-available/alexanderlapygin-stage.conf` (временный bootstrap-контент)
- Create on VPS: симлинк `/etc/nginx/sites-enabled/alexanderlapygin-stage.conf`

- [ ] **Step 1: Развернуть bootstrap-конфиг через heredoc**

```bash
ssh root@84.54.29.190 'cat > /etc/nginx/sites-available/alexanderlapygin-stage.conf <<EOF
server {
    listen 80;
    server_name stage.alexanderlapygin.com;
    location / { return 200 "stage-bootstrap\n"; }
}
EOF
ln -sf /etc/nginx/sites-available/alexanderlapygin-stage.conf /etc/nginx/sites-enabled/alexanderlapygin-stage.conf
nginx -t'
```
Expected: `nginx: configuration file ... test is successful`. Если ошибка — диагностировать (опечатка в heredoc, конфликт server_name) до продолжения.

- [ ] **Step 2: Reload nginx**

```bash
ssh root@84.54.29.190 'nginx -s reload'
```
Expected: молчание (нет ошибок).

- [ ] **Step 3: Smoke снаружи**

```bash
curl -sS http://stage.alexanderlapygin.com/
```
Expected: `stage-bootstrap`. Если другое — DNS ещё не дошёл (вернуться к Task 5 Step 3), или vhost не активен (проверить `ls /etc/nginx/sites-enabled/`).

- [ ] **Step 4: Проверить, что prod не задет**

```bash
curl -sSI https://alexanderlapygin.com/ | head -5
```
Expected: `HTTP/2 200` (или 301 на canonical, как обычно у prod) — никаких изменений от добавления нового vhost'а.

---

## Task 7: Выпустить TLS cert через certbot --nginx

**Files:** (VPS-only — certbot модифицирует)
- Create on VPS: `/etc/letsencrypt/live/stage.alexanderlapygin.com/` (cert lineage)
- Modify on VPS: `/etc/nginx/sites-available/alexanderlapygin-stage.conf` (certbot добавит HTTPS server-блок)

- [ ] **Step 1: Запустить certbot**

```bash
ssh root@84.54.29.190 'certbot --nginx -d stage.alexanderlapygin.com \
    --non-interactive --agree-tos -m alexanderlapygin@gmail.com \
    --redirect'
```
Expected: вывод заканчивается `Congratulations! You have successfully enabled...` и пути к `fullchain.pem` / `privkey.pem`. Если ACME challenge не прошёл — проверить DNS (Task 5 Step 3), bootstrap-vhost (Task 6 Step 3).

- [ ] **Step 2: Проверить, что certbot lineage создан**

```bash
ssh root@84.54.29.190 'certbot certificates 2>&1 | grep -A4 "Certificate Name: stage"'
```
Expected: запись с `Certificate Name: stage.alexanderlapygin.com`, `Domains: stage.alexanderlapygin.com`, `Expiry Date: ...` (на 90 дней вперёд).

- [ ] **Step 3: Проверить, что stage отвечает по HTTPS (всё ещё bootstrap-контент)**

```bash
curl -sSI https://stage.alexanderlapygin.com/ | head -5
curl -sS https://stage.alexanderlapygin.com/
```
Expected: `HTTP/2 200`, body `stage-bootstrap`. HTTPS работает с правильным cert'ом (нет ошибки cert'а).

- [ ] **Step 4: Проверить renew для обеих lineage (apex и stage)**

```bash
ssh root@84.54.29.190 'certbot renew --dry-run 2>&1 | tail -30'
```
Expected: вывод заканчивается `Congratulations, all simulated renewals succeeded:` со списком обеих lineage (`alexanderlapygin.com` и `stage.alexanderlapygin.com`). Если что-то failed — диагностировать до продолжения; cert renewal — критичный invariant.

---

## Task 8: Подменить bootstrap-конфиг на полный stage vhost из репо

**Files:**
- Replace on VPS: `/etc/nginx/sites-available/alexanderlapygin-stage.conf` (с bootstrap на репо-версию)

- [ ] **Step 1: scp полного конфига с локали на VPS**

```bash
scp deploy/nginx/alexanderlapygin-stage.conf \
    root@84.54.29.190:/etc/nginx/sites-available/alexanderlapygin-stage.conf
```
Expected: байт-count загруженного файла.

- [ ] **Step 2: nginx -t**

```bash
ssh root@84.54.29.190 'nginx -t'
```
Expected: `syntax is ok`, `test is successful`. Если ошибка о missing cert/snippet — проверить пути в конфиге; cert lineage уже создана в Task 7, snippet существует с прошлой сессии.

- [ ] **Step 3: Reload nginx**

```bash
ssh root@84.54.29.190 'nginx -s reload'
```
Expected: молчание.

- [ ] **Step 4: Smoke headers (контент ещё не задеплоен — ждём 404 с правильными headers)**

```bash
curl -sSI https://stage.alexanderlapygin.com/ | head -20
```
Expected: `HTTP/2 404` (нет `stage-html` пока) ИЛИ `HTTP/2 500` (если symlink не существует). В headers: `x-robots-tag: noindex, nofollow`, `cache-control: no-cache`, `strict-transport-security: max-age=...; includeSubDomains`, `content-security-policy: ...`.

Если headers есть — vhost работает корректно. 404 на root'е — ожидаемо: контента ещё нет.

- [ ] **Step 5: Smoke HTTP→HTTPS redirect**

```bash
curl -sSI http://stage.alexanderlapygin.com/ | head -5
```
Expected: `HTTP/1.1 301 Moved Permanently`, `Location: https://stage.alexanderlapygin.com/`.

---

## Task 9: Раскатать D1 cache-control fix на prod

**Files:**
- Replace on VPS: `/etc/nginx/sites-available/alexanderlapygin.com.conf`

- [ ] **Step 1: Сделать бэкап текущего prod-конфига на VPS**

```bash
ssh root@84.54.29.190 'cp -a /etc/nginx/sites-available/alexanderlapygin.com.conf /root/alexanderlapygin.com.conf.pre-d1-$(date -u +%Y%m%dT%H%M%SZ).bak && ls -la /root/alexanderlapygin.com.conf.pre-d1-*.bak'
```
Expected: новый `.bak` файл создан с timestamp.

- [ ] **Step 2: scp обновлённого prod-конфига**

```bash
scp deploy/nginx/alexanderlapygin.com.conf \
    root@84.54.29.190:/etc/nginx/sites-available/alexanderlapygin.com.conf
```

- [ ] **Step 3: nginx -t**

```bash
ssh root@84.54.29.190 'nginx -t'
```
Expected: `test is successful`. Если ошибка — `cp /root/alexanderlapygin.com.conf.pre-d1-*.bak /etc/nginx/sites-available/alexanderlapygin.com.conf` (откат), диагностировать.

- [ ] **Step 4: Reload nginx**

```bash
ssh root@84.54.29.190 'nginx -s reload'
```

- [ ] **Step 5: Smoke prod чистых URL — теперь cache-control есть**

```bash
curl -sSI https://alexanderlapygin.com/         | grep -i cache-control
curl -sSI https://alexanderlapygin.com/contact/ | grep -i cache-control
curl -sSI https://alexanderlapygin.com/showcase/payments/sbp/ | grep -i cache-control
```
Expected: для всех трёх — `Cache-Control: no-cache` (или подобное no-cache). До D1 на чистых URL header'а не было; теперь есть.

- [ ] **Step 6: Smoke prod — нет регресса на других routes**

```bash
curl -sSI https://alexanderlapygin.com/_astro/ 2>&1 | grep -i cache-control       # должен оставаться immutable
curl -sSI https://alexanderlapygin.com/api/                                       # должен оставаться no-cache, no-store
```
Expected: `/_astro/` → `public, max-age=31536000, immutable` (без изменения); `/api/` → `no-cache, no-store, must-revalidate` (без изменения).

---

## Task 10: Развернуть stage SBP-backend (новый systemd-юнит)

**Files:**
- Create on VPS: `/etc/sbp-backend/` (директория)
- Create on VPS: `/etc/sbp-backend/stage.env`
- Create on VPS: `/etc/systemd/system/sbp-backend-stage.service`

- [ ] **Step 1: Создать `/etc/sbp-backend/` директорию**

```bash
ssh root@84.54.29.190 'install -d -m 750 -o root -g www-data /etc/sbp-backend && ls -la /etc/sbp-backend'
```
Expected: `drwxr-x--- 2 root www-data ... /etc/sbp-backend`.

- [ ] **Step 2: scp stage-unit**

```bash
scp deploy/systemd/sbp-backend-stage.service \
    root@84.54.29.190:/etc/systemd/system/sbp-backend-stage.service
ssh root@84.54.29.190 'chmod 644 /etc/systemd/system/sbp-backend-stage.service && head -5 /etc/systemd/system/sbp-backend-stage.service'
```
Expected: первые строки stage-юнита (`Description=SBP Payment Demo - Backend API (STAGE)`).

- [ ] **Step 3: Создать `/etc/sbp-backend/stage.env` из prod-значений**

```bash
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
chmod 640 /etc/sbp-backend/stage.env
ls -la /etc/sbp-backend/stage.env'
```
Expected: `-rw-r----- 1 root www-data ... /etc/sbp-backend/stage.env`.

- [ ] **Step 4: Sanity-check stage.env содержит правильные значения**

```bash
ssh root@84.54.29.190 'cat /etc/sbp-backend/stage.env | grep -E "^(PORT|FRONTEND_URL|YOOKASSA_SHOP_ID|YOOKASSA_SECRET_KEY)" | head -10'
```
Expected: `PORT=3001`, `FRONTEND_URL=https://stage.alexanderlapygin.com`, оба `YOOKASSA_*` непустые (тестовый shop_id и `test_...` ключ).

- [ ] **Step 5: systemd daemon-reload + enable + start**

```bash
ssh root@84.54.29.190 'systemctl daemon-reload && systemctl enable --now sbp-backend-stage.service'
```
Expected: `Created symlink ...` (от enable). Запуск тихий.

- [ ] **Step 6: Проверить статус юнита**

```bash
ssh root@84.54.29.190 'systemctl status sbp-backend-stage.service --no-pager | head -25'
```
Expected: `Active: active (running)`. Если `failed` — `journalctl -u sbp-backend-stage.service -n 50` чтобы найти причину.

- [ ] **Step 7: Проверить, что слушает 3001 и отвечает**

```bash
ssh root@84.54.29.190 'curl -sSI http://127.0.0.1:3001/ 2>&1 | head -10 || curl -sS http://127.0.0.1:3001/ 2>&1 | head -10'
```
Expected: HTTP-ответ от Fastify (любой код: 200, 404 на root — оба ОК). Если `Connection refused` — backend не стартанул, см. journalctl.

- [ ] **Step 8: Проверить, что prod-юнит не задет**

```bash
ssh root@84.54.29.190 'systemctl status sbp-backend.service --no-pager | head -5 && curl -sSI http://127.0.0.1:3000/ 2>&1 | head -5 || curl -sS http://127.0.0.1:3000/ 2>&1 | head -5'
```
Expected: prod юнит — `Active: active (running)`, порт 3000 отвечает.

- [ ] **Step 9: Проверить, что `/api/` через nginx идёт в stage-backend**

```bash
curl -sS https://stage.alexanderlapygin.com/api/ 2>&1 | head -10
```
Expected: ответ от Fastify на порту 3001 (не от 3000). Если `502 Bad Gateway` — что-то не так с upstream'ом в stage-vhost (Task 8) или backend упал.

---

## Task 11: Первый stage-деплой (G1 — свежий npm run build)

**Files:**
- Create on VPS: `/var/www/alexanderlapygin.com/stage-releases/<TS>/` (release directory)
- Create on VPS: `/var/www/alexanderlapygin.com/stage-html` (symlink)

- [ ] **Step 1: Локально — чистый build**

```bash
npm run build
ls -la dist/ | head -5
```
Expected: `dist/` содержит `index.html`, директории Astro билда. Если ошибка билда — фиксить прежде чем продолжать.

- [ ] **Step 2: Создать tarball с release timestamp**

```bash
RELEASE=$(date -u +%Y%m%dT%H%M%SZ)
echo "RELEASE=$RELEASE"
tar -czf /tmp/stage-${RELEASE}.tar.gz -C dist .
ls -la /tmp/stage-${RELEASE}.tar.gz
```
Expected: переменная `RELEASE` выставлена в текущий UTC timestamp (формат `YYYYMMDDTHHMMSSZ`); tarball создан в `/tmp/`. **Сохранить значение `$RELEASE`** для следующих шагов.

- [ ] **Step 3: Создать release-директорию на VPS**

```bash
ssh root@84.54.29.190 "install -d -o www-data -g www-data /var/www/alexanderlapygin.com/stage-releases/${RELEASE}"
ssh root@84.54.29.190 "ls -la /var/www/alexanderlapygin.com/stage-releases/${RELEASE}"
```
Expected: пустая директория с владельцем `www-data:www-data`.

- [ ] **Step 4: scp tarball'а и распаковка**

```bash
scp /tmp/stage-${RELEASE}.tar.gz root@84.54.29.190:/tmp/
ssh root@84.54.29.190 "tar -xzf /tmp/stage-${RELEASE}.tar.gz -C /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/ && chown -R www-data:www-data /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/"
ssh root@84.54.29.190 "ls /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/ | head -10"
```
Expected: `index.html`, `_astro/`, `fonts/` (если есть), прочие astro-файлы.

- [ ] **Step 5: Atomic switch симлинка stage-html**

```bash
ssh root@84.54.29.190 "cd /var/www/alexanderlapygin.com && ln -sfn stage-releases/${RELEASE} stage-html.new && mv -T stage-html.new stage-html"
ssh root@84.54.29.190 "ls -la /var/www/alexanderlapygin.com/stage-html"
```
Expected: симлинк `stage-html → stage-releases/<RELEASE>`. Никакого промежуточного состояния «нет stage-html».

- [ ] **Step 6: Smoke HTML-страницы**

```bash
curl -sSI https://stage.alexanderlapygin.com/ | head -15
curl -s https://stage.alexanderlapygin.com/ | grep -c '<html'
```
Expected: `HTTP/2 200`, headers содержат `x-robots-tag: noindex, nofollow`, `cache-control: no-cache`, `strict-transport-security: ...; includeSubDomains`. Body содержит `<html` (≥1 раз).

- [ ] **Step 7: Smoke чистого URL и asset'а**

```bash
curl -sSI https://stage.alexanderlapygin.com/contact/ 2>&1 | grep -iE 'HTTP|cache-control'
curl -sSI https://stage.alexanderlapygin.com/_astro/ 2>&1 | head -5    # любая первая ссылка из dist/_astro/
ASTRO_FILE=$(ssh root@84.54.29.190 "ls /var/www/alexanderlapygin.com/stage-releases/${RELEASE}/_astro/ | head -1")
curl -sSI "https://stage.alexanderlapygin.com/_astro/${ASTRO_FILE}" | grep -iE 'HTTP|cache-control'
```
Expected: `/contact/` → 200 + `cache-control: no-cache`; конкретный `_astro/<file>` → 200 + `cache-control: public, max-age=31536000, immutable`.

- [ ] **Step 8: Smoke /showcase/ — общий с prod**

```bash
curl -sSI https://stage.alexanderlapygin.com/showcase/ 2>&1 | grep -iE 'HTTP|cache-control|x-robots'
```
Expected: 200/301/404 (зависит от того, есть ли там index или showcase редиректит) + `x-robots-tag: noindex, nofollow` (это stage, не должен индексироваться даже через showcase).

---

## Task 12: Финальная браузерная верификация

**Files:** (никаких — ручная браузерная проверка)

- [ ] **Step 1: Открыть `https://stage.alexanderlapygin.com/` в браузере**

В Chrome/Firefox DevTools → Network → выбрать первый document-request → Headers → проверить:
- `x-robots-tag: noindex, nofollow`
- `cache-control: no-cache`
- `strict-transport-security: max-age=...; includeSubDomains`
- TLS-сертификат — для `stage.alexanderlapygin.com`, выдан Let's Encrypt.

Визуально: отображается текущий Astro-сайт (тот же, что в локальном `npm run dev`).

- [ ] **Step 2: Открыть `https://stage.alexanderlapygin.com/showcase/payments/sbp/`**

SPA должна загрузиться. Попробовать создать тест-платёж — формы YooKassa (test-mode). Проверить в DevTools → Network, что `/api/...` вызовы возвращаются `200` (приходят с stage-backend'а на 3001, но это снаружи не видно — важно, что отвечают).

- [ ] **Step 3: Открыть `https://alexanderlapygin.com/` — prod не задет**

Визуально: старый React-сайт работает как обычно.

В DevTools → Network для главной → Headers: теперь должен быть `cache-control: no-cache` (раньше его на чистых URL не было — это эффект D1 фикса в Task 9).

- [ ] **Step 4: Проверить `https://alexanderlapygin.com/contact/`**

В DevTools → Headers: `cache-control: no-cache` присутствует. Эффект D1.

- [ ] **Step 5: Опционально — проверить через CT-log, что cert виден**

```bash
curl -sS "https://crt.sh/?q=stage.alexanderlapygin.com&output=json" | head -200
```
Expected: запись с issuer = Let's Encrypt и `not_before` сегодняшней датой. Это публичный CT-log; полезно для аудита.

---

## Task 13: Обновить HANDOFF.md

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Прочитать текущий HANDOFF.md**

Прочитать `HANDOFF.md` полностью, чтобы знать формат и какие пункты «осталось недоделанным» закрыты этой сессией.

- [ ] **Step 2: Переписать HANDOFF под текущую сессию**

Использовать skill `handoff` из доступных (если есть) — он обновляет HANDOFF.md под текущую сессию автоматически. Иначе — вручную:

Заменить блок `## Session 2026-05-16` на новый раздел `## Session 2026-05-17` (или соответствующий дате выполнения плана), описывающий:

**Что сделано:**
- Развёрнут `stage.alexanderlapygin.com` на VPS: nginx vhost, TLS cert lineage, stage SBP-backend (порт 3001), release-цепочка `stage-releases/`, первый деплой.
- Применён HTML cache-control fix в prod-vhost'е (закрыт гэп из предыдущей сессии).
- Затащены в репо оба systemd-юнита (`deploy/systemd/`).
- Дополнен runbook §2.6 процедурой stage-деплоя.

**Коммиты этой сессии (новые сверх spec'а):**
- `feat(deploy/nginx): add stage vhost for stage.alexanderlapygin.com`
- `fix(deploy/nginx): close HTML cache-control gap on clean URLs`
- `feat(deploy/systemd): track sbp-backend units in repo`
- `docs(runbook): add §2.6 stage deploy procedure`

**Локальное состояние:**
- VPS: новый файл `/etc/nginx/sites-available/alexanderlapygin-stage.conf`, симлинк в `sites-enabled/`, cert lineage `live/stage.alexanderlapygin.com/`, юнит `sbp-backend-stage.service` enabled+running, `/etc/sbp-backend/stage.env`, `stage-releases/<TS>/` + симлинк `stage-html`. Prod не задет; D1-фикс активен.
- Локально: `main` опережает `origin/main` на 23 коммита (было 18 + spec + 4 этой сессии).

**Осталось недоделанным:** (что было — минус закрытое + что новое всплыло)
- ❌ ✅ Развернуть stage.alexanderlapygin.com → **сделано**.
- ❌ ✅ HTML cache-control fix → **сделано**.
- (остальное из предыдущего HANDOFF — `PUBLIC_METRIKA_ID`, уведомление РКН, push коммитов, удаление артефактов несостоявшегося cutover'а, удаление wrangler/CF Pages, GitHub Actions CI/CD).

- [ ] **Step 3: Commit HANDOFF**

```bash
git add HANDOFF.md
git commit -m "$(cat <<'EOF'
docs(handoff): update for stage.alexanderlapygin.com deployment session

stage.alexanderlapygin.com развёрнут, HTML cache-control fix в prod
применён. Из «осталось недоделанным» закрыты пункты 1 и 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Обновить memory**

Обновить (на стороне agent'а — это происходит через файлы в `~/.claude/projects/.../memory/`):
- `vps-state-snapshot.md` — добавить факт о stage-vhost'е, cert lineage, stage SBP-backend, stage release-цепочке.
- `staging-architecture.md` — пометить раздел «Что предстоит сделать» как «выполнено» для пунктов 1-5; остаётся п.6 (CI/CD).
- `MEMORY.md` — обновить однострочники.

---

## Notes / Edge Cases

### Что делать, если `npm run build` падает локально

Текущий `main` HEAD — «полуфабрикат» (см. HANDOFF). Билд должен проходить (он работал в сессии 2026-05-15 для cutover'а, build'ы лежат в `/var/www/.../releases/20260515T204033Z/`). Если падает:
- `rm -rf node_modules .astro && npm install && npm run build` — clean install
- Если всё ещё падает — диагностировать ошибку, починить локально, закоммитить fix отдельным коммитом перед Task 11.

### Если certbot rate-limit'нут

Let's Encrypt: 5 cert'ов на FQDN/неделя, 5 дубликат-renewal'ов/неделя. Stage cert берётся первый раз, лимит не активен. Если случайно нарвались (например, `certbot delete` и повторный issue несколько раз) — ждём окно (до недели) или используем `--cert-name --force-renewal` для повторного выпуска текущего lineage без нового запроса.

### Если CSP блокирует прямые YooKassa-вызовы из SBP-frontend'а

В Task 12 Step 2 при тест-платеже в DevTools Console может появиться CSP-violation для `https://api.yookassa.ru` — текущий snippet включает только `https://mc.yandex.ru/...` в `connect-src`. Если SBP-frontend ходит напрямую в YooKassa API (а не через `/api/` proxy на VPS) — добавить `https://api.yookassa.ru` в `connect-src` snippet'а. **Но** на prod'е этот же SBP-демо работает без проблем с текущим snippet'ом → значит весь трафик идёт через `/api/` proxy → snippet править не нужно. Если всё-таки нужно — это отдельный коммит к `alexanderlapygin-security-headers.conf` + `scp` snippet'а на VPS.

### Если symlink `stage-html` не существует после Task 8 Step 4

Ожидаемое поведение nginx — 500 или 404. Это норма до завершения Task 11.

### Если SBP-backend stage пишет в общую с prod дирекoturu

Бэкенд stateless по факту (sonic-boom logger → STDOUT через journal). Если в будущем появится изменение (например, локальный SQLite) — потребуется разделить `WorkingDirectory`. Сейчас риска нет.

### Cleanup при необходимости отката

Если что-то пошло не так и нужно полностью откатить stage:

```bash
ssh root@84.54.29.190 'systemctl disable --now sbp-backend-stage.service
rm /etc/systemd/system/sbp-backend-stage.service
rm -rf /etc/sbp-backend
systemctl daemon-reload
rm /etc/nginx/sites-enabled/alexanderlapygin-stage.conf
rm /etc/nginx/sites-available/alexanderlapygin-stage.conf
certbot delete --cert-name stage.alexanderlapygin.com --non-interactive
nginx -t && nginx -s reload
rm -rf /var/www/alexanderlapygin.com/stage-html /var/www/alexanderlapygin.com/stage-releases'
```

D1-фикс prod-vhost'а откатывается отдельно из `/root/alexanderlapygin.com.conf.pre-d1-*.bak`.

---

## Spec Coverage Audit

| Spec section | Covered by task(s) |
|---|---|
| Зафиксированные арх. выборы (X1 / B1 / C1 / A1 / D1 / F1 / G1 / etc.) | Task 1 (vhost A1), Task 2 (D1), Task 3 (F1), Task 11 (G1), Task 7 (X1), Task 8 (C1 final step) |
| Stage nginx vhost (детальная спека) | Task 1 (создание), Task 8 (деплой) |
| D1: HTML cache-control fix для prod | Task 2 (создание), Task 9 (деплой) |
| Stage SBP-backend systemd unit | Task 3 (в репо), Task 10 (на VPS) |
| Stage `.env` | Task 10 Step 3 |
| Release-структура + procedure | Task 4 (документация), Task 11 (выполнение) |
| Этап A (DNS) | Task 5 |
| Этап B (репо-коммиты) | Tasks 1, 2, 3, 4 |
| Этап C (bootstrap vhost) | Task 6 |
| Этап D (certbot) | Task 7 |
| Этап E (полный vhost + D1 деплой) | Tasks 8, 9 |
| Этап F (SBP-backend stage) | Task 10 |
| Этап G (первый деплой) | Task 11 |
| Этап H (финальная проверка) | Task 12 |
| Точки риска и митигации | Notes / Edge Cases |
| Что НЕ делается в этой итерации | Plan header «Goal» + Task 13 «Осталось недоделанным» |

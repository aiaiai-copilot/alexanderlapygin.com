# Runbook эксплуатации alexanderlapygin.com

Документ содержит **операционные процедуры**: конкретные команды, конфиги, пошаговые инструкции для первичной настройки и регулярных задач.

Связанные документы:
- [`spec.md`](./spec.md) — описание поведения и обязательств системы.
- [`decisions.md`](./decisions.md) — обоснования архитектурных решений.

## Содержание

1. Build-time переменные окружения
2. Выбор и первичная настройка статического хостинга
3. DNS-записи
4. Заголовки безопасности и CSP
5. Деплой и откат
6. Smoke-test
7. Регулярные задачи
8. Ротация секретов
9. Процедура обработки запросов субъекта ПДн
10. Реестр обработки ПДн (шаблон)
11. Регистрационные действия с Роскомнадзором
12. Транслитерация slug
13. Цели Метрики
14. CSP-директивы
15. Lighthouse-аудит

---

## 1. Build-time переменные окружения

Все переменные используются только при сборке статики и попадают в клиентский бандл (где это уместно). Серверных секретов в проекте нет.

Шаблон `.env.example` в репозитории:

```
# Адрес продакшен-сайта (используется в OG-URL, canonical, sitemap)
SITE_URL=https://alexanderlapygin.com

# Telegram-username для deeplink (без @, например "alexanderlapygin")
PUBLIC_TELEGRAM_USERNAME=

# Контактный email для mailto:-ссылок и подвала
PUBLIC_CONTACT_EMAIL=

# Аналитика
PUBLIC_METRIKA_ID=
```

Локальная копия `.env` (для разработки) — в `.gitignore`. Шаблон с актуальными значениями — резервная копия в 1Password или аналоге.

GitHub Actions — те же значения хранятся как Repository Secrets, инжектируются в `astro build` через step env.

---

## 2. Выбор и первичная настройка статического хостинга

### 2.1. Выбранный провайдер

**Выбранный провайдер:** **Beget VPS** (российский VPS, `84.54.29.190`, root-SSH). Уведомление в РКН по ст. 12 152-ФЗ не требуется (хостинг в РФ).

На прототипе использовался **Cloudflare Pages** (https://alexanderlapygin-prototype.pages.dev). Прототип сохраняется до миграции; продакшен — на Beget VPS.

Кандидаты — см. [`decisions.md`](./decisions.md) §1.5. На том же VPS до миграции работает старый React-сайт (`docroot /var/www/alexanderlapygin.com/html`), процедура атомарного cutover — §2.5.

**Особенность:** на VPS веб-сервер — **Nginx**, не shared-Apache. Кастомные HTTP-заголовки, CSP, redirects и cache-control задаются в nginx vhost-конфиге, не через `.htaccess`. Источник правды — [`deploy/nginx/alexanderlapygin.com.conf`](../../deploy/nginx/alexanderlapygin.com.conf) и snippet [`deploy/nginx/alexanderlapygin-security-headers.conf`](../../deploy/nginx/alexanderlapygin-security-headers.conf) в репозитории; правки на сервере вручную **не делать**, конфигурация живёт в git, на VPS попадает через `scp` + `nginx -s reload` (процедура — §2.5 шаг 2; CI-вариант — §5.1, на момент написания всё ещё описывает старую wrangler/Cloudflare-схему и подлежит переписке).

### 2.2. Требования к хостингу

- Поддержка кастомного домена.
- Штатный автоматический HTTPS-сертификат.
- **Поддержка кастомных HTTP-заголовков** (обязательно — для CSP и заголовков безопасности).
- Поддержка кастомной 404-страницы.
- Интеграция с GitHub (либо штатное Git-deployment, либо CLI/API для деплоя из GitHub Actions).

### 2.3. Шаги первичной настройки

Универсальная схема (детали зависят от провайдера, см. документацию):

1. Создать проект в провайдере, привязать репозиторий или сгенерировать API-токен для CLI-деплоя.
2. Настроить build-команду: `npm ci && npm run build`. Каталог публикации — `dist/`.
3. Указать build-time переменные окружения (см. §1) в настройках проекта на стороне провайдера.
4. Привязать кастомный домен (`alexanderlapygin.com` и `www.alexanderlapygin.com`).
5. Дождаться выпуска сертификата (обычно секунды-минуты).
6. Развернуть конфигурацию веб-сервера с кастомными заголовками (для Cloudflare Pages — `public/_headers`; для Beget VPS — nginx vhost из `deploy/nginx/`, см. §4).
7. Если провайдер не делает редирект `www → apex` (или наоборот) штатно — настроить через DNS или Page Rules.

### 2.4. Cloudflare Pages — конкретные шаги (используется на прототипе)

```bash
# Деплой из CLI:
npm install -g wrangler
wrangler login
wrangler pages deploy dist --project-name=alexanderlapygin
```

Альтернативно — Git-integration в Dashboard: подключить GitHub-репозиторий, выбрать `main` как production branch, указать build-команду и `dist/` как output.

Кастомный домен и автоматический HTTPS — в Cloudflare Dashboard → Pages → Custom Domains.

Кастомные заголовки — файл `public/_headers` (Astro копирует содержимое `public/` в корень `dist/`).

### 2.5. Beget VPS — миграция с существующего сайта

На VPS `84.54.29.190` сейчас работает старый React-сайт под `/var/www/alexanderlapygin.com/html`, обслуживаемый Nginx. Прямой `scp -r dist/* root@.../html` поверх живого docroot — недопустимо: в момент копирования сайт частично битый (часть файлов от старой версии, часть — от новой), плюс при ошибке нет отката.

Безопасный паттерн — **release-каталог + atomic switch + tarball-бэкап**. Не панель-cutover (на VPS такой кнопки нет), а атомарная файловая операция.

Все шаги — под `root@84.54.29.190` по SSH. Дальше `RELEASE=$(date -u +%Y%m%dT%H%M%SZ)` для уникальной отметки релиза.

На VPS уже работает не только корневой React-сайт, но и витрина типовых решений под `/showcase/` (три Vite-SPA: `payments/sbp/`, `oauth/simplest/`, `telegram-bot/messaging/`), плюс Node-бэкенд для SBP-демо — systemd-юнит `sbp-backend.service`, слушает `127.0.0.1:3000`, `WorkingDirectory` указан внутри docroot'а (`/var/www/alexanderlapygin.com/html/showcase/payments/sbp/backend`). Атомарный switch `html`-симлинка сломает этот путь, поэтому **перед первым cutover** showcase выносится в стабильный каталог `legacy/`. Новый nginx-конфиг (`deploy/nginx/alexanderlapygin.com.conf`) уже добавил locations `^~ /showcase/` (root → `legacy`) и `^~ /api/` (proxy → `127.0.0.1:3000`).

0. **(Только при первом cutover) Вынести showcase из docroot в `legacy/` и переконфигурировать `sbp-backend.service`.** На VPS:

   ```bash
   # Создать legacy-каталог и скопировать showcase (preserve perms/timestamps/ownership).
   # cp -a, НЕ mv: html/showcase/ остаётся как часть rollback-плана и попадёт в tarball шага 4.
   mkdir -p /var/www/alexanderlapygin.com/legacy
   cp -a /var/www/alexanderlapygin.com/html/showcase \
         /var/www/alexanderlapygin.com/legacy/

   # Бэкап текущего systemd-юнита (для отката шага 0, не cutover'а).
   cp /etc/systemd/system/sbp-backend.service \
      /root/sbp-backend.service.pre-cutover-${RELEASE}.bak

   # Переписать WorkingDirectory и EnvironmentFile на legacy/.
   # Оба значения содержат префикс /var/www/alexanderlapygin.com/html/showcase
   # — sed по литеральному префиксу заменяет на legacy.
   sed -i 's|/var/www/alexanderlapygin.com/html/showcase|/var/www/alexanderlapygin.com/legacy/showcase|g' \
       /etc/systemd/system/sbp-backend.service

   # Применить.
   systemctl daemon-reload
   systemctl restart sbp-backend.service
   systemctl status sbp-backend.service --no-pager | head -15
   ```

   Проверки:
   - `systemctl status sbp-backend.service` — `active (running)`, PID свежий.
   - `curl -fsS --max-time 5 -o /dev/null -w "localhost:3000 → HTTP %{http_code}\n" http://127.0.0.1:3000/` — ожидаем `200` (или код, который бэкенд возвращает на root path).
   - `curl -fsSI --max-time 5 https://alexanderlapygin.com/api/ | head -3` — публичный proxy через старый vhost ещё работает, ожидаем `200`. На этом этапе мы только починили путь systemd-юнита, vhost менять начнём с шага 1.

   **Зачем шаг 0 отдельно от cutover'а:** systemd-юнит `sbp-backend.service` имеет `WorkingDirectory` и `EnvironmentFile` внутри docroot. После atomic-switch'а `html → releases/${RELEASE}` (шаг 5c) эти пути сломаются — текущий процесс продолжит работать через open fd, но любой `systemctl restart` или OOM-перезапуск его положит. Вынос в `legacy/` развязывает backend от release-дерева Astro.

   **Откат шага 0 (если бэкенд лёг после миграции, не зависит от cutover'а):**

   ```bash
   cp /root/sbp-backend.service.pre-cutover-${RELEASE}.bak \
      /etc/systemd/system/sbp-backend.service
   systemctl daemon-reload && systemctl restart sbp-backend.service
   # legacy/showcase можно оставить или удалить — html/showcase/ на месте, юнит снова работает оттуда.
   ```

   На последующих deploy'ях шаг 0 **пропускается** — showcase уже в legacy/, юнит уже корректно настроен. Деплой делает только release-switch для Astro.

1. **Залить новый build в release-каталог.** На VPS:

   ```bash
   mkdir -p /var/www/alexanderlapygin.com/releases/${RELEASE}
   ```

   С локали:

   ```bash
   rsync -avz --delete dist/ root@84.54.29.190:/var/www/alexanderlapygin.com/releases/${RELEASE}/
   ```

2. **Скопировать nginx-конфигурацию на VPS** (только при первом деплое или когда `deploy/nginx/*` менялся), **без активации**:

   ```bash
   scp deploy/nginx/alexanderlapygin-security-headers.conf \
       root@84.54.29.190:/etc/nginx/snippets/
   scp deploy/nginx/alexanderlapygin.com.conf \
       root@84.54.29.190:/etc/nginx/sites-available/
   ```

   Симлинк в `sites-enabled/` **пока не делать**: старый vhost под тем же `server_name alexanderlapygin.com` всё ещё активен — параллельная активация даст конфликт `conflicting server name` или silent-выбор первого в алфавитном порядке. Активация — на шаге 5 (cutover), одновременно со снятием старого vhost'а.

   Однако синтаксис нового конфига нужно проверить заранее, не активируя его. Самый простой способ — временный отдельный test-instance:

   ```bash
   ssh root@84.54.29.190 'nginx -t -c /etc/nginx/sites-available/alexanderlapygin.com.conf' || true
   ```

   Это выдаст ошибки парсинга и `include`-резолюции; директивы уровня `http {}` (например, `gzip`) ругнутся, но это ожидаемо для отдельного фрагмента — главное, что блоков `server { ... }` нет fatal-ошибок. Точная синтаксическая проверка случится на шаге 5 после `nginx -t` поверх боевого конфига.

3. **Подготовить staging-эндпоинт для верификации.** Variant A — добавить во временный staging-vhost (отдельный файл в `sites-available/`, симлинк в `sites-enabled/`) с `server_name staging.alexanderlapygin.com;` + DNS A-запись + отдельный сертификат. Variant B (проще) — staging-vhost с `server_name _;` + `listen 8443 ssl http2;`, тот же `root /var/www/alexanderlapygin.com/releases/${RELEASE};` и тот же snippet headers. Тогда проверка через `curl -k https://84.54.29.190:8443/...`.

   Прогнать verification (полный список — §6); минимум:
   - `curl -kI https://84.54.29.190:8443/` — все шесть security-заголовков.
   - `curl -kI https://84.54.29.190:8443/contact` — 200 (не 301 на `/contact/`).
   - `curl -kI https://84.54.29.190:8443/_astro/<реальный-hash>.js` — `Cache-Control: public, max-age=31536000, immutable`, `Content-Encoding: gzip`.
   - `curl -kI https://84.54.29.190:8443/garbage` — 404, тело — `/404.html`.

   **Внимание:** правило `www → apex` на staging не сработает — server_name его не матчит, активируется только после cutover. Сертификат на staging — самоподписанный или Beget-выданный для другого имени, отсюда `-k`.

   После прохождения verification — удалить staging-vhost (или просто `unlink` симлинк из `sites-enabled/`) и `nginx -s reload`, чтобы он не остался жить параллельно с боевым.

4. **Снять резервную копию текущего docroot и активной nginx-конфигурации:**

   ```bash
   ssh root@84.54.29.190 \
     "tar -czf /root/alexanderlapygin.com-pre-cutover-${RELEASE}.tar.gz \
        -C /var/www/alexanderlapygin.com html \
        -C /etc/nginx sites-available sites-enabled snippets"
   scp root@84.54.29.190:/root/alexanderlapygin.com-pre-cutover-${RELEASE}.tar.gz ./backups/
   ```

   Хранить в двух точках (на VPS под `/root/` и локально). Не удалять минимум до 48 часов после успешного cutover.

5. **Cutover.** На VPS — три действия в одной SSH-сессии:

   ```bash
   # 5a. Снять старый vhost из sites-enabled (точное имя файла — из шага 4 бэкапа)
   OLD_VHOST=$(ls /etc/nginx/sites-enabled/ | grep -i alexanderlapygin)
   unlink /etc/nginx/sites-enabled/${OLD_VHOST}

   # 5b. Активировать новый vhost
   ln -sfn /etc/nginx/sites-available/alexanderlapygin.com.conf \
           /etc/nginx/sites-enabled/

   # 5c. Переключить docroot
   cd /var/www/alexanderlapygin.com
   mv html html-old-${RELEASE}
   ln -sfn releases/${RELEASE} html

   # 5d. Валидация + reload
   nginx -t && nginx -s reload
   ```

   Шаги 5a-5c не атомарны (окно ~секунды, в течение которого сайт может отдавать 502/404). Для первого cutover (сайт без живого трафика) это приемлемо. Для последующих deploy'ев — обновляется только release-симлинк (`ln -sfn releases/${NEW} html`) через `ln -sfn` + `mv -T` (атомарный rename симлинка), без правки vhost'а и без reload nginx.

   После reload — верификация против `https://alexanderlapygin.com/` и `https://www.alexanderlapygin.com/` (второй должен дать 301 на apex). Полный smoke — §6.

6. **Откат.** Зеркально cutover'у:

   ```bash
   # 6a. Снять новый vhost, активировать старый
   unlink /etc/nginx/sites-enabled/alexanderlapygin.com.conf
   ln -sfn /etc/nginx/sites-available/${OLD_VHOST} /etc/nginx/sites-enabled/

   # 6b. Вернуть docroot
   cd /var/www/alexanderlapygin.com
   rm html
   mv html-old-${RELEASE} html

   # 6c. Reload
   nginx -t && nginx -s reload
   ```

   Если `html-old-${RELEASE}` или старый vhost уже удалены (после 48-часовой выдержки) — восстановить из tarball'а из шага 4:

   ```bash
   tar -xzf /root/alexanderlapygin.com-pre-cutover-${RELEASE}.tar.gz -C /tmp/restore
   mv /tmp/restore/html /var/www/alexanderlapygin.com/html
   cp /tmp/restore/sites-available/${OLD_VHOST} /etc/nginx/sites-available/
   ln -sfn /etc/nginx/sites-available/${OLD_VHOST} /etc/nginx/sites-enabled/
   unlink /etc/nginx/sites-enabled/alexanderlapygin.com.conf
   nginx -t && nginx -s reload
   ```

   **Что НЕ откатывается при откате cutover'а:** `/var/www/alexanderlapygin.com/legacy/showcase/` и правки `sbp-backend.service` (шаг 0). Они независимы от Astro release-switching. После отката cutover'а старый vhost снова сервит `/showcase/` из `html/showcase/` (где showcase ещё лежит — мы делали `cp -a`, не `mv`); `legacy/showcase/` становится временно неиспользуемым контентом, но бэкенд продолжает читать оттуда (что корректно). Откат шага 0 — отдельная процедура, описана в самом шаге 0; делать его только если SBP-бэкенд лёг от миграции, не как часть cutover-rollback'а.

После успешного cutover и стабильной работы в течение 48 часов — `html-old-${RELEASE}` можно удалить. Последние 2-3 каталога `releases/` сохранять как точки быстрого отката контента (`ln -sfn releases/<previous> html` — переключение за миллисекунды, без правки vhost'а). `/var/www/alexanderlapygin.com/legacy/` живёт отдельно, его release-ротация не трогает.

### 2.6. Stage-деплой (`stage.alexanderlapygin.com`)

Stage живёт на том же VPS (`84.54.29.190`), своя release-цепочка
(`stage-releases/<TS>/` + симлинк `stage-html`), не пересекается с prod.
SBP-backend — отдельный инстанс на порту 3001 (юнит `sbp-backend-stage.service`).

Полная архитектура и обоснование развилок: `docs/superpowers/specs/2026-05-16-stage-subdomain-design.md`.

#### Деплой нового билда на stage (5 шагов, повторяемая процедура)

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

#### Retention

Хранить 3 последних релиза:

```bash
ssh root@84.54.29.190 "cd /var/www/alexanderlapygin.com/stage-releases && ls -1t | tail -n +4 | xargs -r rm -rf"
```

#### Smoke-набор для stage

```bash
curl -sSI https://stage.alexanderlapygin.com/             | grep -iE 'HTTP|x-robots|cache-control'
curl -sSI https://stage.alexanderlapygin.com/contact/     | grep -iE 'HTTP|cache-control'
curl -sSI https://stage.alexanderlapygin.com/_astro/...   # любой ассет
curl -sSI https://stage.alexanderlapygin.com/showcase/    # legacy frontend
curl -sS  https://stage.alexanderlapygin.com/api/health 2>&1 | head -5
```

---

## 3. DNS-записи

Делегирование — у регистратора домена или в DNS-провайдере (Cloudflare, Yandex Cloud DNS, регистратор).

### 3.1. Базовые записи

Конкретные значения зависят от хостинга. Шаблоны:

**Если хостинг даёт IP:**

```
A     @     <IP>
A     www   <IP>
```

**Если хостинг даёт CNAME (типично для Cloudflare Pages, Netlify, Vercel):**

```
CNAME @     <provider-hostname>
CNAME www   <provider-hostname>
```

Конкретное значение `<provider-hostname>` берётся из инструкции провайдера при привязке домена.

### 3.2. Email-аутентификация — не нужна

DNS-записи SPF/DKIM/DMARC **не настраиваются** — сайт не отправляет почту. Если в будущем активируется backend-доставка через SMTP (см. §13.5 в [`spec.md`](./spec.md)) — настраиваются заново под выбранного SMTP-провайдера.

---

## 4. Заголовки безопасности и CSP

Механизм доставки — Nginx vhost-конфигурация на VPS (§2.1). Источник правды — два файла в репозитории:

- [`deploy/nginx/alexanderlapygin.com.conf`](../../deploy/nginx/alexanderlapygin.com.conf) — vhost (три server-блока: HTTP→HTTPS, www→apex, основной).
- [`deploy/nginx/alexanderlapygin-security-headers.conf`](../../deploy/nginx/alexanderlapygin-security-headers.conf) — snippet с `add_header`-директивами, который **должен подключаться через `include` в каждом location**, где есть собственный `add_header`. Это известный nginx-footgun: при появлении `add_header` во вложенном блоке наследование `add_header` из родителя отключается полностью.

Правки на сервере вручную **не делать** — конфигурация живёт в git, на VPS попадает через `scp deploy/nginx/*` + `nginx -t` + `nginx -s reload` (см. §2.5 шаг 2 и §5.1).

Что доставляется:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()`
- `Content-Security-Policy` (полный текст — см. §14)
- Cache-Control для `/_astro/*` и `/fonts/*` — `public, max-age=31536000, immutable` (location `~ ^/(_astro|fonts)/`)
- Cache-Control для `*.html` — `no-cache` (location `~ \.html$` и кастомный `/404.html`)

Дополнительно vhost делает: HTTP→HTTPS-редирект (отдельный server-блок на `listen 80`), www→apex-редирект (отдельный server-блок), внутренний `try_files $uri $uri/index.html =404` для clean URLs под `trailingSlash:'never'`, gzip-компрессию, `error_page 404 /404.html`. Brotli — опционально, если модуль собран (`nginx -V | grep brotli`).

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

---

## 5. Деплой и откат

### 5.1. CI-деплой через GitHub Actions

Workflow (`.github/workflows/deploy.yml`) на push в `main`:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` с lockfile.
3. `npm ci`
4. Линтеры, типы, unit-тесты.
5. `npm run build` (с build-time env-переменными).
6. Публикация `dist/` через CLI провайдера (например, `wrangler pages deploy dist`).
7. Smoke-test (см. §6).

Токен деплоя — в Repository Secrets.

### 5.2. Откат

**Способ 1 — UI/CLI провайдера.** Большинство статических хостингов хранят историю деплоев и позволяют откат одной командой (rollback to deployment). На Cloudflare Pages: Dashboard → Pages → Deployments → выбрать предыдущий → Rollback.

**Способ 2 — `git revert`.** Универсально работает на любом провайдере:

```bash
git revert <bad-commit>
git push origin main
```

CI запустит штатный пайплайн и опубликует откатанную версию.

**Время отката** — секунды (способ 1) или минуты (способ 2, ограничено временем CI).

---

## 6. Smoke-test

`scripts/smoke-test.sh`:

```bash
#!/bin/bash
set -e
BASE=https://alexanderlapygin.com

# Главная RU
test "$(curl -s -o /dev/null -w "%{http_code}" $BASE/)" = "200"

# Главная EN
test "$(curl -s -o /dev/null -w "%{http_code}" $BASE/en/)" = "200"

# 404
test "$(curl -s -o /dev/null -w "%{http_code}" $BASE/__no_such_page__)" = "404"

# Проверка наличия CSP-заголовка
curl -sI $BASE/ | grep -i "content-security-policy" > /dev/null

echo "Smoke-test passed"
```

Запускается в GitHub Actions после публикации. Серверных POST-эндпоинтов нет, проверять нечего.

---

## 7. Регулярные задачи

### 7.1. Месячная проверка получения обращений

**Триггер:** ставится в личный календарь как повторяющаяся задача (раз в месяц).

**Процедура.** Сверить:

- Срабатывания цели `form_submit_telegram` в Метрике за период.
- Реально полученные сообщения в Telegram автора и письма на контактный email.

Если в Метрике есть срабатывания, а сообщений в Telegram нет — это **не обязательно** проблема (пользователь мог не нажать «Отправить» после открытия Telegram), но систематическое расхождение — повод проверить корректность формирования deeplink (вручную пройти сценарий, см. §11.8 в [`spec.md`](./spec.md)) и/или активировать §13.5 в [`spec.md`](./spec.md).

### 7.2. Полугодовое обновление зависимостей

Раз в полгода — пройти по открытым Renovate / Dependabot PR, ревью и merge. Внимание на:

- Astro мажорные обновления — переход на 7.x требует анализа breaking changes.
- Node.js LTS — обновление до новой LTS-версии при выходе (затрагивает только сборку, не runtime).

### 7.3. Годовая ротация токенов деплоя

См. §8.

---

## 8. Ротация секретов

В системе единственный «секрет» — API-токен/ключ деплоя на хостинг (в GitHub Secrets). Серверных секретов нет (нет сервера).

**Триггер:** ежегодно (по календарю автора) или немедленно при подозрении на компрометацию.

### 8.1. Токен деплоя

1. Сгенерировать новый токен в личном кабинете хостинга (Cloudflare Pages → API Tokens → Create Token с правами Pages:Edit для конкретного проекта; или аналог у другого провайдера).
2. Обновить значение Repository Secret в GitHub (Settings → Secrets and variables → Actions).
3. Сделать тестовый деплой push'ем в `main`.
4. После успеха — отозвать старый токен у провайдера.

---

## 9. Процедура обработки запросов субъекта ПДн

**Срок исполнения:** не более 30 дней с момента запроса (требование 152-ФЗ).

### Шаги

1. **Идентификация субъекта.** Найти переписку с обращающимся в:
   - Почтовом ящике автора (поиск по email во входящих и исходящих).
   - Telegram-чатах автора (поиск по username или имени в открытых чатах).

2. **Виды запросов и действия:**
   - **Запрос об уточнении.** Сверить хранящиеся данные с тем, что субъект указывает как корректное. Изменить при необходимости — например, перенаправить переписку на новый email.
   - **Запрос на удаление.** Удалить все найденные записи: письма в основном ящике (включая корзину), переписку в Telegram (использовать функцию «удалить для обоих участников», где это возможно).
   - **Запрос на переносимость.** Экспортировать переписку (email — в текст/PDF; Telegram — стандартный экспорт чата) и отправить субъекту.
   - **Отзыв согласия.** Удалить все данные (как при запросе на удаление) и отметить, что новые обращения этого субъекта будут отклоняться.

3. **Фиксация факта исполнения.** Запись в личном файле `pd-requests.md` (вне репозитория, в защищённом хранилище автора):

   ```
   - 2026-05-15: запрос от <email>, тип «удаление», исполнен 2026-05-15.
   ```

4. **Ответ субъекту.** Письмо с подтверждением исполнения.

### Длительная недоступность автора

При планируемом отсутствии > 14 дней — настроить автоответчик на контактном email с упоминанием о возможной задержке ответа на запросы о ПДн и ориентировочной дате возвращения.

---

## 10. Реестр обработки ПДн (шаблон)

Внутренний документ, **не публикуется на сайте**, обязателен по ст. 22.1 152-ФЗ. Ведётся как внешний документ (например, в 1Password или Notion).

Структура:

```
# Реестр обработки персональных данных
Оператор: <ФИО автора>, <статус: ИП/самозанятый/физлицо>
Контакт: <email>

## Цели обработки
1. Обработка обращений потенциальных клиентов
2. Анализ посещаемости сайта (при согласии)

## Категории субъектов
- Посетители сайта alexanderlapygin.com
- Лица, обратившиеся через email или Telegram автора

## Категории ПДн
- Через сайт оператором не обрабатываются: контактная форма не передаёт данные на сервер.
- HTTP-логи хостера: IP-адрес, User-Agent, URL (хранятся на стороне хостера согласно его политике).
- Метрика (при согласии): cookie-идентификатор, IP-адрес, информация о браузере, поведенческие сигналы.
- В Telegram-чатах и почте автора (получены после действий субъекта): имя, email (если указан), компания, текст обращения, Telegram-username/имя/тел (при обращении в Telegram).

## Правовые основания
- Согласие субъекта данных (ст. 6 ч. 1 п. 1 152-ФЗ)

## Перечень действий с ПДн
- Получение (через входящие сообщения в почту/Telegram), хранение (в почтовом ящике / Telegram), использование (для ответа и ведения переговоров), удаление (вручную или по запросу субъекта).

## Сроки хранения
- Переписка с потенциальными клиентами: до 12 месяцев или до завершения переговоров/проекта.
- Данные Метрики: согласно её политике хранения.
- HTTP-логи хостера: согласно политике хостера.

## Меры защиты
Технические:
- HTTPS на сайте
- CSP, заголовки безопасности
- Двухфакторная аутентификация на почте и в Telegram автора
Организационные:
- Сайт не накапливает ПДн (форма не отправляет данные на сервер).
- Регулярная очистка старой переписки автором.

## Передача третьим лицам
- Хостер: <название>, <страна>
- Метрика: Yandex (РФ), при согласии на cookies
- Telegram (передача инициируется субъектом из его клиента — не передача оператором, не отражается в реестре как обработка)

## Дата последней актуализации
<дата>
```

Обновляется при изменении технического стека, провайдеров или политики (не реже раза в год).

---

## 11. Регистрационные действия с Роскомнадзором

### 11.1. Уведомление об обработке ПДн (ст. 22 152-ФЗ)

**Когда требуется:** в общем случае — да. Возможные исключения — ч. 2 ст. 22 (например, если обработка ведётся в рамках трудовых отношений, или ПДн только клиентов по договору, и т. п.). Для оператора-фрилансера с публичным сайтом и анализом посещаемости через Метрику исключения обычно не применимы.

**Как подать:** через личный кабинет на pd.rkn.gov.ru с подтверждённой записью на Госуслугах. Срок рассмотрения — до 30 рабочих дней.

**До запуска сайта:** уведомление должно быть подано.

### 11.2. Уведомление о трансграничной передаче ПДн (ст. 12 152-ФЗ)

**Когда требуется:** при выборе **зарубежного хостинг-провайдера** (Cloudflare Pages, GitHub Pages, AWS, Netlify, Vercel и т. п.) — HTTP-логи и раздача страниц происходят за пределами РФ. **НЕ требуется при российском хостинге** и Яндекс Метрике как единственном внешнем получателе.

**Не требуется для канала Telegram** — передача в Telegram инициируется самим субъектом из его клиента после нажатия «Отправить», оператор сайта в передаче не участвует.

**Как подать:** через тот же личный кабинет pd.rkn.gov.ru. Срок рассмотрения — до 10 рабочих дней.

**До начала передачи:** уведомление должно быть подано — то есть до первой публикации сайта на зарубежном хостинге с публичным доменом.

---

## 12. Транслитерация slug

Схема: **практическая транслитерация** (упрощённая BGN/PCGN).

| Кир. | Лат. | Кир. | Лат. |
|---|---|---|---|
| а | a | р | r |
| б | b | с | s |
| в | v | т | t |
| г | g | у | u |
| д | d | ф | f |
| е | e | х | kh |
| ё | yo | ц | ts |
| ж | zh | ч | ch |
| з | z | ш | sh |
| и | i | щ | shch |
| й | y | ъ | (опускается) |
| к | k | ы | y |
| л | l | ь | (опускается) |
| м | m | э | e |
| н | n | ю | yu |
| о | o | я | ya |
| п | p | | |

Пробелы → `-`. Заглавные → строчные. Знаки препинания, кроме `-`, удаляются.

Реализация — функция `transliterate(s: string)` в `src/lib/slug.ts`, покрыта unit-тестами на каждую букву и краевые случаи.

Slug одного материала **совпадает между локалями**. Если RU-пост `delegirovanie-v-it` — EN-версия должна лежать как `delegirovanie-v-it.md`, не `delegation-in-it.md`. Это даёт устойчивые URL и одинаковые `xhtml:link` в sitemap.

---

## 13. Цели Метрики

Создаются вручную в интерфейсе счётчика. Имена должны точно соответствовать (любые расхождения — данные не собираются):

| Имя цели | Тип в Метрике | Триггер |
|---|---|---|
| `form_submit_telegram` | JavaScript-событие | Клик по активной кнопке «Открыть в Telegram» — валидация прошла, deeplink открывается |
| `form_validation_error` | JavaScript-событие | Попытка нажать кнопку на невалидной форме (если состояние ловится JS) |
| `mailto_click` | JavaScript-событие | Клик по любой `mailto:`-ссылке |
| `telegram_direct_click` | JavaScript-событие | Клик по прямой Telegram-ссылке (подвал / правая колонка `/contact`) |
| `cta_click_home` | JavaScript-событие | Клик по основной CTA на главной |
| `cta_click_about` | JavaScript-событие | Клик по CTA на `/about` |
| `cta_click_solution` | JavaScript-событие | Клик по CTA в `/solutions` |
| `external_link_click` | JavaScript-событие | Клик по внешней ссылке на карточке проекта |
| `theme_toggle` | JavaScript-событие | Клик по переключателю темы |
| `lang_toggle` | JavaScript-событие | Клик по переключателю языка |
| `cookie_settings_open` | JavaScript-событие | Клик по «Настройки cookie» в подвале |

При пересоздании счётчика — воссоздать все цели по этому списку.

**Важно.** `form_submit_telegram` — это **открытие deeplink**, не подтверждение отправки сообщения в Telegram. См. [`decisions.md`](./decisions.md) §5.3.

---

## 14. CSP-директивы

Полный текст HTTP-заголовка `Content-Security-Policy`:

```
default-src 'self';
script-src 'self' https://mc.yandex.ru https://mc.yandex.com https://yastatic.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com;
connect-src 'self' https://mc.yandex.ru https://mc.yandex.com;
frame-src https://mc.yandex.ru https://mc.yandex.com;
font-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

Это однострочное значение HTTP-заголовка — переводы строк выше только для читаемости. Доставляется через nginx vhost-конфигурацию (см. §4); это же значение продублировано одной строкой в [`deploy/nginx/alexanderlapygin-security-headers.conf`](../../deploy/nginx/alexanderlapygin-security-headers.conf) в директиве `add_header Content-Security-Policy "..." always`.

**Замечание про `form-action 'self'`.** Кнопка «Открыть в Telegram» не является `<form action>` — она формирует URL на клиенте и открывает его через `window.open` / `<a target="_blank">`. Поэтому CSP не блокирует переход на `t.me`.

**Замечание про webvisor.** Домены `mc.webvisor.org` / `mc.webvisor.com` в текущей политике **отсутствуют сознательно** — Webvisor и карта кликов выключены в Метрике (`decisions.md` §5.2). При возврате к Webvisor добавить их в `script-src`, `img-src`, `connect-src` (всегда втроём) и синхронно обновить `deploy/nginx/alexanderlapygin-security-headers.conf`.

**Проверка:** [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com). Ожидаемые предупреждения:
- `style-src 'unsafe-inline'` — High Risk. Принимается сознательно, см. [`decisions.md`](./decisions.md) §3.2.
- Остальные директивы — без предупреждений.

При добавлении нового внешнего домена (например, при возврате к backend-доставке через сторонний SMTP с веб-формами) — пересмотр CSP и повторная проверка.

---

## 15. Lighthouse-аудит

**Когда запускать:** перед каждой существенной публичной версией.

**Где запускать:** локально через Chrome DevTools → Lighthouse, или CLI:

```bash
npm install -g lighthouse
lighthouse https://alexanderlapygin.com/ --view --form-factor=mobile
lighthouse https://alexanderlapygin.com/ --view --form-factor=desktop
```

**Что проверять:**

| Страница | Mobile Performance | Desktop Performance | Остальные |
|---|---|---|---|
| `/` (главная) | ≥ 80 | ≥ 95 | ≥ 95 |
| `/projects` | ≥ 80 | ≥ 95 | ≥ 95 |
| `/projects/{любой}` | ≥ 75 | ≥ 95 | ≥ 95 |
| `/blog` | ≥ 80 | ≥ 95 | ≥ 95 |
| `/blog/{любой}` | ≥ 75 | ≥ 95 | ≥ 95 |
| `/contact` | ≥ 80 | ≥ 95 | ≥ 95 |

При несоответствии — выявить причину (обычно — изображение без оптимизации, или CSS-блокировка, или сторонний скрипт без `defer`). Архивирование отчётов в git **не выполняется** (см. [`decisions.md`](./decisions.md) §4.2).

---

**Конец документа.**

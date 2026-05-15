# HANDOFF

**Date:** 2026-05-15
**Branch:** `main` (опережает `origin/main` на 12 коммитов; рабочее дерево чистое) — последний коммит `1eeaeae` refactor(deploy): switch from Apache .htaccess to Nginx vhost (Beget VPS reality) (2026-05-15)

Проект в состоянии «прототип в коде + Nginx vhost-конфигурация под Beget VPS + спека и процедура миграции с живого сайта». Деплой на Beget ещё не делался. Хостинг — **Beget VPS** (`84.54.29.190`, root-SSH, Nginx; российский — ст. 12 152-ФЗ не активируется). На том же VPS до миграции работает старый React-сайт под `/var/www/alexanderlapygin.com/html` — миграция через release-каталог и atomic switch, процедура в `runbook.md` §2.5.

## Session 2026-05-15

### Что сделано

- **Выявлено и исправлено фундаментальное расхождение по хостингу.** Прошлые сессии писали конфигурацию под предположение «Beget shared hosting / Apache / `.htaccess`». Реальный хостинг — **Beget VPS, Nginx**, и `.htaccess` там молча игнорируется — то есть security-заголовки, CSP, redirects и cache-control до прода никогда бы не доехали. Источник правды для server-facts — старый репо `~/Projects/mind-section-dev-portfolio-by-lovable` (`/.github/workflows/deploy.yml`, `DEPLOYMENT-SETUP.md`, `DEPLOYMENT-GUIDE.md`): IP `84.54.29.190`, пользователь `root`, docroot `/var/www/alexanderlapygin.com/html`, заливка через `scp -r dist/*` по SSH-ключу `id_ed25519`. В прежних гайдах nginx-конфиг (без SPA-обвязки и без security-заголовков).
- **Удалён `public/.htaccess`** (мёртвая Apache-конфигурация). `dist/.htaccess` после `npm run build` больше не появляется. Билд проверен — 20 страниц, без ошибок.
- **Добавлены `deploy/nginx/alexanderlapygin.com.conf`** (vhost: HTTP→HTTPS-редирект на `:80`, www→apex-редирект на `:443`, основной HTTPS server-блок с `try_files $uri $uri/index.html =404` под `trailingSlash:'never'`, кэш `/_astro|fonts → public, max-age=31536000, immutable`, `.html → no-cache`, custom 404, gzip; brotli — закомментирован, активировать если модуль собран) и **`deploy/nginx/alexanderlapygin-security-headers.conf`** (snippet с 6 security-заголовками + CSP, подключается через `include` в каждом location-блоке — обойти nginx-footgun с потерей `add_header` при наследовании). Пути сертификата (`/etc/letsencrypt/live/alexanderlapygin.com/...`) и webroot-ACME (`/var/www/letsencrypt`) — placeholder'ы, сверить на VPS перед cutover.
- **Переписаны секции `runbook.md`:** §2.1 (провайдер с «Beget shared / Apache» на «Beget VPS / Nginx»; источники правды — `deploy/nginx/*`), §2.3 шаг 6 (обе модели — Cloudflare prototype vs Beget VPS prod), §2.5 (полностью — release-каталог + tarball-бэкап + atomic switch + rollback вместо «панель-cutover Beget»), §4 (механизм доставки заголовков теперь — nginx vhost + snippet, описан add_header-footgun), §14 (CSP доставляется через `deploy/nginx/*`, не `.htaccess`).
- **Помечены SUPERSEDED** `docs/superpowers/specs/2026-05-15-htaccess-beget-design.md` и `docs/superpowers/plans/2026-05-15-htaccess-beget.md` (баннер с указанием причины и преемника). Содержимое сохранено как исторический record решения — отдельные обоснования по CSP/кэшу/редиректам всё ещё корректны по смыслу, переведены в `add_header`/`return 301`/`try_files`.

### Коммиты этой сессии

- `1eeaeae` refactor(deploy): switch from Apache .htaccess to Nginx vhost (Beget VPS reality)

### Локальное состояние (не в git)

- **`.env`** в корне (gitignored): `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто).
- **Cloudflare Pages**: прототип на https://alexanderlapygin-prototype.pages.dev — содержимое всё ещё от коммита `614681f` (старая mock-форма). Все 12 локальных коммитов в прототипе не видны — push в `origin` придержан.
- **Beget VPS (`84.54.29.190`)**: на `alexanderlapygin.com` работает старый React-сайт под `/var/www/alexanderlapygin.com/html` через Nginx. Новый сайт никуда не выкатывался. Файлы из `deploy/nginx/` на VPS не отправлены. На VPS не проверено: какой именно vhost-файл сейчас обслуживает домен, путь сертификатов certbot, наличие brotli-модуля.
- **Локальная копия старого репо** в `~/Projects/mind-section-dev-portfolio-by-lovable/` — использовалась как fact source для VPS-параметров (IP, пути, SSH-модель). Содержит реальный (опубличенный в гайде) anon-ключ Supabase старого React-проекта — мёртвый, в новом проекте Supabase не используется.
- **Dev-сервер** не запущен. `node_modules/` от предыдущей сессии.
- **Внешних эффектов** (рассылок, сообщений в чужие сервисы, изменений DNS, push в `origin`, выкатки на VPS) — не было.

### Осталось недоделанным

1. **Деплой `dist/` на Beget VPS по runbook §2.5.** Процедура переписана под VPS+Nginx модель (release-dir + atomic switch). Выполнение всё ещё впереди:
   - Перед первым деплоем: `ssh root@84.54.29.190 'ls /etc/letsencrypt/live/; ls /etc/nginx/sites-enabled/; nginx -V 2>&1 | tr " " "\n" | grep -E "with-|brotli"'` — сверить пути сертификата, имя текущего vhost-файла, наличие brotli.
   - Поправить placeholder'ы в `deploy/nginx/alexanderlapygin.com.conf` (cert paths, webroot-ACME) под реальное состояние VPS.
   - Выполнить шаги §2.5: rsync `dist/` в `releases/${RELEASE}/`, scp nginx-конфигов в `sites-available/` (без активации), staging-vhost на отдельном порту для verification, tarball-бэкап docroot + nginx-конфигурации, cutover (снять старый symlink, активировать новый, переключить docroot, `nginx -t && nginx -s reload`), повторная верификация на боевом домене.
2. **`PUBLIC_METRIKA_ID`** не заведён. Создать счётчик в Яндекс Метрике, завести цели (`form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` и пр., список — runbook §13), положить ID в `.env`. Сейчас `trackGoal` — no-op. CSP в nginx snippet уже разрешает домены Метрики.
3. **Уведомление в РКН по ст. 22 152-ФЗ.** Подать **до публичного cutover** (т. е. до момента, когда `alexanderlapygin.com` начнёт принимать обращения через нашу форму). Ст. 12 НЕ требуется (хостинг в РФ — Beget VPS).
4. **Перенастройка CI/CD-деплоя.** Текущий runbook §5.1 всё ещё описывает старую wrangler/Cloudflare-схему. После ручного cutover нужно переписать GitHub Actions workflow под scp-over-SSH+release-dir+atomic-switch. Модель — из старого `~/Projects/mind-section-dev-portfolio-by-lovable/.github/workflows/deploy.yml`, но с release-dir + tarball-бэкап + smoke-verification + ротация старых release'ов. `wrangler` в `devDependencies` после этого можно удалить.
5. **Push 12 коммитов в `origin/main` — придержан осознанно.** Прототип на Cloudflare Pages может быть привязан к `origin/main` с auto-deploy и выкатить «полуфабрикат» (без Метрики и до РКН-уведомления). Push — после Beget-cutover, заведения Метрики и подачи РКН-уведомления.

# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (2 коммита впереди `origin/main` плюс грядущий handoff-коммит; uncommitted: `deploy/nginx/alexanderlapygin-security-headers.conf` — расширен Google Fonts, см. ниже) — последний коммит `0561817` docs(handoff): add prod-vhost upgrade plan (paths A and B) (2026-05-16).

`stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, полный TLS, отдельный SBP-backend на :3001. `alexanderlapygin.com` — всё ещё старый React-сайт, но теперь **с security headers и cache-control** (ad-hoc path B этой сессии). Cutover stage→prod не планировался. Архитектура и состояние VPS — в memory `staging-architecture` и `vps-state-snapshot`.

## In-flight context (важно для следующей сессии)

### Состояние prod-vhost'а после path B

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — по-прежнему **обычный файл** (не симлинк), но **с ad-hoc патчем 2026-05-16**, sha256 `29879978f076dd9170dd9166e30fb22a1d6641c75a4c48a458aed69e4b14ed01`. Добавлено:

- server-level `include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;` + `add_header Cache-Control "no-cache" always;` (= D1 fix + 6 security headers)
- внутри `location ^~ /api/` — повторный `include` snippet'а (nginx-footgun: собственный `add_header Cache-Control` в location сбрасывает наследование add_header'ов с server-уровня; без re-include /api/ не имел бы CSP/HSTS/etc.)

CSP-snippet на VPS обновлён: `style-src` теперь включает `https://fonts.googleapis.com`, `font-src` — `https://fonts.gstatic.com` (React-сайт грузит CSS и шрифты с Google Fonts). Та же правка лежит в репо как **uncommitted** `M deploy/nginx/alexanderlapygin-security-headers.conf` (содержимое идентично VPS).

Текущее prod-поведение (по smoke curl'у):
- 6 security headers (HSTS, X-CTO, X-Frame, Referrer, Permissions, CSP) на главной, /contact (SPA fallback), /showcase/payments/sbp/, /api/*, /favicon.ico, /assets/*.
- `Cache-Control: no-cache` на HTML и (как побочный эффект path B) на hashed React-assets — намеренный минор-trade-off, после Astro cutover'а решится репо-version'ом vhost'а (там /_astro/ → immutable).
- /api/ сохранил свой `Cache-Control: no-cache, no-store, must-revalidate`.
- /api/health → 200 (SBP-backend жив).
- React SPA fallback `try_files $uri $uri/ /index.html` не тронут.

**Известные регрессии** (минорные, не вводятся path B'ом — были до сессии или приняты осознанно):
- Hashed React-assets отдаются с no-cache, не immutable (приемлемо до cutover'а).
- HTTPS-www → HTTPS-apex редирект не работает (legacy vhost объединил оба `server_name` в одном HTTPS server-block'е). Репо-vhost это чинит, но не активен. HTTP-www → HTTPS-apex редирект работает.

**Backups на VPS для отката:**
- snippet: `/root/alexanderlapygin-security-headers.conf.pre-fonts-20260516T000218Z.bak`
- regular-file vhost: `/root/sites-enabled-alexanderlapygin.com.conf.pre-upgrade-20260516T000453Z.bak`

Откат любой из них: `ssh root@84.54.29.190 'cp <backup> <target> && nginx -t && nginx -s reload'`.

### Почему путь A (симлинк на репо-version) отложен

Репо-vhost (`deploy/nginx/alexanderlapygin.com.conf` = VPS `sites-available/...`) спроектирован под Astro — per-route HTML, `location / { try_files $uri $uri/index.html =404; }`. Активный legacy regular-file имеет `try_files $uri $uri/ /index.html` (SPA-fallback). Документ-root `/var/www/alexanderlapygin.com/html/` сейчас — React build (один index.html, нет /contact/, /projects/ и т.д., нет /404.html). Активация симлинка сейчас:
- ✅ главная работает
- ❌ /contact, /projects/*, /blog, /about при прямом заходе/reload → 404 (default nginx-404, т.к. /404.html в React build тоже нет)
- ❌ все внешние ссылки на не-root URL сломаются

**Условие пути A**: Astro build в `/var/www/alexanderlapygin.com/html/`. Эффективно = cutover stage→prod. После cutover'а замена regular-file → симлинк становится тривиальной (`rm sites-enabled/...conf && ln -s ../sites-available/alexanderlapygin.com.conf ...`) + повторный smoke.

### Что осталось недоделанным

1. **Закомитить расширенный snippet** (`deploy/nginx/alexanderlapygin-security-headers.conf`) — отдельный коммит. Содержимое уже на VPS.
2. **Браузерная проверка path B** (на пользователе): prod главная / /contact / /projects/* → DevTools Console → CSP violations? Из CLI было тихо (нет inline-script'ов в bundle, нет внешних script-src запросов), но реальный браузер — единственная честная проверка.
3. **Cutover stage→prod** — не было в scope ни одной сессии явно, требует отдельной подготовки и решения. После него — путь A (regular-file → симлинк).
4. **`PUBLIC_METRIKA_ID`** не заведён → `trackGoal` no-op. Цели: `form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` (runbook §13). CSP уже разрешает домены Метрики.
5. **Уведомление в РКН по ст. 22 152-ФЗ** — подать ДО публичного cutover'а stage→prod (когда форма начнёт принимать обращения).
6. **Verify firewall blocks external :3000 и :3001** — оба backend'а биндят 0.0.0.0. Проверить с другой машины: `curl --connect-timeout 5 http://84.54.29.190:3001/` → должен быть refused/timeout.
7. **Удалить артефакты несостоявшегося cutover'а** (готовы к удалению):
   - VPS: `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` (49M, ≥48ч прошло)
   - VPS: `/var/www/alexanderlapygin.com/showcase/` (16K огрызок Oct 2025)
   - VPS: `/var/www/alexanderlapygin.com/releases/20260515T204033Z/` (Astro-build prod-cutover'а, не используется stage'м)
   - VPS: `/tmp/stage-20260515T233747Z.tar.gz` (release tarball первого stage-деплоя)
   - Локально: `/tmp/stage-20260515T233747Z.tar.gz` + `/tmp/.last-stage-release`
8. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).

## Session 2026-05-16

### Что сделано

- **CSP-аудит React prod-сайта** (статически, без браузера): main HTML + /contact, /projects, /blog, /about (все 1422B — единая SPA shell), `assets/index-x1YQXxU-.js` (388 KB: нет eval/new Function/document.write/inline-script-инъекций; `createElement("link")` × 2 — Vite modulepreload polyfill (self), `createElement("style")` × 1 — runtime CSS injection = разрешено `'unsafe-inline'`; `innerHTML` × 3 — React SVG internals, CSP без trusted-types это не блокирует), `assets/index-B_RORPG1.css` (нет `url()`/`@import`/`data:`/внешних). Найдены 2 внешних ресурса: `https://fonts.googleapis.com` (CSS) и `https://fonts.gstatic.com` (font).
- **Snippet расширен**: `style-src ... https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com`. Деплой на VPS (с backup'ом), nginx -t + reload. Сначала задействован на stage (он Google Fonts не использует — реально no-op для него, но проверил что не сломалось).
- **Path A (replace regular-file → symlink) аборт**: diff активного regular-file vs sites-available (репо-Astro) показал критичную дивергенцию `location /` (SPA-fallback vs `=404`). Симлинк сейчас сломал бы React-сайт на всех non-root роутах. Backup активного vhost'а сделан до аборта (см. «Backups» выше).
- **Path B (расширенный) применён** к активному regular-file: server-level `include` snippet'а + `Cache-Control "no-cache"`; в `location ^~ /api/` повторный `include` snippet'а. nginx -t ok, reload ok. Smoke curl: security headers на всех проверенных endpoint'ах, HTML body байт-идентичен пре-патчу, React SPA fallback цел, /api/health 200.

### Коммиты этой сессии

- `<этот handoff-коммит>` docs(handoff): update for session 2026-05-16 (path B prod patch)

snippet-правка `deploy/nginx/alexanderlapygin-security-headers.conf` пока **в working tree некомитнутая** — см. «Осталось недоделанным» #1.

### Локальное состояние (не в git)

- `deploy/nginx/alexanderlapygin-security-headers.conf` — uncommitted, идентично копии на VPS.
- `/tmp` на ноуте: `prod-active-vhost.conf` (применённая версия), `prod-active-vhost-original.conf` (pre-patch снимок), `prod-index.html`/`prod-postpatch.html`, `prod-bundle.js`/`prod-bundle.css`, `stage-index.html`/`stage-index2.html`. Артефакты CSP-аудита и smoke'ов; можно удалить.

### Побочные эффекты на VPS (`84.54.29.190`)

- `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` — обновлён (Google Fonts добавлены). Backup в `/root/`.
- `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — пропатчен (path B). Backup в `/root/`.
- nginx reload'ен дважды (после snippet, после vhost patch).

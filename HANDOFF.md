# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (опережает `origin/main` на 29 коммитов; рабочее дерево чистое, `backups/` в `.gitignore`) — последний коммит `45e0e19` docs(runbook): add §2.6 stage deploy procedure (2026-05-16).

Проект в состоянии «новый Astro живёт на stage.alexanderlapygin.com (Beget VPS, full TLS, отдельный SBP-backend на :3001) + старый React-сайт всё ещё на apex alexanderlapygin.com». Spec/plan/runbook для stage в репо. Cutover stage→prod не делался и в этой сессии не планировался. Showcase + SBP-демо работают на legacy-путях `/var/www/alexanderlapygin.com/legacy/showcase/`.

## Session 2026-05-16 (stage deploy execution)

### Что сделано

Развёрнут `https://stage.alexanderlapygin.com/` end-to-end по плану `docs/superpowers/plans/2026-05-16-stage-subdomain.md` (subagent-driven). 11 из 13 задач плана выполнены, 1 отложена, 1 (browser-verification) на стороне пользователя.

- **Repo (Tasks 1-4):** `deploy/nginx/alexanderlapygin-stage.conf` (полный stage vhost), правка `deploy/nginx/alexanderlapygin.com.conf` (D1 cache-control fix — в репо, на VPS НЕ задеплоен, см. Task 9 ниже), `deploy/systemd/sbp-backend.service` (затащен с VPS) + `deploy/systemd/sbp-backend-stage.service` (новый), `docs/spec/runbook.md` §2.6 stage deploy procedure.
- **Code-review fix внутри Task 1 (commit `7342ea5`):** code-quality reviewer нашёл, что верстатим-блок плана для stage vhost пропустил `add_header Cache-Control "no-cache" always;` внутри `^~ /showcase/` — это та же ошибка, которую D1 фиксит для prod. Добавлено сразу для stage (spec §D1 строки 206-219 говорит, что это нужно для request'ов через try_files $uri/index.html). Symmetric с Task 2 для prod.
- **VPS (Tasks 5-8, 10-11):**
  - DNS A-запись `stage.alexanderlapygin.com → 84.54.29.190` (TTL 300) — пользователь добавил вручную в Beget DNS panel, propagation подтверждена (8.8.8.8 / 1.1.1.1 / ns1.beget.com).
  - Bootstrap HTTP vhost → certbot --nginx → cert lineage `/etc/letsencrypt/live/stage.alexanderlapygin.com/` (ECDSA, expires 2026-08-13, renew dry-run OK для всех трёх lineage: apex/mind-section/stage).
  - Полный stage vhost задеплоен (scp + nginx -t + reload), все headers подтверждены через curl: HTTP/2, HSTS, CSP, X-Robots-Tag noindex, Cache-Control no-cache, HTTP→HTTPS 301.
  - `/etc/sbp-backend/` (750 root:www-data) + `/etc/sbp-backend/stage.env` (640 root:www-data, PORT=3001, NODE_ENV=production, YOOKASSA_* из prod-`.env`, FRONTEND_URL=https://stage.alexanderlapygin.com).
  - `sbp-backend-stage.service` enabled+active, listens 0.0.0.0:3001 (тот же 0.0.0.0 что у prod на :3000 — firewall блокирует, нужно подтвердить отдельно при необходимости).
  - Первый stage-деплой: `npm run build` (20 страниц) → tarball → release `/var/www/alexanderlapygin.com/stage-releases/20260515T233747Z/` → atomic symlink `stage-html`.
  - Curl-smoke: root 200 (22.8 KB, build от 2026-05-16 23:37:41Z), `/contact/` 200 + cache-control no-cache, `/_astro/<hashed.css>` 200 + immutable, `/showcase/payments/sbp/` 200 + cache-control no-cache (D1-fix на stage работает), `/api/` 200 + правильный CORS из stage-backend'а.

### Task 9 (D1 fix на prod) — ОТЛОЖЕНО (важно!)

Раскопано в момент попытки деплоя: активный prod vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — **обычный файл** (2159B, May 15 21:04 — времён роллбэка), **не симлинк** на репо-версию. Текущий активный конфиг — legacy React-only setup, **без security-headers snippet** (нет HSTS/CSP/X-Frame-Options/X-Content-Type-Options/Cache-Control/X-Robots-Tag вообще). Репо-версия в `sites-available/` — наша полная (security headers, /api/, /showcase/, /404.html, теперь и D1).

Замена sites-enabled на репо-версию — это **НЕ просто D1 fix**, это **полный апгрейд prod-vhost'а**. Side effect: CSP начнёт применяться, что может сломать inline-скрипты/стили старого React-сайта. Решено: отложить полный апгрейд на отдельную итерацию с CSP-тестированием. Этой сессией: backup `/root/alexanderlapygin.com.conf.pre-d1-20260515T233139Z.bak` сделан, sites-available обновлён (dead — nginx читает sites-enabled), активный sites-enabled не тронут, prod работает как раньше.

### Коммиты этой сессии

- `6cd49f6` feat(deploy/nginx): add stage vhost for stage.alexanderlapygin.com
- `7342ea5` fix(deploy/nginx): add Cache-Control to stage /showcase/ block (post-code-review)
- `b27259f` fix(deploy/nginx): close HTML cache-control gap on clean URLs (D1, repo only — VPS-deploy отложен)
- `7addc19` feat(deploy/systemd): track sbp-backend units in repo
- `45e0e19` docs(runbook): add §2.6 stage deploy procedure

### Локальное состояние (не в git)

**На VPS `84.54.29.190` (новое в этой сессии):**
- `/etc/nginx/sites-available/alexanderlapygin-stage.conf` + симлинк в `sites-enabled/` (full stage vhost)
- `/etc/letsencrypt/live/stage.alexanderlapygin.com/` (ECDSA cert, exp 2026-08-13)
- `/etc/sbp-backend/` (750 root:www-data) + `stage.env` (640 root:www-data)
- `/etc/systemd/system/sbp-backend-stage.service` (enabled, active, PID listens 0.0.0.0:3001, journal logs)
- `/var/www/alexanderlapygin.com/stage-releases/20260515T233747Z/` (Astro 1.0.0 build, 20 страниц, 420К)
- `/var/www/alexanderlapygin.com/stage-html` → `stage-releases/20260515T233747Z` (symlink)
- `/etc/nginx/sites-available/alexanderlapygin.com.conf` — **обновлён с D1, но dead** (sites-enabled — другой файл)
- `/root/alexanderlapygin.com.conf.pre-d1-20260515T233139Z.bak` — pre-D1 backup репо-версии sites-available
- prod sites-enabled не тронут, prod продолжает работать как раньше (без security headers, без cache-control)

**Локально:**
- `dist/` — текущий Astro build (содержимое то же, что в stage-releases/20260515T233747Z/)
- `/tmp/stage-20260515T233747Z.tar.gz` (40631B) и `/tmp/.last-stage-release` — артефакты деплоя, можно удалить
- Без изменений в `.env`

**Внешние эффекты:**
- Let's Encrypt issued ECDSA cert для stage.alexanderlapygin.com — запись попадёт в публичный CT-log
- DNS-запись `stage A 84.54.29.190` в Beget DNS зоны alexanderlapygin.com
- Stage SBP-backend начал отвечать на YooKassa-вызовы (test-mode shop_id 1198492 — тот же, что prod)
- `git push` в `origin/main` **не делался** — теперь впереди на 29 коммитов (после handoff-коммита — 30)

### Осталось недоделанным

1. **Task 9 (D1 на prod) полноценно**: нужно решить, делаем ли полный апгрейд prod-vhost'а (заменить sites-enabled обычный файл на симлинк → репо-версия). Это требует: pre-deploy CSP-аудит старого React (есть ли inline-скрипты/стили, которые сломаются под нашей CSP), browser-smoke после с DevTools Console на violations, готовый rollback (`cp /root/alexanderlapygin.com.conf.pre-d1-20260515T233139Z.bak` → восстановить sites-available, плюс восстановить активный файл из его собственного backup — TODO: сделать backup активного sites-enabled до апгрейда отдельной командой). Минимальная альтернатива: добавить только одну строку `add_header Cache-Control "no-cache"` в текущий активный sites-enabled, не трогая остального.
2. **Task 12 (браузерная верификация stage)** — на стороне пользователя сейчас (открыть stage в браузере, проверить headers, SBP-демо тест-платёж, проверить что prod не задет). После этого Task 12 можно закрыть.
3. **`PUBLIC_METRIKA_ID`** не заведён. `trackGoal` — no-op. Цели: `form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` (runbook §13). CSP уже разрешает домены Метрики.
4. **Уведомление в РКН по ст. 22 152-ФЗ** — подать ДО публичного cutover'а stage→prod (когда `alexanderlapygin.com` начнёт принимать обращения через форму).
5. **Push коммитов в `origin/main`** — придержан. Сейчас 29 коммитов впереди (после handoff — 30).
6. **Удалить артефакты несостоявшегося cutover'а:**
   - `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` (≥48ч стабильной работы старого сайта — после 2026-05-17 21:04 UTC, прошло)
   - `/var/www/alexanderlapygin.com/showcase/` (16K огрызок Oct 2025, не используется — безопасно прямо сейчас)
   - `/tmp/stage-20260515T233747Z.tar.gz` и `/tmp/.last-stage-release` локально + `/tmp/stage-20260515T233747Z.tar.gz` на VPS
7. **Verify firewall blocks external :3000 и :3001** — оба backend'а биндят 0.0.0.0. Если firewall открыт → backend доступен напрямую снаружи (минуя nginx). Проверить: `curl http://84.54.29.190:3001/` снаружи (с другой машины, не с VPS) — должно быть `Connection refused` или timeout.
8. **Вне MVP-scope этой итерации, на потом:**
   - GitHub Actions: push в `main` → деплой на stage. Старый wrangler workflow удалить, `wrangler` выкинуть из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: перенести prod-`.env` SBP-backend'а из `/var/www/.../legacy/...backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage; единая директория для secrets-конфигов).

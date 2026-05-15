# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (опережает `origin/main` на 23 коммита; рабочее дерево чистое, `backups/` в `.gitignore`) — последний коммит `edcad26` docs(plan): implementation plan for stage.alexanderlapygin.com MVP (2026-05-16).

Проект в состоянии «прототип Astro + Nginx vhost под Beget VPS + спека и процедура миграции + spec/plan для stage». На боевом домене `https://alexanderlapygin.com/` — **старый React-сайт** (cutover на Astro был выполнен 2026-05-15 и откачен через ~20 минут; текущий main HEAD — «полуфабрикат», публикация на прод не входит в план). Новый Astro поедет через `stage.alexanderlapygin.com` на том же VPS (см. memory `staging-architecture`). Showcase + SBP-бэкенд работают на legacy-путях (`/var/www/alexanderlapygin.com/legacy/showcase/`), независимы от Astro release-switching.

## Session 2026-05-16 (брейншторм + план stage)

### Что сделано

- **Брейншторм архитектуры `stage.alexanderlapygin.com`.** Зафиксированы развилки и причины выбора (X1 отдельный TLS-cert lineage; A1 sibling-файл `deploy/nginx/alexanderlapygin-stage.conf`; B1 общий `SITE_URL=https://alexanderlapygin.com` для stage-build'а; C1 DNS → ACME через минимальный HTTP-блок → certbot --nginx; noindex-only protection без Basic Auth; отдельный systemd-юнит SBP-backend'а на порту 3001 с общим WorkingDirectory и изолированным EnvironmentFile; F1 затащить оба unit-файла в репо; D1 параллельно починить HTML cache-control gap в prod-vhost'е; G1 первый stage-деплой — свежий `npm run build`).
- **Спец:** `docs/superpowers/specs/2026-05-16-stage-subdomain-design.md` (500 строк, описывает архитектуру, vhost детально, D1 фикс, SBP-backend, release-структуру, последовательность A-H, точки риска).
- **План:** `docs/superpowers/plans/2026-05-16-stage-subdomain.md` (13 задач, bite-sized, со smoke-before/action/smoke-after для VPS-операций; есть spec coverage audit в конце).
- **Технический риск проверен:** SBP-backend stateless (`PORT` и YooKassa-ключи через `process.env`, никаких локальных файлов state) — два инстанса с одним shop_id безопасны.
- **HSTS-блокатор для HTTP-only stage задокументирован:** snippet прод-vhost'а отдаёт `Strict-Transport-Security includeSubDomains; max-age=63072000` → все браузеры пользователей уже принудительно ходят на HTTPS для `*.alexanderlapygin.com` → cert для stage обязателен.
- **Решение по execution:** subagent-driven, но в **новой сессии**. План передаётся целиком.

### Коммиты этой сессии

- `bcb8b7e` docs(spec): design for stage.alexanderlapygin.com MVP
- `edcad26` docs(plan): implementation plan for stage.alexanderlapygin.com MVP

### Локальное состояние (не в git) — кросс-сессионное, состояние VPS и локали

- **На VPS `84.54.29.190` (актуальное состояние после сессии 2026-05-15, не менялось этой сессией):**
  - Прод: `https://alexanderlapygin.com/` — старый React-сайт из `/var/www/alexanderlapygin.com/html/` (обычный каталог). `/api/` (SBP-бэкенд через nginx proxy на 127.0.0.1:3000) и `/showcase/` работают; SBP-бэкенд читает из `legacy/showcase/payments/sbp/backend/`.
  - Артефакты несостоявшегося cutover'а — **сохранены**, переиспользуются под stage:
    - `/var/www/alexanderlapygin.com/releases/20260515T204033Z/` — Astro-build, отвязан от sites-enabled (420К, 22 файла, 20 страниц)
    - `/var/www/alexanderlapygin.com/legacy/showcase/` — 5.9M, активная база для SBP-демо
    - `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` — 49M, снапшот старого docroot'а (можно удалять после 2026-05-17 21:04 UTC)
    - `/etc/nginx/sites-available/alexanderlapygin.com.conf` — наш конфиг из репо (6551B, **отвязан** от sites-enabled — основа для будущей правки D1)
    - `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` — переиспользуется как есть (для stage-vhost'а тоже)
    - `/root/sbp-backend.service.pre-cutover-20260515T202223Z.bak` — бэкап юнита до шага 0
    - `/root/sites-{enabled,available}-alexanderlapygin.com.conf.pre-cutover-20260515T204033Z.bak` — бэкапы старого vhost'а
    - `/root/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` (21.3MB) — tarball перед cutover'ом
  - Ядро `6.8.0-117-generic` (после `apt dist-upgrade` + reboot 2026-05-16). `cloud-init` на hold (Beget), `open-vm-tools` в phased rollout.
- **Локально:**
  - `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` (21.3MB) — untracked, теперь в `.gitignore`
  - `.env`: `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто)
- **Внешних эффектов** (push в `origin`, чужие сервисы, изменения DNS, сообщения в чаты) — этой сессией не было.

### Осталось недоделанным

1. **Выполнить план `docs/superpowers/plans/2026-05-16-stage-subdomain.md`** через subagent-driven-development (новая сессия). 13 задач:
   - Tasks 1-4: репо-коммиты (vhost stage, D1 fix prod-vhost, systemd units, runbook §2.6)
   - Task 5: **первое блокирующее внешнее действие — пользователь добавляет DNS A-запись** `stage.alexanderlapygin.com → 84.54.29.190` в Beget DNS-панели
   - Tasks 6-12: bootstrap-vhost → certbot → полный vhost → D1 deploy → SBP-backend stage → первый stage-деплой → браузерная верификация
   - Task 13: обновить HANDOFF и memory
2. **`PUBLIC_METRIKA_ID`** не заведён. Сейчас `trackGoal` — no-op. Цели: `form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` (runbook §13). CSP уже разрешает домены Метрики.
3. **Уведомление в РКН по ст. 22 152-ФЗ** — подать ДО публичного cutover'а stage→prod (когда `alexanderlapygin.com` начнёт принимать обращения через форму). Ст. 12 не требуется (хостинг российский).
4. **Push коммитов в `origin/main`** — придержан до завершения staging-настройки. Сейчас 23 коммита впереди; после выполнения плана будет ещё 5-6.
5. **Удалить артефакты несостоявшегося cutover'а** (когда перестанут быть нужны):
   - `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` (≥48ч стабильной работы старого сайта — после 2026-05-17 21:04 UTC)
   - `/var/www/alexanderlapygin.com/showcase/` (16K огрызок Oct 2025, не используется — безопасно прямо сейчас)
6. **Вне MVP-scope этой итерации, на потом:**
   - GitHub Actions: push в `main` → деплой на stage. Старый wrangler workflow удалить, `wrangler` выкинуть из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: перенести prod-`.env` SBP-backend'а из `/var/www/.../legacy/...backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage; единая директория для secrets-конфигов).

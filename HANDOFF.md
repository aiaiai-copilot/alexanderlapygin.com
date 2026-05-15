# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (опережает `origin/main` на 17 коммитов; есть uncommitted: 1 modified `deploy/nginx/alexanderlapygin.com.conf`, 1 untracked `backups/`) — последний коммит `4d7c827` docs(handoff): update for session 2026-05-15 (2026-05-15). Эта сессия новых код-коммитов в репо не добавила.

Проект в состоянии «прототип Astro + Nginx vhost под Beget VPS + спека и процедура миграции». На боевом домене `https://alexanderlapygin.com/` — **старый React-сайт** (cutover на Astro был выполнен 2026-05-15 и откачен через ~20 минут — текущий main HEAD признан «полуфабрикатом», не для прода). План: новый Astro поедет через `stage.alexanderlapygin.com` на том же VPS (см. memory `staging-architecture`). Хостинг — **Beget VPS** (`84.54.29.190`, root-SSH, Nginx; российский — ст. 12 152-ФЗ не активируется). Showcase + SBP-бэкенд работают на legacy-путях (`/var/www/alexanderlapygin.com/legacy/showcase/`, шаг 0 runbook §2.5 выполнен и не откачивался — независим от Astro release-switching). Полная процедура — `docs/spec/runbook.md` §2.5.

## Session 2026-05-16

### Что сделано

- **`apt dist-upgrade` + reboot VPS.** 79+4 пакета (включая ядро 6.8.0-85 → 6.8.0-117), reboot-required очищен, downtime сервисов ~30с. После ребута все юниты поднялись (`nginx`, `sbp-backend.service` на legacy-путях, `certbot.timer`), 0 failed. Не обновились: `cloud-init` (Beget hold), `open-vm-tools` 12.5→13.0 (Ubuntu phased rollout). `-111` и `-85` остались на диске.
- **Шаг 0 runbook §2.5 — выполнен** (RELEASE-tag `20260515T202223Z`). `/var/www/alexanderlapygin.com/legacy/showcase/` создан (`cp -a`, не `mv`), `sbp-backend.service` переписан на legacy-путь, бэкап юнита: `/root/sbp-backend.service.pre-cutover-20260515T202223Z.bak`. Пережил ребут с правильными путями. **Не откатывался** при последующем откате Astro cutover'а — он независим и нужен для будущего stage.
- **Cutover Astro (RELEASE=20260515T204033Z) — выполнен и откачен.** Шаги 1-5 runbook §2.5 прошли полностью (build → rsync → scp nginx → staging :8443 verify → tarball-бэкап → atomic switch → `nginx -t && reload`), 11 публичных smoke-тестов из интернета зелёные, `certbot renew --dry-run` для обоих доменов succeeded (главный риск split apex/www не материализовался). **Через ~20 минут** юзер указал, что текущий main HEAD — «полуфабрикат», публикация на проде не входила в план (это противоречие явно стояло в предыдущем HANDOFF и должно было быть зафлажено ДО запуска процедуры). Откат за ~5 секунд: `mv html-old-... html`, vhost восстановлен из `.bak`, `nginx -s reload`. Прод снова обслуживает React-сайт.
- **Архитектурное решение по staging:** новый Astro поедет через `stage.alexanderlapygin.com` на том же VPS (отдельный subdomain), Cloudflare Pages-прототип выводится из эксплуатации. Подробное обоснование, todo-список для развёртывания и перечень переиспользуемых артефактов — в memory `staging-architecture.md`.
- **Найдены два nginx-нюанса в `deploy/nginx/alexanderlapygin.com.conf`:**
  - **regex-footgun:** `location ~* /assets/.+-[A-Za-z0-9_-]{8,}\.(?:...)$` — nginx тащит `{` как начало блока, ломая `nginx -t`. **Починено** в working tree обёрткой regex в двойные кавычки. Поймал реальный cutover, потому что staging-vhost не воспроизводил `/showcase/` location. Изменение не закоммичено.
  - **HTML cache-control gap:** `location ~ \.html$` не матчит чистые URL `/contact/`, `/projects/` и т.д. — nginx `try_files` resolve в `<path>/index.html` не пересчитывает location selector. Эффект: HTML отдаётся без `Cache-Control: no-cache`, browser использует heuristic caching. **Не починено.** Фикс: `add_header Cache-Control "no-cache" always;` на server-уровне в основном HTTPS-блоке.
- **Memory обновлена** (`~/.claude/projects/.../memory/`):
  - Новый файл `staging-architecture.md` — почему именно `stage.alexanderlapygin.com`, полный todo для реализации.
  - Новый файл `check-publish-readiness-before-cutover.md` — правило (feedback-тип) о том, что авторизация механизма (`«поехали с cutover»`) ≠ авторизация артефакта; перед публичным cutover'ом сканировать HANDOFF/memory на маркеры «полуфабрикат/WIP/придержан/hold».
  - Обновлены `vps-state-snapshot.md` (актуальное состояние после ребута + отката) и индекс `MEMORY.md`.

### Коммиты этой сессии

Нет код-коммитов. Все изменения — операционные (на VPS) или в memory (вне репо). Локально: один modified-файл (regex-fix) и одна untracked-папка (`backups/`).

Коммит этого HANDOFF.md (отдельный, без других файлов) — единственный коммит сессии.

### Локальное состояние (не в git)

- **На VPS `84.54.29.190` (актуальное состояние конца сессии):**
  - Прод: `https://alexanderlapygin.com/` — старый React-сайт из `/var/www/alexanderlapygin.com/html/` (обычный каталог). `/api/` (SBP-бэкенд через nginx proxy) и `/showcase/` работают; SBP-бэкенд читает из `legacy/showcase/payments/sbp/backend/`.
  - Артефакты несостоявшегося cutover'а — **сохранены**, переиспользуются под stage:
    - `/var/www/alexanderlapygin.com/releases/20260515T204033Z/` — Astro-build (420К, 22 файла, 20 страниц включая `/en/*`), отвязан от sites-enabled
    - `/var/www/alexanderlapygin.com/legacy/showcase/` — 5.9M, активная база для SBP-демо
    - `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` — 49M, снапшот старого docroot'а на момент cutover'а (старый сайт уже вернулся в `html/`, эта копия — резерв на ≥48ч; можно удалять после 2026-05-17 21:04 UTC)
    - `/etc/nginx/sites-available/alexanderlapygin.com.conf` — наш конфиг из репо (6551B, **отвязан** от sites-enabled) — основа для будущего `alexanderlapygin-stage.conf`
    - `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` — snippet, переиспользуется как есть
    - `/root/sbp-backend.service.pre-cutover-20260515T202223Z.bak` — бэкап юнита до шага 0
    - `/root/sites-{enabled,available}-alexanderlapygin.com.conf.pre-cutover-20260515T204033Z.bak` — бэкапы старого vhost'а
    - `/root/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` (21.3MB) — tarball перед cutover'ом
  - Ядро `6.8.0-117-generic`, uptime ~30мин на конец сессии. `cloud-init` остаётся на hold (Beget), `open-vm-tools` в phased rollout.
- **Локально:**
  - `deploy/nginx/alexanderlapygin.com.conf` — modified (regex-quote fix); не закоммичено
  - `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` (21.3MB) — untracked; нужно решить про `.gitignore`
  - `.env` — без изменений: `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто)
- **Внешних эффектов** (push в `origin`, чужие сервисы, изменения DNS, сообщения в чаты) — не было. Прод-минуту работы Astro никто из внешних пользователей перехватить не успел (~20 минут публикации, прямой трафик не отслеживался).

### Осталось недоделанным

1. **Развернуть `stage.alexanderlapygin.com` (Вариант 2 staging-архитектуры).** Полный todo — в memory `staging-architecture.md` §«Что предстоит сделать»:
   - DNS A-запись `stage.alexanderlapygin.com → 84.54.29.190` (действие пользователя в Beget DNS-панели)
   - `certbot --nginx -d stage.alexanderlapygin.com`
   - Отдельный vhost с `server_name stage.alexanderlapygin.com`, переиспользуя наш `deploy/nginx/alexanderlapygin.com.conf` за минусом server_name; добавить `X-Robots-Tag: noindex, nofollow` always + (вероятно) Basic Auth или IP-allowlist
   - Решить, как ходит SBP-бэкенд на stage: общий с prod'овым `127.0.0.1:3000` (опасно для state-тестов) или отдельный systemd-юнит на другом порту с отдельной `.env`
   - Release-структура `stage-releases/` + `stage-html` симлинк (отдельная цепочка от prod-`releases/`)
   - GitHub Actions: push в `main` → деплой на stage по модели runbook §2.5. Старый wrangler-based workflow удалить, `wrangler` выкинуть из `devDependencies`.
2. **Применить два nginx-фикса при настройке stage-vhost'а:** (а) regex в кавычках — уже в working tree, надо закоммитить; (б) `add_header Cache-Control "no-cache" always;` на server-уровне.
3. **`PUBLIC_METRIKA_ID`** не заведён. Сейчас `trackGoal` — no-op. Цели: `form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` (полный список — runbook §13). CSP уже разрешает домены Метрики.
4. **Уведомление в РКН по ст. 22 152-ФЗ** — подать ДО публичного cutover'а stage→prod (когда `alexanderlapygin.com` начнёт принимать обращения через форму). Ст. 12 не требуется (хостинг российский).
5. **`backups/` в `.gitignore`** — решить. 21МБ tarball не место в репо.
6. **Push коммитов в `origin/main`** — придержан до завершения staging-настройки. 17 коммитов впереди origin.
7. **Удалить артефакты несостоявшегося cutover'а** (когда перестанут быть нужны):
   - `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` (≥48ч стабильной работы старого сайта — после 2026-05-17 21:04 UTC)
   - `/var/www/alexanderlapygin.com/showcase/` (16K огрызок Oct 2025, не используется никем — безопасно прямо сейчас)

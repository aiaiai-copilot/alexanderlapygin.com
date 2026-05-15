# HANDOFF

**Date:** 2026-05-15
**Branch:** `main` (опережает `origin/main` на 15 коммитов; рабочее дерево чистое) — последний коммит `fcdeaac` feat(deploy): preserve showcase + SBP backend across Astro release switches (2026-05-15)

Проект в состоянии «прототип в коде + Nginx vhost-конфигурация под Beget VPS + спека и процедура миграции с живого сайта». Деплой на Beget ещё не делался. Хостинг — **Beget VPS** (`84.54.29.190`, root-SSH, Nginx; российский — ст. 12 152-ФЗ не активируется). На том же VPS до миграции работает старый React-сайт под `/var/www/alexanderlapygin.com/html` — миграция через release-каталог и atomic switch, процедура в `runbook.md` §2.5.

## Session 2026-05-15

### Что сделано

- **Установлен SSH-доступ к боевому VPS впервые с этой машины.** Старый ключ `~/.ssh/archive/id_ed25519.sftspider.bak[.pub]` из Telegram-архива (комментарий `sftspider@gmail.com`) сервером отклонён — его pubkey не в `authorized_keys`. Сгенерирован новый ed25519 (`~/.ssh/id_ed25519`, комментарий `alexanderlapygin@laptop-2026-05-15 alexanderlapygin.com-deploy`, fingerprint `SHA256:vV73dSqLWYod/3s2GGYJN0VqmsGNYI6+Sr+6IPwzNTo`); pubkey доставлен на VPS через anonymous paste.rs (web-терминал Beget не поддерживает paste, набирать вручную нереально). Pastbin удалён через `DELETE` после установки. Host keys VPS добавлены в `known_hosts` через TOFU (independent verification fingerprint в панели Beget не делался). Команды на VPS — read-only диагностика + единственная: `mkdir + echo pubkey >> authorized_keys + chmod 600`.
- **Полный read-only обход VPS.** Ubuntu 24.04.3 LTS, kernel 6.8.0-85 (uptime 221 день, **reboot required**: 11 ядер + libc6); nginx 1.24.0 без brotli-модуля; certbot 2.9.0, оба сертификата (alexanderlapygin.com, mind-section.com) ECDSA до 2026-07-05; **`/etc/letsencrypt/renewal/alexanderlapygin.com.conf` — `authenticator = nginx`, `installer = nginx`** (webroot не используется); docroot `/var/www/alexanderlapygin.com/html` ~49M (старый React от Lovable + showcase); диск 4.7/8.7G (55%); DNS `/etc/resolv.conf → 198.18.18.18` (внутренний Beget, наружу резолвит ОК); ufw inactive. На :3000 — **`sbp-backend.service`** (systemd, `User=www-data`, source: github.com/aiaiai-copilot/showcase-sbp-payment-fullstack, listens 127.0.0.1:3000 через nginx proxy `/api/`).
- **Скачаны живые vhost/renewal-конфиги для сверки.** Положены в `deploy/nginx/_remote-snapshot-2026-05-15/` (8 файлов): `alexanderlapygin.com.conf.enabled`, `….available`, `…renewal.conf`, аналоги для `mind-section.com`, `default`, `default.bak`, `nginx.conf`. Это reference, на VPS из этого каталога ничего не заливается.
- **Выровнен `deploy/nginx/alexanderlapygin.com.conf` по реальному состоянию VPS.** Удалена webroot-location для `/.well-known/acme-challenge` (certbot работает через nginx-plugin); в оба HTTPS-блока добавлены `include /etc/letsencrypt/options-ssl-nginx.conf;` + `ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;` (без них наследовались бы слабые дефолты из `nginx.conf`, включая TLSv1/1.1); вступительный комментарий обновлён. Cert paths уже совпадали с реальностью.
- **Принята архитектура показо/SBP: вынос в `legacy/` вне release-дерева Astro.** В docroot три самодостаточных Vite-SPA (`/showcase/payments/sbp/`, `/showcase/oauth/simplest/`, `/showcase/telegram-bot/messaging/`) + Node-бэкенд для SBP-демо (`sbp-backend.service`, `WorkingDirectory`+`EnvironmentFile` внутри docroot). Atomic switch `html`-симлинка их бы сломал. Решение: переносим showcase в `/var/www/alexanderlapygin.com/legacy/showcase/` и переписываем systemd-юнит на новый путь — release-switching касается только Astro. В vhost добавлены `^~ /api/` (proxy 127.0.0.1:3000) и `^~ /showcase/` (root → legacy) с nested locations: deny `~* /backend(/|$)` (защита от утечки серверного JS — у старого vhost'а `try_files $uri $uri/ /index.html` теоретически отдавал `/showcase/payments/sbp/backend/dist/server.js`), immutable cache для Vite-хешированных ассетов, no-cache для HTML. В runbook `docs/spec/runbook.md` §2.5 — новый **шаг 0** (только при первом cutover): `cp -a html/showcase legacy/showcase` (не `mv`, чтобы не сломать cutover-rollback), бэкап юнита, sed-замена префикса пути, daemon-reload+restart, отдельный rollback-сценарий для шага 0.
- **Memory обновлена** в `~/.claude/projects/.../memory/`: новые `vps-ssh-access.md` (какой ключ, fingerprints, как восстановить доступ через панель Beget) и `vps-state-snapshot.md` (snapshot состояния VPS 2026-05-15 + последствия для cutover'а; «SBP/showcase»-пункт помечен ✅ — архитектура утверждена). Подгружаются автоматически в следующих сессиях.

### Коммиты этой сессии

- `fcdeaac` feat(deploy): preserve showcase + SBP backend across Astro release switches
- `c37eb60` refactor(deploy/nginx): align vhost with real Beget VPS state
- `8292e96` chore(deploy): snapshot real VPS nginx + certbot configs for sverka

### Локальное состояние (не в git)

- **`~/.ssh/id_ed25519` (новый, рабочий)** — pubkey в `/root/.ssh/authorized_keys` на 84.54.29.190. Старая пара в `~/.ssh/archive/id_ed25519.sftspider.bak[.pub]` — не работает, можно игнорировать.
- **`~/.ssh/known_hosts`** — добавлены ключи `84.54.29.190` (ED25519 `SHA256:Pr/NxJHWyKy6e5GYvQ14TX3RG+jbrXr46wudwJgYMq4`, RSA, ECDSA), TOFU без сверки в панели Beget.
- **Beget VPS** — никаких изменений уровня сервиса. Шаг 0 runbook §2.5 (миграция showcase в `legacy/`, правка `sbp-backend.service`) **не выполнен**: всё ещё `WorkingDirectory=…/html/showcase/payments/sbp/backend`. `/var/www/alexanderlapygin.com/legacy/` не создан. Старый React-сайт + витрина + SBP-бэкенд продолжают работать, как раньше.
- **`.env`** в корне (gitignored): `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто).
- **Cloudflare Pages**: прототип на https://alexanderlapygin-prototype.pages.dev — содержимое всё ещё от `614681f` (старая mock-форма). Push в `origin/main` придержан, чтобы auto-deploy не выкатил полуфабрикат.
- **paste.rs/tWcX1** — анонимный пастбин с pubkey, **удалён** через DELETE.
- **Dev-сервер** не запущен. `node_modules/` от предыдущих сессий.
- **Внешних эффектов** (push в `origin`, выкатки на VPS, изменений DNS) — не было. Единственное взаимодействие с третьими сторонами — однократная заливка pubkey на paste.rs (удалена).

### Осталось недоделанным

1. **Первый cutover на Beget VPS по обновлённому runbook §2.5.** Шаг 0 (миграция showcase в `legacy/`, правка `sbp-backend.service`) — один раз перед остальными шагами. Шаги 1-5 (release-dir, scp конфигов, staging-vhost на отдельном порту, tarball-бэкап, atomic switch).
2. **`certbot renew --dry-run` сразу после cutover.** Боевой vhost объединяет `apex+www` в один `server`-блок, наш — разделяет; certbot installer может не понять, в какой блок вписывать `# managed by Certbot` строки. При падении: консолидировать наш vhost или править `/etc/letsencrypt/renewal/alexanderlapygin.com.conf`.
3. **`apt upgrade && reboot` VPS ДО cutover.** 221 день uptime, `/var/run/reboot-required` стоит. Downtime касается только старого сайта (~30-60 сек).
4. **`PUBLIC_METRIKA_ID`** не заведён. Счётчик + цели (`form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click`; полный список — `docs/spec/runbook.md` §13). Сейчас `trackGoal` — no-op. CSP уже разрешает домены Метрики.
5. **Уведомление в РКН по ст. 22 152-ФЗ.** Подать ДО публичного cutover (т.е. до момента, когда `alexanderlapygin.com` начнёт принимать обращения через нашу форму). Ст. 12 не требуется.
6. **Переписать CI/CD под scp+release-dir.** Runbook §5.1 всё ещё описывает старую wrangler/Cloudflare схему. Модель — `~/Projects/mind-section-dev-portfolio-by-lovable/.github/workflows/deploy.yml`, но с release-dir + atomic switch + smoke + ротация. Удалить `wrangler` из `devDependencies`.
7. **Push 15 коммитов в `origin/main`** — придержан до cutover'а на Beget + заведения Метрики + РКН-уведомления.

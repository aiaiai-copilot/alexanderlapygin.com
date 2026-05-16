# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (8 коммитов впереди `origin/main` плюс грядущий handoff-коммит; рабочее дерево чистое) — последний коммит `791a247` docs(handoff): mark РКН-removal as committed (d4b70b8) (2026-05-16).

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, отдельный SBP-backend на :3001. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из прошлой сессии (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok (20 страниц, 731 ms). На VPS ничего ещё не задеплоено (см. ниже).

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным (актуализировано на конец сессии)

1. **Cutover stage→prod** — крупный scope. Включает: deploy Astro в `/var/www/alexanderlapygin.com/html/`, активация репо-vhost (path A: regular-file → симлинк), 301-редиректы старых React-URL'ов если важно для SEO, smoke план, rollback план. Пред-чек по правилу [[check-publish-readiness-before-cutover]]: контент готов, формы работают, 404/sitemap/robots/OG ok. **Приоритет следующей сессии.**
2. **Defense-in-depth** (не критично пока ufw в силе): сменить bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` в `sbp-backend.service` (prod, :3000) и `sbp-backend-stage.service` (stage, :3001). Артефакты в репо: `deploy/systemd/*.service`.
3. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).

## Session 2026-05-16 (CSP snippet deploy)

### Что сделано

Задеплоен сужённый CSP snippet (из коммита `d4b70b8`) на VPS — prod + stage. Файл `deploy/nginx/alexanderlapygin-security-headers.conf` в репо не менялся (в коммитах не отражено — только перенос на VPS).

- `scp deploy/nginx/alexanderlapygin-security-headers.conf root@84.54.29.190:/etc/nginx/snippets/` — sha256 нового файла на VPS совпал с локальным (`72a15068c31b7003fec7c16661368235d60e8f1166f062776e1507c10d831754`).
- Pre-deploy backup на VPS: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 широкой версии `51ba5f28f5007d70e1d8a0a6e3cba21d83ebf5f7f74273736201afdb27b52baa`).
- `ssh root@84.54.29.190 'nginx -t && nginx -s reload'` — ok.
- Smoke `curl -sSI`: prod `/`, prod `/api/health`, stage `/` — все 6 security-заголовков на месте (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, новая узкая CSP). На `/api/` повторный `include` snippet'а отработал как ожидалось (nginx-footgun: add_header в location сбрасывает наследование).
- Memory `vps-state-snapshot` обновлён под новый sha256 snippet'а и путь к backup'у.

### Коммиты этой сессии

- `<этот handoff-коммит>` docs(handoff): update for session 2026-05-16 (CSP snippet deployed)

### Локальное состояние (не в git)

- **Локально:** рабочее дерево чистое. `.env` — `PUBLIC_METRIKA_ID` удалён (gitignored), без изменений в этой сессии.
- **VPS:** snippet `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` обновлён (sha256 `72a15068…`); nginx перезагружен; prod + stage отдают новую узкую CSP; backup широкой версии — в `/root/`.

### Осталось недоделанным

См. блок «Что осталось недоделанным» в In-flight context. Главное: #1 — cutover stage→prod.

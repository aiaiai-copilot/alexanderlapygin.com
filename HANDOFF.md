# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (9 коммитов впереди `origin/main` плюс грядущий handoff-коммит; рабочее дерево чистое) — последний коммит `f2e7714` docs(handoff): update for session 2026-05-16 (CSP snippet deployed) (2026-05-16).

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, отдельный SBP-backend на :3001. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из прошлой сессии (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok (20 страниц, 731 ms). На VPS ничего ещё не задеплоено (см. ниже).

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным (актуализировано на конец сессии)

Pre-check stage'а 2026-05-16 показал: cutover не готов. Скоуп остатка разделён на два независимых трека (технический + контентный) + сам cutover после них. Технический трек закроется быстро, контентный — отдельный многосессионный.

1. **Технический трек pre-cutover** (приоритет следующей сессии, оценка — пара коммитов). Артефакты обнаружены pre-check'ом, по коду в HEAD'е:
   - `@astrojs/sitemap` — нет в `package.json`, нет в `astro.config.mjs`. На stage `/sitemap.xml` и `/sitemap-index.xml` → 404.
   - `public/robots.txt` — `public/` пуст. На stage `/robots.txt` → 404. На текущем React-prod robots.txt есть.
   - RSS: ссылки `/blog/rss.xml` в `Footer.astro:93` и `BlogCatalog.astro:41`, фактически 404 на stage. Решение — либо подключить `@astrojs/rss` (генерация feed.xml из коллекции `posts`), либо убрать ссылки.
   - `og:image` отсутствует во всём сайте (`BaseLayout.astro:53-58` — есть og:title/description/type/url/locale, нет og:image). Добавить дефолтный в `public/` и поле в `BaseLayout` props.
   - `favicon.ico` отсутствует (`public/` пуст; stage 404; на React-prod есть).
   - Мелкий fix: `SolutionsPage.astro:16` (RU-карточка «Витрина с минимальным backend») упоминает «CSP, аналитика, темы, локализация» — слово «аналитика» убрать (соответствует decisions §5.4).
   - В конце трека — `npm run check && npm run build`, redeploy stage, повторная проверка тех же эндпойнтов.

2. **Контент-трек pre-cutover** (отдельный, многосессионный, требует участия автора как контент-мейкера — несопоставим по объёму с техническим):
   - `HomePage.astro:79-108` и `:124-144` — захардкоженный полуфабрикат: `[1,2,3].map(...)` для «Featured Projects» и «Latest Posts» с inline-RU/EN-стрингами «Пример проекта 1/2/3» / «Sample project 1/2/3» / «Заголовок публикации 1/2/3» с явным комментарием «Сюда подтянутся реальные карточки из коллекции» / «Реальные данные подтянутся из контент-коллекции». **Прямой блокер cutover'а.** Решение: либо пополнить коллекции и подключить `getCollection` (как в `ProjectsCatalog`/`BlogCatalog`), либо временно скрыть секции, либо другая стратегия.
   - EN-локализация контент-коллекций: в `src/content/` всё почти только RU — 2 RU + 1 EN пост, 1 client-project (RU), 1 personal-project (RU), 1 saas-project (RU), 2 solutions (RU). EN-каталоги `/en/projects`, `/en/blog`, `/en/solutions` рендерятся почти пустыми.
   - Решение по `/portfolio/*` и `/showcase/*` (старый React-prod): URL'ы `/portfolio/living-tags/{living-tags-poc,living-tags-prototype}/`, `/showcase/{payments/sbp,oauth/simplest,telegram-bot/messaging}/` — это демки/PoC. Их нет в Astro. Варианты: (а) сохранить URL'ы через nginx alias на html-файлы (сами демки переехать в `public/legacy/` или хранить отдельно); (б) 301-редиректы на карточки в новом каталоге; (в) 410 Gone; (г) использовать их как `liveUrl` в карточках проектов.

3. **Cutover stage→prod** (после треков 1 и 2 — pre-check должен пройти полностью):
   - Redeploy stage с актуальным build'ом (текущий релиз `stage-releases/20260515T233747Z` — pre-`d4b70b8`, в HTML видна удалённая кнопка `data-cookie-settings`).
   - Pre-check повтор: блокеры и defects из треков 1 и 2 закрыты.
   - Релизная цепочка prod как на stage: `/var/www/alexanderlapygin.com/html/` → симлинк на `releases/<TS>/` (atomic switch).
   - Deploy Astro в новый `releases/<TS>/`.
   - Path A vhost: `cp /etc/nginx/sites-enabled/alexanderlapygin.com.conf /root/...pre-upgrade-<TS>.bak` → `rm` regular-file → `ln -s ../sites-available/alexanderlapygin.com.conf` → `nginx -t && nginx -s reload`.
   - 301-редиректы (если решено в треке 2).
   - Smoke prod (все ключевые URL'ы 200, формы работают, CSP/headers совпадают со stage, `certbot renew --dry-run` ok).
   - Rollback план держать рядом на каждом шаге.

4. **Defense-in-depth** (не критично пока ufw в силе): сменить bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` в `sbp-backend.service` (prod, :3000) и `sbp-backend-stage.service` (stage, :3001). Артефакты в репо: `deploy/systemd/*.service`.

5. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).
   - Cleanup `.wrangler/` (в `.gitignore` отсутствует — артефакт CF Pages лежит в репо).

## Session 2026-05-16 (CSP snippet deploy + cutover pre-check)

### Что сделано

**Часть 1 — CSP snippet deploy** (закоммичено в `f2e7714` промежуточным handoff-коммитом — позже зафиксировано: handoff коммитить **один раз в конце сессии**; см. memory `feedback-handoff-commit-once-per-session`).

- `scp deploy/nginx/alexanderlapygin-security-headers.conf root@84.54.29.190:/etc/nginx/snippets/` — sha256 на VPS совпал с локальным (`72a15068…`).
- Pre-deploy backup на VPS: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 широкой версии `51ba5f28…`).
- `ssh root@84.54.29.190 'nginx -t && nginx -s reload'` — ok.
- Smoke `curl -sSI`: prod `/`, prod `/api/health`, stage `/` — все 6 security-заголовков на месте.
- Memory `vps-state-snapshot` обновлён под новый sha256 snippet'а и путь к backup'у.

**Часть 2 — cutover stage→prod pre-check.** Прошёлся по правилу [[check-publish-readiness-before-cutover]], читая HEAD напрямую (stage устарел: релиз pre-`d4b70b8`). Вывод: **не готов**. Полная сводка перенесена в «Что осталось недоделанным» в In-flight context, разделена на технический + контентный треки + сам cutover. Главные находки одной строкой: HomePage захардкожен `[1,2,3]` карточками-полуфабрикатами (БЛОКЕР); sitemap/robots/RSS/og:image/favicon отсутствуют; контент-коллекции почти только RU; на старом prod-React есть URL'ы `/portfolio/*` и `/showcase/*` с реальными демками, которых нет в Astro.

### Коммиты этой сессии

- `f2e7714` docs(handoff): update for session 2026-05-16 (CSP snippet deployed) — промежуточный, в норме его быть не должно
- `<этот handoff-коммит>` docs(handoff): pre-check results + scope split — финальный

### Локальное состояние (не в git)

- **Локально:** рабочее дерево чистое. `.env` — `PUBLIC_METRIKA_ID` удалён (gitignored), без изменений в этой сессии.
- **VPS:** snippet `/etc/nginx/snippets/alexanderlapygin-security-headers.conf` обновлён (sha256 `72a15068…`); nginx перезагружен; prod + stage отдают узкую CSP; backup широкой версии в `/root/`. Деплоев Astro в этой сессии **не было** — stage `stage-releases/20260515T233747Z` всё ещё pre-`d4b70b8`.

### Осталось недоделанным

См. блок «Что осталось недоделанным» в In-flight context. Главное: #1 — технический трек pre-cutover (быстрый); #2 — контентный трек pre-cutover (большой, отдельные сессии); #3 — сам cutover после.

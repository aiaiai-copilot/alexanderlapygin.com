# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (после merge технического трека впереди `origin/main` на 9 коммитов плюс грядущий handoff-коммит; рабочее дерево чистое) — последний код-коммит `9a8e0ab` fix(solutions): remove "analytics" from EN minimal-backend card (2026-05-17).

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, **обновлён 2026-05-17** до релиза `20260516T212815Z` (теперь содержит sitemap, RSS per-locale, og:image, favicon-стек, twitter:card, очищенную карточку minimal-backend). Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из сессии 2026-05-15 (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok.

### Технический трек pre-cutover — выполнен (2026-05-17)

Spec `8a3df13` + plan `f615616` → исполнение subagent-driven'ом в worktree. Все 5 tasks плана закрыты + 2 follow-up fix'а от code-quality review. Stage redeployed в новый `stage-releases/20260516T212815Z`, smoke 9/9 endpoints HTTP/2 200, 4 мета-тега в `dist/index.html`, «аналитика»/«analytics» count 0 на `/solutions` и `/en/solutions`, RSS items: RU 2, EN 1. Финальный integration review подтвердил merge readiness. Подробности — `git log --oneline cdaaf6a..HEAD` после merge'а.

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным

1. **Контент-трек pre-cutover** (отдельный, многосессионный, требует участия автора как контент-мейкера — несопоставим по объёму с техническим):
   - `HomePage.astro:79-108` и `:124-144` — захардкоженный полуфабрикат: `[1,2,3].map(...)` для «Featured Projects» и «Latest Posts» с inline-RU/EN-стрингами «Пример проекта 1/2/3» / «Sample project 1/2/3» / «Заголовок публикации 1/2/3» с явным комментарием «Сюда подтянутся реальные карточки из коллекции» / «Реальные данные подтянутся из контент-коллекции». **Прямой блокер cutover'а.** Решение: либо пополнить коллекции и подключить `getCollection` (как в `ProjectsCatalog`/`BlogCatalog`), либо временно скрыть секции, либо другая стратегия.
   - EN-локализация контент-коллекций: в `src/content/` всё почти только RU — 2 RU + 1 EN пост, 1 client-project (RU), 1 personal-project (RU), 1 saas-project (RU), 2 solutions (RU). EN-каталоги `/en/projects`, `/en/blog`, `/en/solutions` рендерятся почти пустыми.
   - **Cyrillic-only `public/og.png`** — содержит «АЛ / Александр Лапыгин / Независимый разработчик»; для EN-локалей при социальной шарилке выглядит странно. Решение из спеки (один статический OG для обеих локалей) принято осознанно — пересматривать когда EN станет primary surface. Хук уже есть: `locale` в scope в `BaseLayout.astro`; добавить `og-en.svg` + ветвление в meta-теге.
   - Решение по `/portfolio/*` и `/showcase/*` (старый React-prod): URL'ы `/portfolio/living-tags/{living-tags-poc,living-tags-prototype}/`, `/showcase/{payments/sbp,oauth/simplest,telegram-bot/messaging}/` — это демки/PoC. Их нет в Astro. Варианты: (а) сохранить URL'ы через nginx alias на html-файлы (сами демки переехать в `public/legacy/` или хранить отдельно); (б) 301-редиректы на карточки в новом каталоге; (в) 410 Gone; (г) использовать их как `liveUrl` в карточках проектов.

2. **Cutover stage→prod** (после контент-трека — pre-check должен пройти полностью):
   - Pre-check повтор: блокеры из контент-трека закрыты, остальные ranking'ом OK.
   - Свежий redeploy stage с актуальным build'ом + смоук перед cutover'ом (текущий stage-релиз `20260516T212815Z` от 2026-05-17 включает технический трек; если контент-трек добавит изменения — пересобрать).
   - Релизная цепочка prod как на stage: `/var/www/alexanderlapygin.com/html/` → симлинк на `releases/<TS>/` (atomic switch).
   - Deploy Astro в новый `releases/<TS>/`.
   - Path A vhost: `cp /etc/nginx/sites-enabled/alexanderlapygin.com.conf /root/...pre-upgrade-<TS>.bak` → `rm` regular-file → `ln -s ../sites-available/alexanderlapygin.com.conf` → `nginx -t && nginx -s reload`.
   - 301-редиректы (если решено в контент-треке).
   - Smoke prod (все ключевые URL'ы 200, формы работают, CSP/headers совпадают со stage, `certbot renew --dry-run` ok).
   - Rollback план держать рядом на каждом шаге.

3. **Defense-in-depth** (не критично пока ufw в силе): сменить bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` в `sbp-backend.service` (prod, :3000) и `sbp-backend-stage.service` (stage, :3001). Артефакты в репо: `deploy/systemd/*.service`.

4. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).
   - Cleanup `.wrangler/` (в `.gitignore` отсутствует — артефакт CF Pages лежит в репо).
   - `package.json` script для `node src/scripts/build-branding-assets.mjs` (сейчас запускается вручную — discoverability ноль).

## Session 2026-05-17

### Что сделано

Имплементация технического трека pre-cutover. План `f615616` выполнен subagent-driven подходом из worktree `.claude/worktrees/feat-pre-cutover-technical-track` (создан через `EnterWorktree`, удалён в финиш-шаге).

- **Task 1: Sitemap + robots.txt** — `@astrojs/sitemap` в `dependencies`, per-locale i18n config (ru-RU, en-US), `public/robots.txt` с Sitemap pointer.
- **Task 2: RSS feeds per locale** — `@astrojs/rss` в `dependencies`, два endpoint'а (`src/pages/blog/rss.xml.ts`, `src/pages/en/blog/rss.xml.ts`), новый i18n key `rss.{title,description}` в `ru.ts`/`en.ts`/`types.ts`, `<link rel="alternate" type="application/rss+xml">` в `BaseLayout.astro` (per-locale, через `localizedPath`).
- **Task 3: Branding assets** — `@resvg/resvg-js` в `devDependencies`, SVG-исходники `src/assets/branding/{og,favicon}.svg`, генератор `src/scripts/build-branding-assets.mjs` (resvg + inline ICO writer), сгенерированные `public/{og.png,favicon.{svg,ico},apple-touch-icon.png}` закоммичены в git (script запускается вручную, ассеты редко меняются). `BaseLayout`: favicon links + og:image-блок + twitter:card.
- **Task 3 follow-up:** `<meta name="twitter:image">` добавлен рядом с `twitter:card` — code-quality reviewer обратил внимание, что не все scrapers Twitter/X надёжно fallback'ятся на og:image.
- **Task 4: Cleanup «аналитика»** — `src/components/SolutionsPage.astro` строка 16 (RU) + строка 39 (EN) — слово «аналитика» / «analytics» убрано из карточки minimal-backend. EN-фикс был отдельным follow-up'ом — implementer Task 4 пропустил парный EN-card, что план эксплицитно предвидел.
- **Task 5: Redeploy stage + smoke** — `npm run build` + rsync на VPS в новый `stage-releases/20260516T212815Z`, atomic symlink switch `/var/www/alexanderlapygin.com/stage-html` → новый релиз. Smoke: 9/9 endpoints HTTP/2 200 (`sitemap-index.xml`, `sitemap-0.xml`, `robots.txt`, оба `rss.xml`, `og.png`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`), 4 мета-тега в `dist/index.html`, «аналитика»/«analytics» count 0 на обоих solutions, RSS items: RU 2, EN 1.

Каждая задача проходила цикл implementer → spec-compliance review → code-quality review с фикс-циклами при необходимости. Финальный integration review подтвердил merge readiness.

### Коммиты этой сессии

- `49e38f1` feat(seo): add sitemap integration and robots.txt
- `d8eba14` feat(blog): generate RSS feeds per locale
- `61b78a9` feat(branding): add og:image, favicon, apple-touch-icon
- `28b3a36` fix(branding): add twitter:image alongside twitter:card
- `e32a559` fix(solutions): remove "аналитика" from RU minimal-backend card
- `9a8e0ab` fix(solutions): remove "analytics" from EN minimal-backend card

После HANDOFF-коммита worktree merge'дется в `main` локально (fast-forward), worktree и feature-branch удаляются.

### Локальное состояние (не в git)

- **Локально:** worktree `.claude/worktrees/feat-pre-cutover-technical-track` и feature branch `worktree-feat-pre-cutover-technical-track` будут удалены после merge'а. После финиш-шагов рабочее дерево чистое в `main`.
- **VPS:** новый stage-релиз `/var/www/alexanderlapygin.com/stage-releases/20260516T212815Z` (live через `stage-html` symlink). Предыдущий `stage-releases/20260515T233747Z` лежит рядом — для быстрого rollback'а `ln -sfn .../20260515T233747Z .../stage-html`. Retention 3 последних релиза — пока чистить нечего. Prod, snippet, vhost'ы, SBP-backend'ы — без изменений.

### Осталось недоделанным

См. блок «Что осталось недоделанным» в In-flight context. Главное на следующую сессию: либо контент-трек (наполнить коллекции, спрятать `[1,2,3].map`-полуфабрикат на HomePage, разобраться с EN OG image и с легаси `/portfolio`-`/showcase` URL'ами), либо cutover stage→prod, если контент готов сам по себе.

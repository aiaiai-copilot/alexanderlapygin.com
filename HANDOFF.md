# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (2 коммита впереди `origin/main` плюс грядущий handoff-коммит; рабочее дерево чистое) — последний коммит `f615616` docs(plan): pre-cutover technical track implementation plan (2026-05-16).

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, отдельный SBP-backend на :3001. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из сессии 2026-05-15 (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok.

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным (актуализировано на конец сессии)

1. **Технический трек pre-cutover — готов к исполнению.**
   - **Spec:** `docs/superpowers/specs/2026-05-16-pre-cutover-technical-track-design.md` (коммит `8a3df13`) — 8 секций, все архитектурные развилки закрыты в брейншторме.
   - **Implementation plan:** `docs/superpowers/plans/2026-05-16-pre-cutover-technical-track.md` (коммит `f615616`) — 5 tasks (1+2 = sitemap+robots; 3 = RSS per-locale; 4+5 = og:image+favicon через resvg + inline ICO; 6 = cleanup «аналитика»; 7 = redeploy stage + smoke), bite-sized steps.
   - **Способ исполнения:** subagent-driven (выбор юзера — пускать в **новой сессии** через `superpowers:subagent-driven-development`).
   - Скоуп закрывает: `@astrojs/sitemap` (404 → 200), `public/robots.txt` (404 → 200), RSS per-locale (`/blog/rss.xml` + `/en/blog/rss.xml`, 404 → 200), `og:image` (нет → default static), `favicon`/`apple-touch-icon` (нет → есть, через `@resvg/resvg-js` devDep + inline ICO writer ~30 строк), убрать слово «аналитика» из `SolutionsPage.astro:16`.

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

## Session 2026-05-17

### Что сделано

Брейншторм + дизайн + implementation plan для технического трека pre-cutover. Кода/деплоев в этой сессии не было — только проектирование.

- **Брейншторм 4 архитектурных развилок** (зафиксированы в spec):
  - RSS: реализовать `@astrojs/rss` (а не убрать ссылки) — текущая разметка подразумевает фид, обвязка минимальна.
  - og:image: один статический дефолт `public/og.png` 1200×630 (per-locale/per-page — over-engineering).
  - Branding pipeline: `@resvg/resvg-js` (devDep) + inline ICO writer (~30 строк, без `png-to-ico`) — меньше footprint против `sharp`, нет коллизий с возможным будущим `astro:assets`.
  - robots.txt: минимальный allow-all + Sitemap pointer (без политики по AI-ботам).

- **Spec:** `docs/superpowers/specs/2026-05-16-pre-cutover-technical-track-design.md` — 8 секций, self-reviewed (3 неоднозначности по line-anchored insertion'ам в BaseLayout исправлены inline до коммита).

- **Implementation plan:** `docs/superpowers/plans/2026-05-16-pre-cutover-technical-track.md` — 5 tasks, bite-sized steps с полным кодом всех артефактов (SVG-исходники, build-скрипт с inline ICO writer, RSS-endpoint'ы, BaseLayout patch'и). Включает Task 5 — redeploy stage + smoke endpoints.

- **Выбор способа исполнения:** subagent-driven, но **запуск в новой сессии** (выбор юзера).

### Коммиты этой сессии

- `8a3df13` docs(spec): pre-cutover technical track design
- `f615616` docs(plan): pre-cutover technical track implementation plan

### Локальное состояние (не в git)

- **Локально:** рабочее дерево чистое. Никаких uncommitted-файлов, никаких запущенных процессов, никаких side-effect'ов в этой сессии.
- **VPS:** без изменений в этой сессии. Состояние: prod-vhost с ad-hoc patch'ем + актуальный узкий CSP snippet (как зафиксировано 2026-05-16), stage release всё ещё `stage-releases/20260515T233747Z` (pre-`d4b70b8`).

### Осталось недоделанным

См. блок «Что осталось недоделанным» в In-flight context. Главное: следующая сессия должна запустить execution плана `f615616` через `superpowers:subagent-driven-development` (5 tasks, последняя — redeploy stage + smoke).

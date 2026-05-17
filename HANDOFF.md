# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (впереди `origin/main` на 8 коммитов — Phases 1-4 контент-трека + Phase 3 fix `367882a` + 3 handoff'а; рабочее дерево чистое) — последний содержательный коммит `7e93350` feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio (2026-05-17), не запушен.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, **обновлён 2026-05-17** до релиза `20260516T221717Z` (CSP-фикс: все скрипты внешние, theme toggle и mobile menu работают под строгим `script-src 'self'`; всё, что было в предыдущем релизе `20260516T212815Z`, тоже здесь — sitemap, RSS per-locale, og:image, favicon-стек, twitter:card, очищенная карточка minimal-backend). Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из сессии 2026-05-15 (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok.

### Технический трек pre-cutover — выполнен (2026-05-17)

Spec `8a3df13` + plan `f615616` → исполнение subagent-driven'ом в worktree. Все 5 tasks плана закрыты + 2 follow-up fix'а от code-quality review. Stage redeployed в новый `stage-releases/20260516T212815Z`, smoke 9/9 endpoints HTTP/2 200, 4 мета-тега в `dist/index.html`, «аналитика»/«analytics» count 0 на `/solutions` и `/en/solutions`, RSS items: RU 2, EN 1. Финальный integration review подтвердил merge readiness. Подробности — `git log --oneline cdaaf6a..HEAD` после merge'а.

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным

1. **Контент-трек pre-cutover — ВСЕ 4 ФАЗЫ ЗАКРЫТЫ ЛОКАЛЬНО** (`c2da2a1` + `9777ca9` + `25ef234` + fix `367882a` + `7e93350`). Spec: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`. План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`.
   - Phase 1 (`c2da2a1`): seed posts/projects из прод-источника.
   - Phase 2 (`9777ca9`): i18n rewrite + HomePage rename/tagline.
   - Phase 3 (`25ef234` + fix `367882a`): HomePage rewire на `getCollection` + kind-aware project links.
   - Phase 4 (`7e93350`): og-en.svg + locale-conditional og:image/twitter:image в BaseLayout + nginx `/portfolio/` alias.
   - **Подход исполнения (подтверждён в Phases 1-4):** `superpowers:subagent-driven-development` (по одному implementer-subagent'у на task + spec review + quality review + final integration review на цельный phase-коммит).
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты фаз, но блокируют cutover): реальный `liveUrl` для `voice-to-spec` (сейчас `-tbd` placeholder в `c2da2a1`); реальный body для `llm-spec-tools` (placeholder body «## Цель / ## Состояние» добавлен в `c2da2a1`); EN/RU-переводы single-locale showcase'ов (oauth EN-only, telegram EN-only, sbp RU-only); body для EN-solutions `spec-trio` и `static-site-with-ssr` (skeleton'ы созданы в `c2da2a1`); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной редизайн `og-en.svg` если автор хочет более полированный визуал (сейчас — структурная копия `og.svg` с латинской типографикой).

2. **Redeploy stage с актуальным build'ом** — отдельная сессия. Текущий stage-релиз `20260516T221717Z` от 2026-05-17 включает только технический трек + CSP-фикс; **контент-трек Phases 1-4 ещё НЕ задеплоен на stage**. Перед redeploy: `npm run build` локально → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch `stage-html` симлинка. Smoke по спеке §5 + добавить `/portfolio/living-tags/living-tags-prototype/` (рекомендация из final integration review Phase 4 — spec'овый smoke-loop сейчас покрывает только Astro-URL'ы).

3. **Cutover stage→prod** (после redeploy stage + smoke — единственный оставшийся блокер; CSP-фикс закрыт в `cece042`):
   - Pre-check повтор: блокеры из контент-трека закрыты, остальные ranking'ом OK.
   - Релизная цепочка prod как на stage: `/var/www/alexanderlapygin.com/html/` → симлинк на `releases/<TS>/` (atomic switch).
   - Deploy Astro в новый `releases/<TS>/`.
   - Path A vhost: `cp /etc/nginx/sites-enabled/alexanderlapygin.com.conf /root/...pre-upgrade-<TS>.bak` → `rm` regular-file → `ln -s ../sites-available/alexanderlapygin.com.conf` → `nginx -t && nginx -s reload`.
   - VPS-side: распаковка `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` в `/var/www/alexanderlapygin.com/legacy/` (showcase + portfolio sub-SPAs). Удалить `legacy/showcase/payments/sbp/backend/.env` перед публикацией (sensitive). nginx `/showcase/` блок уже есть, `/portfolio/` добавлен Phase 4'ом.
   - 301-редиректы (если решено).
   - Smoke prod (все ключевые URL'ы 200, **включая `/portfolio/living-tags/living-tags-prototype/`**, формы работают, CSP/headers совпадают со stage, `certbot renew --dry-run` ok).
   - Rollback план держать рядом на каждом шаге.

4. **Defense-in-depth** (не критично пока ufw в силе): сменить bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` в `sbp-backend.service` (prod, :3000) и `sbp-backend-stage.service` (stage, :3001). Артефакты в репо: `deploy/systemd/*.service`.

5. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).
   - Cleanup `.wrangler/` (в `.gitignore` отсутствует — артефакт CF Pages лежит в репо).
   - `package.json` script для `node src/scripts/build-branding-assets.mjs` (сейчас запускается вручную — discoverability ноль).
   - CI guard на «edited og-en.svg but forgot to commit og-en.png» (из Phase 4 final review).

## Session 2026-05-17 (восьмая сессия дня)

### Что сделано

- Phase 4 контент-трека (Tasks 11-14 плана) выполнена через `superpowers:subagent-driven-development`. Flow per task: 1 implementer-subagent (sonnet) → spec compliance review (sonnet) → code-quality review (sonnet) → mark complete. После Task 14 — финальный integration review всей Phase 4 (opus) READY_TO_MERGE + Cutover READY.
- Контентный трек теперь **полностью закрыт локально** (4 атомарных phase-коммита: `c2da2a1`, `9777ca9`, `25ef234`+fix `367882a`, `7e93350`).
- Phase 4 — единый коммит на 5 файлов:
  - `7e93350` feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio
- Изменения по файлам:
  - `src/assets/branding/og-en.svg` (NEW, 13 строк) — структурная копия `og.svg`, только 3 текстовые замены: `АЛ`→`AL`, `Александр Лапыгин`→`Alexander Lapygin`, `Независимый разработчик`→`Independent developer`. ViewBox/координаты/шрифты/цвета bit-for-bit идентичны.
  - `public/og-en.png` (NEW, 1200×630 RGBA PNG, 25579 байт) — сгенерирован скриптом.
  - `src/scripts/build-branding-assets.mjs` — добавлен блок `// 1b. og-en.png` сразу после `// 1. og.png` (тот же `rasterize` helper); финальный лог обновлён с «4 assets» на «5 assets».
  - `src/layouts/BaseLayout.astro` — в frontmatter добавлен `const ogImagePath = locale === "en" ? "/og-en.png" : "/og.png"` (strict `===`, неизвестные локали падают на RU); хардкоженный `/og.png` заменён на `ogImagePath` в двух местах: `og:image` (line 69) **и** `twitter:image` (line 74). `twitter:image` обновлён сверх spec'а для consistency — обоснование в integration review: spec явно запрещал менять только `twitter:card` (тип карточки, без path), а `twitter:image` концептуально всегда дублировал `og:image`. Bonus: `og:image:alt` уже использует `dict.meta.siteAuthor` (RU «Александр Лапыгин» / EN «Alexander Lapygin»), так что alt автоматически стал locale-aware.
  - `deploy/nginx/alexanderlapygin.com.conf` — вставлен `location ^~ /portfolio/` блок (25 строк, между `/showcase/` close на line 115 и immutable-cache comment на line 117). Структурная копия `/showcase/` минус `backend/` exclusion (portfolio не имеет server-side компонентов). `root /var/www/alexanderlapygin.com/legacy;` + same security-headers include + `try_files $uri $uri/index.html =404;`. Live `nginx -t` отложен до cutover'а (snippet path существует только на VPS).
- Build/check: `npm run check` 0/0 (64 pre-existing Zod-deprecation hint'а), `npm run build` 26 страниц success. Спот-чек dist: RU pages (`/`, `/about/`, `/projects/voice-to-spec/`, `/404/`) → `og.png`; EN pages (`/en/`, `/en/about/`, `/en/blog/sdd-intro/`, `/en/404/`) → `og-en.png`. Оба meta-тега (og:image + twitter:image) согласованы на каждой странице.
- Final integration review (opus): READY_TO_MERGE + Cutover READY. Полезная рекомендация на cutover — добавить `https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/` в smoke-loop (sect §5 покрывает только Astro-URL'ы, не portfolio alias).

### Коммиты этой сессии

- `7e93350` feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- Никаких фоновых процессов: subagent'ы, поднимавшие `npm run dev` для smoke-проверок, убирали их сами.
- На VPS — без изменений (нет деплоев в этой сессии). Stage retention: активный релиз `20260516T221717Z`. Контент-трек Phases 1-4 **не задеплоен на stage** (ждёт redeploy в следующей сессии).

### Осталось недоделанным

Следующая сессия:

1. **Redeploy stage** с актуальным build'ом (содержит все 4 phase-коммита). Mechanism — как для текущего `stage-releases/20260516T221717Z`: `npm run build` локально → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch `stage-html` симлинка. Smoke по спеке §5 + добавить `/portfolio/living-tags/living-tags-prototype/`. На этом stage будет готов под cutover.
2. После redeploy stage + smoke — cutover stage→prod (см. общий блок «Что осталось недоделанным» п.3 в начале файла).

Дальше по общему блоку: открытые элементы спеки §7 (авторская работа — реальный `liveUrl` для voice-to-spec, body для llm-spec-tools, single-locale переводы, EN-solutions bodies), defense-in-depth, вне-MVP cleanup.

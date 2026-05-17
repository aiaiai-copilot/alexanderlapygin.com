# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (впереди `origin/main` на 10 коммитов — Phases 1-4 контент-трека + Phase 3 fix `367882a` + content-realign `744b059` + 4 handoff'а; рабочее дерево чистое до этого handoff-коммита) — последний содержательный коммит `744b059` feat(content): align about/solutions/blog/projects with prod source-of-truth (2026-05-17), не запушен.

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

1. **Контент-трек pre-cutover — ВСЕ 4 ФАЗЫ ЗАКРЫТЫ ЛОКАЛЬНО + content-realign** (`c2da2a1` + `9777ca9` + `25ef234` + fix `367882a` + `7e93350` + `744b059`). Spec: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`. План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`.
   - Phase 1 (`c2da2a1`): seed posts/projects из прод-источника.
   - Phase 2 (`9777ca9`): i18n rewrite + HomePage rename/tagline.
   - Phase 3 (`25ef234` + fix `367882a`): HomePage rewire на `getCollection` + kind-aware project links.
   - Phase 4 (`7e93350`): og-en.svg + locale-conditional og:image/twitter:image в BaseLayout + nginx `/portfolio/` alias.
   - **Content-realign (`744b059`, эта сессия):** ручной разворот контента под прод как single source of truth — заменены/удалены seed-скелетоны, see "Session 2026-05-17" ниже. Расхождение со spec'ом сознательное, фиксируется в коде.
   - **Подход исполнения (Phases 1-4):** `superpowers:subagent-driven-development`. Content-realign в этой сессии — ad-hoc, без плана/спеки, по интерактивной правке UI с просмотром в dev-сервере.
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты, блокируют cutover): реальный `liveUrl` для `voice-to-spec` (сейчас `-tbd` placeholder в `c2da2a1`); реальный body для `llm-spec-tools` (placeholder body «## Цель / ## Состояние» в `c2da2a1`); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной редизайн `og-en.svg` если хочется более полированный визуал. **Закрыто/устарело:** single-locale showcase'ы и EN-solutions skeleton'ы `spec-trio`/`static-site-with-ssr` — удалены в `744b059`, заменены на прод-витрину (oauth/telegram/sbp/saas).

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

## Session 2026-05-17 (девятая сессия дня — content-realign)

### Что сделано

Интерактивный разворот контента под прод как single source of truth. Источник правды — прод-React-SPA: основной JS `https://alexanderlapygin.com/assets/index-x1YQXxU-.js` + sub-chunks (`blogPosts-BRZs9O0j.js`, `showcaseProjects-SOi9Qs7t.js`). Расхождение со spec'ом 2026-05-17-content-seed-from-prod сознательное — пользователь принимал решения в живом просмотре через `npm run dev`. Единый коммит:

- `744b059` feat(content): align about/solutions/blog/projects with prod source-of-truth

Изменения по областям:

- **About (`src/i18n/{ru,en}.ts` + `src/components/AboutPage.astro` + `src/i18n/types.ts`):**
  - Опечатка: «не ваша» → «не моя» (RU).
  - Группа экспертизы **Разработка** / **Development** восстановлена из прода (с bullet-списком «инструменты ИИ: Claude Code / Antigravity / Lovable / и др.»); заменила две stage-группы (AI-инструменты + Документация).
  - Timeline: добавлены две прод-записи (Самозанятый 2025—наст., VDI/Росбанк/Т-Банк 2000—2025), потом две stage-записи (2023—наст., 2018—2023) удалены — остались только прод. Тип timeline расширен опциональным `company`, `summary` сделан опциональным; renderer показывает оба поля условно.
  - Education: интервал убран, заменено на «МИФИ — прикладная математика» / «MEPhI — Applied Mathematics»; тип `period` сделан опциональным, renderer условный.
  - CTA-блок «Обсудить проект» удалён.

- **Solutions (`src/components/SolutionsPage.astro` + `src/content/solutions/{ru,en}/*`):**
  - SolutionsPage перепаян с хардкоженного массива на `getCollection("solutions")` с фильтром по локали и сортировкой по `order`. Удалён неиспользуемый импорт `localizedPath`.
  - Содержимое полностью заменено на 4 прод-витрины: `oauth-simplest` (10), `telegram-gateway` (20), `sbp-payments` (30), `saas-dashboard` (40) — обе локали. `demoUrl` сверены с прод-роутером showcase-чанка: `/showcase/oauth/simplest/`, `/showcase/telegram-bot/messaging/`, `/showcase/payments/sbp/`, у saas-dashboard URL убран (на проде `isLive:false`).
  - Удалены skeleton'ы `spec-trio` и `static-site-with-ssr` в обеих локалях.
  - Добавлен «Open / Открыть» link в карточку (рендерится только при наличии `demoUrl`).
  - CTA-блок «Готовы начать проект?» удалён.

- **Blog (`src/content/posts/{ru,en}/*`):**
  - Оставлены три прод-SDD-поста (`sdd-intro`, `sdd-backstory`, `sdd-first-experience`) — RU+EN. Их body уже идентичны проду (Phase 1).
  - Удалены `zachem-spec-pered-kodom` (RU+EN) и `staticheskiy-sait-i-odna-tochka-ssr` (RU).

- **Projects (`src/content/projects-{personal,saas}/`):**
  - `living-tags-prototype.md` перенесён из `projects-personal/{ru,en}` в `projects-saas/{ru,en}` (git mv, контент без изменений).
  - `sbp-payments.md` удалён из `projects-personal/ru` (переведён в Solutions).
  - `scoped-tasks.md` удалён из `projects-saas/ru`.

- **Home (`src/components/HomePage.astro`):** удалён нижний CTA «Обсудить проект».

Build/check: `npm run check` 0/0 (64 pre-existing Zod-deprecation hint'а — unchanged). `npm run build` не запускался в этой сессии (HMR-only flow).

### Коммиты этой сессии

- `744b059` feat(content): align about/solutions/blog/projects with prod source-of-truth
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- **Фоновый процесс:** `npm run dev` поднят на `http://localhost:4321/` (Bash background ID `bzsoublsn`). Если следующая сессия начинает с разработки UI — можно переподнять; если с деплоя/cutover'а — убить.
- **Временные дампы прод-источников** в `/tmp/`: `prod-app.js` (397 KB, основной React-bundle), `blogPosts.js` (17.9 KB), `showcase.js` (1.8 KB). Использовались как источник истины для extraction'а контента в `744b059`. Если нужно повторить расследование — пути воспроизводимы через `curl https://alexanderlapygin.com/assets/index-x1YQXxU-.js` и т.д.
- На VPS — без изменений (нет деплоев в этой сессии). Stage retention: активный релиз `20260516T221717Z` от 2026-05-17. Контент-трек Phases 1-4 **и** content-realign (`744b059`) **не задеплоены на stage** (ждут redeploy в следующей сессии).

### Осталось недоделанным

Следующая сессия:

1. **Redeploy stage** с актуальным build'ом (содержит Phases 1-4 + `744b059`). Mechanism — как для текущего `stage-releases/20260516T221717Z`: `npm run build` локально → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch `stage-html` симлинка. Smoke по спеке §5 + `/portfolio/living-tags/living-tags-prototype/`. **Новое в smoke:** проверить `/solutions/`, `/en/solutions/` (4 карточки + рабочие «Open»-ссылки на 3 sub-SPA), `/about/`, `/en/about/` (Разработка-группа + 2 прод-записи timeline + МИФИ); проверить, что `/blog/`, `/en/blog/` показывают ровно 3 SDD-поста; проверить, что `/projects/living-tags-prototype/` теперь под `projects-saas` (как kind), а `/showcase/payments/sbp/` ведёт корректно.
2. После redeploy stage + smoke — cutover stage→prod (см. общий блок «Что осталось недоделанным» п.3 в начале файла).

Дальше по общему блоку: открытые элементы спеки §7 (реальный `liveUrl` для voice-to-spec, body для llm-spec-tools, подготовка legacy/ extraction, опциональный редизайн og-en.svg), defense-in-depth, вне-MVP cleanup.

# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (впереди `origin/main` на 6 коммитов — Phase 1 `c2da2a1` + Phase 2 `9777ca9` + Phase 3 `25ef234` + Phase 3 fix `367882a` + 2 handoff'а; рабочее дерево чистое) — последний содержательный коммит `367882a` fix(home): kind-aware project links + sort featured + rename isoDate (2026-05-17), не запушен.

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

1. **Контент-трек pre-cutover** — **Phases 1-3 закрыты** (`c2da2a1`, `9777ca9`, `25ef234` + fix `367882a`), Phase 4 ожидает имплементации:
   - Спека: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`.
   - План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md` — 14 tasks × 4 фазы (по одному атомарному коммиту на фазу + опциональные follow-up fix'ы из code-review):
     - **Phase 1 (Tasks 1-5, seed контент) — DONE `c2da2a1`.** 13 новых файлов + 2 модификации.
     - **Phase 2 (Tasks 6-9, i18n rewrite + HomePage rename/tagline) — DONE `9777ca9`.** 4 файла: `types.ts` + `ru.ts` + `en.ts` + `HomePage.astro`.
     - **Phase 3 (Task 10, HomePage rewire to `getCollection`) — DONE `25ef234` + fix `367882a`.** 1 файл: `HomePage.astro`. Fix-commit добавил kind-aware маршрутизацию ссылок (mirror `ProjectsCatalog.astro`: client → internal `/projects/<slug>`, personal → `liveUrl ?? repoUrl ?? "#"` с `target="_blank"`, saas → `liveUrl ?? "#"` или disabled `<div>` при `comingSoon`) — pseudocode плана производил 404'ы для personal/saas карточек, так как `pages/projects/[slug].astro` строится только из `projects-client`. Plus sort `featuredFirst` by pubDate desc, plus rename локальной `formatDate` → `isoDate` (избегает name-collision с `~/lib/format`'s `formatDate`).
     - Phase 4 (Tasks 11-14): og-en SVG + locale-conditional og:image + nginx `/portfolio/` alias → `feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio`.
   - **Подход исполнения (выбран пользователем, подтверждён в Phases 1-3):** `superpowers:subagent-driven-development` (по одному implementer-subagent'у на task + spec review + quality review + final integration review на цельный phase-коммит). Применить тот же flow к Phase 4 в **новой сессии**.
   - Прод-исходник для seed'а: `~/Projects/mind-section-dev-portfolio-by-lovable` (отдельный локальный репо, git-history present).
   - Backup для legacy URL'ов: `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` — все 5 portfolio/showcase подпутей имеют prerendered `index.html`, SPA-fallback не нужен (`/showcase/` nginx-блок уже есть в `deploy/nginx/alexanderlapygin.com.conf:87-115`, Phase 4 добавляет только `/portfolio/`).
   - Open Q в спеке (default'ы можно override перед Phase 2): Q1 — about-timeline keep stage (а не прод-данные VDI/Rosbank/T-Bank); Q2 — heroTagline через `\n` + CSS `white-space: pre-line` (без HTML-инъекции).
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты фаз, но блокируют cutover): реальный `liveUrl` для `voice-to-spec` (сейчас `-tbd` placeholder в `c2da2a1`); реальный body для `llm-spec-tools` (placeholder body «## Цель / ## Состояние» добавлен в `c2da2a1`); EN/RU-переводы single-locale showcase'ов (oauth EN-only, telegram EN-only, sbp RU-only); body для EN-solutions `spec-trio` и `static-site-with-ssr` (skeleton'ы созданы в `c2da2a1`); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной дизайн `og-en.svg` (Phase 4 имплементируется, но контент SVG — авторский).

2. **Cutover stage→prod** (после контент-трека — единственный оставшийся блокер; CSP-фикс закрыт в `cece042`):
   - Pre-check повтор: блокеры из контент-трека закрыты, остальные ranking'ом OK.
   - Свежий redeploy stage с актуальным build'ом + смоук перед cutover'ом (текущий stage-релиз `20260516T221717Z` от 2026-05-17 включает технический трек + CSP-фикс; контент-трек Phases 1-3 + Phase 4 ещё НЕ задеплоен на stage — пересобрать после закрытия Phase 4).
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

## Session 2026-05-17 (седьмая сессия дня)

### Что сделано

- Phase 3 контент-трека (Task 10 плана) выполнена через `superpowers:subagent-driven-development`. Flow: 1 implementer-subagent (sonnet) → spec compliance review (sonnet) APPROVED → code-quality review (sonnet) → 1 fix-implementer (sonnet) на найденные issues → re-review (sonnet) APPROVED → финальный integration review (opus) READY_TO_MERGE.
- Изменения — только в `src/components/HomePage.astro`, 2 атомарных коммита:
  - `25ef234` feat(home): rewire featured projects and latest posts to content collections — заменил `[1,2,3].map` placeholders на `getCollection` (`projects-client` + `projects-personal` + `projects-saas`, фильтр по `lang`, featured-first + pubDate desc, slice 3) и `posts` (фильтр по `lang+!draft`, pubDate desc, slice 3). Drop hardcoded «5 мин». Sections collapse при пустой коллекции.
  - `367882a` fix(home): kind-aware project links + sort featured + rename isoDate — code-review нашёл, что literal-pseudocode плана клал ВСЕ типы карточек на `/projects/<slug>`, но `pages/projects/[slug].astro` строится только из `projects-client` → personal/saas карточки получали 404. Fix mirror'ит `ProjectsCatalog.astro`: client → internal `/projects/<slug>`, personal → `liveUrl ?? repoUrl ?? "#"` `target="_blank" rel="noopener"` + external-link SVG icon, saas → `liveUrl ?? "#"` `target="_blank"` или disabled `<div>` при `p.data.comingSoon` (с "Coming soon" badge + `opacity: 0.7`). Plus sort `featuredFirst` by pubDate desc (был order-indeterminate при >1 featured), plus rename локальной `formatDate` → `isoDate` (избегает name-collision с `~/lib/format`'s `formatDate`).
- Build/check (финальным reviewer'ом): `npm run check` 0/0 (64 pre-existing Zod-deprecation hint'а в `content.config.ts`); `npm run build` — 26 страниц без ошибок. Все `/projects/<slug>` ссылки с главной разрешаются в существующие static-страницы (`voice-to-spec` на RU; EN homepage имеет 0 client-карточек, так как `projects-client/en/*` пуст — все 3 EN-карточки внешние personal); personal/saas карточки рендерятся с `target="_blank" rel="noopener"`; `scoped-tasks` (saas, `comingSoon: true`) — как disabled `<div>`.
- Зафиксированные минорные не-блокеры (для контекста, не для рефакторинга):
  - Personal-карточка с пустыми `liveUrl` и `repoUrl` ушла бы в `href="#" target="_blank"` (degenerate case; в seed-data таких записей нет, `llm-spec-tools` без `liveUrl` корректно фолбэчится на `repoUrl`). `ProjectsCatalog.astro:71` использует условный `target` — homepage этот нюанс не зеркалит.
  - `HomePage.astro` вырос до 306 строк; 3 почти-одинаковых card-shell блока (client / personal / saas) — кандидат на будущий `<ProjectCard>`-компонент, но per CLAUDE.md «three similar lines is better than premature abstraction» — оставлено как есть.
  - EN homepage сейчас рендерит 3 personal-карточки и 0 client/saas (content-coverage state, не code defect). Если author захочет featured client-карточку на EN — нужны EN-переводы `projects-client/*` (на сегодня их нет; §7 open items упоминают только showcase'ы).

### Коммиты этой сессии

- `25ef234` feat(home): rewire featured projects and latest posts to content collections
- `367882a` fix(home): kind-aware project links + sort featured + rename isoDate
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- Никаких фоновых процессов не оставлено: dev-серверы, поднятые subagent'ами для smoke-проверок (`npm run dev` на 4321), убивались тем же subagent'ом после verify-блоков.
- На VPS — без изменений (никаких деплоев в этой сессии). Stage retention: 3 релиза, активный — `20260516T221717Z` (Phase 3 ещё НЕ задеплоен на stage).

### Осталось недоделанным

Следующая сессия:

1. **Phase 4 контент-трека** (Tasks 11-14): og-en.svg (рисовать вручную — copy og.svg + replace АЛ→AL и RU→EN), расширить `build-branding-assets.mjs` (+og-en pipeline), locale-conditional og:image в `BaseLayout.astro`, nginx `location ^~ /portfolio/` блок (зеркало `/showcase/`). Тот же `superpowers:subagent-driven-development` flow.
2. После Phase 4 — redeploy stage (`/var/www/alexanderlapygin.com/stage-releases/<TS>/` + atomic symlink) + smoke по спеке §5. Отдельная сессия перед cutover'ом.

Дальше по общему блоку «Что осталось недоделанным» в начале файла: открытые элементы спеки §7 (авторская работа), cutover stage→prod, defense-in-depth, вне-MVP cleanup.

# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (впереди `origin/main` на 4 коммита после этой сессии — Phase 1 `c2da2a1` + Phase 2 `9777ca9` + 2 handoff'а; рабочее дерево чистое) — последний содержательный коммит `9777ca9` feat(i18n): rewrite home and about to prod voice, add hero tagline (2026-05-17), не запушен.

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

1. **Контент-трек pre-cutover** — **Phases 1-2 закрыты** (`c2da2a1`, `9777ca9`), Phases 3-4 ожидают имплементации:
   - Спека: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`.
   - План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md` — 14 tasks × 4 фазы (по одному атомарному коммиту на фазу):
     - **Phase 1 (Tasks 1-5, seed контент) — DONE `c2da2a1`.** 13 новых файлов + 2 модификации.
     - **Phase 2 (Tasks 6-9, i18n rewrite + HomePage rename/tagline) — DONE `9777ca9`.** 4 файла: `types.ts` + `ru.ts` + `en.ts` + `HomePage.astro` (см. Session-блок ниже).
     - Phase 3 (Task 10): HomePage rewire to `getCollection` → `feat(home): rewire featured projects and latest posts to content collections`.
     - Phase 4 (Tasks 11-14): og-en SVG + locale-conditional og:image + nginx `/portfolio/` alias → `feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio`.
   - **Подход исполнения (выбран пользователем, подтверждён в Phases 1-2):** `superpowers:subagent-driven-development` (по одному implementer-subagent'у на task + spec review + quality review + final integration review на цельный phase-коммит). Применить тот же flow к Phases 3-4 в **новой сессии**.
   - Прод-исходник для seed'а: `~/Projects/mind-section-dev-portfolio-by-lovable` (отдельный локальный репо, git-history present).
   - Backup для legacy URL'ов: `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` — все 5 portfolio/showcase подпутей имеют prerendered `index.html`, SPA-fallback не нужен (`/showcase/` nginx-блок уже есть в `deploy/nginx/alexanderlapygin.com.conf:87-115`, Phase 4 добавляет только `/portfolio/`).
   - Open Q в спеке (default'ы можно override перед Phase 2): Q1 — about-timeline keep stage (а не прод-данные VDI/Rosbank/T-Bank); Q2 — heroTagline через `\n` + CSS `white-space: pre-line` (без HTML-инъекции).
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты фаз, но блокируют cutover): реальный `liveUrl` для `voice-to-spec` (сейчас `-tbd` placeholder в `c2da2a1`); реальный body для `llm-spec-tools` (placeholder body «## Цель / ## Состояние» добавлен в `c2da2a1`); EN/RU-переводы single-locale showcase'ов (oauth EN-only, telegram EN-only, sbp RU-only); body для EN-solutions `spec-trio` и `static-site-with-ssr` (skeleton'ы созданы в `c2da2a1`); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной дизайн `og-en.svg` (Phase 4 имплементируется, но контент SVG — авторский).

2. **Cutover stage→prod** (после контент-трека — единственный оставшийся блокер; CSP-фикс закрыт в `cece042`):
   - Pre-check повтор: блокеры из контент-трека закрыты, остальные ranking'ом OK.
   - Свежий redeploy stage с актуальным build'ом + смоук перед cutover'ом (текущий stage-релиз `20260516T221717Z` от 2026-05-17 включает технический трек + CSP-фикс; если контент-трек добавит изменения — пересобрать).
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

## Session 2026-05-17 (шестая сессия дня)

### Что сделано

- Phase 2 контент-трека (Tasks 6-9 плана `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`) выполнена через `superpowers:subagent-driven-development`. Flow: 4 implementer-subagent'а (sonnet, по одному на task) + spec compliance review + code quality review после каждой задачи (Tasks 6/7 — отдельные subagent'ы для spec и quality; Task 8 — консолидированный reviewer с секциями spec → quality; Task 9 — на нём же финальный integration-review subagent на цельный Phase 2 commit). Все ревью APPROVED, без iteration-циклов.
- Изменено 4 файла одним атомарным коммитом `9777ca9`:
  - `src/i18n/types.ts` — `Dictionary.home` rename: убраны `philosophyTitle`/`philosophyBody`, добавлены `heroTagline: string` и nested `sdd: { title; description }`.
  - `src/i18n/ru.ts` — переписан `home` блок (heroTitle → имя «Александр Лапыгин», heroSubtitle → роль «Разработка Web-приложений», heroTagline через `\n`, sdd.* + 4 advantage'а на прод-голос); переписан `about.approachBody` (3 параграфа) + первые 3 группы `expertise` (Frontend/Backend/Архитектура). Последние 2 группы expertise (AI-инструменты, Документация) + `timeline` + `education` + `about.cta` — не тронуты.
  - `src/i18n/en.ts` — EN-зеркало изменений из ru.ts (heroTagline EN: «Sustainable code. Clear architecture.\nDocumentation that works…»).
  - `src/components/HomePage.astro` — `dict.home.philosophy*` refs → `dict.home.sdd.*`; hero-секция расширена: `heroSubtitle` теперь короткий roleline (mt-2, text-xl md:text-2xl, font-medium, primary text color), новый `<p>` рендерит `heroTagline` через CSS `whitespace-pre-line` (без HTML-инъекции).
- Build/check checks (финальным reviewer'ом): `npm run check` 0/0 (64 hint'а Zod-deprecation в `content.config.ts` — pre-existing, unrelated); `npm run build` — 26 страниц, 0 errors. Dev smoke: все 4 ключевые фразы (RU/EN heroSubtitle + heroTagline + about bio) рендерятся.
- Отмечено reviewer'ами, не блокирующее (фиксируем для контекста, не для рефакторинга):
  - Code-quality reviewer Task 6 предложил flat `sddTitle`/`sddDescription` вместо nested `sdd: { title, description }` (одиночный nested singleton inconsistent с соседями внутри `home`). Решение: nested per spec — это намеренное проектное решение (`sdd` — ключевой термин проекта, evidenced by Phase 1 SDD-постами).
  - Code-quality reviewer Task 7 предложил исправить ё-consistency («партнер» → «партнёр», «черных» → «чёрных») и «Web-приложений» → «веб-приложений» (mixed-script capitalisation). Решение: оставить per spec — Phase 1 precedent «faithful-to-source-копия предпочтена per spec» применяется и здесь, эти строки взяты дословно из плана.

### Коммиты этой сессии

- `9777ca9` feat(i18n): rewrite home and about to prod voice, add hero tagline
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- Никаких фоновых процессов не оставлено: dev-серверы, поднятые subagent'ами для smoke-проверок (`npm run dev` на 4321), убивались тем же subagent'ом.
- На VPS — без изменений (никаких деплоев в этой сессии). Stage retention: 3 релиза, активный — `20260516T221717Z`.

### Осталось недоделанным

Следующая сессия:

1. **Phase 3 контент-трека** (Task 10): HomePage rewire — заменить `[1,2,3].map` placeholder'ы на `getCollection` для projects-client/personal/saas (union, фильтр по lang, sort по pubDate, slice 3) и posts (фильтр по lang+!draft, sort, slice 3). Drop hardcoded «5 мин» reading time. Запустить через тот же `superpowers:subagent-driven-development` flow.
2. **Phase 4** (Tasks 11-14): og-en.svg (рисовать вручную — copy og.svg + replace АЛ→AL и RU→EN), расширить `build-branding-assets.mjs`, locale-conditional og:image в `BaseLayout.astro`, nginx `location ^~ /portfolio/` блок (зеркало `/showcase/`).
3. После Phases 3+4: redeploy stage (`/var/www/alexanderlapygin.com/stage-releases/<TS>/` + atomic symlink) + smoke по спеке §5. Отдельная сессия перед cutover'ом.

Дальше по общему блоку «Что осталось недоделанным» в начале файла: открытые элементы спеки §7 (авторская работа), cutover stage→prod, defense-in-depth, вне-MVP cleanup.

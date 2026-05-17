# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (**впереди `origin/main` на 1 коммит** — `e74594f` handoff не запушен; рабочее дерево чистое) — последний содержательный коммит `cece042` fix(csp): emit theme/header scripts as external files (2026-05-17), запушен.

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

1. **Контент-трек pre-cutover** (отдельный, многосессионный — design согласован в сессии 2026-05-17 (третья), детальная спека на следующую сессию; см. блок `Session 2026-05-17 (третья)` ниже):
   - Подходы: **C (full mirror)** — прод-контент как канон + per-item курация stage-элементов; **execution phased** — 4 фазы (1: seed collections, 2: i18n+About в прод-голосе, 3: HomePage rewire через `getCollection`, 4: og-en + nginx alias). Прод-исходник: `~/Projects/mind-section-dev-portfolio-by-lovable` (`src/data/blogPosts.ts` — 3 RU + 3 EN SDD-серии; `src/data/showcaseProjects.ts` — 4 showcase; `src/i18n/locales/{ru,en}.json` 391 строка). URL-стратегия по `/portfolio/*` `/showcase/*`: (а) keep alive через nginx alias на extracted `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz`.
   - Прямой cutover-блокер — `HomePage.astro:79-108` и `:124-144` (`[1,2,3].map(...)`-плейсхолдеры) закрывается фазой 3.
   - Открытые элементы (требуют авторской работы, не блокируют коммит фазы 1, но блокируют cutover): реальный `liveUrl` для `voice-to-spec`; body для `llm-spec-tools`; EN-переводы single-locale showcase'ов (sbp/oauth/telegram); body для EN-solutions; подготовка `/var/www/alexanderlapygin.com/legacy/` из backup-тарбола на VPS.

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

## Session 2026-05-17 (третья сессия дня)

### Что сделано

- Полный brainstorming контент-трека через `superpowers:brainstorming` skill. Согласованы: scope (**C: full mirror прода**), execution-подход (**фазированный, 4 фазы**), курация stage↔prod, design по 7 секциям. Спеку пользователь явно отложил на следующую сессию.
- Фоновый `npm run dev` (PID 9209, :4321) от прошлой сессии остановлен (`kill 9209`); порт свободен. `csp-preview` (:4322) уже был мёртв.

### Approved design summary (для написания спеки в следующей сессии)

**Источник прод-контента:** `~/Projects/mind-section-dev-portfolio-by-lovable` (отдельный репо, имеет git-историю). Ключевые файлы:
- `src/data/blogPosts.ts` — 3 EN posts (sdd-intro/backstory/first-experience, строки 13-98) + 3 RU posts (строки 197-283) + ~12 закомментированных черновиков.
- `src/data/showcaseProjects.ts` — 4 проекта: oauth-simplest (live, EN-only desc), telegram-bot-messaging (live, EN), sbp-payments (live, RU), saas-dashboard (vaporware placeholder — **drop**).
- `src/i18n/locales/{ru,en}.json` — 391 строка/локаль (navigation, home hero/sdd/benefits/cta, about title/description/technicalExpertise/skills.{frontend,backend,architecture}).
- Portfolio living-tags poc + prototype (URL'ы: `/portfolio/living-tags/{poc,prototype}/`).

**Курация stage-контента (что keep/drop):**
- Stage posts: `posts/{ru,en}/zachem-spec-pered-kodom` — **keep** (не дубль SDD-серии, другой угол). `posts/ru/staticheskiy-sait-i-odna-tochka-ssr` — **keep** (тема не пересекается).
- Stage projects: `voice-to-spec` (client/ru) — **keep**, но открытый `liveUrl` (сейчас `example.com`); `llm-spec-tools` (personal/ru) — **keep**, body пустой → плейсхолдер в фазе 1, открытое наполнение; `scoped-tasks` (saas/ru) — **keep**, `comingSoon: true` ок без body.
- Stage solutions (`spec-trio`, `static-site-with-ssr`) — **keep**, раздел Solutions остаётся как новая сущность нового сайта (прод-аналога нет).
- About: extra-группы expertise (AI-инструменты, Документация), `timeline`, `education` — **keep как stage поверх прод-канона**.

**Маппинг прод-showcase/portfolio → коллекция `projects-personal`:**
- `oauth-simplest` (EN): `projects-personal/en/oauth-simplest.md`, `liveUrl=https://alexanderlapygin.com/showcase/oauth/simplest/`.
- `telegram-bot-messaging` (EN): аналогично, `liveUrl=.../showcase/telegram-bot/messaging/`.
- `sbp-payments` (RU): `projects-personal/ru/sbp-payments.md`, `liveUrl=.../showcase/payments/sbp/`.
- `living-tags-poc/prototype` (RU+EN, обе локали если на проде обе): `liveUrl=.../portfolio/living-tags/.../`.
- **Schema gotcha:** `projects-personal.liveUrl` требует `z.string().url()` — нужны абсолютные URL'ы, не относительные. После cutover'а nginx alias на `/var/www/alexanderlapygin.com/legacy/` обслуживает эти URL'ы.

**4 фазы (каждая — отдельный PR/коммит, контракты в спеке):**

1. **Seed collections** — только `.md` файлы, никаких code/schema-изменений. Posts (6 файлов: `posts/{ru,en}/sdd-{intro,backstory,first-experience}.md`) + Projects (5 файлов в `projects-personal`) + fix stage stubs (`voice-to-spec` URL-заглушка с TBD, `llm-spec-tools` плейсхолдер-body) + EN solutions skeletons (frontmatter только). Acceptance: `npm run check` 0/0, `npm run build` ok, `/projects` `/en/projects` `/blog` `/en/blog` `/solutions` `/en/solutions` рендерятся с новыми карточками.

2. **i18n + About (прод-голос, B)** — `src/i18n/{ru,en}.ts`: `home.heroTitle`→имя, `home.heroSubtitle`→роль, новый `home.heroTagline`, переименовать `philosophy*` → `home.sdd.{title,description}`, переписать `home.advantages[]` на прод-формулировки, `about.description`→прод-биография, добавить `about.technicalExpertise.{title,subtitle}`, переписать `about.skills.{frontend,backend,architecture}` на прод-тексты. **Keep stage-only:** extra-группы expertise (AI-инструменты, Документация), `timeline`, `education`. `HomePage.astro`: рефактор обращений к dict (`philosophyTitle/Body` → `sdd.title/description`).

3. **HomePage rewire** — `src/components/HomePage.astro`: добавить `getCollection` imports + `pageSlug` helper + helper `projectHref(p)`. Featured Projects = union client+personal+saas, filter `featured===true && lang===locale`, sort `pubDate desc`, slice(0,3). Fallback: добор по дате если featured<3. Latest Posts = `posts` filter `!draft && lang===locale`, sort+slice(0,3). 0 items → секция скрывается целиком. Удаляем «5 мин»-микро-копию (нет поля в схеме). Acceptance: `dist/index.html` и `dist/en/index.html` содержат 0 совпадений с «Пример проекта», «Sample project», «Заголовок публикации», «Sample post title».

4. **og-en + nginx alias prep** — `public/og-en.svg` (EN-аналог `og.svg`: «АЛ»→«AL» и т.д.) + extend `src/scripts/build-branding-assets.mjs` для генерации `og-en.png`. `BaseLayout.astro` ветвление `ogImage = locale === 'en' ? '/og-en.png' : '/og.png'`. `deploy/nginx/sites-available/alexanderlapygin.com.conf`: `location ^~ /portfolio/` + `location ^~ /showcase/` через `alias /var/www/alexanderlapygin.com/legacy/.../;`. **Не активирует ничего на проде** — применяется атомарно с cutover'ом.

**Открытые элементы (Section 7 design'а), требуют авторской работы перед cutover'ом:**
- (1) Реальный `liveUrl` для `voice-to-spec` (заменить заглушку).
- (2) Body для `llm-spec-tools.md` (1-2 абзаца).
- (3) EN-переводы single-locale showcase descriptions: RU для oauth + telegram, EN для sbp (по факту прода living-tags — уточнить, есть ли обе локали в прод-данных).
- (4) Body для `solutions/en/spec-trio.md` и `solutions/en/static-site-with-ssr.md`.
- (5) VPS: подготовка `/var/www/alexanderlapygin.com/legacy/{portfolio,showcase}/` extraction из `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` — на cutover'е, не сейчас.
- (6) Не блокирует cutover, но желательно: `og-en.png`/`og-en.svg`. Без него EN-локаль шарится с кириллической картинкой.

**После завершения brainstorming'а:** в новой сессии — пишется спека `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md` по этому summary, self-review, user-review, далее `superpowers:writing-plans` для имплементационного плана.

### Коммиты этой сессии

- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- `npm run dev` (PID 9209) убит в этой сессии, :4321 свободен.
- `csp-preview` (:4322) был мёртв до начала сессии.
- `/tmp/astro-dev.log` остался от прошлой сессии (последняя запись `08:40:30 [200] /`). Не очищен.
- На VPS retention stage-цепочки: 3 релиза, активный — `20260516T221717Z`. Не менялось.

### Осталось недоделанным

- **Спека контент-трека** — написать `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md` по summary выше. Это первое действие следующей сессии.
- Дальше по общему блоку «Что осталось недоделанным» выше: имплементация фаз 1-4, разрешение открытых элементов авторской работой, cutover, defense-in-depth, вне-MVP cleanup.

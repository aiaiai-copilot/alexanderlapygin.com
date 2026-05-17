# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (впереди `origin/main` на 1 коммит — `c3def4a` UI; всё до него запушено, рабочее дерево чистое до этого handoff-коммита) — последний содержательный коммит `c3def4a` feat(ui): centered prod-style layout across pages (2026-05-17), не запушен.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, **обновлён 2026-05-17** до релиза `20260517T110530Z` (контент-трек Phases 1-4 + content-realign `744b059` — но НЕ UI-сессия `c3def4a`). Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

## In-flight context

### РКН-removal — закоммичен (`d4b70b8`, 2026-05-16)

Скоуп-pivot из сессии 2026-05-15 (отказ от Метрики и всего, что триггерит ст. 22 152-ФЗ) реализован и закоммичен: код, документация (spec/decisions/runbook), CSP snippet, README, env-шаблон. Подробности — `git show d4b70b8`. `npm run check` 0/0, `npm run build` ok.

### Технический трек pre-cutover — выполнен (2026-05-17)

Spec `8a3df13` + plan `f615616` → исполнение subagent-driven'ом в worktree. Все 5 tasks плана закрыты + 2 follow-up fix'а от code-quality review. Stage redeployed в новый `stage-releases/20260516T212815Z`, smoke 9/9 endpoints HTTP/2 200, 4 мета-тега в `dist/index.html`, «аналитика»/«analytics» count 0 на `/solutions` и `/en/solutions`, RSS items: RU 2, EN 1. Финальный integration review подтвердил merge readiness. Подробности — `git log --oneline cdaaf6a..HEAD` после merge'а.

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

CSP snippet на VPS (`/etc/nginx/snippets/alexanderlapygin-security-headers.conf`) — **актуальный, узкий** (синхронизирован с репо 2026-05-16 19:07 UTC, sha256 `72a15068…`): только Google Fonts, без `mc.yandex.*`/`yastatic.net`, без `frame-src`. Backup предыдущей широкой версии: `/root/alexanderlapygin-security-headers.conf.pre-csp-narrow-20260516T190419Z.bak` (sha256 `51ba5f28…`). Rollback: `cp <backup> /etc/nginx/snippets/alexanderlapygin-security-headers.conf && nginx -t && nginx -s reload`.

### Что осталось недоделанным

1. **Контент-трек pre-cutover — ВСЕ 4 ФАЗЫ ЗАКРЫТЫ + content-realign + UI** (`c2da2a1` + `9777ca9` + `25ef234` + fix `367882a` + `7e93350` + `744b059` + `c3def4a`). Spec: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`. План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`.
   - Phase 1 (`c2da2a1`): seed posts/projects из прод-источника.
   - Phase 2 (`9777ca9`): i18n rewrite + HomePage rename/tagline.
   - Phase 3 (`25ef234` + fix `367882a`): HomePage rewire на `getCollection` + kind-aware project links.
   - Phase 4 (`7e93350`): og-en.svg + locale-conditional og:image/twitter:image в BaseLayout + nginx `/portfolio/` alias.
   - **Content-realign (`744b059`):** ручной разворот контента под прод как single source of truth — заменены/удалены seed-скелетоны.
   - **UI (`c3def4a`, эта сессия):** прод-стиль layout на всех страницах — центрированный hero с круглым фото, удалены секции «Клиентские проекты»/«Последние публикации» и «Что вы получаете», GitHub-ссылка переключена на `aiaiai-copilot`. См. "Session 2026-05-17 (десятая)" ниже.
   - **Подход исполнения (Phases 1-4):** `superpowers:subagent-driven-development`. Content-realign и UI — ad-hoc, без плана/спеки, интерактивная правка с просмотром в `npm run dev`.
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты, блокируют cutover): реальный `liveUrl` для `voice-to-spec` (сейчас `-tbd` placeholder в `c2da2a1`); реальный body для `llm-spec-tools` (placeholder body «## Цель / ## Состояние» в `c2da2a1`); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной редизайн `og-en.svg` если хочется более полированный визуал. **Закрыто/устарело:** single-locale showcase'ы и EN-solutions skeleton'ы `spec-trio`/`static-site-with-ssr` — удалены в `744b059`, заменены на прод-витрину (oauth/telegram/sbp/saas).

2. **Redeploy stage с актуальным build'ом** — отдельная сессия. Текущий stage-релиз `20260517T110530Z` (от этой сессии) включает Phases 1-4 + content-realign `744b059`; **UI-сессия `c3def4a` ещё НЕ задеплоена на stage**. Перед redeploy: `npm run build` локально → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch `stage-html` симлинка. Smoke по спеке §5 + добавить `/portfolio/living-tags/living-tags-prototype/`. На VPS уже 4 стейдж-релиза (классификатор заблокировал prune самого старого `20260515T233747Z` без явного «delete»); если диск критичен — почистить руками или явно разрешить классификатору в следующей сессии.

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

## Session 2026-05-17 (десятая сессия дня — stage redeploy + UI prod-alignment)

### Что сделано

Сессия в две части: (1) stage redeploy предыдущей работы; (2) интерактивный UI-redesign под прод-стиль.

**Stage redeploy:**
- `npm run build` локально (23 страницы, dist 560K) → rsync `dist/` → `/var/www/alexanderlapygin.com/stage-releases/20260517T110530Z/` → atomic switch `stage-html` symlink. Содержит Phases 1-4 + content-realign `744b059`.
- Smoke 15/15 HTTP/2 200 (главные RU+EN, blog, solutions, projects, contact, sdd-intro). Content checks: about RU/EN (МИФИ/MEPhI, Разработка/Development group, Самозанятый/Self Employed, VDI/T-Bank), solutions (4 карточки + Open links), blog (только 3 SDD-поста, без zachem/staticheskiy), og:image RU→`og.png`/EN→`og-en.png` с locale-aware alt, RSS RU/EN 3 items each. ✓ Pre-cutover-ready state.
- Pruning старого релиза `20260515T233747Z` заблокирован классификатором; на VPS сейчас 4 стейдж-релиза (нарушение retention=3). Диск `/var` 56% used, 3.9G свободно — не критично.

**UI prod-alignment** (`c3def4a`, единый коммит, 11 файлов, +71/−297):
- **HomePage:** заменили АЛ-placeholder на круглое фото `public/photo.png` (500×500 PNG, 704K, скачан с прода `/assets/developer-photo-Dx5DPJwC.png`); hero центрирован, H1 = «Разработка Web-приложений» (имя ушло в header-бренд); SDD-блок центрирован внутри карточки; advantages-карточки центрированы; **удалены секции «Клиентские проекты» и «Последние публикации»** (Phase 3 наследство, не было на проде — обоснование в чате); удалён заголовок «Что вы получаете» / «What you get»; вертикальные spacing'и уменьшены (после двух итераций: сначала bump до `py-20`, потом halve по запросу — итог `pt-8 md:pt-12 pb-8 md:pb-10`).
- **AboutPage, ProjectsCatalog, SolutionsPage, ContactPage, BlogCatalog:** все hero-секции переведены в `max-w-3xl px-4 md:px-6 ... text-center`. Из BlogCatalog убран кружок «АЛ»/«AL» и flex-row — H1 теперь центрирован, RSS-иконка absolute-positioned справа.
- **Footer.astro:** GitHub-ссылка переключена с `github.com/alexanderlapygin` на `github.com/aiaiai-copilot` (как на проде).
- **ContactPage:** добавлена aside-карточка «GitHub» / «GitHub» ниже Email — ссылка тоже на `aiaiai-copilot`. Тип `Dictionary.contact` расширен полем `asideGithubHeading`.
- **i18n:** «Технический партнер» → «Техническое партнёрство»; «Technical Partner» → «Technical Partnership».

Не сделано (пользователь решил оставить): «Разработка Web-приложений» → «Разработка Web-приложений и сайтов» (обсудили pros/cons — оставили текущее позиционирование).

Build/check: `npm run check` 0/0 (64 pre-existing Zod-deprecation hint'а — unchanged).

### Коммиты этой сессии

- (стейдж-деплой — без коммита, только VPS-сайд изменения)
- `c3def4a` feat(ui): centered prod-style layout across pages
- (handoff-коммит этой сессии)

Push origin: предыдущая `cf6f2e9` (handoff прошлой сессии) запушена пользователем вручную в начале этой сессии (push 11 коммитов — `30f8d94..cf6f2e9`). `c3def4a` и handoff этой сессии — НЕ запушены (классификатор требует явного approval для `git push origin main`).

### Локальное состояние (не в git)

- **Фоновых процессов от этой сессии нет.** `npm run dev` (PID 36890/36917) убит в конце сессии. Параллельный процесс на порту 4399 (PID 25270, запущен в 11:10 не нашей сессией) — не трогали.
- **Временные дампы прод-источников** в `/tmp/`: `prod-app.js`, `blogPosts.js`, `showcase.js`, `prod.css`, `prod-about.html`. Релевантны если следующая сессия будет дальше переносить контент с прода — иначе можно удалить.
- **VPS:** активный stage-релиз `/var/www/alexanderlapygin.com/stage-releases/20260517T110530Z/`, `stage-html` symlink на него. На VPS лежит 4 release-каталога (старый `20260515T233747Z` не удалён). Никаких других изменений на VPS не делали.

### Осталось недоделанным

Следующая сессия:

1. **Redeploy stage** с UI-коммитом `c3def4a` (текущий stage `20260517T110530Z` его НЕ содержит). Тот же mechanism. Smoke добавить: проверить центрированный hero на `/`, `/en/`, отсутствие секций «Клиентские проекты» и «Последние публикации» на main, прод-стиль layout на `/about/`, `/solutions/`, `/projects/`, `/blog/`, `/contact/` (RU+EN). Проверить GitHub-карточку на `/contact/` и подвале (ведёт на `aiaiai-copilot`).
2. Опционально перед redeploy: `git push origin main` для синхронизации (классификатор заблокирует — нужен явный approval пользователя или ручной push, как в этой сессии).
3. Опционально: cleanup oldest stage release `20260515T233747Z` (retention=3, сейчас 4). Делать только с явным разрешением — классификатор такие действия заблокирует автоматически.
4. После redeploy stage + smoke — cutover stage→prod (см. общий блок «Что осталось недоделанным» п.3 в начале файла).

Дальше по общему блоку: открытые элементы спеки §7 (реальный `liveUrl` для voice-to-spec, body для llm-spec-tools, подготовка legacy/ extraction, опциональный редизайн og-en.svg), defense-in-depth, вне-MVP cleanup.

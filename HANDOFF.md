# HANDOFF

**Date:** 2026-05-18
**Branch:** `main` — в sync с `origin/main` (последний коммит `4f1bd6b` fix(ui): /about — упростить рамку фото (rounded-2xl без border/shadow), 2026-05-18). Рабочее дерево чистое.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live, **актуальный stage-релиз `20260518T110112Z`** (от 14-й сессии 2026-05-18) — содержит весь pre-cutover контент + UI prod-alignment + /faq + ContactCta + /contact rework + /about prod-alignment + /about photo polish. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

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

2. **Подтянуть stage страницы к проду (продолжение)** — следующая локальная задача. Главная (`c3def4a`) и /about (`732db83` + `1683846` + photo polish `4f1bd6b`) уже подтянуты. **`/projects` — в работе** (15-я сессия): brainstorm завершён, решения зафиксированы в Session-блоке ниже; запись spec'а отложена на следующую сессию. Дальше — `/solutions`, `/blog`, `/contact`, `/faq` по той же логике: brainstorm с visual companion'ом → отдельная spec → план → subagent-driven implementation → stage redeploy. На VPS сейчас 3 stage-release-каталога (retention=3 в норме).

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

## Session 2026-05-18 (пятнадцатая — /projects brainstorm + content cleanup; spec deferred)

### Что сделано

- **Удаление seed-плейсхолдеров проектов** по явному запросу пользователя: `src/content/projects-client/ru/voice-to-spec.md` и `src/content/projects-personal/ru/llm-spec-tools.md`. Оба — placeholder-контент из Phase 1 контент-трека (см. открытые элементы §7), реального liveUrl/body не имели. Коммит `ddae486`. Build после удаления — 22 страницы (было 23, пропала `/projects/voice-to-spec/`).
- **Brainstorming `/projects` prod-alignment** через `superpowers:brainstorming` skill. Источник истины для прод-структуры: `https://alexanderlapygin.com/portfolio` (React-компонент `Portfolio-Dk-oEsFm.js`, i18n в `_E`/`BE` бандла `prod-app.js`). Прод-структура:
  - 2 секции: «Сайты-портфолио» (1 карточка — self-reference на сам сайт) + «SaaS» (2 карточки: Living Tags Prototype + Living Tags MVP coming-soon).
  - Карточка inline-богатая: title + description + tech-pills + Key Features grid (2col, чекмарки) + Project Metrics grid (4col) + кнопки Code/Live Demo.
- **Зафиксированы решения для спеки** (полный дизайн ниже). Запись `docs/superpowers/specs/2026-05-18-projects-prod-alignment-design.md` **отложена на следующую сессию** по явному решению пользователя.
- **Замечен mis-classification:** `src/content/projects-personal/en/{oauth-simplest,telegram-bot-messaging}.md` — это не проекты, а типовые решения (дубли `src/content/solutions/{ru,en}/oauth-simplest.md` и `telegram-gateway.md` с тем же `demoUrl`). Их удаление включено в дизайн (будет в плане следующей сессии).

### Согласованный дизайн `/projects` prod-alignment (для записи в спеку)

#### Секция 1 — контент

- Все 3 collection'а (`projects-client`/`projects-personal`/`projects-saas`) **остаются** в `src/content.config.ts` (явное решение пользователя — не консолидировать, оставить гибкость на будущее).
- В схему `projectSaas` добавить `features: z.array(z.string()).default([])`.
- Удалить mis-classified из `projects-personal/en/`: `oauth-simplest.md`, `telegram-bot-messaging.md` (живут в `/solutions`).
- `src/content/projects-saas/{ru,en}/living-tags-prototype.md` — расширить front-matter полем `features` (тексты — перевод features прода, см. ниже).
- Создать `src/content/projects-saas/{ru,en}/living-tags-mvp.md` — `comingSoon: true`, тот же stack `["React", "TypeScript", "Supabase", "Claude API"]`, features из прода.

**Features Living Tags Prototype (из прод-i18n, RU/EN):**
- RU: «Глоссарий тегов», «Редактор коллекции текстов», «Автоматическая генерация тегов», «Качественный UI/UX дизайн», «Интеграция с Claude API», «Интеграция с Supabase (Database, Auth)», «Авторизация пользователя».
- EN: "Tag glossary", "Text collection editor", "Automatic tag generation", "High-quality UI/UX design", "Claude API integration", "Supabase integration (Database, Auth)", "User authorization".

(На проде в этих строках значился общий «AI API» / «AI API integration». В нашей версии замена на «Claude API» — точнее, отражает реальность. Stack тоже оставляем `Claude API` вместо `AI API` прода.)

**Features Living Tags MVP (из прод-i18n):**
- RU: «Глоссарий тегов», «Редактор коллекции текстов», «Автоматическая генерация тегов», «Качественный UI/UX дизайн», «Интеграция с Claude API», «Production-ready инфраструктура», «Система управления пользователями», «Оптимизация производительности».
- EN: "Tag glossary", "Text collection editor", "Automatic tag generation", "High-quality UI/UX design", "Claude API integration", "Production-ready infrastructure", "User management system", "Performance optimizations".

**Self-reference на сам сайт — НЕ добавляем.** Явное решение пользователя: «Нет, без self-reference». Соответственно из прод-структуры остаётся только секция «SaaS» (heading из `dict.projects.saasHeading`). Прод-секция «Сайты-портфолио» опускается полностью.

#### Секция 2 — карточка (Hybrid layout)

Рендерится локально в `src/components/ProjectsCatalog.astro` (без отдельного компонента — карточка остаётся inline в файле страницы).

Структура карточки:
- **Header:** title + comingSoon badge «Скоро» (правый верх, sm pill, neutral bg, только для `comingSoon: true`) + description.
- **Tech-pills:** outline-style, все элементы `stack` (без slice 4).
- **Features-блок:** subheading «Ключевые особенности» / «Key features» + grid 2col на md+, каждый item — inline SVG чекмарк (стиль CircleCheckBig) + текст feature.
- **Buttons row:** «Код» (с GitHub-иконкой) если `repoUrl`; «Демо» (с ExternalLink-стрелкой) если `liveUrl`. Карточка **больше не кликабельна целиком** — клики только через кнопки.

**Сетка карточек на странице:** 1col mobile, **2col md+** (как на проде; отличается от текущей 3col).

**Coming-soon стилизация:**
- Бейдж «Скоро» в правом верхнем.
- `opacity: 0.7`, `cursor: not-allowed`.
- Кнопки Код/Демо **скрыты целиком** (нет смысла кликать в placeholder).

**Стилевая база:** все цвета через CSS-переменные дизайн-системы (`--color-text`, `--color-text-muted`, `--color-bg-elev`, `--color-border`, `--color-accent`). Не использовать lucide-react/любые React-only иконки — inline SVG.

**Что НЕ берём с прода (отброшено в brainstorm'е):**
- «Project Metrics» grid (4col, phase/type/access/status) — отказались, шумно при пустой инфе.
- `longDescription`/featured-логика.
- Прод-баг с «Key Features» латиницей в RU-локали — в нашей версии будет правильно локализовано через i18n.

#### Секция 3 — i18n изменения (`src/i18n/{ru,en}.ts` + `types.ts`)

В разделе `projects.*`:
- Изменить `saasHeading`: RU `"SaaS-проекты"` → `"SaaS"` (match с продом).
- Изменить `comingSoon`: RU `"Coming Soon"` → `"Скоро"` (EN остаётся `"Coming Soon"`).
- **Новые ключи** (добавить в `types.ts` тоже):
  - `featuresHeading`: RU `"Ключевые особенности"`, EN `"Key features"`.
  - `codeLink`: RU `"Код"`, EN `"Code"`.
  - `demoLink`: RU `"Демо"`, EN `"Live demo"`.

Существующий `repoLink: "Репозиторий" / "Repository"` **не трогаем** — он используется где-то ещё (`codeLink` — отдельная короткая надпись для кнопки внутри карточки).

#### Секция 4 — routes / dead code

- `/projects/[slug].astro` и `/en/projects/[slug].astro` + компонент `ProjectPage.astro` — **оставляем** (привязаны к `projects-client`, генерируют 0 страниц сейчас, оживают если добавится client-проект). Согласовано с «оставить все 3 коллекции».

#### Секция 5 — build/smoke ожидания

- `npm run build`: 22 страницы (без новых маршрутов — MVP coming-soon disabled, detail нет).
- На `/projects/` рендерится 1 секция «SaaS» с 2 карточками.
- HTML `/projects/` содержит: «Living Tags», «Living Tags MVP», «Скоро», «Ключевые особенности», `aiaiai-copilot/living-tags-prototype`. **Не должен содержать** «SaaS-проекты», «Coming Soon» в RU.

#### Скоуп вне работы

Не трогаем: `/solutions`, `/blog`, `/contact`, `/faq`, главную, `/portfolio/living-tags/living-tags-prototype/` (nginx-alias на legacy/), прод-баг «Key Features» латиницей. Не делаем cutover stage→prod (отдельная задача).

### Коммиты этой сессии

- `ddae486` chore(content): drop placeholder projects voice-to-spec и llm-spec-tools
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- **Локальный main опережает `origin/main` на эти 2 коммита + предыдущий `6110c78` (handoff 14-й сессии).** То есть unpushed: `6110c78`, `ddae486`, и handoff-коммит 15-й сессии. Решение о push — за пользователем (push в default-branch отклоняется auto-classifier'ом; пользователь либо запускает `! git push origin main` сам, либо разрешает rule).
- **VPS:** stage-html → `stage-releases/20260518T110112Z` (релиз 14-й сессии с photo polish). Удаления `voice-to-spec`/`llm-spec-tools` **на stage не выкатывались** — это будет сделано вместе с финальным `/projects`-релизом в следующей сессии. 3 каталога в stage-releases.
- **Dev-сервер** запускался в этой сессии (`npm run dev`, task `b1vkrlkoc`, порт 4321) — может ещё работать на момент закрытия сессии; не критично.
- **Worktree-сирота от 13-й сессии:** `.claude/worktrees/about-prod-alignment/` всё ещё на диске (не в `git worktree list`). Безопасно удалить вручную, не блокирует.
- **Прод-дампы в `/tmp/`:** добавились в этой сессии — `prod-portfolio-bundle.js` (Portfolio React-компонент прода), `prod-showcase-projects.js`, `prod-showcase-bundle.js`, `prod-projects.html`, `prod-portfolio.html`. К прежним дампам с 12-13-й сессий (`prod-app.js`, `prod-bundle.js` и др.). Все нужны для следующих страниц.

### Осталось недоделанным

1. **Следующая сессия — записать spec'у** `docs/superpowers/specs/2026-05-18-projects-prod-alignment-design.md` строго по согласованному дизайну (Секции 1-5 + скоуп вне работы выше). Спека должна пройти self-review (placeholder scan, internal consistency, scope check, ambiguity), затем user review.
2. **После спеки** — план через `superpowers:writing-plans` (`docs/superpowers/plans/2026-05-18-projects-prod-alignment.md`).
3. **После плана** — `superpowers:subagent-driven-development` (как в 13-й сессии для /about): implementer subagent → spec-compliance review subagent → code-quality review subagent → merge fixes if needed.
4. **После implementation** — `npm run build` + stage redeploy в новый `stage-releases/<TS>/` + smoke + cleanup retention=3.
5. **Push в origin** — за пользователем (накопится 3 unpushed коммита + новые).

Дальше по общему блоку: следующая страница (`/solutions`/`/blog`/`/contact`/`/faq`), cutover stage→prod, defense-in-depth, вне-MVP cleanup.

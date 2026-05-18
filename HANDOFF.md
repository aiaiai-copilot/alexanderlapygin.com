# HANDOFF

**Date:** 2026-05-18
**Branch:** `main` — в sync с `origin/main` (последний коммит `1f56a66` Merge pull request #1 from aiaiai-copilot/worktree-about-prod-alignment, 2026-05-18). Рабочее дерево чистое.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live, **актуальный stage-релиз `20260518T101100Z`** (от 13-й сессии 2026-05-18) — содержит весь pre-cutover контент + UI prod-alignment + /faq + ContactCta + /contact rework + /about prod-alignment. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

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

2. **Подтянуть stage страницы к проду (продолжение)** — следующая локальная задача. Главная (`c3def4a`) и /about (`732db83` + `1683846`, через merge `1f56a66` в origin/main; stage redeployed в `stage-releases/20260518T101100Z`) уже подтянуты. Дальше — `/projects`, `/solutions`, `/blog`, `/contact`, `/faq` по той же логике: brainstorm с visual companion'ом → отдельная spec → план → subagent-driven implementation → stage redeploy. На VPS сейчас 3 stage-release-каталога (retention=3 в норме после cleanup'а 13-й сессии).

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

## Session 2026-05-18 (тринадцатая — /about implementation + visual review + stage deploy + PR merge)

### Что сделано

- **Исполнен план `/about` prod-alignment** через `superpowers:subagent-driven-development` в worktree `.claude/worktrees/about-prod-alignment` (ветка `worktree-about-prod-alignment`). Implementer-subagent сделал Task 1-4 (тип `Dictionary.about` + `ru.ts` + `en.ts` + полный rewrite `AboutPage.astro`); spec-compliance review subagent → ✅; code-quality review subagent → APPROVED WITH MINOR ISSUES (0 critical, 0 important; nits — следствие директивности плана, не правил).
- **Визуальная итерация после `npm run dev`:** убраны `<br />`-переносы в RU subtitle (текст течёт сплошным потоком), вместе с `<br />` убран ненужный `set:html`; NBHY (U+2011) + NBSP (U+00A0) в «Spec‑Driven Development» (RU и EN) чтобы фраза не ломалась посреди в карточке; «инструменты ИИ:» → «Инструменты ИИ:»; убраны `·`-bullet'ы из item-`<li>` в expertise + experience (matches prod plain-list style).
- **Тонкое место (заметка для следующих сессий):** в фреш worktree не было `.env`, поэтому `/contact` (Telegram + email-кнопки) пустел — рендеринг под conditional'ом `tgDirectUrl/mailtoUrl && ...`. Скопировал `.env` из main repo в worktree, перезапустил dev. Issue worktree-specific; продуктовая логика `ContactPage.astro` в порядке.
- **PR #1** (https://github.com/aiaiai-copilot/alexanderlapygin.com/pull/1) — 5 коммитов (spec + plan + session-12 handoff + feat + fix). **Смержен пользователем**, merge commit `1f56a66`. Локальный main fast-forwarded до origin/main.
- **Stage redeploy:** `npm run build` (with `.env`) → rsync `dist/` → `/var/www/alexanderlapygin.com/stage-releases/20260518T101100Z/` → atomic switch `stage-html` (`ln -sfn ... .new && mv -Tf`). Smoke: 8/8 endpoints HTTP 200, RU /about содержит «Технические компетенции»/«Инструменты ИИ»/«Full-stack разработчик»/«Профессиональный опыт»/«МИФИ», absent — «О подходе»/«Техническая экспертиза»; EN /en/about — «Technical Expertise»/«Web Application Development»/«good maintainable»/«Professional Experience»; `/contact` — `t.me/alexanderlapygin` + `mailto:alapygin` присутствуют.
- **Cleanup stage-releases:** удалены 3 старых (`20260515T233747Z`, `20260516T212815Z`, `20260516T221717Z`). На VPS осталось 3 каталога: `20260517T110530Z`, `20260517T172923Z`, `20260518T101100Z` (текущий). Retention=3 восстановлен.

### Коммиты этой сессии

Все попали в `origin/main` через merge `1f56a66`:

- `732db83` feat(ui): /about — align with prod layout
- `1683846` fix(ui): /about — visual review polish
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- **Worktree:** `.claude/worktrees/about-prod-alignment/` — `ExitWorktree` вернул сессию в main repo, но **каталог worktree остался на диске** (action=remove с `discard_changes=true`, но удаление не выполнилось, рапорт `kept at ...`). Безопасно очистить вручную: `git worktree remove --force .claude/worktrees/about-prod-alignment && git branch -D worktree-about-prod-alignment` — все коммиты ветки уже в `origin/main` через merge `1f56a66`.
- **Локальный `.env`** в worktree был скопирован из main repo (см. «Тонкое место» выше) — теперь живёт под `.claude/worktrees/about-prod-alignment/.env`. Удалится вместе с worktree-каталогом.
- **Фоновые dev-сервера** — запускались (`npm run dev` background-task'и `b67p3pho4`, `bm8c3dt12`), оба остановлены к концу сессии.
- **Временные дампы в `/tmp/`** (с 12-й сессии): `prod-app.js`, `prod-bundle.js`, `prod-index-bundle.js`, `prod-about-bundle.js`, `prod-about.html`, `prod-contact.html`, `prod-home-new.html`, `prod-contacts.html`, `prod.css`. Для /about больше не нужны, но пригодятся для следующих страниц (extract i18n-словарей `LE`/`$E`).
- **VPS:** stage-html → `stage-releases/20260518T101100Z` (текущий релиз с /about prod-alignment). 3 каталога в stage-releases (retention=3 в норме). Прод не трогали.

### Осталось недоделанным

См. общий блок «Что осталось недоделанным» — /about закрыт, следующий шаг очереди:

1. **Следующая страница** (`/projects`, либо `/solutions`/`/blog`/`/contact`/`/faq` по выбору пользователя) — по шаблону: brainstorm с visual companion'ом из `superpowers:brainstorming` → diff stage vs прод (тексты из `/tmp/prod-*.js`) → спека → план → `superpowers:subagent-driven-development` → stage redeploy.
2. **Cutover stage→prod** — после того как все страницы подтянуты и stage стабилен. См. общий блок п.3.
3. **Опционально:** удалить worktree-каталог `about-prod-alignment` (см. «Локальное состояние»).

Дальше по общему блоку: открытые элементы спеки §7 контент-трека (реальный `liveUrl` для voice-to-spec, body для llm-spec-tools, опц. редизайн og-en.svg), defense-in-depth, вне-MVP cleanup, синхронизация `docs/spec/*.md` и `README.md` с фактическим состоянием (privacy убрана, форма убрана).

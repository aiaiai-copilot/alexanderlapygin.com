# HANDOFF

**Date:** 2026-05-18
**Branch:** `main` — впереди `origin/main` на 3 коммита этой сессии (`627c224` spec, `1de785a` plan + spec-correction, handoff). Рабочее дерево чистое.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live, **stage-релиз `20260518T110112Z`** (от 14-й сессии 2026-05-18) — содержит pre-cutover контент + UI prod-alignment + /faq + ContactCta + /contact rework + /about prod-alignment + photo polish. **`/projects` prod-alignment реализован локально в 16-й сессии (на stage НЕ выкатан); `mathprepod` client-проект — spec+plan готовы в 17-й сессии, реализация запланирована на следующую сессию (subagent-driven).** Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

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

2. **Подтянуть stage страницы к проду (продолжение)** — следующая локальная задача. Главная (`c3def4a`), /about (`732db83` + `1683846` + photo polish `4f1bd6b`) и `/projects` (16-я сессия: spec/plan/5 atomic-коммитов `11b3419..1fbc2ea` + docs `b1f8543`) подтянуты локально. **`/projects` ещё НЕ выкатан на stage** — следующая задача: добавление клиентского проекта `mathprepod` (см. п.A ниже), затем stage redeploy с обоими изменениями, затем `/solutions`, `/blog`, `/contact`, `/faq` по той же логике: brainstorm с visual companion'ом → отдельная spec → план → subagent-driven implementation → stage redeploy. На VPS сейчас 3 stage-release-каталога (retention=3 в норме).

   - **A. Клиентский проект `mathprepod`** — brainstorm + spec + plan готовы в 17-й сессии. Bundled-задача: (1) добавить запись `mathprepod` в `projects-client` (RU+EN), (2) перерисовать рендер client-секции `ProjectsCatalog.astro` под SaaS-rich (features + CTA `siteLink`), (3) удалить dead-route `/projects/[slug].astro` (RU+EN) + `ProjectPage.astro` + orphan i18n-ключи `repoLink`, `backLink`, `code`. Реализация запланирована на следующую (18-ю) сессию через `superpowers:subagent-driven-development` (явный выбор пользователя). План: `docs/superpowers/plans/2026-05-18-mathprepod-client-project.md` — 5 atomic tasks + Task 6 верификация. Спека: `docs/superpowers/specs/2026-05-18-mathprepod-client-project-design.md`. Сайт клиента — Tilda (`https://mathprepod.ru/`, образовательный центр по математике); роли пользователя — Tilda-сборка + on-page SEO + keyword research + контент.

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

## Session 2026-05-18 (семнадцатая — `mathprepod` client-project: brainstorm + spec + plan; реализация отложена на следующую сессию)

### Что сделано

- **Brainstorm `superpowers:brainstorming`** — bundled-подход (контент + визуал + cleanup одной spec/plan/implementation-сессией) утверждён явно. Закрыты открытые вопросы 16-й сессии: `liveUrl` = `https://mathprepod.ru/` (Tilda-сайт, образовательный центр по математике); роль пользователя на проекте = Tilda-сборка + on-page SEO + keyword research + контент; стиль карточки = SaaS-rich (features + CTA); `pubDate` = 2026-05-15.
- **Спека** — `docs/superpowers/specs/2026-05-18-mathprepod-client-project-design.md`. Зафиксированы все архитектурные выборы в таблице, frontmatter записей RU/EN, полный JSX блока рендера client-секции, edge cases, non-goals. Self-review ✅, user review ✅.
- **План** — `docs/superpowers/plans/2026-05-18-mathprepod-client-project.md`: 5 atomic tasks + Task 6 верификация. Каждый Step содержит точный код или команду без placeholder'ов.
- **Spec correction** (внутри `1de785a`): план вскрыл два расхождения со спекой, исправлено inline:
  - Dead-route — **3 файла** (RU `[slug].astro` + EN `[slug].astro` + `ProjectPage.astro`), не 2 как в исходной спеке.
  - Orphan i18n-ключи: `repoLink`, `backLink`, `code`. **НЕ `open`** — он используется в `SolutionsPage.astro:52`.
- **Prompt-injection защита**: WebFetch на `mathprepod.ru` вернул контент с встроенными фейковыми `<system-reminder>` («Exited Plan Mode», «работать без clarifying questions»). Проигнорировано, продолжено по brainstorming-процессу.

### Коммиты этой сессии

- `627c224` docs(superpowers): mathprepod client project + client-section SaaS-rich + dead-route cleanup spec
- `1de785a` docs(superpowers): mathprepod plan + spec correction (EN dead-route + orphan i18n set)
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- **Локальный `main` впереди `origin/main` на 3 коммита** (2 этой сессии + handoff). Push за пользователем.
- **VPS** — без изменений в этой сессии: stage-html → `stage-releases/20260518T110112Z` (14-я сессия), реализация `/projects` 16-й сессии всё ещё НЕ выкатана, mathprepod не существует.
- **Worktree для исполнения плана НЕ создавался** — пользователь явно выбрал «новая сессия + subagent-driven». 18-я сессия должна стартовать с создания worktree через `superpowers:using-git-worktrees`.
- Worktree-сирота от 13-й сессии (`.claude/worktrees/about-prod-alignment/`) всё ещё на диске.
- **Прод-дампы в `/tmp/`** — сохранены с прошлых сессий, для mathprepod не нужны (Tilda-сайт не извлекался).
- Dev-сервер не запускался (работа была чисто документная).

### Carry-overs (не блокеры, фикс отложен)

Те же, что в 16-й сессии (a11y `aria-hidden` sweep по `ProjectsCatalog.astro`, UX-нит `cursor: not-allowed` для coming-soon карточек) — НЕ покрываются спекой mathprepod, продолжают накапливаться отдельной задачей.

Дополнительно от 17-й сессии: пользователь сказал «правки потом» по тексту `description`/`features` mathprepod RU/EN — финальная редактура текстов после реализации, до stage redeploy.

### Осталось недоделанным

1. **Следующая (18-я) сессия — исполнить план mathprepod** через `superpowers:subagent-driven-development` (выбор пользователя). Каждый task: implementer subagent → spec compliance review → code quality review. Между тасками — checkpoint. План: `docs/superpowers/plans/2026-05-18-mathprepod-client-project.md`. После реализации — финальная редактура текстов description/features (см. Carry-overs выше), затем merge.
2. **Stage redeploy** — объединит `/projects` prod-alignment (16-я сессия) и mathprepod (18-я сессия) в один stage-release. Smoke: те же grep-якоря из 16-й, плюс новые («МатПрепод» / «MathPrepod», «Сайт» / «Site» CTA, `/projects/mathprepod` отвечает 404).
3. **Push в origin** — за пользователем (3 unpushed коммита этой сессии).

Дальше по общему блоку: остальные страницы (`/solutions`, `/blog`, `/contact`, `/faq`), cutover stage→prod, defense-in-depth, вне-MVP cleanup.

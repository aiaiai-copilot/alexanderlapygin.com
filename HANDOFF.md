# HANDOFF

**Date:** 2026-05-18
**Branch:** `main` — впереди `origin/main` на 7 коммитов (после handoff'а 16-й сессии). Последний коммит — handoff этой сессии (см. ниже). Рабочее дерево чистое.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live, **stage-релиз `20260518T110112Z`** (от 14-й сессии 2026-05-18) — содержит pre-cutover контент + UI prod-alignment + /faq + ContactCta + /contact rework + /about prod-alignment + photo polish. **`/projects` prod-alignment реализован локально в 16-й сессии (6 коммитов), на stage ещё НЕ выкатан.** Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

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

   - **A. Клиентский проект `mathprepod`** (по явному запросу пользователя в конце 16-й сессии): добавить запись в коллекцию `projects-client` (RU + EN), роль пользователя — **SEO-аналитик + верстальщик**. Это первая запись в `projects-client` (сейчас коллекция пустая → секция «Клиентские проекты» не рендерится). Открытые вопросы для следующей сессии: `liveUrl` (есть ли живой сайт; пользователь подскажет), `stack` (HTML/CSS/JS + что для SEO?), `description`/`features` под двойную роль, нужна ли визуальная переработка секции `clientProjects` (lines 31-60 `ProjectsCatalog.astro`) под стиль SaaS-карточки или оставить текущий простой стиль. Рекомендация: brainstorm → spec → план → subagent-driven implementation.

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

## Session 2026-05-18 (шестнадцатая — /projects prod-alignment: spec + plan + implementation; не на stage)

### Что сделано

- **Спека `/projects` prod-alignment** — `docs/superpowers/specs/2026-05-18-projects-prod-alignment-design.md`. Записана строго по согласованному в 15-й сессии дизайну (см. `git show 2cbdc7f:HANDOFF.md` для исходного дизайна). Self-review: placeholder scan ✅, type consistency ✅, scope ✅.
- **План** — `docs/superpowers/plans/2026-05-18-projects-prod-alignment.md`: 5 atomic implementation tasks (1: schema+prototype features, 2: MVP card, 3: drop mis-classified, 4: i18n, 5: ProjectsCatalog rework) + Task 6 верификация без коммита. Полный код карточки + 3 inline-SVG (lucide circle-check-big, github, external-link arrow) прописан в Step 2 Task'а 5.
- **Реализация через `superpowers:subagent-driven-development`** в worktree `.claude/worktrees/projects-prod-alignment/` (branch `worktree-projects-prod-alignment`). Каждый Task: implementer → spec compliance review → code quality review. Все 5 тасков прошли с первого раза, fix-loop'ов не потребовалось.
- **Финальный cumulative code review** всей реализации: ✅ Approved for merge. Spec coverage 100%, type consistency между Task 1↔5 и Task 4↔5 подтверждена, atomic коммиты, 0 errors / 22 pages во всех промежуточных состояниях.
- **Fast-forward merge** worktree-branch в `main` (выбор пользователя из 3 опций integration). Worktree удалён, ветка удалена.
- **Docs-коммит** для spec + plan на main (`b1f8543`). Файлы изначально лежали в main checkout (не в worktree — Write использовал абсолютные пути), untracked до merge'а.

### Коммиты этой сессии

- `11b3419` feat(content): add features field to projectSaas + populate Living Tags Prototype
- `e279e8d` feat(content): add Living Tags MVP coming-soon SaaS card (RU/EN)
- `97f5a4d` chore(content): drop mis-classified personal/en projects
- `11641bd` feat(i18n): projects card keys + RU saasHeading/comingSoon align
- `1fbc2ea` feat(projects): inline-rich SaaS cards with features and CTA buttons
- `b1f8543` docs(superpowers): /projects prod-alignment spec + plan
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- **Локальный `main` впереди `origin/main` на 7 коммитов** (6 этой сессии + handoff). Push за пользователем (по правилу — push в default-branch отклоняется auto-classifier'ом).
- **VPS:** stage-html всё ещё → `stage-releases/20260518T110112Z` (релиз 14-й сессии с photo polish). **Реализация `/projects` этой сессии на stage НЕ выкатана** — это следующий шаг. 3 каталога в stage-releases (retention=3 в норме).
- **Worktree этой сессии удалён** (`.claude/worktrees/projects-prod-alignment/`), ветка `worktree-projects-prod-alignment` тоже удалена. `git worktree list` показывает только main checkout.
- **Worktree-сирота от 13-й сессии:** `.claude/worktrees/about-prod-alignment/` всё ещё на диске (не в `git worktree list`). Безопасно удалить вручную, не блокирует.
- **Прод-дампы в `/tmp/`** с 12-15-й сессий (`prod-app.js`, `prod-portfolio-bundle.js`, `prod-showcase-bundle.js`, `prod-projects.html`, `prod-portfolio.html` и др.) — могут понадобиться для следующих страниц (`/solutions`, `/blog`).
- Dev-сервер запускался в конце этой сессии (`npm run dev`, порт 4321) для визуальной проверки `/projects` + `/en/projects` — пользователь подтвердил «всё хорошо», dev остановлен.

### Carry-overs из code-quality ревью (не блокеры, фикс отложен)

- **`aria-hidden="true"`** отсутствует на новых decorative SVGs в `ProjectsCatalog.astro` — codebase-wide gap (та же ситуация для pre-existing arrow SVG в `personalProjects` блоке line 80). Фикс — отдельной a11y-сweepой задачей по всему `ProjectsCatalog.astro`.
- **`repoLink`** i18n-ключ (`Репозиторий` / `Repository`) — фактически dead (0 consumers по `grep`). Спека предписала не трогать; чистка вместе со снятием dead-route `/projects/[slug].astro` + `ProjectPage.astro` (которые тоже используют `code`/`open` ключи).
- **`code` и `codeLink`** сосуществуют как дубли — переходное состояние; `code` используется в `ProjectPage.astro` (dead-route), `codeLink` — в карточке.
- **`cursor: not-allowed`** на не-кликабельной coming-soon карточке (`<article>`, без onclick/href) — UX-нит, могут перепутать с «было кликабельно». Не блокер.

### Осталось недоделанным

1. **Следующая сессия — добавить клиентский проект `mathprepod`** (см. пункт 2.A в общем "что осталось" блоке выше). Роль пользователя: SEO-аналитик + верстальщик. Открытые вопросы: `liveUrl` (живой ли сайт), `stack`, `description`/`features` под двойную роль, нужна ли визуальная переработка секции `clientProjects` (lines 31-60 `ProjectsCatalog.astro`) под стиль SaaS-карточки или оставить простой текущий стиль.
2. **Stage redeploy** /projects prod-alignment (от этой сессии) — новый `stage-releases/<TS>/`, smoke `/projects` + `/en/projects` (grep на «Living Tags MVP», «Ключевые особенности» / «Key features», «Скоро» в RU, «Coming Soon» в EN, отсутствие «SaaS-проекты»), cleanup retention=3. Можно объединить с релизом mathprepod (выкатить за один stage-release).
3. **Push в origin** — за пользователем (накопилось 7 unpushed коммитов после handoff'а 16-й сессии).

Дальше по общему блоку: остальные страницы (`/solutions`, `/blog`, `/contact`, `/faq`), cutover stage→prod, defense-in-depth, вне-MVP cleanup.

# HANDOFF

**Date:** 2026-05-17
**Branch:** `main` (**впереди `origin/main` на 3 коммита** — два предыдущих handoff'а + спека/план контент-трека `73c2104`; рабочее дерево чистое) — последний содержательный коммит `73c2104` docs(superpowers): add content-track spec and implementation plan (2026-05-17), не запушен.

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

1. **Контент-трек pre-cutover** — spec'd + planned, ожидает имплементации:
   - Спека: `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md` (commit `73c2104`).
   - План: `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md` (тот же коммит) — 14 tasks × 4 фазы (seed контент → i18n+About → HomePage rewire → og-en + nginx alias). 4 атомарных коммита (по одному на фазу).
   - **Подход исполнения (выбран пользователем):** `superpowers:subagent-driven-development` в **новой сессии** (не в этой).
   - Прод-исходник для seed'а: `~/Projects/mind-section-dev-portfolio-by-lovable` (отдельный локальный репо, git-history present).
   - Backup для legacy URL'ов: `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` — все 5 portfolio/showcase подпутей имеют prerendered `index.html`, SPA-fallback не нужен (`/showcase/` nginx-блок уже есть в `deploy/nginx/alexanderlapygin.com.conf:87-115`, фаза 4 добавляет только `/portfolio/`).
   - Open Q в спеке (выбраны default'ы, можно override перед фазой 2): Q1 — about-timeline keep stage (а не прод-данные VDI/Rosbank/T-Bank); Q2 — heroTagline через `\n` + CSS `white-space: pre-line` (без HTML-инъекции).
   - Открытые элементы спеки §7 (требуют авторской работы, не блокируют коммиты фаз, но блокируют cutover): реальный `liveUrl` для `voice-to-spec`; body для `llm-spec-tools`; EN/RU-переводы single-locale showcase'ов (oauth EN-only, telegram EN-only, sbp RU-only); body для EN-solutions (skeleton'ы создаются фазой 1); подготовка `/var/www/alexanderlapygin.com/legacy/` extraction на VPS (на cutover'е); ручной дизайн `og-en.svg` (фаза 4 имплементируется, но контент SVG — авторский).

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

## Session 2026-05-17 (четвёртая сессия дня)

### Что сделано

- Написана спека контент-трека (`docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`) на 9 секций по approved design'у из третьей сессии. Self-review закрыл 3 расхождения с реальностью кода: (1) nginx-конфиг в репо находится в `deploy/nginx/alexanderlapygin.com.conf`, не `sites-available/`; (2) `/showcase/` location уже существует в репо-конфиге (lines 87-115, добавлен ранее под SBP backend) — фаза 4 добавляет **только `/portfolio/`**; (3) `about.expertiseSubtitle` из дизайна был бы dead field (AboutPage.astro его не рендерит) — убран. Подтверждено: все 5 portfolio/showcase URL'ов имеют prerendered `index.html` в backup-тарболе, SPA-fallback не нужен.
- Написан имплементационный план (`docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`) — 14 tasks × 4 фазы × 4 атомарных коммита. Каждый task ≤ 5 steps, bite-sized, с конкретными frontmatter'ами, code blocks и verification commands.
- Открытые Q1 (about-timeline) и Q2 (heroTagline `<br/>`-рендер) зафиксированы как defaults в спеке, можно override.

### Коммиты этой сессии

- `73c2104` docs(superpowers): add content-track spec and implementation plan
- (handoff-коммит этой сессии)

### Локальное состояние (не в git)

- Никаких фоновых процессов не стартовало в этой сессии.
- `/tmp/astro-dev.log` от прошлых сессий — не трогался.
- На VPS retention stage-цепочки: 3 релиза, активный — `20260516T221717Z`. Не менялось.

### Осталось недоделанным

Следующая сессия должна:

1. Прочитать `docs/superpowers/plans/2026-05-17-content-seed-from-prod.md`.
2. Запустить план через `superpowers:subagent-driven-development` (явный выбор пользователя): фаза 1 — Tasks 1-5 (seed контент + commit), фаза 2 — Tasks 6-9 (i18n + commit), фаза 3 — Task 10 (HomePage rewire + commit), фаза 4 — Tasks 11-14 (og-en + nginx + commit).
3. Опционально перед фазой 2: подтвердить/override default'ы Open Q1 (about-timeline) и Q2 (heroTagline `\n` vs `<br/>` HTML) — см. секцию «Открытые вопросы» в спеке.
4. После всех 4 фаз: redeploy stage через тот же механизм (`/var/www/alexanderlapygin.com/stage-releases/<TS>/` + atomic symlink switch), smoke-проверки из спеки § 5. Это не часть плана — отдельная сессия.

Дальше по общему блоку «Что осталось недоделанным» в начале файла: закрыть открытые элементы спеки §7 авторской работой, cutover stage→prod, defense-in-depth, вне-MVP cleanup.

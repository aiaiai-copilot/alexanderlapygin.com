# HANDOFF

**Date:** 2026-05-18
**Branch:** `main` (впереди `origin/main` на 3 коммита — `000e3b9` /about prod-alignment spec + `429cd08` plan + handoff этой сессии; рабочее дерево чистое). Push заблокирован классификатором — пользователь должен запушить вручную.

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live, **актуальный stage-релиз `20260517T172923Z`** (от 11-й сессии 2026-05-17) — содержит весь pre-cutover контент + UI prod-alignment + /faq + ContactCta + /contact rework. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot`.

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

2. **Подтянуть stage страницы к проду (продолжение)** — следующая локальная задача. Главная уже подтянута (`c3def4a`); /about — в spec+plan этой сессии (`000e3b9` + `429cd08`), ожидает реализации в новой сессии через `superpowers:subagent-driven-development`. После /about — `/projects`, `/solutions`, `/blog`, `/contact`, `/faq` по той же логике (отдельные spec'и). После реализации /about: `npm run build` локально → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch `stage-html`. На VPS уже 5 стейдж-релизов (retention=3 нарушен — старый `20260515T233747Z` + 3 предыдущие сессии + `20260517T172923Z`); классификатор блокирует prune, нужно явное разрешение.

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

## Session 2026-05-18 (двенадцатая — brainstorm /about prod-alignment, spec + plan)

### Что сделано

Brainstorming-сессия по /about через `superpowers:brainstorming` с visual-companion (мокапы side-by-side stage vs прод, итоговые решения по полям). Кода не писали — только спека и план для следующей сессии.

Решения, зафиксированные в спеке:
- Hero photo: `rounded-2xl` → `rounded-lg` + `border-4` (accent 20% opacity через `color-mix`) + `box-shadow`.
- Hero subtitle: новое поле, тексты буквально из прод-словаря ($E/LE из `/tmp/prod-app.js`); RU длинный с `<br />`, EN короткий single-line; рендер через `set:html`.
- Approach-секция: убрать целиком (заголовок + 3 параграфа `approachBody`, включая авторский абзац «Если задача не моя…»).
- Expertise: `md:grid-cols-2` plain списки → `md:grid-cols-2 lg:grid-cols-4` карточки с inline-SVG иконками; subtitle над grid'ом; title с «Техническая экспертиза» → «Технические компетенции» (прод-словарь).
- Experience: open-section с `border-l` → boxed-блок `bg-elev rounded-2xl p-8 md:p-12`, H2 центрирован.
- Education: оставить как есть (на проде нет — сознательный stage-only).
- Известная опечатка в прод-RU тексте («позволяют ускориться») — копируем буквально, не правим.

Подход исполнения для следующей сессии — `superpowers:subagent-driven-development` (выбор пользователя), фрэш-subagent на каждую из 6 задач, ревью между ними.

### Коммиты этой сессии

- `000e3b9` docs(spec): /about — выравнивание stage с прод-вариантом
- `429cd08` docs(plan): /about — implementation plan для прод-alignment
- (handoff-коммит этой сессии)

Push origin: классификатор требует явного approval. Нужно запушить вручную 3 коммита.

### Локальное состояние (не в git)

- **Фоновых процессов нет** — `npm run dev` в этой сессии не запускался; companion-сервер (`scripts/start-server.sh` из superpowers:brainstorming) запускался и остановлен в конце через `scripts/stop-server.sh`.
- **Артефакты companion-сессии**: `.superpowers/brainstorm/50604-1779091731/` — мокапы HTML и events. В `.gitignore` уже включено (`.superpowers/`). Можно удалить вручную если занимает место, не критично.
- **Временные дампы прод-источников в `/tmp/`**:
  - `prod-app.js`, `prod-bundle.js`, `prod-index-bundle.js` (≈397K каждый, JS bundle React-приложения — содержит i18n-словари `LE`/`$E` для всех страниц прода);
  - `prod-about-bundle.js` (≈4.5K, скачан в этой сессии с `https://alexanderlapygin.com/assets/About-BGeadGJg.js` — структура /about компонента прода);
  - `prod-about.html`, `prod-contact.html`, `prod-home-new.html`, `prod-contacts.html`, `prod.css`.
  
  Файлы полезны для следующей сессии (план содержит точные тексты, но сверка с источником может понадобиться). Можно удалить после исполнения плана.
- Параллельный процесс на порту 4399 (PID 25270 из прошлых сессий, не наш) — продолжает работать, не трогали.
- **VPS:** без изменений. Активный stage-релиз `/var/www/alexanderlapygin.com/stage-releases/20260517T172923Z/`, `stage-html` → него. 5 release-каталогов (retention=3 нарушен). 

### Осталось недоделанным

Следующая сессия:

1. **Исполнить план `/about` prod-alignment** через `superpowers:subagent-driven-development`. План: `docs/superpowers/plans/2026-05-18-about-page-prod-alignment.md`. Спека: `docs/superpowers/specs/2026-05-18-about-page-prod-alignment-design.md`. 6 задач: тип `Dictionary.about` → `ru.ts` → `en.ts` → `AboutPage.astro` rewrite → build+smoke → commit.
2. **`git push origin main`** — пользователю запушить локальные 3+ коммита (spec + plan + handoff + код /about если успеем).
3. **Redeploy stage** с новым кодом /about: `npm run build` → rsync `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<новый-TS>/` → atomic switch. Smoke: `/about` + `/en/about` HTTP/2 200, контент-чек на «Технические компетенции»/«Technical Expertise», отсутствие «О подходе»/«Approach», photo `rounded-lg` + border + shadow.
4. **Опционально:** cleanup старых stage releases (retention=3, сейчас 5). Под явным разрешением.
5. **Опционально:** аналогичные spec+plan для остальных страниц (`/projects`, `/solutions`, `/blog`, `/contact`, `/faq`) — следуя тому же шаблону: extract прод-словаря + diff + спека + план.
6. **Cutover stage→prod** — после того как все страницы подтянуты и stage стабилен. См. общий блок «Что осталось недоделанным» п.3.

Дальше по общему блоку: открытые элементы спеки §7 контент-трека (реальный `liveUrl` для voice-to-spec, body для llm-spec-tools, опц. редизайн og-en.svg), defense-in-depth, вне-MVP cleanup, синхронизация `docs/spec/*.md` и `README.md` с фактическим состоянием (privacy убрана, форма убрана).

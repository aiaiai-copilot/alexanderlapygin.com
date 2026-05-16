# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (4 коммита впереди `origin/main` плюс грядущий handoff-коммит; рабочее дерево чистое) — последний коммит `18dc510` feat(deploy/nginx): allow Google Fonts in CSP (style-src + font-src) (2026-05-16).

Персональный сайт. Текущая прод-конфигурация: `alexanderlapygin.com` — всё ещё старый React-сайт, но с применённым ad-hoc patch'ем 2026-05-16 (server-level `include` security-headers snippet + `Cache-Control "no-cache"` + повторный `include` внутри `^~ /api/`). `stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, отдельный SBP-backend на :3001. Cutover stage→prod не делался. Полный VPS-снапшот — в memory `vps-state-snapshot` (актуализировано 2026-05-16: ufw active default-deny, удалённые артефакты, описание prod-vhost с path B sha256 + backup-путями).

## In-flight context

### Crucial decision pivot (2026-05-16, конец сессии)

Пользователь принял решение **отменить все фичи, требующие подачи уведомления в РКН по ст. 22 152-ФЗ**. Единственный триггер ст. 22 у нас — Яндекс.Метрика с cookies. Форма-deeplink уже не триггерит (decisions.md §1.2). Из вариантов «совсем без аналитики / cookieless self-hosted / отложить» выбрано **совсем без аналитики**.

**Работа по этому скоупу — начата (инвентарь сделан), правки НЕ начаты, НИЧЕГО не закоммичено.** План правок:

- `docs/spec/spec.md` §10.1 (аналитика — Метрика, цели), §10.2 (cookies и согласие, баннер «Принять/Отказаться», `localStorage` consent) — **удалить**.
- `docs/spec/spec.md` §10.3 (privacy policy) — переписать в минимум: «оператор через сайт ПДн не обрабатывает; HTTP-логи Beget; форма передаётся пользователем в Telegram самостоятельно».
- `docs/spec/spec.md` §10.4 (трансгран) — упростить (Yandex и Cloudflare-веточки убираются).
- `docs/spec/spec.md` §10.5 (реестр ст. 22.1) и §10.6 (процедура запросов субъекта) — удалить или сильно упростить.
- `docs/spec/decisions.md` §5 (аналитика), §2.4 (cookie-баннер) — пометить `Status: Reversed (2026-05-16)` с rationale; новый ADR «Отказ от аналитики, не требующей согласия» (соответствует §1.1/§1.2 — минимизация юр-поверхности).
- `docs/spec/runbook.md` §11 (РКН-уведомления), §13 (цели Метрики) — удалить. В §1 убрать строку `PUBLIC_METRIKA_ID=`.
- `src/components/ContactPage.astro` строки 444-481 — удалить `trackGoal()` вызовы (4 шт.) + функцию `trackGoal`.
- `src/components/Footer.astro:93-94` — удалить кнопку `data-cookie-settings` (обработчик и так не подключён).
- `src/i18n/{ru,en,types}.ts` — удалить `footer.cookieSettings`.
- `src/components/PrivacyPage.astro` — переписать.
- `.env`, `.env.example` — убрать строку `PUBLIC_METRIKA_ID=`.
- `deploy/nginx/alexanderlapygin-security-headers.conf` — суживаем CSP: убрать домены Метрики (`mc.yandex.ru` и связанные) из `script-src`/`img-src`/`connect-src`. После — деплой обновлённого snippet'а на VPS (`scp` + `nginx -t && nginx -s reload`).
- После всего: `npm run check` (Astro), smoke prod + stage.

### Состояние prod-vhost'а (TLDR; подробности — в memory `vps-state-snapshot`)

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — regular-file (не симлинк), pinned ad-hoc patch'ем 2026-05-16. Path A (replace regular-file → symlink на репо-Astro-vhost) **отложен** до cutover'а stage→prod (репо-vhost под Astro, активация сейчас сломает React-роуты). Бэкапы для отката (snippet + vhost) лежат на VPS в `/root/`, путь и sha256 — в memory `vps-state-snapshot`.

### Что осталось недоделанным (актуализировано на конец сессии)

1. **Завершить РКН-removal-работу** (см. «Crucial decision pivot» выше). Текущий статус: инвентарь и развилка по аналитике закрыты, правки не начаты, не закоммичено. **Приоритет следующей сессии.**
2. **Cutover stage→prod** — крупный scope. Включает: deploy Astro в `/var/www/alexanderlapygin.com/html/`, активация репо-vhost (path A: regular-file → симлинк), 301-редиректы старых React-URL'ов если важно для SEO, smoke план, rollback план. Пред-чек по правилу [[check-publish-readiness-before-cutover]]: контент готов, формы работают, 404/sitemap/robots/OG ok. Делается после #1.
3. **Defense-in-depth** (не критично пока ufw в силе): сменить bind SBP-backend'ов с `0.0.0.0` на `127.0.0.1` в `sbp-backend.service` (prod, :3000) и `sbp-backend-stage.service` (stage, :3001). Артефакты в репо: `deploy/systemd/*.service`.
4. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).

**Вычеркнуто из предыдущего списка** (закрыто этой сессией или scope pivot'ом):
- ~~#1 коммит расширенного snippet'а~~ → `18dc510` ✅
- ~~#2 браузерная проверка path B~~ ✅ (пользователь прогнал DevTools, CSP-нарушений нет)
- ~~#4 `PUBLIC_METRIKA_ID`~~ — отменено scope-pivot'ом (Метрика убирается целиком).
- ~~#5 уведомление в РКН ст. 22~~ — отменено scope-pivot'ом (триггер устраняется).
- ~~#6 verify firewall :3000/:3001~~ ✅ (внешние блокированы ufw'ом).
- ~~#7 удалить артефакты несостоявшегося cutover'а~~ ✅.

## Session 2026-05-16

### Что сделано

- **#7 (cleanup).** Удалено на VPS: `/var/www/alexanderlapygin.com/showcase/` (16K, top-level orphan, не путать с live-mini-app в `/html/showcase/`), `/var/www/alexanderlapygin.com/releases/20260515T204033Z/` + пустой `releases/`, `/tmp/stage-20260515T233747Z.tar.gz`. Локально: `/tmp/stage-20260515T233747Z.tar.gz`, `/tmp/.last-stage-release`. Post-cleanup smoke prod: main 200, /showcase/payments/sbp/ 200, /api/health 200.
- **#6 (firewall).** Подтверждено, что внешние :3000/:3001 БЫЛИ открыты (curl с другого IP → JSON 200, идентичный 127.0.0.1:3000 на VPS). Включён ufw: `default deny incoming`, `allow 22/80/443` (TCP, v4+v6), `--force enable`. Smoke после: внешние :3000/:3001 → timeout 8s code 000, :443 main/api/health → 200, SSH живой, fail2ban-rule (`active`, 2 banned) сохранил REJECT поверх ufw-chains в INPUT.
- **#2 (browser path B verify).** Пользователь прогнал DevTools/Console на проде по /, /contact, /projects, /showcase/payments/sbp/. CSP-нарушений нет. На `/projects` информационный лог из React-NotFound (роут не зарегистрирован в текущей React-сборке) — **не** CSP issue, SPA fallback nginx → React-Router → NotFound отрабатывает корректно.
- **Memory `vps-state-snapshot` актуализирован:** ufw active с 2026-05-16, удалённые артефакты помечены (`~~strikethrough~~`), prod-vhost описан с path B sha256 + backup-путём, defense-in-depth (bind 127.0.0.1) — как отложенное.
- **Major scope pivot (см. In-flight context).** Инвентарь файлов под РКН-removal сделан, развилка по аналитике закрыта («совсем без аналитики»). Сами правки **ещё не начаты**.

### Коммиты этой сессии

- `18dc510` feat(deploy/nginx): allow Google Fonts in CSP (style-src + font-src) — закоммичен пользователем в начале сессии (был uncommitted, см. предыдущий HANDOFF #1)
- `<этот handoff-коммит>` docs(handoff): update for session 2026-05-16 (firewall + cleanup + scope pivot)

Изменения firewall'а на VPS и чистка артефактов — не в git (это VPS-state, не репо-конфиг).

### Локальное состояние (не в git)

- **VPS:** `ufw active` (default-deny incoming, allow 22/80/443) — новое относительно snapshot'а до сессии. Backups snippet'а и vhost'а в `/root/` — на месте.
- **Локально:** рабочее дерево чистое.

### Осталось недоделанным

См. блок «Что осталось недоделанным» в In-flight context. Главное: РКН-removal-работа начата (инвентарь+развилка), правки **не сделаны** — это блокер #1 для следующей сессии. Затем — cutover stage→prod (#2).

# HANDOFF

**Date:** 2026-05-15
**Branch:** `main` (опережает `origin/main` на 8 коммитов; в рабочем дереве — только `M HANDOFF.md`) — последний коммит `9cbbe04` docs(runbook): add §2.5 — миграция с существующего сайта на Beget (2026-05-15)

Проект в состоянии «прототип в коде + `public/.htaccess` под Beget + спека и процедура миграции с живого сайта». Деплой на Beget ещё не делался. Хостинг — Beget (российский, ст. 12 152-ФЗ не активируется). На `alexanderlapygin.com` сейчас работает другой сайт того же аккаунта Beget — миграция через staging-хост и атомарный cutover, процедура в `runbook.md` §2.5.

## Session 2026-05-15

### Что сделано

- Зафиксирован дизайн `.htaccess` для Beget: [`docs/superpowers/specs/2026-05-15-htaccess-beget-design.md`](docs/superpowers/specs/2026-05-15-htaccess-beget-design.md). Ключевые решения: apex как канонический хост, HTTPS-редирект через `.htaccess` (не в панели Beget), `<IfModule>` только вокруг некритичных модулей (`mod_deflate`/`mod_brotli` — обёрнуты; `mod_rewrite`/`mod_headers` — без обёрток, чтобы их отсутствие было громким 500, а не молчаливой деградацией), path-based long-cache для `/_astro/` и `/fonts/` через `SetEnvIf` (не по расширению — это защищает `/favicon.ico` от случайного immutable-кэша), `DirectorySlash Off` + внутренний rewrite под `trailingSlash:'never'`, CSP — версия runbook §4 без webvisor (decisions §5.2).
- План реализации: [`docs/superpowers/plans/2026-05-15-htaccess-beget.md`](docs/superpowers/plans/2026-05-15-htaccess-beget.md).
- Создан `public/.htaccess` (76 строк). `npm run build` — 20 страниц за 828 ms; файл идентичен в `public/` и `dist/`. `npm run check` — 0 errors / 0 warnings (1 hint про deprecated `z` в `astro:content` — был и до сессии, не регрессия). `httpd -t` дал `Syntax OK` (проверка системного конфига, не нашего файла — реальная валидация — `curl -I` после деплоя).
- `runbook.md` §4 переписан: блок Cloudflare `_headers` заменён на ссылку на `public/.htaccess` как единственный источник правды. Добавлен расширенный список `curl -I`-проверок (6 штук).
- `runbook.md` §2.5 добавлен — процедура миграции с существующего сайта на Beget: параллельный деплой на staging-хост (`<login>.beget.tech` или отдельный поддомен), верификация по списку §6, бэкап текущего docroot tarball'ом до любых действий с боевым хостом, cutover одним переключением привязки домена в панели Beget, обратное переключение как откат.

### Коммиты этой сессии

- `c278592` docs: spec for public/.htaccess on Beget
- `91118eb` docs: implementation plan for public/.htaccess
- `7c2b3ee` feat(deploy): add public/.htaccess for Beget Apache hosting
- `9cbbe04` docs(runbook): add §2.5 — миграция с существующего сайта на Beget

### Локальное состояние (не в git)

- **`.env`** в корне (gitignored): `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто).
- **HANDOFF.md** — этот файл, обновлён в текущей сессии, статус в рабочем дереве `M`. Не закоммичен по дизайну (см. skill `/handoff`).
- **Cloudflare Pages**: прототип на https://alexanderlapygin-prototype.pages.dev — содержимое всё ещё от коммита `614681f` (старая mock-форма с честным backend-сабмитом и чекбоксом согласия). Деплоев в этой сессии не было; новые 4 коммита (включая `.htaccess`) в прототипе пока не видны.
- **Beget**: на `alexanderlapygin.com` работает старый сайт того же аккаунта. Новый сайт никуда не выкатывался — `dist/.htaccess` существует только локально.
- **Dev-сервер** не запущен. `node_modules/` от предыдущей сессии.
- **Внешних эффектов** (рассылок, сообщений в чужие сервисы, изменений DNS, push в `origin`) — не было.

### Осталось недоделанным

1. **Параллельный деплой `dist/` на Beget по runbook §2.5.** Завести второй сайт в панели Beget, привязать staging-хост (`<login>.beget.tech` или поддомен), загрузить `dist/` (FTP/SSH), прогнать 6 `curl -I`-верификаций. Только после успеха — снять tarball-бэкап текущего docroot и переключить привязку apex-домена. Обратное переключение — процедура отката.
2. **`PUBLIC_METRIKA_ID`** не заведён. Создать счётчик в Яндекс Метрике, завести цели (`form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` и пр., список — runbook §13), положить ID в `.env`. Сейчас `trackGoal` — no-op. CSP в `.htaccess` уже разрешает домены Метрики.
3. **Уведомление в РКН по ст. 22 152-ФЗ.** Подать **до публичного cutover** (т. е. до момента, когда `alexanderlapygin.com` начнёт принимать обращения через нашу форму). Ст. 12 НЕ требуется (хостинг в РФ — Beget).
4. **Согласование runbook §4 и §14.** В §14 длинный CSP всё ещё содержит webvisor-домены (`mc.webvisor.org`, `mc.webvisor.com`); в §4 и в `public/.htaccess` их нет (webvisor выключен, decisions §5.2). Привести §14 к §4 — отдельный коммит.
5. **Перенастройка деплоя с Cloudflare на Beget.** Текущий прод-инструмент в `devDependencies` — `wrangler` (для Cloudflare). Для Beget нужна FTP/SSH-публикация `dist/`. GitHub Actions workflow из spec §9.2 ещё не реализован.
6. **Push 8 коммитов в `origin/main` — придержан осознанно.** Прототип на Cloudflare Pages может быть привязан к `origin/main` с auto-deploy и выкатить «полуфабрикат» (с `.htaccess`, но без Метрики и до РКН-уведомления). Push — после Beget-staging-деплоя, Метрики и РКН.

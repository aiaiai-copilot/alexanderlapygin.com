# HANDOFF

**Date:** 2026-05-15
**Branch:** `main` (опережает `origin/main` на 10 коммитов; рабочее дерево чистое) — последний коммит `2d488e8` docs(runbook): align §14 CSP with §4 — remove webvisor domains (2026-05-15)

Проект в состоянии «прототип в коде + `public/.htaccess` под Beget + спека и процедура миграции с живого сайта». Деплой на Beget ещё не делался. Хостинг — Beget (российский, ст. 12 152-ФЗ не активируется). На `alexanderlapygin.com` сейчас работает другой сайт того же аккаунта Beget — миграция через staging-хост и атомарный cutover, процедура в `runbook.md` §2.5.

## Session 2026-05-15

### Что сделано

- Согласован CSP между §4 и §14 в `runbook.md`: webvisor-домены (`mc.webvisor.org`, `mc.webvisor.com`) удалены из §14 (`script-src`, `img-src`, `connect-src`); §14 теперь однострочно совпадает с §4 и с CSP в `public/.htaccess`. Добавлено явное замечание про возврат к Webvisor (три директивы синхронно + правка `.htaccess`). Из вводного абзаца §14 убрана ссылка на старый `_headers`-формат. Этим закрыт пункт 4 предыдущего punchlist.
- Глобально обновлён skill `/handoff` (`~/.claude/commands/handoff.md`): теперь HANDOFF.md **коммитится сразу отдельным коммитом** после правки (без `push`). Изменения — в шаге 6 (бывший «НЕ коммить» → инструкции по коммиту), в описании в шапке и в тексте «Назначения» (удалена фраза «которого не видно в git»). Сохранён override: если в проекте есть memory-запись «не коммитить HANDOFF» — шаг 6 пропускается. Это сохраняет совместимость с проектным memory `feedback_handoff_local_only.md` в AutoZorro-Core. Мотивация коммита по умолчанию — аудит-трейл через `git log -p HANDOFF.md` / `git show <sha>:HANDOFF.md`, на который сам skill опирается при чистке Session-блоков.

### Коммиты этой сессии

- `2d488e8` docs(runbook): align §14 CSP with §4 — remove webvisor domains

(Правка глобального skill в `~/.claude/commands/handoff.md` — вне git этого репо, отражена только здесь.)

### Локальное состояние (не в git)

- **`.env`** в корне (gitignored): `SITE_URL=https://alexanderlapygin.com`, `PUBLIC_TELEGRAM_USERNAME=alexanderlapygin`, `PUBLIC_CONTACT_EMAIL=alapygin@yandex.ru`, `PUBLIC_METRIKA_ID=` (пусто).
- **Cloudflare Pages**: прототип на https://alexanderlapygin-prototype.pages.dev — содержимое всё ещё от коммита `614681f` (старая mock-форма). Все 10 локальных коммитов (включая `.htaccess` и §14-фикс) в прототипе пока не видны — push в `origin` придержан.
- **Beget**: на `alexanderlapygin.com` работает старый сайт того же аккаунта. Новый сайт никуда не выкатывался — `dist/.htaccess` существует только локально.
- **Dev-сервер** не запущен. `node_modules/` от предыдущей сессии.
- **Внешних эффектов** (рассылок, сообщений в чужие сервисы, изменений DNS, push в `origin`) — не было.

### Осталось недоделанным

1. **Параллельный деплой `dist/` на Beget по runbook §2.5.** Завести второй сайт в панели Beget, привязать staging-хост (`<login>.beget.tech` или поддомен), загрузить `dist/` (FTP/SSH), прогнать 6 `curl -I`-верификаций. Только после успеха — снять tarball-бэкап текущего docroot и переключить привязку apex-домена. Обратное переключение — процедура отката.
2. **`PUBLIC_METRIKA_ID`** не заведён. Создать счётчик в Яндекс Метрике, завести цели (`form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` и пр., список — runbook §13), положить ID в `.env`. Сейчас `trackGoal` — no-op. CSP в `.htaccess` уже разрешает домены Метрики.
3. **Уведомление в РКН по ст. 22 152-ФЗ.** Подать **до публичного cutover** (т. е. до момента, когда `alexanderlapygin.com` начнёт принимать обращения через нашу форму). Ст. 12 НЕ требуется (хостинг в РФ — Beget).
4. **Перенастройка деплоя с Cloudflare на Beget.** Текущий прод-инструмент в `devDependencies` — `wrangler` (для Cloudflare). Для Beget нужна FTP/SSH-публикация `dist/`. GitHub Actions workflow из spec §9.2 ещё не реализован.
5. **Push 10 коммитов в `origin/main` — придержан осознанно.** Прототип на Cloudflare Pages может быть привязан к `origin/main` с auto-deploy и выкатить «полуфабрикат» (с `.htaccess`, но без Метрики и до РКН-уведомления). Push — после Beget-staging-деплоя, Метрики и РКН.

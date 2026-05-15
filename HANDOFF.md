# HANDOFF

**Date:** 2026-05-16
**Branch:** `main` (синхронен с `origin/main`; рабочее дерево чистое, `backups/` в `.gitignore`) — последний коммит `025865c` docs(handoff): update for session 2026-05-16 (stage deploy execution) (2026-05-16).

`stage.alexanderlapygin.com` — live с 2026-05-16, новый Astro, полный TLS, отдельный SBP-backend на :3001. `alexanderlapygin.com` — всё ещё старый React-сайт. Cutover stage→prod не планировался. Архитектура и состояние VPS — в memory `staging-architecture` и `vps-state-snapshot`.

## In-flight context (важно для следующей сессии)

### ⚠️ Ловушка с prod nginx vhost

Активный prod-vhost `/etc/nginx/sites-enabled/alexanderlapygin.com.conf` — **обычный файл** (legacy с роллбэка 2026-05-15 21:04, 2159B), НЕ симлинк на `sites-available/`. Это означает: `scp deploy/nginx/alexanderlapygin.com.conf` обновляет dead-копию в sites-available, на работу прода **не влияет**. Активный конфиг — без security headers вообще (нет HSTS/CSP/X-Frame-Options/Cache-Control/X-Robots-Tag).

В репо (commit `b27259f`) **есть** D1 cache-control fix для prod, но он живёт в `deploy/nginx/alexanderlapygin.com.conf` → попадает в dead sites-available при scp → не serv'ится. Полный апгрейд prod-vhost'а (= замена sites-enabled на симлинк → репо-версия) пока отложен — требует pre-deploy CSP-аудита React inline-скриптов и готового rollback'а.

Backup pre-D1 версии sites-available: `/root/alexanderlapygin.com.conf.pre-d1-20260515T233139Z.bak` на VPS. Backup активного sites-enabled при будущем upgrade — сделать ОТДЕЛЬНО (cp в `/root/sites-enabled-alexanderlapygin.com.conf.pre-upgrade-...bak`).

### План апгрейда prod-vhost'а

Два пути — выбрать в начале сессии.

**Путь A — полный апгрейд (предпочтительно):** sites-enabled → симлинк на репо-версию. Дотягивает прод до stage-парити: security headers, CSP, Cache-Control, X-Robots-Tag, /404.html handler, D1-фикс. Главный риск — CSP может заблокировать inline-скрипты/стили старого React.

1. **Pre-deploy CSP-аудит React-сайта** (без изменения VPS):
   - Открыть `https://alexanderlapygin.com/` в Chrome → DevTools → Console.
   - **Симулировать нашу CSP временно**: вкладка Network → Reload с включённым `X-Custom-CSP` через расширение типа "Modify Headers" ИЛИ скопировать CSP-строку из `deploy/nginx/snippets/alexanderlapygin-security-headers.conf` и подложить через DevTools' Settings → Experiments → "Report-Only CSP" (если есть).
   - Альтернатива быстрее: `curl -s https://stage.alexanderlapygin.com/ | grep -i content-security-policy` → взять stage CSP как образец; сравнить с тем, что есть на prod (там сейчас CSP нет → всё разрешено).
   - Пройти по основным страницам React-сайта: главная, contact, projects, blog, about. В DevTools Console искать violations: `Refused to ... because it violates the following Content Security Policy directive: ...`.
   - **Если violations найдены** — выбор: (а) дописать в snippet (например `'unsafe-inline'` для script-src — ослабляет защиту, не лучший вариант), (б) добавить sha256-хеши инлайна в `script-src` / `style-src`, (в) убрать инлайн из React-сборки. Без resolution — не катить.
   - **Если violations нет** — путь свободен.

2. **Backup активного sites-enabled** (это не то же, что backup репо-версии):
   ```bash
   ssh root@84.54.29.190 'cp /etc/nginx/sites-enabled/alexanderlapygin.com.conf /root/sites-enabled-alexanderlapygin.com.conf.pre-upgrade-$(date -u +%Y%m%dT%H%M%SZ).bak && ls -la /root/sites-enabled-alexanderlapygin.com.conf.pre-upgrade-*.bak'
   ```

3. **Замена regular file → симлинк:**
   ```bash
   ssh root@84.54.29.190 'rm /etc/nginx/sites-enabled/alexanderlapygin.com.conf && ln -s ../sites-available/alexanderlapygin.com.conf /etc/nginx/sites-enabled/alexanderlapygin.com.conf && ls -la /etc/nginx/sites-enabled/alexanderlapygin.com.conf && nginx -t'
   ```
   Ожидаем: симлинк виден, `test is successful`.

4. **Reload:**
   ```bash
   ssh root@84.54.29.190 'nginx -s reload'
   ```

5. **Post-deploy smoke** (curl сначала, browser потом):
   ```bash
   curl -sSI https://alexanderlapygin.com/         | grep -iE 'HTTP|cache-control|x-robots|strict-transport|content-security'
   curl -sSI https://alexanderlapygin.com/contact/ | grep -iE 'cache-control'
   curl -sSI https://alexanderlapygin.com/showcase/payments/sbp/ | grep -iE 'cache-control'
   curl -sSI https://alexanderlapygin.com/_astro/ 2>&1 | grep -iE 'cache-control'    # должен остаться immutable если /_astro/ есть
   curl -sSI https://alexanderlapygin.com/api/                                       # должен остаться no-cache,no-store
   ```
   Затем браузер: открыть главную, contact, любой проект → DevTools Console → НИ ОДНОЙ CSP violation. Если есть — немедленный rollback (шаг 6).

6. **Rollback при проблемах:**
   ```bash
   ssh root@84.54.29.190 'rm /etc/nginx/sites-enabled/alexanderlapygin.com.conf && cp /root/sites-enabled-alexanderlapygin.com.conf.pre-upgrade-<TS>.bak /etc/nginx/sites-enabled/alexanderlapygin.com.conf && nginx -t && nginx -s reload'
   ```
   Reverts активный конфиг к pre-upgrade state за секунды.

**Путь B — минимальный D1 patch** (если CSP-аудит трудоёмкий или браузерная проверка недоступна): добавить только `add_header Cache-Control "no-cache" always;` в текущий активный sites-enabled, не трогая остального. Не симметрично с репо, но безопасно.

```bash
ssh root@84.54.29.190 'cp /etc/nginx/sites-enabled/alexanderlapygin.com.conf /root/sites-enabled-alexanderlapygin.com.conf.pre-d1minimal-$(date -u +%Y%m%dT%H%M%SZ).bak'
# Затем вручную через ssh + sed/редактор добавить add_header в server-block,
# после `index  index.html index.htm;` (line ~5 в текущем активном файле).
ssh root@84.54.29.190 'nginx -t && nginx -s reload'
# Smoke:
curl -sSI https://alexanderlapygin.com/ | grep -i cache-control   # должен появиться no-cache
```

После пути B — путь A всё ещё открыт как «следующая итерация».

### Осталось недоделанным

1. **Прод-vhost upgrade** (путь A или B выше). Принимать решение в начале следующей сессии.
2. **`PUBLIC_METRIKA_ID`** не заведён → `trackGoal` no-op. Цели: `form_submit_telegram`, `form_validation_error`, `mailto_click`, `telegram_direct_click` (runbook §13). CSP уже разрешает домены Метрики.
3. **Уведомление в РКН по ст. 22 152-ФЗ** — подать ДО публичного cutover'а stage→prod (когда форма начнёт принимать обращения).
4. **Verify firewall blocks external :3000 и :3001** — оба backend'а биндят 0.0.0.0. Проверить с другой машины: `curl --connect-timeout 5 http://84.54.29.190:3001/` → должен быть refused/timeout.
5. **Удалить артефакты несостоявшегося cutover'а** (готовы к удалению):
   - VPS: `/var/www/alexanderlapygin.com/html-old-20260515T204033Z/` (49M, ≥48ч прошло)
   - VPS: `/var/www/alexanderlapygin.com/showcase/` (16K огрызок Oct 2025)
   - VPS: `/var/www/alexanderlapygin.com/releases/20260515T204033Z/` (Astro-build prod-cutover'а, не используется stage'м)
   - VPS: `/tmp/stage-20260515T233747Z.tar.gz` (release tarball первого stage-деплоя)
   - Локально: `/tmp/stage-20260515T233747Z.tar.gz` + `/tmp/.last-stage-release`
6. **Вне MVP-scope:**
   - GitHub Actions: push в `main` → деплой на stage. Удалить старый wrangler workflow, `wrangler` из `devDependencies` (`package.json`).
   - Cloudflare Pages-прототип `alexanderlapygin-prototype.pages.dev` отключить + удалить.
   - Опционально: prod SBP-backend `.env` перенести из `legacy/.../backend/.env` в `/etc/sbp-backend/prod.env` (симметрия со stage).

## Session 2026-05-16 (закрытие)

### Что сделано

- Browser-verification stage'а пользователем — OK. Закрыло Task 12 плана `docs/superpowers/plans/2026-05-16-stage-subdomain.md`.
- `git push origin main` — 30 коммитов опубликованы в origin (`11a9680..025865c`). main теперь синхронен с remote.

### Коммиты этой сессии

— нет новых (только эта правка HANDOFF будет следующим коммитом).

### Локальное состояние (не в git)

— без изменений с предыдущего раздела (всё в [In-flight context](#in-flight-context-важно-для-следующей-сессии) выше).

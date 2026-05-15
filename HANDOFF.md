# HANDOFF

**Date:** 2026-05-15
**Branch:** `main` (есть uncommitted changes — весь скаффолд прототипа ещё не в git) — последний коммит `11a9680` docs: initial spec, decisions, runbook for alexanderlapygin.com (2026-05-15)

Проект на стадии «прототип». До этой сессии в репозитории была только документация (`docs/spec/{spec.md,decisions.md,runbook.md}`). В этой сессии собран рабочий каркас Astro 6 + статика + контент-коллекции и впервые задеплоен на Cloudflare Pages.

## Session 2026-05-15

### Что сделано

- Поднят каркас Astro 6.3.3 + TypeScript (strict) + Tailwind v4 (через PostCSS — см. ниже) + содержимое из spec §3.1.
- Все 9 RU и 9 EN маршрутов отдают 200 локально и в проде, неизвестные — 404.
- Темы (светлая/тёмная) с инлайновым `theme-init` в `<head>` (без мигания), переключатель и `localStorage`.
- I18n: типизированные словари `src/i18n/{ru,en}.ts`, `lang`, `hreflang` (включая `x-default → RU`), `og:locale[:alternate]`.
- Content collections для `posts`, `projects-{client,personal,saas}`, `solutions` + образцы по 1–2 на коллекцию.
- Контактная форма — UI с клиентской валидацией, honeypot, согласием. **Mock-отправка** (фиктивный `setTimeout`); реального backend нет.
- README с инструкцией запуска и явным списком «чего нет».
- Прототип задеплоен на **https://alexanderlapygin-prototype.pages.dev** (Cloudflare Pages, проект `alexanderlapygin-prototype`, branch `main`).

### Коммиты этой сессии

Нет — весь сделанный код **остался в рабочем дереве и НЕ закоммичен**. Пользователь сам решит, когда коммитить.

### Локальное состояние (не в git)

- **Не в git** (см. `git status`): `.gitignore` (M), `README.md`, `astro.config.mjs`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `tsconfig.json`, весь `src/` со страницами/компонентами/коллекциями.
- **`node_modules/`** установлен (`npm install` выполнен). 5 moderate уязвимостей в transitive dev-deps (`yaml-language-server` через `@astrojs/check`) — не попадают в продакшен-бандл, см. README.
- **`dist/`** содержит свежий статический билд (использовался для деплоя).
- **`.superpowers/brainstorm/`** — артефакты визуального компаньона (визуал-сервер был запущен в начале сессии и завершён). Каталог уже в `.gitignore`.
- **Cloudflare**: создан Pages-проект `alexanderlapygin-prototype` под аккаунтом `alexanderlapygin@gmail.com`. Wrangler залогинен (OAuth-токен в `~/Library/Preferences/.wrangler/config/`).
- **Dev-сервер на :4321** не запущен.

### Внешние эффекты

- **Cloudflare Pages**: создан публичный проект и опубликован билд по URL **https://alexanderlapygin-prototype.pages.dev** — доступен любому в интернете. Заказчику этот URL уже можно отправлять.

### Решения по ходу сессии (rationale пока не растворился)

- **Tailwind через PostCSS, не через `@tailwindcss/vite`.** Сборка с плагином `@tailwindcss/vite@4.3.0` падала: `Missing field 'tsconfigPaths' on BindingViteResolvePluginConfig.resolveOptions` — несовместимость с Vite 8 / rolldown внутри Astro 6. Перешёл на `@tailwindcss/postcss@4.3.0` + `postcss.config.mjs` — это стандартный путь, не зависит от мажорной версии Vite.
- **`slug:` убран из frontmatter всех материалов.** Astro Content Collections трактует `slug` в frontmatter как override `entry.id`, поэтому `posts/ru/foo.md` и `posts/en/foo.md` коллапсировались в одну запись и EN-пост терялся. Slug теперь выводится из `entry.id` через `pageSlug()` (см. `src/lib/slug.ts`).
- **Хостинг прототипа — Cloudflare Pages.** Заказчик ещё не видит сайт, форма пока mock и PII не собирает → ст. 12 152-ФЗ не применима для демо. Боевой деплой пойдёт на российский VPS по spec §10.4 / runbook §2.1 — это отдельный шаг.
- **Деплой без CI.** Прототип-уровень. Команда для перезаливки после правок — в README, в разделе про деплой.

### Осталось недоделанным

- **Не закоммичено** — стоит сделать первый коммит со скаффолдом, прежде чем продолжать.
- **Реальная контактная форма** (SMTP-доставка) — следующий очевидный шаг по spec §5: `@astrojs/node` адаптер, `nodemailer`, валидация на сервере, экранирование, `shared/failed/` fallback. На Cloudflare Pages не работает — это статический хост, нужен либо переход на Cloudflare Workers, либо боевой VPS-деплой. Решение пока не принято.
- **Текст `/privacy`** — заглушка. Реальный текст готовит автор (юридическая часть).
- **Аналитика** (Метрика, cookie-баннер, целевые события) — не подключена.
- **RSS, sitemap, robots.txt, schema.org JSON-LD** — не сгенерированы.
- **OG-картинки на сборке** (универсальный шаблон с подставляемым заголовком) — не реализованы.
- **EN-контент** — наполнен только структурно (один пример поста); полное наполнение по триггеру spec §13.3.
- **Unit-тесты на критичные утилиты** (HTML-экранирование, CRLF-санитизация, валидация, slug, время чтения) — не написаны. Появятся вместе с серверной формой.
- **Боевая инфраструктура** (nginx + systemd + certbot + logrotate + DNS + DMARC) — по runbook §2-§9, не начата.

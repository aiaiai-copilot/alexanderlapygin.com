# alexanderlapygin.com

Прототип сайта по [`docs/spec/spec.md`](./docs/spec/spec.md).

## Запуск локально

```bash
npm install
npm run dev
```

Открыть [http://localhost:4321](http://localhost:4321).

## Скрипты

| Команда         | Что делает                                  |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Dev-сервер с горячей перезагрузкой          |
| `npm run build` | Сборка статики в `dist/`                    |
| `npm run preview` | Локальный preview собранной статики       |
| `npm run check` | `astro check` — типы и схемы коллекций      |

## Что в прототипе есть

- Astro 6 + TypeScript (strict) + Tailwind v4. Зависимости пиннятся точно.
- Каркас всех маршрутов из spec §3.1 — RU и EN зеркала: `/`, `/about`, `/projects`, `/projects/{slug}`, `/solutions`, `/blog`, `/blog/{slug}`, `/contact`, `/privacy`, `/404` и `/en/...`.
- Сквозная шапка с навигацией, подвал, мобильное меню (`Escape`, перенос фокуса, авто-закрытие при resize).
- Светлая/тёмная темы, инлайновый `theme-init` в `<head>` без мигания. Выбор сохраняется в `localStorage`.
- Локализация: типизированные словари `src/i18n/{ru,en}.ts`, `lang` на `<html>`, `hreflang` (включая `x-default → RU`), `og:locale[:alternate]`.
- Content collections (`src/content.config.ts`) для `posts`, `projects-client`, `projects-personal`, `projects-saas`, `solutions`. Slug одного материала совпадает между локалями (по spec §6.6).
- Контактная форма: вёрстка по spec §5.1, клиентская валидация, формирование Telegram-deeplink по spec §5.2.

## Чего в прототипе нет (осознанно)

- **Серверный приём формы** — канал доставки — Telegram deeplink (spec §5.2). Возврат к backend-каналу — отложен (spec §13.5).
- **Аналитика и cookie-баннер** — нет. Метрика и иные внешние счётчики не подключаются (decisions §5.4).
- **Эксплуатация** — nginx, systemd, CI/CD. Описаны в [`docs/spec/runbook.md`](./docs/spec/runbook.md).
- **OG-картинки на сборке** — пока не подставляется заголовок.
- **RSS, sitemap, robots.txt, schema.org JSON-LD** — добавляется одной интеграцией каждое.
- **Полный английский контент** — англоязычные словари UI на месте, страниц контента — один пример. Наполнение идёт по триггеру spec §13.3.
- **Unit-тесты** — добавляются вместе с серверной формой (HTML-экранирование, CRLF-санитизация, валидация).

## Структура

```
src/
  components/      Astro-компоненты страниц и сквозных элементов
  content/         Markdown-коллекции, по локалям: posts/{ru,en}/, projects-client/{ru,en}/, ...
  i18n/            Словари UI, типы, утилиты getLocale/t/localizedPath/alternatePath
  layouts/         BaseLayout — head, sidebar shells
  lib/             Чистые утилиты: формат даты, время чтения, slug
  pages/           RU маршруты в корне, EN маршруты в pages/en/
  scripts/         Клиентские скрипты (theme-toggle)
  styles/global.css  Tailwind import + CSS-переменные тем
docs/spec/         spec.md / decisions.md / runbook.md
```

Подробнее — в [`docs/spec/spec.md`](./docs/spec/spec.md).

## Заметки про зависимости

`npm audit` показывает 5 moderate уязвимостей в **devDependencies** transitively (`yaml-language-server` через `@astrojs/check`). В продакшен-бандл это не попадает; чинится либо downgrade `@astrojs/check`, либо ожиданием апстрим-фикса.

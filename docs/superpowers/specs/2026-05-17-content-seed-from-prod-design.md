# Design: контент-трек pre-cutover — seed контента из прод-источника

**Date:** 2026-05-17
**Status:** Approved (юзер подтвердил design в сессии 2026-05-17, brainstorming через `superpowers:brainstorming`)
**Scope:** «Контентный трек» из HANDOFF.md (2026-05-16) — закрыть последний блокер cutover stage→prod, не относящийся к технике (он закрыт спекой `2026-05-16-pre-cutover-technical-track-design.md` и финальным CSP-фиксом `cece042`). Сам cutover stage→prod — отдельная итерация после этого трека.

## Контекст и мотивация

В сессии 2026-05-16 cutover pre-check разделил остаток скоупа на технический + контентный треки. Технический трек закрыт. Контентный остался последним блокером:

1. **`HomePage.astro:79-108` и `:124-144`** — секции «Клиентские проекты» и «Последние публикации» рендерят `[1,2,3].map(...)`-плейсхолдеры с текстом «Пример проекта N» / «Заголовок публикации N». Это уйдёт на прод как есть, если не подключить реальные данные через `getCollection`.
2. **Каталоги почти пусты.** В `src/content/`:
   - `posts/`: 2 RU (`zachem-spec-pered-kodom`, `staticheskiy-sait-i-odna-tochka-ssr`) + 1 EN (`zachem-spec-pered-kodom`).
   - `projects-client/ru/voice-to-spec.md` — единственная карточка, с заглушечным `liveUrl: "https://example.com/voice-to-spec"`.
   - `projects-personal/ru/llm-spec-tools.md` — пустое body (только frontmatter).
   - `projects-saas/ru/scoped-tasks.md` — `comingSoon: true` (ок).
   - `solutions/{ru/spec-trio.md, ru/static-site-with-ssr.md}` — body пустое (короткие frontmatter с features). EN-аналогов нет.
3. **`/portfolio/*` и `/showcase/*`** — рабочие URL'ы прод-React-сайта, на которые ссылаются прод-карточки. После cutover'а они отдадут 404, если не сохранить как legacy через nginx alias.
4. **HomePage hero/sdd/advantages/about** — текущие формулировки stage-сайта (общий «партнёрский» tone) не совпадают с прод-голосом, в котором автор уже узнаваемо подаёт себя (см. `home.hero.tagline`, `home.sdd.*` прод). После cutover'а посетители, помнящие прод, увидят менее персонализированный сайт.

Цели контент-трека:

- Полный mirror прод-контента (Scope C, согласовано в брейншторме) с per-item курацией stage-элементов, которые надо сохранить.
- Replace `[1,2,3].map(...)`-плейсхолдеры реальным `getCollection`-рендером с fallback по дате при недостатке `featured`.
- Подготовить (но **не** активировать) nginx alias на legacy-каталог из backup-тарбола.
- Каждая из 4 фаз — отдельный коммит/PR, ревью-checkpoint между фазами.

Не-цели:

- Сам cutover stage→prod — отдельная итерация после этого трека.
- Defense-in-depth (bind SBP-backend'ов на `127.0.0.1`) — HANDOFF п.3.
- Имплементация технического трека (он уже закрыт `cdaaf6a..HEAD` + `cece042`).
- CI/CD, выпил CF Pages-прототипа — вне MVP-scope.
- Полноценное «второе тело» для прод-проектов (тексты прод-проектов берём как есть; расширение откладывается).

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| Scope контент-mirror'а | **C: full mirror прода** | Прод — канон голоса автора; stage-контент должен поглотить прод-голос, а не наоборот |
| Курация stage-элементов | **Per-item keep/drop**, не «снести всё stage» | На stage есть валидный материал, отсутствующий в проде: статья «Статика по умолчанию», раздел Solutions, мета-информация About |
| Execution-подход | **Фазированный, 4 коммита** | Каждая фаза независимо reverteable; ревью-checkpoint между фазами; phase 1 unlocks тестирование на stage до начала phase 2 |
| `featured` для прод-проектов | **Не существует в схеме `projects-personal`** — featured только в `projects-client` и `posts`; для personal/saas — fallback по `pubDate desc` | Не расширяем схему ради дополнительного поля; HomePage и так считает featured как «hint, не обязательство» |
| Источник списка featured | **Union всех 3 `projects-*` коллекций**, filter на `featured===true` где поле есть, fallback по `pubDate desc` если меньше 3 | Главное — показать активный материал, а не разделить по типу проекта |
| Удалить «5 мин»-микро-копию | **Да** (`HomePage.astro:131-133`) | Поле reading time в схеме `posts` отсутствует; вычислять на главной — over-engineering для 3 карточек |
| `home.heroTagline` | **Новое поле**, добавить в тип | Прод-голос имеет 3-уровневую структуру hero (title/subtitle/tagline), у нас сейчас 2-уровневая |
| `home.philosophy*` → `home.sdd.{title,description}` | **Переименование**, breaking change в `Dictionary` | Соответствует прод-структуре; смысл — `sdd` (AI/Spec-Driven Development) вместо абстрактного «philosophy»; единое имя на 2 локали |
| `about.skills.{frontend,backend,architecture}` (новый prod-shape) vs stage `about.expertise[]` (массив групп) | **Сохранить stage-shape `expertise: { group, items }[]`** | Стейдж-структура общее (произвольное количество групп), прод-shape жёстче (3 фиксированные подключи); миграция в обратную сторону невозможна без потери AI-инструменты + Документация |
| Тексты внутри `expertise` | **Прод-формулировки для frontend/backend/architecture**, stage-формулировки для extra-групп | Прод-голос как канон + stage-расширения сохранены |
| About `timeline` / `education` | **Keep stage-only** | Прод имеет `experience.jobs` (VDI/Rosbank/Т-Bank 2000-2025 + Self-employed 2025-Present), но дизайн-решение брейншторма — сохранить stage'овую структуру (timeline + education отдельно). См. «Открытые вопросы». |
| `home.advantages[]` тексты | **Прод-формулировки** | Прод-голос как канон |
| Stage post `zachem-spec-pered-kodom` (RU+EN) и `staticheskiy-sait-i-odna-tochka-ssr` (RU) | **Keep** | Не дублируют SDD-серию из прода |
| Stage projects: `voice-to-spec`, `llm-spec-tools`, `scoped-tasks` | **Keep** | Тематически валидны; нужны фиксы (см. фазу 1) |
| Stage solutions: `spec-trio`, `static-site-with-ssr` | **Keep** | Раздел Solutions — новая сущность, на проде аналога нет |
| Stage extra-группы expertise: AI-инструменты, Документация | **Keep как stage-only поверх прод-канона** | Дифференцирующая часть позиционирования |
| Prod `saas-dashboard` (vaporware placeholder) | **Drop** | На проде маркирован `isLive: false`, реального наполнения нет |
| URL-стратегия `/portfolio/*` `/showcase/*` | **Keep-alive через nginx alias** на extracted `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` | Сохраняет внешние ссылки и `liveUrl` прод-проектов; alternative «301 на главную» обесценивает прод-карточки |
| OG-image: EN-аналог | **Сделать `og-en.png`** (1200×630, «АЛ» → «AL») | Без него EN-локаль шарится с кириллической картинкой |
| Коммитная стратегия | **4 атомарных коммита**, по одному на фазу; ревью-checkpoint между ними | Каждая фаза отдельно reverteable; ревью-checkpoint снижает риск bulk-merge'а сомнительного контента |

## Архитектура

### Файлы в репо (после трека)

```
src/content/
├── posts/
│   ├── ru/
│   │   ├── zachem-spec-pered-kodom.md             # keep
│   │   ├── staticheskiy-sait-i-odna-tochka-ssr.md # keep
│   │   ├── sdd-intro.md                           # NEW (prod)
│   │   ├── sdd-backstory.md                       # NEW (prod)
│   │   └── sdd-first-experience.md                # NEW (prod)
│   └── en/
│       ├── zachem-spec-pered-kodom.md             # keep
│       ├── sdd-intro.md                           # NEW (prod)
│       ├── sdd-backstory.md                       # NEW (prod)
│       └── sdd-first-experience.md                # NEW (prod)
├── projects-client/
│   └── ru/
│       └── voice-to-spec.md                       # MODIFIED (liveUrl-stub fix)
├── projects-personal/
│   ├── ru/
│   │   ├── llm-spec-tools.md                      # MODIFIED (placeholder body)
│   │   ├── sbp-payments.md                        # NEW (prod)
│   │   └── living-tags-prototype.md               # NEW (prod)
│   └── en/
│       ├── oauth-simplest.md                      # NEW (prod)
│       ├── telegram-bot-messaging.md              # NEW (prod)
│       └── living-tags-prototype.md               # NEW (prod)
├── projects-saas/
│   └── ru/
│       └── scoped-tasks.md                        # keep, unchanged
└── solutions/
    ├── ru/
    │   ├── spec-trio.md                           # keep
    │   └── static-site-with-ssr.md                # keep
    └── en/
        ├── spec-trio.md                           # NEW (skeleton in phase 1, body in open-items)
        └── static-site-with-ssr.md                # NEW (skeleton in phase 1, body in open-items)

src/i18n/
├── types.ts                                       # MODIFIED (+heroTagline; rename philosophy*→sdd; remove philosophy keys)
├── ru.ts                                          # MODIFIED (prod voice for home + about.{description,expertise.frontend/backend/architecture})
└── en.ts                                          # MODIFIED (mirror of ru.ts)

src/components/
└── HomePage.astro                                 # MODIFIED (getCollection rewire; rename dict refs; remove [1,2,3].map; remove «5 мин»)

src/layouts/
└── BaseLayout.astro                               # MODIFIED (locale-conditional og:image)

src/scripts/
└── build-branding-assets.mjs                      # MODIFIED (+og-en.png generation)

src/assets/branding/
├── og.svg                                         # existing
├── og-en.svg                                      # NEW
└── favicon.svg                                    # existing

public/
├── og.png                                         # existing
└── og-en.png                                      # NEW (generated)

deploy/nginx/
└── alexanderlapygin.com.conf                      # MODIFIED (+location ^~ /portfolio/; /showcase/ блок уже есть)
```

### Build artifacts (после `npm run build`)

```
dist/
├── projects/                                      # +5 RU карточек (фактический рендер)
├── en/projects/                                   # +3 EN карточек
├── blog/                                          # +3 RU постов (sdd-серия)
├── en/blog/                                       # +3 EN постов (sdd-серия)
├── en/solutions/                                  # +2 EN solution-карточек
├── og-en.png
├── index.html                                     # без [1,2,3].map плейсхолдеров
└── en/index.html                                  # без [1,2,3].map плейсхолдеров
```

### VPS (cutover-time, не в этом треке)

```
/var/www/alexanderlapygin.com/legacy/
├── index.html                                     # SPA fallback (из html/index.html backup'а)
├── assets/                                        # SPA bundles
├── portfolio/
│   └── living-tags/
│       ├── living-tags-poc/
│       └── living-tags-prototype/
└── showcase/
    ├── oauth/simplest/
    ├── telegram-bot/messaging/
    └── payments/sbp/                              # без backend/.env — фильтровать
```

## Источник прод-контента

Локальный отдельный репо (имеет git-историю, не submodule):

```
~/Projects/mind-section-dev-portfolio-by-lovable/
├── src/data/blogPosts.ts                          # 3 RU + 3 EN SDD-серии (строки 13-98 EN, 197-283 RU)
├── src/data/showcaseProjects.ts                   # 4 showcase: 3 keep + 1 drop (saas-dashboard)
└── src/i18n/locales/{ru,en}.json                  # home/about/portfolio
```

Backup для legacy URL'ов:

```
backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz
```

Уже разведано: содержит `html/index.html` (SPA), `html/showcase/{oauth,telegram-bot,payments}/...` (sub-SPAs), `html/portfolio/living-tags/...` (sub-SPAs). 249 entries.

✅ **Showcase backup-структура проверена:** `/showcase/oauth/simplest/`, `/showcase/telegram-bot/messaging/`, `/showcase/payments/sbp/` — все 3 имеют **prerendered `index.html`** (отдельные sub-SPAs, собранные Vite). SPA-fallback на главный `/legacy/index.html` **не нужен**. Текущий `try_files $uri $uri/index.html =404` (см. `/showcase/` блок в `deploy/nginx/alexanderlapygin.com.conf:114`) обслужит их корректно.

✅ **Portfolio backup-структура:** `/portfolio/living-tags/living-tags-poc/`, `/portfolio/living-tags/living-tags-prototype/` — оба имеют prerendered `index.html`. `/portfolio/coming-soon` — React Router route без prerendered HTML, но из контент-карточек на него не ссылаемся (в проде он использовался только для disabled-карточек `livingTagsMVP`, которые мы dropped).

ℹ️ **`/showcase/` location уже существует** в `deploy/nginx/alexanderlapygin.com.conf:87-115` — добавлен для SBP demo backend ранее. Фаза 4 добавляет **только `/portfolio/`** блок (копией структуры `/showcase/`).

## Маппинг прод-контента → коллекции репо

### Posts (`src/content/posts/{ru,en}/`)

Источник: `mind-section.../src/data/blogPosts.ts`.

Маппинг полей `BlogPost` → frontmatter:

| BlogPost | Frontmatter | Примечание |
|---|---|---|
| `title` | `title` | как есть |
| `excerpt` | `description` | как есть |
| `content` (markdown body) | body (без frontmatter) | как есть; markdown-ссылки `[Next](sdd-backstory)` остаются — Astro их prerenders в относительные пути |
| `date` (`"2025-10-13"`) | `pubDate: 2025-10-13` | как есть |
| `category` (`"SDD"`) | `tags: ["sdd"]` | category → 1-element tags |
| `featured` | `featured` | как есть |
| `language` | `lang` | `'en'`→`en`, `'ru'`→`ru` |
| `readTime` (`"1 min read"`) | **отбрасывается** | нет поля в схеме |
| (новое) | `draft: false` | дефолт |

6 файлов:

- `posts/ru/sdd-intro.md` — featured=true
- `posts/ru/sdd-backstory.md` — featured=true
- `posts/ru/sdd-first-experience.md` — featured=false
- `posts/en/sdd-intro.md` — featured=true
- `posts/en/sdd-backstory.md` — featured=true
- `posts/en/sdd-first-experience.md` — featured=false

### Projects (`src/content/projects-personal/{ru,en}/`)

Источник: `mind-section.../src/data/showcaseProjects.ts`.

Маппинг `ShowcaseProject` → frontmatter `projects-personal`:

| ShowcaseProject | Frontmatter | Примечание |
|---|---|---|
| `title` | `title` | как есть |
| `description` | `description` | как есть |
| `technologies` | `stack` | rename |
| `showcasePath` | `liveUrl` | абсолютная URL: `https://alexanderlapygin.com${showcasePath}` |
| `image` (assets/ref) | **отбрасывается** в фазе 1 | image-pipeline вне scope; в схеме `optional` |
| `id` | filename (`<id>.md`) | |
| `category` | **отбрасывается** | нет поля в схеме |
| `features` | **отбрасывается** | нет поля в схеме `projects-personal` (есть в `client`) |
| `isLive` | если `false` — drop project (case: saas-dashboard) | |
| (новое) | `pubDate` | заглушка `2025-10-01` (дата запуска прода); единое значение для всех 4-х, отсортировать tie-break'ом по filename |
| (новое) | `lang` | вычисляется из текста описания: RU description → `lang: ru`, EN → `lang: en` |

ℹ️ **`liveUrl` в `projects-personal` — `optional`**, но если задан — `z.string().url()` требует абсолютный URL с протоколом. Захардкоживаем `https://alexanderlapygin.com${showcasePath}` (без trailing-slash normalization). Для `projects-client` (voice-to-spec) — `liveUrl` **обязательно**.

3 keep-проекта + drop saas-dashboard:

- `projects-personal/en/oauth-simplest.md` (EN description в проде) — `liveUrl: https://alexanderlapygin.com/showcase/oauth/simplest/`
- `projects-personal/en/telegram-bot-messaging.md` (EN) — `liveUrl: https://alexanderlapygin.com/showcase/telegram-bot/messaging/`
- `projects-personal/ru/sbp-payments.md` (RU) — `liveUrl: https://alexanderlapygin.com/showcase/payments/sbp/`

Дополнительно из `portfolio.projects.livingTagsPrototype` (prod i18n RU+EN, обе локали):

- `projects-personal/ru/living-tags-prototype.md` — `liveUrl: https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/`
- `projects-personal/en/living-tags-prototype.md` — тот же `liveUrl`

`livingTagsPoC` отбрасываем — в исходнике он закомментирован в `Portfolio.tsx:19-20`, current; код-канон считает его dropped. `livingTagsMVP` — `metrics.status: "Скоро"` — vaporware placeholder, drop как saas-dashboard.

Single-locale ситуации (по дефолту берём прод как есть):

- `oauth-simplest`: EN-only на проде → создаём только `en/oauth-simplest.md`. Открытый элемент (см. Section 7): RU-перевод.
- `telegram-bot-messaging`: EN-only → создаём только `en/`. Открытый элемент: RU.
- `sbp-payments`: RU-only → создаём только `ru/`. Открытый элемент: EN.
- `living-tags-prototype`: prod i18n даёт обе локали → создаём обе.

### Solutions EN-skeletons (`src/content/solutions/en/`)

Прод-аналога нет. Создаём только frontmatter (skeleton). Body — open-item.

```yaml
---
title: "..."        # из en.ts solutions translations
description: "..."  # английский аналог description из ru-файла
category: "Documentation" / "Architecture"
order: <тот же что в ru>
features:
  - "..."           # 4 переведённые fields из ru-файла
lang: en
---
```

2 файла: `en/spec-trio.md`, `en/static-site-with-ssr.md`.

### Stage stubs fix

`projects-client/ru/voice-to-spec.md`: текущий `liveUrl: "https://example.com/voice-to-spec"` — заменить на `liveUrl: "https://example.com/voice-to-spec-tbd"` (TBD-маркер, чтобы было видно, что заглушка не реальная). Альтернатива: убрать поле и поставить `phase: "Internal"` — нельзя, схема требует `z.string().url()` без `.optional()`. **Открытый элемент**: реальный `liveUrl` — авторская работа.

`projects-personal/ru/llm-spec-tools.md`: добавить placeholder body 1-2 абзаца (общая формулировка про CLI-утилиты SDD), чтобы карточка детальной страницы не была пустой. **Открытый элемент**: полное содержательное body — авторская работа.

## Фаза 1 — Seed collections

**Scope:** только `.md` файлы, никаких code/schema/i18n изменений.

**Деятельность:**

- Создать 6 SDD-постов (RU+EN по 3): копирование `content` field из `blogPosts.ts` в body, frontmatter — по маппингу выше.
- Создать 5 personal-проектов (3 EN: oauth, telegram, living-tags + 1 RU: sbp; +1 RU: living-tags).
- Fix `voice-to-spec.md` liveUrl заглушки → TBD-маркер.
- Fix `llm-spec-tools.md` body placeholder.
- Создать 2 EN solutions skeletons (только frontmatter).

**Acceptance:**

- `npm run check` — 0 ошибок, 0 предупреждений (schema-валидация контента).
- `npm run build` — успешный билд без warnings.
- Локально `npm run dev` рендерит:
  - `/projects` (RU) — карточки: 1 client (voice-to-spec) + 1 personal (llm-spec-tools) + 1 personal (sbp-payments) + 1 personal (living-tags-prototype) + 1 saas (scoped-tasks) = 5 карточек.
  - `/en/projects` (EN) — 3 карточки: oauth-simplest, telegram-bot-messaging, living-tags-prototype.
  - `/blog` (RU) — 5 карточек: zachem + staticheskiy + 3 SDD.
  - `/en/blog` (EN) — 4 карточки: zachem + 3 SDD.
  - `/solutions` (RU) — 2 карточки (без изменений).
  - `/en/solutions` (EN) — 2 карточки (новые skeletons).
- `/blog/sdd-intro` (RU) и `/en/blog/sdd-intro` — рендерятся, body не пустой.

**Коммит:** `feat(content): seed posts and personal projects from prod source`.

## Фаза 2 — i18n + About (прод-голос)

**Scope:** правки `src/i18n/{ru,en}.ts` + `src/i18n/types.ts` + минимальный refactor `HomePage.astro` под новые ключи (без подключения коллекций — это фаза 3).

**Изменения типа `Dictionary` (`types.ts`):**

```ts
home: {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;        // NEW
  sdd: {                      // NEW (renamed from philosophy*)
    title: string;
    description: string;
  };
  // удалить: philosophyTitle, philosophyBody
  advantagesTitle: string;
  advantages: { title: string; body: string }[];  // тексты переписываются на прод
  ...
};
about: {
  title: string;
  approachTitle: string;       // keep
  approachBody: string[];      // MODIFIED: переписать первый параграф на прод-биографию
  expertiseTitle: string;      // keep ("Техническая экспертиза" / "Technical expertise")
  expertise: { group: string; items: string[] }[];  // тексты frontend/backend/architecture переписываются на прод
  timelineTitle: string;       // keep
  timeline: ...;               // keep stage значения
  educationTitle: string;      // keep
  education: ...;              // keep stage значения
  cta: string;                 // keep
};
```

**Тексты — RU (`ru.ts`):**

```ts
home: {
  heroTitle: "Александр Лапыгин",
  heroSubtitle: "Разработка Web-приложений",
  heroTagline: "От идей до работающих решений.\nПроекты, готовые к дальнейшему развитию людьми и AI-агентами.",  // \n вместо <br/> — рендерим через CSS white-space: pre-line или splittext
  sdd: {
    title: "AI- и Spec-Driven Development",
    description: "В основе любого этапа разработки лежит детальная спецификация — исходник для AI и ориентир для людей. Это гарантирует точность реализации, актуальность и полноту документации на всех этапах жизненного цикла продукта.",
  },
  advantagesTitle: "Что вы получаете",   // keep stage
  advantages: [
    { title: "Технический партнер", body: "Поддержка полного цикла разработки: от анализа требований и дизайна архитектуры до написания кода и настройки серверов." },
    { title: "Прозрачность", body: "Прогресс в реальном времени: регулярные демо-версии, понятные отчеты, никаких «черных ящиков»." },
    { title: "Полный контроль над проектом", body: "Отсутствие зависимости от одного разработчика. Вы получаете полностью отчуждаемый код и инфраструктуру, которыми владеете на 100%." },
    { title: "AI-ready архитектура", body: "Документация, архитектура и промпты оптимизированы для лёгкого онбординга новых сотрудников и быстрого развития проекта с помощью AI-инструментов." },
  ],
  // оставляем как есть: featuredProjectsTitle, featuredProjectsLink, latestPostsTitle, latestPostsLink, cta
}
```

```ts
about: {
  title: "О себе",
  approachTitle: "О подходе",
  approachBody: [
    "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.",
    "Использование современных AI-инструментов позволяет ускоряться без потери качества. Любая команда или AI смогут продолжить разработку на любом этапе.",
    // 3-й абзац stage'а («Если задача не ваша…») — keep
    "Если задача не ваша — скажу прямо и порекомендую коллег.",
  ],
  expertiseTitle: "Техническая экспертиза",
  expertise: [
    { group: "Frontend", items: ["TypeScript", "JavaScript", "React", "и др."] },
    { group: "Backend", items: ["Node.js", "TypeScript", "Java/Kotlin", "PostgreSQL", "Supabase", "Redis", "и др."] },
    { group: "Архитектура", items: ["Чистая архитектура", "Feature-Sliced Design", "Serverless", "и др."] },
    // keep stage: AI-инструменты, Документация
    { group: "AI-инструменты", items: ["Интеграция LLM в продукт", "Документация для ассистентов", "Voice-to-spec пайплайны"] },
    { group: "Документация", items: ["Технические спецификации", "Runbook'и эксплуатации", "Журналы решений"] },
  ],
  // keep stage: timelineTitle, timeline (2 jobs), educationTitle, education, cta
}
```

**Тексты — EN (`en.ts`):** строго симметричный mirror RU (текст прода `en.json`):

- `home.heroTitle: "Alexander Lapygin"`
- `home.heroSubtitle: "Web Application Development"`
- `home.heroTagline: "Sustainable code. Clear architecture.\nDocumentation that works — for people and tools"`
- `home.sdd.{title,description}` — прод EN
- `home.advantages[]` — прод EN (Technical Partner / Transparency / No Vendor Lock-in / AI-ready Architecture). Заголовок 3-го элемента в проде — «No Vendor Lock-in», в стейдже — «Project ownership stays with you». Берём прод.
- `about.approachBody` — прод EN биография («Web applications built to last…»)
- `about.expertise[]` — прод EN формулировки для frontend/backend/architecture

**`HomePage.astro` refactor (только переименования ключей, не подключение коллекций):**

- `dict.home.philosophyTitle` → `dict.home.sdd.title`
- `dict.home.philosophyBody` → `dict.home.sdd.description`
- Под heroSubtitle добавить `<p>{dict.home.heroTagline}</p>` с CSS `white-space: pre-line` для рендера `\n`.

Карточки `[1,2,3].map(...)` и Latest Posts остаются плейсхолдерами на этой фазе — их закрывает фаза 3.

**Acceptance:**

- `npm run check` — 0/0 (типы соответствуют новой схеме).
- `npm run build` — успешный билд.
- `/` (RU) рендерит: «Александр Лапыгин», «Разработка Web-приложений», новый tagline, новые advantages.
- `/en/` рендерит EN-аналог.
- `/about` (RU) — секция Approach показывает прод-биографию, expertise начинается с Frontend/TypeScript/JavaScript/React.
- `/en/about` — EN-аналог.

**Коммит:** `feat(i18n): rewrite home and about to prod voice, add hero tagline`.

## Фаза 3 — HomePage rewire (replace placeholders)

**Scope:** заменить `[1,2,3].map(...)`-плейсхолдеры в `HomePage.astro` реальным `getCollection`-рендером + удалить «5 мин»-микро-копию + удалить hardcoded tag-chips.

**Изменения `HomePage.astro`:**

```astro
---
import { getCollection } from "astro:content";
import { localizedPath, t, type Locale } from "~/i18n";
import { pageSlug } from "~/lib/slug";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const dict = t(locale);

// Featured projects = union of client+personal+saas, filter by lang
// 1) collect entries with featured===true (только client/posts имеют featured в схеме);
// 2) fallback по pubDate desc если меньше 3.

const clientProjects = await getCollection("projects-client", (e) => e.data.lang === locale);
const personalProjects = await getCollection("projects-personal", (e) => e.data.lang === locale);
const saasProjects = await getCollection("projects-saas", (e) => e.data.lang === locale);

const allProjects = [
  ...clientProjects.map((e) => ({ entry: e, type: "client", featured: e.data.featured ?? false })),
  ...personalProjects.map((e) => ({ entry: e, type: "personal", featured: false })),
  ...saasProjects.map((e) => ({ entry: e, type: "saas", featured: false })),
];

const featuredFirst = allProjects.filter((p) => p.featured);
const rest = allProjects
  .filter((p) => !p.featured)
  .sort((a, b) => b.entry.data.pubDate.getTime() - a.entry.data.pubDate.getTime());
const featuredProjects = [...featuredFirst, ...rest].slice(0, 3);

// Latest posts = filter !draft && lang === locale, sort by pubDate desc, slice(0,3)
const posts = (
  await getCollection("posts", (e) => e.data.lang === locale && !e.data.draft)
).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()).slice(0, 3);

function projectHref(entry: typeof allProjects[number]) {
  const slug = pageSlug(entry.entry.id);
  return localizedPath(locale, `/projects/${slug}`);
}

function postHref(entry: typeof posts[number]) {
  const slug = pageSlug(entry.id);
  return localizedPath(locale, `/blog/${slug}`);
}

function projectKindLabel(type: "client" | "personal" | "saas") {
  if (type === "client") return dict.projects.clientHeading;
  if (type === "personal") return dict.projects.personalHeading;
  return dict.projects.saasHeading;
}
---

<!-- Featured Projects section -->
{featuredProjects.length > 0 && (
  <section ...>
    ...
    <div class="grid md:grid-cols-3 gap-4 md:gap-6">
      {featuredProjects.map((p) => (
        <a href={projectHref(p)} class="rounded-lg p-5 border h-full block ...">
          <div class="text-xs uppercase tracking-wider mb-2 ...">
            {projectKindLabel(p.type as "client" | "personal" | "saas")}
          </div>
          <h3>{p.entry.data.title}</h3>
          <p>{p.entry.data.description}</p>
          <div class="flex flex-wrap gap-1.5">
            {p.entry.data.stack.slice(0, 3).map((tech) => (
              <span ...>{tech}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </section>
)}

<!-- Latest Posts section -->
{posts.length > 0 && (
  <section ...>
    ...
    <div class="grid md:grid-cols-3 gap-4 md:gap-6">
      {posts.map((post) => (
        <a href={postHref(post)} class="...">
          <div class="text-xs mb-2 ...">
            {post.data.pubDate.toISOString().slice(0, 10)}
            <!-- БЕЗ «5 мин»: поля нет в схеме -->
          </div>
          <h3>{post.data.title}</h3>
          <p>{post.data.description}</p>
        </a>
      ))}
    </div>
  </section>
)}
```

**Поведение пустых коллекций:** если `featuredProjects.length === 0` — секция Featured Projects не рендерится. Аналогично для Latest Posts. На текущем seed'е это не сработает (после фазы 1 у нас уже достаточно карточек и постов).

**Acceptance:**

- `npm run check` — 0/0.
- `npm run build` — успешный билд.
- В сборке `dist/index.html` и `dist/en/index.html` нет строк:
  - `"Пример проекта 1"`, `"Пример проекта 2"`, `"Пример проекта 3"` (RU placeholders)
  - `"Sample project 1"`, `"Sample project 2"`, `"Sample project 3"` (EN placeholders)
  - `"Заголовок публикации 1"`, `"Sample post title 1"` (post placeholders)
  - `"5 мин"`, `"5 min"` (reading time микро-копия)
- В сборке `dist/index.html` присутствует «Voice-to-spec пайплайн» (текущая featured-карточка), «Зачем спецификация перед кодом».

**Проверочные команды:**

```bash
grep -c "Пример проекта\|Sample project\|Заголовок публикации\|Sample post title" dist/index.html dist/en/index.html
# Ожидание: 0:0
grep -c "Voice-to-spec\|spec-trio\|sdd-intro" dist/index.html dist/en/index.html
# Ожидание: > 0
```

**Коммит:** `feat(home): rewire featured projects and latest posts to content collections`.

## Фаза 4 — og-en + nginx alias prep

**Scope:** EN OG-image + nginx-конфиг alias'ов для legacy URL'ов. **Активация alias'ов на проде происходит атомарно с cutover'ом**, не в этой фазе.

### og-en pipeline

**Файлы:**

- `src/assets/branding/og-en.svg` — EN-аналог `og.svg`. Различия:
  - Инициалы «АЛ» → «AL».
  - Любой кириллический текст (например, «Александр Лапыгин») → «Alexander Lapygin».
  - Любые subtitle/tag-строки на русском → EN.

- `src/scripts/build-branding-assets.mjs` extend:
  - Прочитать `og-en.svg` → resvg → `public/og-en.png` (1200×630).

**BaseLayout.astro изменения:**

```astro
const ogImagePath = locale === "en" ? "/og-en.png" : "/og.png";
...
<meta property="og:image" content={new URL(ogImagePath, Astro.site).toString()} />
<meta property="og:image:alt" content={dict.meta.siteAuthor} />
```

`width`/`height`/`twitter:card` без изменений.

**Запуск pipeline:** вручную (`node src/scripts/build-branding-assets.mjs`), результат `public/og-en.png` коммитится.

### nginx alias

**`deploy/nginx/alexanderlapygin.com.conf` — добавить блок `location ^~ /portfolio/` внутри `server { listen 443 ssl http2; server_name alexanderlapygin.com; }` (рядом с существующим `/showcase/`).**

Структура — копия существующего `/showcase/` блока (lines 87-115), но с `legacy/portfolio/` вместо `legacy/showcase/` и без backend-exclusion (в portfolio нет server-side компонентов):

```nginx
# Legacy React SPA portfolio (preserved from pre-2026-05-15 prod).
# Living-tags poc/prototype — отдельные prerendered Vite-SPAs (свой index.html + assets/).
location ^~ /portfolio/ {
    root /var/www/alexanderlapygin.com/legacy;
    include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
    add_header Cache-Control "no-cache" always;

    # Vite-ассеты с хешем (immutable, content-addressed).
    location ~* "/assets/.+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|svg|png|jpe?g|webp|ico)$" {
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location ~ \.html$ {
        include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
        add_header Cache-Control "no-cache" always;
    }

    try_files $uri $uri/index.html =404;
}
```

**`/showcase/` блок не трогаем** — он уже есть в `alexanderlapygin.com.conf:87-115`, обслуживает SBP demo. После cutover'а тот же конфиг покроет oauth/simplest и telegram-bot/messaging при условии extracted `/var/www/.../legacy/showcase/{oauth,telegram-bot}/`.

⚠️ **Live-проверка nginx-конфига** — на cutover'е (отдельная итерация). В этой фазе только статика конфига коммитится; `nginx -t` на VPS — отдельный шаг cutover-runbook'а.

**Acceptance (статика, без live-проверки):**

- `npm run check` — 0/0.
- `npm run build` — успешный билд.
- `dist/og-en.png` существует, 1200×630.
- `dist/index.html` — `og:image content="https://alexanderlapygin.com/og.png"`.
- `dist/en/index.html` — `og:image content="https://alexanderlapygin.com/og-en.png"`.
- `nginx -t` синтаксис-проверка nginx-конфига в `deploy/nginx/`:
  ```bash
  # На локалке — символический тест: проверка синтаксиса через docker если доступен,
  # иначе — визуальный review + проверка на VPS перед cutover'ом.
  ```

**Коммит:** `feat(branding,deploy): add EN og:image and nginx aliases for legacy URLs`.

## Секция 5 — Verification & deploy

### После каждой фазы (контрольная точка)

1. `npm run check` — 0/0.
2. `npm run build` — успешный билд.
3. Локально `npm run dev` + просмотр изменённых страниц.
4. Self-review diff'а.
5. User-review (ревью-checkpoint между фазами).

### После всех 4 фаз — redeploy stage

Через тот же механизм, что использовался для текущего релиза `stage-releases/20260516T221717Z`:

- `npm run build` → upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<TS>/`.
- Atomic switch `stage-html` симлинка на новый релиз.
- Точный механизм см. в `2026-05-16-stage-subdomain-design.md` и memory `staging-architecture`.

### Smoke-проверки stage (после redeploy)

```bash
# Существование ключевых URL'ов:
for url in \
  https://stage.alexanderlapygin.com/ \
  https://stage.alexanderlapygin.com/en/ \
  https://stage.alexanderlapygin.com/projects \
  https://stage.alexanderlapygin.com/en/projects \
  https://stage.alexanderlapygin.com/blog \
  https://stage.alexanderlapygin.com/en/blog \
  https://stage.alexanderlapygin.com/blog/sdd-intro \
  https://stage.alexanderlapygin.com/en/blog/sdd-intro \
  https://stage.alexanderlapygin.com/solutions \
  https://stage.alexanderlapygin.com/en/solutions \
  https://stage.alexanderlapygin.com/about \
  https://stage.alexanderlapygin.com/en/about \
  https://stage.alexanderlapygin.com/og-en.png; do
  echo "=== $url"
  curl -sSI "$url" | head -1
done
```

Ожидание: все `HTTP/2 200`.

Content-проверки:

```bash
# Главная не содержит placeholder'ов:
curl -s https://stage.alexanderlapygin.com/ | grep -c "Пример проекта\|Заголовок публикации\|5 мин"
curl -s https://stage.alexanderlapygin.com/en/ | grep -c "Sample project\|Sample post title\|5 min"
# Ожидание: 0 для обоих

# OG-image — locale-conditional:
curl -s https://stage.alexanderlapygin.com/ | grep "og:image"
curl -s https://stage.alexanderlapygin.com/en/ | grep "og:image"
# Ожидание: /og.png для RU, /og-en.png для EN
```

### Не-в-этом-треке проверки

- Live-проверка nginx alias'ов на проде — на cutover'е.
- Backup-extraction в `/var/www/alexanderlapygin.com/legacy/` — на cutover'е.

## Секция 6 — Коммитная стратегия

```
1. feat(content): seed posts and personal projects from prod source
   - src/content/posts/{ru,en}/sdd-{intro,backstory,first-experience}.md: NEW (6 файлов)
   - src/content/projects-personal/{ru,en}/<5 files>.md: NEW
   - src/content/projects-client/ru/voice-to-spec.md: MODIFIED (TBD-маркер в liveUrl)
   - src/content/projects-personal/ru/llm-spec-tools.md: MODIFIED (placeholder body)
   - src/content/solutions/en/{spec-trio,static-site-with-ssr}.md: NEW (skeletons)

2. feat(i18n): rewrite home and about to prod voice, add hero tagline
   - src/i18n/types.ts: rename philosophy*→sdd, +heroTagline
   - src/i18n/ru.ts: home rewrite, about.approachBody rewrite, expertise frontend/backend/arch rewrite
   - src/i18n/en.ts: mirror EN
   - src/components/HomePage.astro: rename dict refs, +heroTagline render

3. feat(home): rewire featured projects and latest posts to content collections
   - src/components/HomePage.astro: replace [1,2,3].map with getCollection,
                                    remove «5 мин» микро-копия,
                                    remove hardcoded tag chips

4. feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio
   - src/assets/branding/og-en.svg: NEW
   - public/og-en.png: NEW (generated)
   - src/scripts/build-branding-assets.mjs: +og-en pipeline
   - src/layouts/BaseLayout.astro: locale-conditional og:image
   - deploy/nginx/alexanderlapygin.com.conf: +location ^~ /portfolio/
```

Каждый коммит независимо reverteable; ни один не ломает `npm run check`/`npm run build` по отдельности.

## Секция 7 — Открытые элементы (требуют авторской работы)

**Не блокируют коммиты фаз 1-4, но блокируют cutover stage→prod.** Закрываются отдельной авторской сессией.

1. **`voice-to-spec.md`** — реальный `liveUrl` (заменить `example.com/voice-to-spec-tbd`).
2. **`llm-spec-tools.md`** — содержательное body (1-2 абзаца про реальную утилиту, заменить placeholder).
3. **EN-переводы single-locale showcase'ов:**
   - `projects-personal/ru/oauth-simplest.md` — RU-описание для EN-only `oauth-simplest`.
   - `projects-personal/ru/telegram-bot-messaging.md` — RU.
   - `projects-personal/en/sbp-payments.md` — EN.
4. **Body для EN-solutions:**
   - `solutions/en/spec-trio.md` — body 2-4 параграфа.
   - `solutions/en/static-site-with-ssr.md` — body 2-4 параграфа.
5. **VPS legacy/-prep** (на cutover'е, не сейчас):
   - Extraction `backups/alexanderlapygin.com-pre-cutover-20260515T204033Z.tar.gz` в `/var/www/alexanderlapygin.com/legacy/`.
   - Удалить `legacy/showcase/payments/sbp/backend/.env` (sensitive data в публичном пути).
   - Финализировать `try_files`-семантику в nginx-конфиге под фактическую структуру.
6. **`og-en.svg` дизайн** — нарисовать руками. Без него EN-локаль шарится с кириллической картинкой `og.png` (косметический регресс, не блокер cutover'а).

## Открытые вопросы

**Q1: About-timeline — keep stage или взять прод?**

Дизайн брейншторма зафиксировал «keep stage-only» для timeline и education. Но прод имеет более конкретные данные (VDI/Rosbank/Т-Bank 2000-2025, Self-employed 2025-Present), stage имеет generic-formulations (2018-2023 «Senior Engineer / Tech Lead» без названия компании).

Возможные варианты решения:
- **Стейдж (как сейчас в design'е)** — нейтральнее, меньше NDA-проблем с банками.
- **Прод** — конкретнее, ближе к реальной биографии.
- **Гибрид** — взять рамки прода (период 2000-2025 для VDI+банки, 2025-present), но без раскрытия названий банков.

**Действие:** подтвердить выбор перед началом фазы 2. Если меняется на прод/гибрид — обновить раздел «Тексты — RU» в этой спеке.

**Q2: `home.heroTagline` рендер `<br />`-разрывов**

Прод-источник содержит `<br />` в tagline:
> `"От идей до работающих решений.<br />Проекты, готовые к дальнейшему развитию<br /> людьми и AI-агентами."`

Stage-сайт строит i18n как plain string без HTML-инъекций (см. all other strings в `ru.ts`). Замена `<br/>` на `\n` + CSS `white-space: pre-line` сохраняет визуальный разрыв без HTML-инъекции. Альтернатива — `set:html` в Astro-шаблоне с risks XSS.

**Действие:** подтвердить выбор `\n` + CSS. Если автор хочет точный прод-рендер с тонкими HTML-`<br/>` — отдельный паттерн через `Fragment` + `set:html` под санитизацию (over-engineering для одной строки).

**Q3: Featured-стратегия для personal-проектов**

Схема `projects-personal` не имеет `featured` поля. Расширять схему ради дополнительного управления на главной — over-engineering. Текущий design: fallback по `pubDate desc` если меньше 3 featured-карточек из client'а. Достаточно ли этого для контроля порядка карточек на главной?

**Действие:** оставить как есть; пересмотреть если станет неудобно после первого редактирования контента.

## Out of scope

- Сам cutover stage→prod (после контент-трека — отдельная итерация).
- Defense-in-depth: bind SBP-backend'ов на `127.0.0.1` (HANDOFF.md п.3).
- Per-page og:image автогенерация (satori + resvg).
- Image-pipeline для проектных карточек (поле `image` в схеме).
- Backfill `image` для прод-проектов.
- CI/CD (push в `main` → stage deploy).
- Выпил CF Pages-прототипа.
- Cleanup `.wrangler/`.
- Перенос `readTime` в схему `posts` и его автовычисление.
- Image-conversion для `og.svg`/`og-en.svg` через CI вместо ручного запуска.
- Полные body для `voice-to-spec`/`llm-spec-tools` (открытые элементы § 7).

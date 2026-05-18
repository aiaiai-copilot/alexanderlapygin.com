# Design: /projects — выравнивание stage с прод-вариантом

**Date:** 2026-05-18
**Status:** Approved (юзер подтвердил решения в брэйншторме `superpowers:brainstorming`, сессия 2026-05-18, 15-я)
**Scope:** Переработка содержимого и визуала страницы `/projects` на stage, чтобы приблизить её к текущему прод-сайту (`alexanderlapygin.com/portfolio`, статический React-сборка от Lovable). Часть более широкой задачи "подтянуть stage к проду перед cutover'ом" — следующие страницы (`/solutions`, `/blog`, `/contact`, `/faq`) идут отдельными спеками.

## Контекст и мотивация

Ближайшая цель — cutover stage→prod (HANDOFF.md, п.3 общего блока «что осталось недоделанным»). По итогам сессии 2026-05-17 главная (`c3def4a`) и `/about` (`732db83` + `1683846` + `4f1bd6b`) уже выравнены. Следующая в очереди — `/projects`.

Текущий stage `/projects` (`src/components/ProjectsCatalog.astro` + `src/i18n/{ru,en}.ts:projects`) построен в Phase 3 контент-трека (`25ef234`, kind-aware project links): hero (H1 + subtitle) → 3 секции (`projects-client`, `projects-personal`, `projects-saas`) с одинаковой плиточной разметкой `md:grid-cols-2 lg:grid-cols-3`, карточка кликабельна целиком. Текущее наполнение коллекций (после удаления placeholder'ов `voice-to-spec`/`llm-spec-tools` в `ddae486`):

- `projects-client/` — директория отсутствует, коллекция пустая → секция «Клиентские проекты» не рендерится.
- `projects-personal/en/` — `oauth-simplest.md`, `telegram-bot-messaging.md` (mis-classification: это типовые решения, дубли `solutions/{ru,en}/oauth-simplest.md` и `telegram-gateway.md` с теми же `demoUrl`).
- `projects-saas/{ru,en}/` — по одному `living-tags-prototype.md`.

Прод `/portfolio` извлечён из бандла `Portfolio-Dk-oEsFm.js` (структура) + `index-x1YQXxU-.js` (i18n-объекты `_E` для EN, `BE` для RU, имена бандл-минифицированные — реальные ключи на проде доступны через `dict.projects.*`). Прод-структура `/portfolio`: 2 секции — «Сайты-портфолио» (1 self-reference карточка) + «SaaS» (2 карточки: Living Tags Prototype + Living Tags MVP coming-soon). Карточка прода inline-богатая: title + description + tech-pills (все элементы stack) + Key Features grid (2col, чекмарки) + Project Metrics grid (4col phase/type/access/status) + кнопки Code/Live Demo. Сетка карточек на проде — `md:grid-cols-2`.

Цель спеки:

- Привести структуру и содержимое `/projects` к прод-варианту в части SaaS-секции (это единственная секция, попадающая на stage из прод-структуры).
- Расширить карточку features-блоком и кнопочной строкой (Hybrid layout, см. ниже).
- Очистить mis-classified `projects-personal/en/*` (дубли solutions).
- Добавить i18n-ключи для новых элементов карточки.

Не-цели:

- Cutover stage→prod (отдельная итерация после redeploy'а stage с этими изменениями).
- Выравнивание других страниц (`/solutions`, `/blog`, `/contact`, `/faq`) — отдельные спеки/итерации.
- Self-reference карточка на сам сайт (прод-секция «Сайты-портфолио» опускается полностью — явное решение пользователя).
- Project Metrics grid (phase/type/access/status) — отброшено в брэйншторме как шумное при пустой инфе.
- Удаление коллекций `projects-client`/`projects-personal` или консолидация в одну — решено оставить все 3 (явное решение пользователя — гибкость на будущее).
- Удаление dead-route'ов `/projects/[slug].astro` + `/en/projects/[slug].astro` + `ProjectPage.astro` — оставляем (привязаны к `projects-client`, генерируют 0 страниц сейчас, оживают если добавится client-проект).
- Подключение библиотеки иконок (`lucide-react` и т.п.) — inline-SVG, как в `/about`.
- Изображения карточек (`image` поле) — не разбираем в этой спеке, остаётся off.
- Починка прод-бага «Key Features» латиницей в RU-локали (на проде в RU-версии секция называется английским словосочетанием) — в нашей версии будет правильно локализовано через i18n.

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| Глобальный подход | **Hybrid** (вариант B из брэйншторма): прод-структура SaaS-секции + наш существующий hero + features-блок + кнопки | Прод-структура минус metrics-grid (отброшено) и минус self-reference (отброшено). Стиль и переменные — наши |
| Коллекции | **Оставить все 3** (`projects-client`/`projects-personal`/`projects-saas`) в `content.config.ts` | Явное решение пользователя — гибкость на будущее |
| Mis-classified в `projects-personal/en/` | **Удалить** `oauth-simplest.md`, `telegram-bot-messaging.md` | Дубли `solutions/{ru,en}/oauth-simplest.md` и `telegram-gateway.md` (тот же `demoUrl`); их место — `/solutions`, не `/projects` |
| Self-reference карточка на сам сайт | **НЕ добавляем** | Явное решение пользователя: «Нет, без self-reference». Соответственно прод-секция «Сайты-портфолио» опускается полностью |
| Project Metrics grid (phase/type/access/status) | **НЕ берём** | Отброшено в брэйншторме как шумное при пустой инфе. Поля схемы `projectClient` (`phase`/`type`/`access`/`status`) — не трогаем, они унаследованы из Phase 1 и могут пригодиться client-проектам потом |
| `longDescription` / featured-логика | **НЕ берём** | Отброшено в брэйншторме |
| Features-блок в карточке | **Добавляем** для `projects-saas` (через новое поле `features` в схеме) | Прод-стандарт; даёт inline-богатую карточку без detail-страницы |
| Поле `features` в схеме `projectSaas` | `z.array(z.string()).default([])` | Симметрия со схемой `projectClient.features` и `solution.features` (которые уже так типизированы) |
| Living Tags MVP | **Создать новый** `projects-saas/{ru,en}/living-tags-mvp.md` с `comingSoon: true` | Прод-структура SaaS-секции — 2 карточки, MVP — coming-soon заглушка |
| Living Tags Prototype | **Расширить** существующий `projects-saas/{ru,en}/living-tags-prototype.md` полем `features` | Совпадение с прод-карточкой |
| Stack pills | **Все элементы `stack`** (без `slice(0, 4)`) | Прод-стандарт; у обоих SaaS-проектов стек ровно 4 элемента, разницы при текущем контенте нет, но семантически правильнее |
| Карточка кликабельна целиком? | **Нет** — только через кнопки Код / Демо | Прод-стандарт; кликабельность всей карточки конфликтует с двумя отдельными CTA |
| Сетка карточек | `md:grid-cols-2 lg:grid-cols-3` → **`md:grid-cols-2`** | Прод-стандарт; при наличии features-блока 3 колонки слишком тесно |
| Coming-soon стилизация | бейдж «Скоро» (правый верх, sm pill) + `opacity: 0.7` + `cursor: not-allowed` + **кнопки Код/Демо скрыты целиком** | Прод-стандарт; в placeholder нет смысла кликать |
| Иконки в карточке | **Inline-SVG** (чекмарк для features, GitHub для Код, ExternalLink-стрелка для Демо) | Зависимостей не добавляем; стиль как в существующем `personalProjects` блоке (там уже inline-SVG стрелка) |
| Стилевая база | CSS-переменные дизайн-системы (`--color-text`, `--color-text-muted`, `--color-bg-elev`, `--color-border`, `--color-accent`) | Единый стиль с остальным сайтом |
| Локальный рендер | Карточка остаётся **inline** в `ProjectsCatalog.astro`, без отдельного компонента | Минимальный объём изменений; вынесение в компонент — преждевременное обобщение при 1 типе карточки |
| Тип `Dictionary.projects` | Добавить ключи `featuresHeading`, `codeLink`, `demoLink`; изменить значения `saasHeading` (RU only) и `comingSoon` (RU only) | Структура отражает финальный layout |
| Существующие ключи `repoLink`/`open`/`code` | **Не трогаем** | `open` и `code` используются в `ProjectPage.astro` (dead route, но live ключи). `repoLink` фактически нигде не используется (см. открытые вопросы), но HANDOFF предписывает не трогать |
| Тестирование | Юнит-тестов компонент не имеет; `npm run check` + `npm run build` + `npm run dev` визуальная проверка + stage smoke после redeploy | Astro-компонент без логики, классический smoke достаточен |

## Технические решения (детали маппинга)

### Структура карточки (псевдокод)

```jsx
<article class="card">
  <header>
    <h3 class="card-title">{title}</h3>
    {comingSoon && <span class="badge">Скоро / Coming Soon</span>}
  </header>
  <p class="card-description">{description}</p>
  <div class="stack-pills">{stack.map(tag => <span class="pill">{tag}</span>)}</div>
  {features.length > 0 && (
    <section class="features">
      <h4 class="features-heading">{dict.projects.featuresHeading}</h4>
      <ul class="features-grid">{features.map(f => <li><CheckIcon /> {f}</li>)}</ul>
    </section>
  )}
  {!comingSoon && (repoUrl || liveUrl) && (
    <div class="buttons">
      {repoUrl && <a href={repoUrl}><GitHubIcon /> {dict.projects.codeLink}</a>}
      {liveUrl && <a href={liveUrl}><ExternalLinkIcon /> {dict.projects.demoLink}</a>}
    </div>
  )}
</article>
```

### Стили карточки

- Контейнер: `rounded-lg p-5 border block h-full`, `border-color: var(--color-border)`. Без `hover:bg-*` (карточка больше не кликабельна целиком).
- Header: `flex items-start justify-between gap-2 mb-2`.
- Title: `font-semibold text-lg`, `color: var(--color-text)`.
- Coming-soon бейдж: `text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap`, `background-color: var(--color-bg-muted); color: var(--color-text-muted);` — наследуется как есть от текущего `saasProjects` блока.
- Description: `text-sm leading-relaxed mb-3`, `color: var(--color-text-muted)`.
- Stack pills: `flex flex-wrap gap-1.5`, каждая pill `text-xs px-2 py-0.5 rounded-full`, `background-color: var(--color-bg-muted); color: var(--color-text-muted);` — стиль текущих pill'ов, БЕЗ `slice(0, 4)`.
- Features-секция: `mt-4` отступ сверху.
  - Heading: `text-xs uppercase tracking-wider mb-2`, `color: var(--color-text-muted)` — стиль раздельных секционных подзаголовков сайта.
  - Grid: `grid grid-cols-1 md:grid-cols-2 gap-2`.
  - Item: `flex items-start gap-2 text-sm`, цвет `var(--color-text-muted)`; чекмарк `width: 16; height: 16; flex-shrink: 0; margin-top: 2px;` цвет `var(--color-accent)`.
- Buttons row: `flex flex-wrap gap-3 mt-4`.
  - Кнопка: `inline-flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 border`, `border-color: var(--color-border); color: var(--color-text);`, hover `background-color: var(--color-bg-muted)` через `transition-colors`.
  - Иконка: 16×16 inline-SVG, цвет наследуется.
- Coming-soon (`comingSoon: true`):
  - На контейнере: добавить `opacity: 0.7; cursor: not-allowed;` (тег остаётся `article`, как и сейчас — `div` в текущем `saasProjects` блоке; рендер не-кликабельным).
  - Buttons row не рендерим целиком (по условию `!comingSoon && ...`).
  - Features-секция рендерится — coming-soon карточка должна показывать что обещается.

### Inline-SVG иконки

Использовать lucide-style 24×24 viewBox, stroke-width:2, `currentColor`:

- **Чекмарк (CircleCheckBig стиль)** — для features. Путь: круг + галочка. Размер 16×16.
- **GitHub** — для кнопки Код. Путь стандартный GitHub mark. Размер 16×16.
- **ExternalLink (arrow up-right)** — для кнопки Демо. Тот же путь, что в существующем `personalProjects` блоке (`d="M7 17L17 7M7 7h10v10"`). Размер 16×16.

Точные SVG-пути — определяем в плане; стиль `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`.

### Сортировка карточек

Текущая сортировка `b.data.pubDate.getTime() - a.data.pubDate.getTime()` (DESC) — оставляем. Для воспроизведения прод-порядка (Prototype первым, MVP вторым) MVP должен иметь `pubDate` строго раньше Prototype (`2025-10-01`). Спека фиксирует `pubDate: 2025-09-01` для MVP — произвольное прошлое значение, единственная цель сейчас — порядок сортировки.

### Хранение features в front-matter

Features живут в front-matter md-файлов (как `solutions.*.features` сейчас), а не в i18n-словарях. Причины:
- Это контент конкретного проекта, не UI-копия.
- Локализация — через раздельные `*/ru/*.md` и `*/en/*.md` файлы (уже устоявшийся паттерн коллекций).
- i18n-словари хранят только UI-копию (`featuresHeading`, `codeLink`, `demoLink`).

## Изменения в файлах

### `src/content.config.ts`

Расширить схему `projectSaas` полем `features`:

```diff
 const projectSaas = defineCollection({
   loader: glob({ pattern: "**/*.md", base: "./src/content/projects-saas" }),
   schema: z.object({
     title: z.string(),
     description: z.string(),
     pubDate: z.coerce.date(),
     stack: z.array(z.string()).default([]),
     liveUrl: z.string().url().optional(),
     image: z.string().optional(),
     repoUrl: z.string().url().optional(),
     comingSoon: z.boolean().default(false),
+    features: z.array(z.string()).default([]),
     lang: localeField,
   }),
 });
```

Default `[]` — обратная совместимость, существующие prototype md-файлы без `features` соберутся (но мы тут же их обновим).

### Удалить файлы

- `src/content/projects-personal/en/oauth-simplest.md`
- `src/content/projects-personal/en/telegram-bot-messaging.md`

После удаления коллекция `projects-personal` пустая для обеих локалей → секция «Личные проекты» / «Personal projects» не рендерится в `ProjectsCatalog.astro` (условие `personalProjects.length > 0`).

### `src/content/projects-saas/ru/living-tags-prototype.md`

Добавить `features` в front-matter:

```diff
 ---
 title: "Living Tags - прототип"
 description: "Прототип SaaS-сервиса для автоматической разметки тегами коротких текстов"
 pubDate: 2025-10-01
 stack: ["React", "TypeScript", "Supabase", "Claude API"]
 liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
 repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
+features:
+  - "Глоссарий тегов"
+  - "Редактор коллекции текстов"
+  - "Автоматическая генерация тегов"
+  - "Качественный UI/UX дизайн"
+  - "Интеграция с Claude API"
+  - "Интеграция с Supabase (Database, Auth)"
+  - "Авторизация пользователя"
 lang: ru
 ---
```

Примечание: на проде в этих строках значится общий «AI API integration». Меняем на «Интеграция с Claude API» — точнее, отражает реальность (stack уже `Claude API`, а не `AI API`).

### `src/content/projects-saas/en/living-tags-prototype.md`

```diff
 ---
 title: "Living Tags Prototype"
 description: "Prototype of a SaaS service for automatic tagging of short texts"
 pubDate: 2025-10-01
 stack: ["React", "TypeScript", "Supabase", "Claude API"]
 liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
 repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
+features:
+  - "Tag glossary"
+  - "Text collection editor"
+  - "Automatic tag generation"
+  - "High-quality UI/UX design"
+  - "Claude API integration"
+  - "Supabase integration (Database, Auth)"
+  - "User authorization"
 lang: en
 ---
```

### `src/content/projects-saas/ru/living-tags-mvp.md` (новый файл)

```markdown
---
title: "Living Tags MVP"
description: "MVP SaaS-сервиса для автоматической разметки тегами коротких текстов"
pubDate: 2025-09-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
comingSoon: true
features:
  - "Глоссарий тегов"
  - "Редактор коллекции текстов"
  - "Автоматическая генерация тегов"
  - "Качественный UI/UX дизайн"
  - "Интеграция с Claude API"
  - "Production-ready инфраструктура"
  - "Система управления пользователями"
  - "Оптимизация производительности"
lang: ru
---
```

### `src/content/projects-saas/en/living-tags-mvp.md` (новый файл)

```markdown
---
title: "Living Tags MVP"
description: "MVP of a SaaS service for automatic tagging of short texts"
pubDate: 2025-09-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
comingSoon: true
features:
  - "Tag glossary"
  - "Text collection editor"
  - "Automatic tag generation"
  - "High-quality UI/UX design"
  - "Claude API integration"
  - "Production-ready infrastructure"
  - "User management system"
  - "Performance optimizations"
lang: en
---
```

### `src/i18n/types.ts`

В `Dictionary.projects` добавить 3 поля (без удаления существующих):

```diff
   projects: {
     title: string;
     subtitle: string;
     clientHeading: string;
     personalHeading: string;
     saasHeading: string;
     comingSoon: string;
     repoLink: string;
     backLink: string;
     open: string;
     code: string;
+    featuresHeading: string;
+    codeLink: string;
+    demoLink: string;
   };
```

### `src/i18n/ru.ts`

```diff
   projects: {
     title: "Проекты",
     subtitle:
       "Клиентские проекты, личные эксперименты и SaaS-продукты, над которыми я работал.",
     clientHeading: "Клиентские проекты",
     personalHeading: "Личные проекты",
-    saasHeading: "SaaS-проекты",
-    comingSoon: "Coming Soon",
+    saasHeading: "SaaS",
+    comingSoon: "Скоро",
     repoLink: "Репозиторий",
     backLink: "← Все проекты",
     open: "Открыть",
     code: "Код",
+    featuresHeading: "Ключевые особенности",
+    codeLink: "Код",
+    demoLink: "Демо",
   },
```

### `src/i18n/en.ts`

```diff
   projects: {
     title: "Projects",
     subtitle:
       "Client work, personal experiments and SaaS products I've worked on.",
     clientHeading: "Client projects",
     personalHeading: "Personal projects",
     saasHeading: "SaaS",
     comingSoon: "Coming Soon",
     repoLink: "Repository",
     backLink: "← All projects",
     open: "Open",
     code: "Code",
+    featuresHeading: "Key features",
+    codeLink: "Code",
+    demoLink: "Live demo",
   },
```

EN `saasHeading` уже `"SaaS"` и `comingSoon` уже `"Coming Soon"` — не меняем.

### `src/components/ProjectsCatalog.astro`

Изменения только в `saasProjects` секции (lines 100-143):

- Сетка: `md:grid-cols-2 lg:grid-cols-3` → `md:grid-cols-2`.
- Карточка как `article` (или оставить `Tag = div`, но семантика лучше с `article`):
  - Полностью **не-кликабельный контейнер** (без `<Tag>`-логики прода для disabled vs `<a>`); внешние клики только через кнопки.
  - Stack-pills: убрать `slice(0, 4)`.
  - Добавить features-секцию (если `p.data.features.length > 0`): h4 с `dict.projects.featuresHeading` + grid 2col с чекмарками.
  - Добавить buttons row (если `!p.data.comingSoon && (p.data.repoUrl || p.data.liveUrl)`): кнопки Код/Демо с inline-SVG иконками.
- Стиль контейнера для coming-soon: `opacity: 0.7; cursor: not-allowed;` (как сейчас) — оставляем.

Секции `clientProjects` (lines 31-60) и `personalProjects` (lines 62-98) **не трогаем** — они и так не рендерятся (коллекции пустые после удалений), их разметка к проду не относится. Если в будущем добавится client/personal проект, его карточка останется в старом стиле — отдельная задача.

Хеадер страницы (lines 22-29) **не трогаем** — H1 + subtitle уже соответствует общему стилю сайта.

## План тестирования

1. **`npm run check`** — TypeScript должен пройти после добавления 3 ключей в `Dictionary.projects` и поля `features` в `projectSaas`.
2. **`npm run build`** — должно собраться **22 страницы** (без изменений по сравнению с текущим состоянием 22 страниц после `ddae486`). Расклад:
   - Удаление 2 md-файлов из `projects-personal/en/` не убирает страниц (detail-route'ы не для personal).
   - Добавление `living-tags-mvp` (`comingSoon: true`, нет detail-route'а для projects-saas) не добавляет страниц.
3. **`npm run dev`** — открыть `/projects` и `/en/projects`, визуально сверить:
   - Hero неизменный (H1 «Проекты» / «Projects» + subtitle).
   - Секции «Клиентские проекты» / «Личные проекты» **не рендерятся**.
   - Секция «SaaS» с **2 карточками** в сетке `md:grid-cols-2`:
     - Living Tags - прототип / Living Tags Prototype: title, description, 4 stack-pills, features-блок «Ключевые особенности» / «Key features» (7 items в grid 2col с зелёными/teal чекмарками), кнопки «Код» с GitHub-иконкой + «Демо» с стрелкой.
     - Living Tags MVP: бейдж «Скоро» / «Coming Soon» в правом верху, opacity 0.7, cursor not-allowed, features-блок (8 items), **кнопок нет**.
   - RU heading секции — «SaaS» (не «SaaS-проекты»).
4. **HTML grep после `npm run build`** (`dist/projects/index.html`, `dist/en/projects/index.html`):
   - Содержит: «Living Tags», «Living Tags MVP», «Скоро» (в RU) / «Coming Soon» (в EN), «Ключевые особенности» (RU) / «Key features» (EN), `aiaiai-copilot/living-tags-prototype` (link target кнопки Код для prototype), «Глоссарий тегов» (RU) / «Tag glossary» (EN).
   - НЕ содержит в RU: «SaaS-проекты», «Coming Soon» (старое RU значение), «Клиентские проекты» как живой `<h2>` (отсутствие секции — heading тоже отсутствует), «Личные проекты».
5. **Stage smoke (после redeploy в `stage-releases/<TS>/`)**: `curl -sI https://stage.alexanderlapygin.com/projects/` и `/en/projects/` → `HTTP/2 200`; grep на тот же набор строк.

## Открытые вопросы / решения на этапе плана

- Точные SVG-пути для трёх иконок (CircleCheckBig, GitHub mark, ExternalLink arrow) — выбираем в плане (стиль `lucide`).
- Цвет чекмарка: `var(--color-accent)` (teal) или нейтральный `var(--color-text-muted)`. По умолчанию — `var(--color-accent)` (выделение позитивных пунктов).
- Hover-эффект на карточке: убрать целиком (карточка не кликабельна) или оставить лёгкий `transition: transform` / тень — по умолчанию **убрать** (нет интерактива → нет hover).
- Использовать `<article>` или оставить `<div>` для карточки — по умолчанию **`<article>`** (семантика).
- Dead i18n-ключ `repoLink: "Репозиторий" / "Repository"` — по HANDOFF «не трогаем», но `grep` показывает 0 использований. Возможно артефакт от dead-route'а `/projects/[slug].astro`. На цикл этой спеки оставляем как есть (соответствие HANDOFF); чистка — отдельной задачей при cleanup'е.
- `pubDate` для Living Tags MVP — фиксируем `2025-09-01` для корректного порядка сортировки. Если позже захотим показывать MVP первым (как «новейший анонс»), меняем pubDate на будущую дату.

## Связи

- Зависит от: контент-трек Phase 1-4 (`c2da2a1`, `9777ca9`, `25ef234`, `367882a`, `7e93350`) — коллекции и i18n структура установлены, схема `projectSaas` базово существует.
- Депенденс: удаление placeholder'ов `voice-to-spec`/`llm-spec-tools` (`ddae486`) — `projects-client` уже пуста, эта спека её состояние не меняет.
- Блокирует: cutover stage→prod (HANDOFF п.3) — `/projects` должна быть подтянута к проду до cutover'а.
- Не связано с: defense-in-depth (bind SBP-backend), вне-MVP cleanup, выравнивание `/solutions`/`/blog`/`/contact`/`/faq` (отдельные итерации).

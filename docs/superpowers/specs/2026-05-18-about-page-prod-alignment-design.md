# Design: /about — выравнивание stage с прод-вариантом

**Date:** 2026-05-18
**Status:** Approved (юзер подтвердил решения в брэйншторме `superpowers:brainstorming`, сессия 2026-05-18)
**Scope:** Переработка визуала и структуры страницы `/about` на stage, чтобы приблизить её к текущему прод-сайту (`alexanderlapygin.com`, статический React-сборка от Lovable). Часть более широкой задачи "подтянуть stage к проду перед cutover'ом" — следующие страницы будут отдельными спеками.

## Контекст и мотивация

Ближайшая цель — cutover stage→prod (HANDOFF.md, п.3 общего блока «что осталось недоделанным»). Перед cutover'ом нужно, чтобы stage визуально и структурно соответствовал тому, что посетители видят сейчас. По итогам сессии 2026-05-17 главная страница уже выравнена (`c3def4a`). Следующая в очереди — `/about`.

Текущий stage `/about` (`src/components/AboutPage.astro` + словари `src/i18n/{ru,en}.ts:about`) построен в Phases 1-3 контент-трека (HANDOFF.md): 5 секций линейно — hero (фото+H1) → approach (заголовок «О подходе» + 3 параграфа) → expertise (2-колонный grid plain-списков) → timeline (`border-l` ol) → education. Контент в i18n частично совпадает с прод-словарём (skills, experience.jobs), частично — авторские добавления (3-й абзац approach, education).

Прод `/about` извлечён из бандлов `https://alexanderlapygin.com/assets/About-BGeadGJg.js` (структура) + `/assets/index-x1YQXxU-.js` (i18n-объекты `LE` для EN, `$E` для RU). Структура прода: hero (фото c border+shadow + H1 + длинный hero-subtitle) → Technical Expertise (4-col grid карточек с иконками и subtitle) → Professional Experience (jobs в выделенной рамке `bg-secondary/30 rounded-2xl`). Approach и Education на проде отсутствуют.

Цель спеки:

- Привести структуру и визуал `/about` к прод-варианту, сохранив stage-специфичный контент, который мы решили не терять (Education).
- Подтянуть i18n-тексты к прод-словарю буквально там, где они отличаются от наших домыслов (Expertise title/subtitle).
- Удалить контент, которого нет на проде и который не нужен по решению пользователя (Approach-секция целиком, включая 3-й авторский абзац).

Не-цели:

- Cutover stage→prod (отдельная итерация после redeploy'а stage с этими изменениями).
- Выравнивание других страниц (`/projects`, `/solutions`, `/blog`, `/contact`, `/faq`) — отдельные спеки/итерации.
- Содержательное переписывание текстов опыта/skills — они уже совпадают с прод-словарём.
- Подключение библиотеки иконок (`lucide-react` и т.п.) — будут inline-SVG.

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| Глобальный подход | **Hybrid** (вариант B из брэйншторма): структура с прода, Education оставляем | Education — единственная stage-only секция, которую решено сохранить; во всём остальном следуем проду |
| Approach-секция | **Полное удаление** (заголовок H2 + все 3 абзаца `approachBody`) | Заголовок «О подходе» решено убрать; авторский 3-й абзац («Если задача не моя — скажу прямо…») решено удалить (вариант A в финальной развилке брэйншторма); первые 2 абзаца дублируют прод-description, который теперь идёт hero-subtitle |
| Hero-subtitle | **Добавить** — длинный текст под H1, RU/EN из прод-словаря буквально | Прод-структура: photo → H1 → длинный description. На проде RU и EN не симметричны (RU биографический, EN философский) — копируем как есть, без выравнивания |
| Поддержка `<br />` в RU-subtitle | **Рендер через `set:html`** в Astro | Прод-RU description содержит `<br />` теги для логических переносов; рендер как plain-text потеряет структуру |
| Hero photo стилизация | `rounded-2xl` → **`rounded-lg` + border + shadow** | Совпадение с прод-вариантом (`rounded-lg border-4 border-primary/20 shadow-elegant`); адаптация под нашу тему — см. ниже технические решения |
| Expertise layout | `md:grid-cols-2` plain bullet-listы → **`md:grid-cols-2 lg:grid-cols-4` карточки с иконками** | Прод-структура; на больших экранах 4 колонки вмещают все группы в один ряд |
| Иконки в Expertise-карточках | **Inline-SVG**, не библиотека | Зависимостей не добавляем; 4 иконки, маленький объём; на проде иконки тоже простые (Code/Database/Layers/Wrench-подобные) |
| Expertise title | «Техническая экспертиза» → **«Технические компетенции»** (RU), сохранить «Technical Expertise» (EN) | Прод-словарь буквально |
| Expertise subtitle | **Новое поле**: «Full-stack разработка с использованием современных технологий» (RU) / «Web Application Development» (EN) | Прод-словарь буквально |
| Experience визуал | `border-l pl-6` open-section → **boxed-блок** `bg-secondary/30 p-8 md:p-12 rounded-2xl` | Прод-визуал; в нашей теме маппится на `var(--color-bg-elev)` с padding/rounded |
| Experience содержимое | **Не меняем** — те же 2 job-записи, achievements уже совпадают с прод-словарём | По итогам Phase 2 контент-трека контент уже подтянут |
| Education | **Keep stage-only** | Авторская секция, на проде отсутствует; решение пользователя — сохранить |
| Тип `Dictionary.about` | Breaking change: убрать `approachTitle`, `approachBody`; добавить `subtitle`, `expertiseSubtitle`; переименовать `expertiseTitle` значение | Структура отражает финальный layout; старые ключи не нужны нигде кроме `AboutPage.astro` |
| Поле `cta: "Обсудить проект"` в `about` | **Не трогаем** — оставляем в типе и в словарях | Может использоваться в `ContactCta` или footer; не блокирует, проверка usage вне scope этой спеки |
| Тестирование | **Smoke на stage после redeploy** (визуальная проверка + curl content checks); юнит-тестов компонент не имеет | Astro-компонент без логики, классический smoke достаточен |

## Технические решения (детали маппинга)

### Hero photo стилизация

Прод использует Tailwind-классы `rounded-lg border-4 border-primary/20 shadow-elegant`, где `primary` — кастомный «бренд»-оттенок Lovable-темы и `shadow-elegant` — кастомный shadow в `tailwind.config`. Маппинг на нашу тему:

- `rounded-lg` — Tailwind встроенный, оставляем как есть (`rounded-lg` = 0.5rem).
- `border-4 border-primary/20` — в нашей теме `--color-accent` (teal #0f766e light / #2dd4bf dark). Используем `border: 4px solid color-mix(in srgb, var(--color-accent) 20%, transparent)` или эквивалент через утилитарный класс. Если `color-mix` не поддерживается — задаём явные RGBA в обоих темах через CSS.
- `shadow-elegant` — заменяем на стандартный `shadow-lg` Tailwind либо явный `box-shadow: 0 10px 30px -10px rgba(0,0,0,0.25)`. Конкретный выбор — на этапе плана (визуальная проверка).

### Hero-subtitle типографика

- Класс: `max-w-3xl mx-auto mt-6 text-base md:text-lg leading-relaxed`, цвет — `var(--color-text-muted)`.
- Локали: RU — длинный с `<br />`, EN — короткий single-line. Рендерим через `set:html` универсально для обеих локалей (EN-текст без HTML-тегов рендерится идентично plain-text-варианту, разницы не будет).
- Текст RU (точно из прод-словаря `$E.description`):
  ```
  Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. <br />Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.<br />Использование современных AI-инструментов позволяют ускориться без потери качества.<br />Любая команда или AI смогут продолжить разработку на любом этапе.
  ```
- Текст EN (точно из прод-словаря `LE.description`):
  ```
  Web applications built to last — with explicit structure, thorough documentation, and code that's good maintainable by developers and AI alike
  ```

Примечание: прод-RU имеет опечатку «позволяют ускориться» (плюрализованный глагол вместо ед. ч.). Дублируем буквально — это прод-текст. Если хочется починить — обсудим отдельно (в плане отметим как known issue).

### Expertise-карточки

Структура карточки (псевдокод):
```jsx
<div class="card">
  <div class="card-icon">{inlineSvg}</div>
  <div class="card-category">{group}</div>
  <ul class="card-items">{items.map(...)}</ul>
</div>
```

Стиль карточки:
- Фон: `var(--color-bg-elev)`.
- Border: `1px solid var(--color-border)` или без border, только фон.
- Padding: `p-6`.
- Rounded: `rounded-xl`.
- Hover: лёгкое поднятие (`transition: transform; hover:-translate-y-0.5`) или отказаться от hover для простоты — решим в плане.

Иконки (inline-SVG, по 1 на группу):
- Frontend → Code (`<>`).
- Backend → Database (cylinder).
- Architecture → Layers (3 stacked).
- Development → Wrench / Settings.

Точные SVG-пути — определяем в плане; используем `lucide`-style 24×24 viewBox stroke-width:2.

### Experience-блок (boxed)

- Внешний контейнер: `bg-[var(--color-bg-elev)] rounded-2xl p-8 md:p-12`.
- Заголовок `text-center` (вместо текущего left-aligned).
- Внутри — те же job-записи, но без `border-l` (т.к. контейнер уже выделяет секцию).
- Job-запись: role (semibold) → company (muted) → period (uppercase, muted, small) → achievements (bullet-list).

## Изменения в файлах

### `src/components/AboutPage.astro`

Полный rewrite разметки:
- Удалить block «Approach» (lines 26-33).
- В hero (lines 11-24): photo `rounded-2xl` → `rounded-lg` + border + shadow; добавить subtitle ниже H1.
- Expertise (lines 35-51): grid-cols-2 → `lg:grid-cols-4`; bullet-list → cards с иконками + subtitle над grid'ом.
- Timeline (lines 53-82): заменить `border-l` open-section на boxed-блок, центрировать H2.
- Education (lines 84-100): оставить как есть, но проверить отступы относительно нового experience-блока.

### `src/i18n/types.ts` (если поле `about` типизировано там) или прямо в `Dictionary`

- Удалить: `approachTitle: string`, `approachBody: string[]`.
- Добавить: `subtitle: string`, `expertiseSubtitle: string`.
- Изменить значение (не тип): `expertiseTitle`.

### `src/i18n/ru.ts`

```diff
   about: {
     title: "О себе",
-    approachTitle: "О подходе",
-    approachBody: [
-      "Full-stack разработчик, эксперт по разработке…",
-      "Использование современных AI-инструментов…",
-      "Если задача не моя — скажу прямо и порекомендую коллег.",
-    ],
-    expertiseTitle: "Техническая экспертиза",
+    subtitle: "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. <br />Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.<br />Использование современных AI-инструментов позволяют ускориться без потери качества.<br />Любая команда или AI смогут продолжить разработку на любом этапе.",
+    expertiseTitle: "Технические компетенции",
+    expertiseSubtitle: "Full-stack разработка с использованием современных технологий",
     expertise: [ ... unchanged ... ],
     timelineTitle: "Профессиональный опыт",
     timeline: [ ... unchanged ... ],
     educationTitle: "Образование",
     education: [ ... unchanged ... ],
     cta: "Обсудить проект",
   }
```

### `src/i18n/en.ts`

```diff
   about: {
     title: "About Me",
-    approachTitle: "Approach",
-    approachBody: [
-      "...",
-      "...",
-      "...",
-    ],
-    expertiseTitle: "Technical Expertise",
+    subtitle: "Web applications built to last — with explicit structure, thorough documentation, and code that's good maintainable by developers and AI alike",
+    expertiseTitle: "Technical Expertise",
+    expertiseSubtitle: "Web Application Development",
     expertise: [ ... unchanged ... ],
     ...
   }
```

## План тестирования

1. `npm run check` — TypeScript должен пройти после изменения типа `Dictionary.about`.
2. `npm run build` — все 23 страницы должны собираться без ошибок.
3. `npm run dev` — открыть `/about` и `/en/about`, визуально сверить:
   - Hero: photo `rounded-lg` с border accent/20 + shadow; H1 центрирован; subtitle ниже с переносами (RU только).
   - Approach-секции нет.
   - Expertise: subtitle между title и grid; на широком экране 4 колонки карточек, каждая с иконкой; контент совпадает с прод-словарём.
   - Experience: в выделенном boxed-блоке с centered H2; jobs внутри.
   - Education: ниже Experience-блока, неизменно.
4. Stage smoke (после redeploy): curl `/about` и `/en/about` → `HTTP/2 200`; grep на «Технические компетенции» (RU), «Technical Expertise» (EN), отсутствие «О подходе» / «Approach», наличие «Full-stack разработчик» в RU subtitle.

## Открытые вопросы / решения на этапе плана

- Точная форма inline-SVG иконок (Code/Database/Layers/Wrench) — выбираем в плане.
- Конкретный `box-shadow` для photo (либо Tailwind `shadow-lg`, либо явный CSS).
- Hover-эффект на Expertise-карточках: оставлять или нет.
- Опечатка «позволяют ускориться» в прод-RU тексте — оставляем буквально с прода (если решим иначе — отдельный commit).
- (нет открытых вопросов по `cta` — решено в архитектурных выборах: не трогаем)

## Связи

- Зависит от: контент-трек Phase 2/3 (уже merged: `9777ca9`, `25ef234`) — i18n-словари обновлены до прод-голоса.
- Блокирует: cutover stage→prod (HANDOFF п.3) — после redeploy'а stage с этими изменениями.
- Не связано с: defense-in-depth (bind SBP-backend), вне-MVP cleanup.

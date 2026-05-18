# /about prod-alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подтянуть `/about` (RU + EN) на stage к структуре и визуалу прод-сайта: убрать Approach, добавить hero-subtitle, переделать Expertise в 4-col карточки с иконками, Experience в boxed-блок; Education оставить.

**Architecture:** Чистый Astro-компонент (`src/components/AboutPage.astro`) + i18n словари (`src/i18n/{types,ru,en}.ts`). Без новых зависимостей. Tailwind v4 классы + наши CSS-переменные темы (`var(--color-bg-elev)`, `var(--color-accent)`, и т.п.). Иконки — inline-SVG прямо в компоненте.

**Tech Stack:** Astro 6.3, TypeScript, Tailwind 4.3, CSS custom properties.

**Spec:** [docs/superpowers/specs/2026-05-18-about-page-prod-alignment-design.md](../specs/2026-05-18-about-page-prod-alignment-design.md)

---

## File Structure

| Файл | Тип | Что меняем |
|---|---|---|
| `src/i18n/types.ts` | modify | `Dictionary.about`: убрать `approachTitle`/`approachBody`, добавить `subtitle`/`expertiseSubtitle` |
| `src/i18n/ru.ts` | modify | блок `about`: удалить `approachTitle`/`approachBody`, добавить `subtitle`/`expertiseSubtitle`, изменить `expertiseTitle` |
| `src/i18n/en.ts` | modify | то же для EN |
| `src/components/AboutPage.astro` | rewrite | новая разметка: photo+H1+subtitle hero; expertise 4-col cards с inline-SVG; experience boxed; education unchanged |

Промежуточные состояния (между Task 1 и Task 4) не компилируются — это ожидаемо. Все правки делаются в одной серии без коммитов между ними; финальный коммит — последний шаг (Task 6).

---

### Task 1: Обновить тип `Dictionary.about`

**Files:**
- Modify: `src/i18n/types.ts:60-77`

- [ ] **Step 1: Прочитать текущий блок типа**

Открыть `src/i18n/types.ts`, lines 60-77. Убедиться что вижу:
```ts
about: {
  title: string;
  approachTitle: string;
  approachBody: string[];
  expertiseTitle: string;
  expertise: { group: string; items: string[] }[];
  timelineTitle: string;
  timeline: { ... }[];
  educationTitle: string;
  education: { period?: string; line: string }[];
  cta: string;
};
```

- [ ] **Step 2: Заменить блок `about`**

Заменить целиком на:
```ts
about: {
  title: string;
  subtitle: string;
  expertiseTitle: string;
  expertiseSubtitle: string;
  expertise: { group: string; items: string[] }[];
  timelineTitle: string;
  timeline: {
    period: string;
    role: string;
    company?: string;
    summary?: string;
    achievements: string[];
  }[];
  educationTitle: string;
  education: { period?: string; line: string }[];
  cta: string;
};
```

Изменения: убраны `approachTitle`, `approachBody`; добавлены `subtitle`, `expertiseSubtitle`. Поля `expertise`, `timeline`, `education`, `title`, `cta` неизменны.

- [ ] **Step 3: Запустить TS check — ожидается failure**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
npm run check 2>&1 | tail -30
```

Expected: ошибки про missing `subtitle`/`expertiseSubtitle` в `ru.ts`/`en.ts` и про excess `approachTitle`/`approachBody`. Также возможна ошибка про `dict.about.approachTitle`/`dict.about.approachBody` в `AboutPage.astro`.

Это ожидаемо — пойдём чинить по очереди.

---

### Task 2: Обновить `src/i18n/ru.ts`

**Files:**
- Modify: `src/i18n/ru.ts:82-152`

- [ ] **Step 1: Открыть блок about в `src/i18n/ru.ts`**

Текущий блок (lines 82-152):
```ts
about: {
  title: "О себе",
  approachTitle: "О подходе",
  approachBody: [
    "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.",
    "Использование современных AI-инструментов позволяет ускоряться без потери качества. Любая команда или AI смогут продолжить разработку на любом этапе.",
    "Если задача не моя — скажу прямо и порекомендую коллег.",
  ],
  expertiseTitle: "Техническая экспертиза",
  expertise: [ ... ],
  timelineTitle: "Профессиональный опыт",
  timeline: [ ... ],
  educationTitle: "Образование",
  education: [
    { line: "МИФИ — прикладная математика" },
  ],
  cta: "Обсудить проект",
},
```

- [ ] **Step 2: Заменить первые 4 поля блока about**

Заменить:
```ts
  title: "О себе",
  approachTitle: "О подходе",
  approachBody: [
    "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.",
    "Использование современных AI-инструментов позволяет ускоряться без потери качества. Любая команда или AI смогут продолжить разработку на любом этапе.",
    "Если задача не моя — скажу прямо и порекомендую коллег.",
  ],
  expertiseTitle: "Техническая экспертиза",
```

На:
```ts
  title: "О себе",
  subtitle:
    "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. <br />Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.<br />Использование современных AI-инструментов позволяют ускориться без потери качества.<br />Любая команда или AI смогут продолжить разработку на любом этапе.",
  expertiseTitle: "Технические компетенции",
  expertiseSubtitle: "Full-stack разработка с использованием современных технологий",
```

Внимание: текст `subtitle` копируется из прод-словаря **буквально**, включая `<br />`-теги и опечатку «позволяют ускориться» (см. spec, секция "Hero-subtitle типографика"). Не править.

Поля `expertise`, `timeline`, `educationTitle`, `education`, `cta` ниже — не трогать.

- [ ] **Step 3: Запустить TS check**

```bash
npm run check 2>&1 | tail -30
```

Expected: ошибок про `ru.ts` больше нет; остались ошибки про `en.ts` (missing `subtitle`/`expertiseSubtitle`) и `AboutPage.astro` (использует удалённые ключи).

---

### Task 3: Обновить `src/i18n/en.ts`

**Files:**
- Modify: `src/i18n/en.ts` (блок `about`, аналогичные строки)

- [ ] **Step 1: Найти блок about в `src/i18n/en.ts`**

```bash
grep -n "about:\|approachTitle\|expertiseTitle" src/i18n/en.ts | head
```

- [ ] **Step 2: Заменить первые 4 поля блока about**

Заменить блок с `title`, `approachTitle`, `approachBody`, `expertiseTitle` на:
```ts
  title: "About Me",
  subtitle:
    "Web applications built to last — with explicit structure, thorough documentation, and code that's good maintainable by developers and AI alike",
  expertiseTitle: "Technical Expertise",
  expertiseSubtitle: "Web Application Development",
```

`subtitle` — буквально с прода (LE.description), не править «good maintainable» (это формулировка с прода).

Остальные поля блока (expertise, timeline, education, cta) — не трогать.

- [ ] **Step 3: Запустить TS check**

```bash
npm run check 2>&1 | tail -30
```

Expected: ошибок про `en.ts` больше нет; остаются ошибки в `AboutPage.astro` про `approachTitle`/`approachBody`.

---

### Task 4: Переписать `src/components/AboutPage.astro`

**Files:**
- Modify: `src/components/AboutPage.astro` (полный rewrite)

- [ ] **Step 1: Заменить содержимое файла на новую разметку**

Заменить **весь** `src/components/AboutPage.astro` на:

```astro
---
import { t, type Locale } from "~/i18n";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const dict = t(locale);
---

<section class="mx-auto max-w-3xl px-4 md:px-6 pt-8 md:pt-12 pb-8 text-center">
  <img
    src="/photo.png"
    alt={dict.meta.siteAuthor}
    width="160"
    height="160"
    class="mx-auto w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover"
    style="border: 4px solid color-mix(in srgb, var(--color-accent) 20%, transparent); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.25);"
    loading="eager"
    decoding="async"
  />
  <h1 class="mt-8 text-3xl md:text-5xl font-semibold tracking-tight" style="color: var(--color-text);">
    {dict.about.title}
  </h1>
  <p
    class="mt-6 max-w-3xl mx-auto text-base md:text-lg leading-relaxed"
    style="color: var(--color-text-muted);"
    set:html={dict.about.subtitle}
  />
</section>

<section class="mx-auto max-w-5xl px-4 md:px-6 pb-12">
  <div class="text-center mb-8">
    <h2 class="text-2xl md:text-3xl font-semibold tracking-tight mb-2" style="color: var(--color-text);">
      {dict.about.expertiseTitle}
    </h2>
    <p class="text-base md:text-lg" style="color: var(--color-text-muted);">
      {dict.about.expertiseSubtitle}
    </p>
  </div>
  <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {dict.about.expertise.map((g, idx) => (
      <div
        class="p-6 rounded-xl"
        style="background-color: var(--color-bg-elev); border: 1px solid var(--color-border);"
      >
        <div class="mb-3" style="color: var(--color-accent);">
          {idx === 0 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          )}
          {idx === 1 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14a9 3 0 0 0 18 0V5" />
              <path d="M3 12a9 3 0 0 0 18 0" />
            </svg>
          )}
          {idx === 2 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          )}
          {idx === 3 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          )}
        </div>
        <div class="text-sm uppercase tracking-wider font-semibold mb-3" style="color: var(--color-text);">
          {g.group}
        </div>
        <ul class="space-y-1.5 text-sm" style="color: var(--color-text-muted);">
          {g.items.map((it) => <li>· {it}</li>)}
        </ul>
      </div>
    ))}
  </div>
</section>

<section class="mx-auto max-w-3xl px-4 md:px-6 pb-12">
  <div class="p-8 md:p-12 rounded-2xl" style="background-color: var(--color-bg-elev);">
    <h2 class="text-2xl md:text-3xl font-semibold tracking-tight mb-8 text-center" style="color: var(--color-text);">
      {dict.about.timelineTitle}
    </h2>
    <ol class="space-y-8">
      {dict.about.timeline.map((row) => (
        <li>
          <div class="text-xs uppercase tracking-wider mb-1" style="color: var(--color-text-muted);">
            {row.period}
          </div>
          <div class="font-semibold text-base mb-2" style="color: var(--color-text);">
            {row.role}
          </div>
          {row.company && (
            <div class="text-sm mb-3" style="color: var(--color-text-muted);">
              {row.company}
            </div>
          )}
          {row.summary && (
            <p class="text-sm leading-relaxed mb-3" style="color: var(--color-text-muted);">
              {row.summary}
            </p>
          )}
          <ul class="space-y-1.5 text-sm" style="color: var(--color-text);">
            {row.achievements.map((a) => <li>· {a}</li>)}
          </ul>
        </li>
      ))}
    </ol>
  </div>
</section>

<section class="mx-auto max-w-3xl px-4 md:px-6 pb-12">
  <h2 class="text-xl md:text-2xl font-semibold tracking-tight mb-4" style="color: var(--color-text);">
    {dict.about.educationTitle}
  </h2>
  <ul class="space-y-3 text-sm">
    {dict.about.education.map((e) => (
      <li class="flex flex-col md:flex-row md:gap-4">
        {e.period && (
          <span class="text-xs uppercase tracking-wider md:w-40" style="color: var(--color-text-muted);">
            {e.period}
          </span>
        )}
        <span style="color: var(--color-text);">{e.line}</span>
      </li>
    ))}
  </ul>
</section>
```

Ключевые изменения по сравнению с прежней разметкой:
- Hero: `rounded-2xl` → `rounded-lg`; добавлены `border: 4px solid color-mix(...)` и `box-shadow` через inline-style; добавлен `<p set:html={dict.about.subtitle}>` ниже H1.
- Удалена секция Approach (раньше lines 26-33).
- Expertise: контейнер `max-w-3xl` → `max-w-5xl` (чтобы вместить 4 колонки); grid `md:grid-cols-2` → `md:grid-cols-2 lg:grid-cols-4`; добавлены subtitle и карточный вид с inline-SVG иконками.
- Experience (бывшая timeline-секция): убран `border-l pl-6`; всё обёрнуто в `<div class="p-8 md:p-12 rounded-2xl" style="background-color: var(--color-bg-elev);">`; H2 теперь `text-center`.
- Education: без изменений.

- [ ] **Step 2: Запустить TS check — ожидается green**

```bash
npm run check 2>&1 | tail -20
```

Expected: zero errors related to about. Допустимы pre-existing Zod-deprecation hint'ы (≈64 hint'а из контент-коллекций, см. HANDOFF).

Если ошибки остались — внимательно перечитать diff между ожидаемым и фактическим (особенно: имена ключей `dict.about.*`, опечатки в шаблоне).

---

### Task 5: Сборка и smoke-тест в dev-сервере

**Files:** none (verification only)

- [ ] **Step 1: Build**

```bash
npm run build 2>&1 | tail -20
```

Expected: «23 page(s) built» (или сколько у нас всего — проверить, что число не уменьшилось и нет ошибок).

- [ ] **Step 2: Запустить dev-сервер**

```bash
npm run dev
```

(Запускается на http://localhost:4321 или близком порту — будет в логах.)

- [ ] **Step 3: Открыть `/about` и `/en/about`, визуально сверить**

В браузере (или через curl + Node для текстовой проверки):

Чек-лист на `/about` (RU):
- [ ] Hero photo `rounded-lg` с заметным border (teal-оттенок ~20% opacity) и тенью.
- [ ] H1 «О себе» центрирован.
- [ ] Под H1 — длинный subtitle с переносами строк («…на основе спецификаций и AI-инструментов.» — перенос — «Создаю программные продукты…»).
- [ ] Секции «О подходе» нет.
- [ ] Заголовок «Технические компетенции» (не «Техническая экспертиза»).
- [ ] Subtitle «Full-stack разработка с использованием современных технологий».
- [ ] На широком экране (≥1024px) — 4 колонки карточек с иконками; на md — 2 колонки.
- [ ] Каждая карточка с фоном `bg-elev`, иконка teal-цвета сверху, название группы, список items.
- [ ] Секция «Профессиональный опыт» в выделенном blockе с padding и rounded-2xl; H2 центрирован.
- [ ] Секция «Образование» с «МИФИ — прикладная математика».

Чек-лист на `/en/about` (EN):
- [ ] H1 «About Me», subtitle «Web applications built to last…».
- [ ] Expertise title «Technical Expertise», subtitle «Web Application Development».
- [ ] Experience title «Professional Experience», в boxed-блоке.
- [ ] Все категории на английском (Frontend / Backend / Architecture / Development).

- [ ] **Step 4: Остановить dev-сервер**

`Ctrl+C` в терминале с dev'ом или kill процесса.

---

### Task 6: Commit

**Files:** уже изменены — коммитим то, что есть.

- [ ] **Step 1: Проверить git status**

```bash
git status -s
```

Expected: M на 4 файлах:
- `src/i18n/types.ts`
- `src/i18n/ru.ts`
- `src/i18n/en.ts`
- `src/components/AboutPage.astro`

(Никаких других модификаций — если есть, разобраться.)

- [ ] **Step 2: Diff sanity check**

```bash
git diff src/i18n/types.ts src/i18n/ru.ts src/i18n/en.ts src/components/AboutPage.astro | head -200
```

Убедиться что:
- Удалены `approachTitle`, `approachBody` (4 места: тип, ru, en, AboutPage).
- Добавлены `subtitle`, `expertiseSubtitle` (4 места).
- В `ru.ts` и `en.ts` — точные тексты из прод-словаря.
- В AboutPage — новая разметка с инлайн-SVG и boxed Experience.

- [ ] **Step 3: Stage and commit**

```bash
git add src/i18n/types.ts src/i18n/ru.ts src/i18n/en.ts src/components/AboutPage.astro
git commit -m "$(cat <<'EOF'
feat(ui): /about — align with prod layout

- Drop Approach section (heading + body)
- Add hero subtitle from prod dictionary (RU/EN)
- Rename "Техническая экспертиза" → "Технические компетенции"
- Add expertise subtitle "Full-stack разработка..."/"Web Application Development"
- Convert Expertise to 4-col card grid with inline SVG icons
- Wrap Experience in boxed block (bg-elev, rounded-2xl)
- Keep Education as-is

Spec: docs/superpowers/specs/2026-05-18-about-page-prod-alignment-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify commit**

```bash
git log -1 --stat
```

Expected: 4 files changed, commit с правильным сообщением.

- [ ] **Step 5: НЕ пушить** — push заблокирован классификатором, пользователь пушит вручную после ревью.

---

## Self-review (post-plan, before handoff)

**Spec coverage check:**
- Hero photo стилизация → Task 4 step 1 (inline border + box-shadow).
- Hero subtitle добавлен → Task 4 step 1 (`<p set:html={dict.about.subtitle}>`).
- Approach удалён → Task 1 (тип), Task 2/3 (словари), Task 4 (разметка).
- Expertise → 4-col карточки с inline-SVG → Task 4 step 1.
- Expertise title/subtitle → Task 2/3 (тексты), Task 4 (разметка).
- Experience boxed-блок → Task 4 step 1.
- Education unchanged → Task 4 step 1 (разметка скопирована из старого файла без изменений).
- `set:html` для RU-subtitle → Task 4 step 1.

**Placeholder scan:** Нет TBD/TODO. Все шаги содержат конкретный код или конкретную команду.

**Type consistency:** Имена ключей `subtitle`, `expertiseSubtitle` совпадают в типе (Task 1), словарях (Task 2/3) и разметке (Task 4).

**Known caveat:** Прод-RU текст содержит опечатку «позволяют ускориться» — копируется буквально (см. spec). Если на ревью пользователь захочет исправить — отдельный commit.

# /projects prod-alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подтянуть `/projects` (RU + EN) на stage к прод-варианту: 2 SaaS-карточки (Living Tags Prototype + MVP coming-soon) с features-блоком и кнопками Код/Демо; убрать mis-classified personal-projects; добавить i18n-ключи карточки.

**Architecture:** Расширение Astro Content Collection (`projectSaas` + поле `features`) → новые/обновлённые md-файлы в `src/content/projects-saas/{ru,en}/` → 3 новых ключа в i18n-словарях + 2 изменения значений в RU → переработка только SaaS-секции компонента `src/components/ProjectsCatalog.astro` (inline-rich карточка: features-grid + кнопки Код/Демо). Без новых зависимостей; inline-SVG иконки (lucide-style) прямо в компоненте.

**Tech Stack:** Astro 6.3 (Content Collections + Zod), TypeScript, Tailwind 4.3, CSS custom properties.

**Spec:** [docs/superpowers/specs/2026-05-18-projects-prod-alignment-design.md](../specs/2026-05-18-projects-prod-alignment-design.md)

---

## File Structure

| Файл | Тип | Что меняем |
|---|---|---|
| `src/content.config.ts` | modify | схема `projectSaas`: добавить `features: z.array(z.string()).default([])` |
| `src/content/projects-saas/ru/living-tags-prototype.md` | modify | front-matter: добавить `features` (7 items, RU) |
| `src/content/projects-saas/en/living-tags-prototype.md` | modify | front-matter: добавить `features` (7 items, EN) |
| `src/content/projects-saas/ru/living-tags-mvp.md` | create | новый файл, `comingSoon: true`, 8 features (RU) |
| `src/content/projects-saas/en/living-tags-mvp.md` | create | новый файл, `comingSoon: true`, 8 features (EN) |
| `src/content/projects-personal/en/oauth-simplest.md` | delete | mis-classified (дубль `solutions/oauth-simplest`) |
| `src/content/projects-personal/en/telegram-bot-messaging.md` | delete | mis-classified (дубль `solutions/telegram-gateway`) |
| `src/i18n/types.ts` | modify | `Dictionary.projects`: добавить `featuresHeading`, `codeLink`, `demoLink` |
| `src/i18n/ru.ts` | modify | блок `projects`: изменить `saasHeading`, `comingSoon`; добавить 3 ключа |
| `src/i18n/en.ts` | modify | блок `projects`: добавить 3 ключа (saasHeading/comingSoon уже корректны) |
| `src/components/ProjectsCatalog.astro` | modify | переработка только секции `saasProjects` (lines 100-143): сетка 2col, не-кликабельная карточка, features-блок, кнопки |

Атомарные коммиты после каждого Task (1-5). Task 6 — финальная верификация без коммита (см. секцию Self-Review/Final Smoke в конце).

Каждый Task оставляет репозиторий в компилируемом состоянии (`npm run check` 0/0, `npm run build` 22 страницы). Конкретные зависимости:
- Task 1 (schema + prototype features) — самостоятельный, поле `features` имеет `default([])`.
- Task 2 (MVP md) — после Task 1 (требует поля `features` в схеме).
- Task 3 (delete mis-classified) — независимый.
- Task 4 (i18n) — независимый.
- Task 5 (ProjectsCatalog rework) — после Task 1 (нужно `p.data.features`) И после Task 4 (нужны i18n-ключи). Task 2 не строго обязателен для компиляции, но желателен для визуальной проверки (2 карточки вместо 1).

---

### Task 1: Расширить схему `projectSaas` + features в Living Tags Prototype

**Files:**
- Modify: `src/content.config.ts:54-67`
- Modify: `src/content/projects-saas/ru/living-tags-prototype.md`
- Modify: `src/content/projects-saas/en/living-tags-prototype.md`

- [ ] **Step 1: Прочитать текущую схему `projectSaas`**

Открыть `src/content.config.ts`. Текущий блок (lines 54-67):
```ts
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
    lang: localeField,
  }),
});
```

- [ ] **Step 2: Добавить поле `features` в схему**

Заменить блок `schema` так, чтобы добавилась строка `features: z.array(z.string()).default([]),` сразу после `comingSoon`:

```ts
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
    features: z.array(z.string()).default([]),
    lang: localeField,
  }),
});
```

- [ ] **Step 3: Обновить `living-tags-prototype.md` (RU)**

Прочитать `src/content/projects-saas/ru/living-tags-prototype.md`. Текущий front-matter:
```yaml
---
title: "Living Tags - прототип"
description: "Прототип SaaS-сервиса для автоматической разметки тегами коротких текстов"
pubDate: 2025-10-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
lang: ru
---
```

Добавить блок `features` (7 строк) перед `lang: ru`:
```yaml
---
title: "Living Tags - прототип"
description: "Прототип SaaS-сервиса для автоматической разметки тегами коротких текстов"
pubDate: 2025-10-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
features:
  - "Глоссарий тегов"
  - "Редактор коллекции текстов"
  - "Автоматическая генерация тегов"
  - "Качественный UI/UX дизайн"
  - "Интеграция с Claude API"
  - "Интеграция с Supabase (Database, Auth)"
  - "Авторизация пользователя"
lang: ru
---
```

- [ ] **Step 4: Обновить `living-tags-prototype.md` (EN)**

Прочитать `src/content/projects-saas/en/living-tags-prototype.md`. Текущий front-matter:
```yaml
---
title: "Living Tags Prototype"
description: "Prototype of a SaaS service for automatic tagging of short texts"
pubDate: 2025-10-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
lang: en
---
```

Добавить блок `features` (7 строк) перед `lang: en`:
```yaml
---
title: "Living Tags Prototype"
description: "Prototype of a SaaS service for automatic tagging of short texts"
pubDate: 2025-10-01
stack: ["React", "TypeScript", "Supabase", "Claude API"]
liveUrl: "https://alexanderlapygin.com/portfolio/living-tags/living-tags-prototype/"
repoUrl: "https://github.com/aiaiai-copilot/living-tags-prototype"
features:
  - "Tag glossary"
  - "Text collection editor"
  - "Automatic tag generation"
  - "High-quality UI/UX design"
  - "Claude API integration"
  - "Supabase integration (Database, Auth)"
  - "User authorization"
lang: en
---
```

- [ ] **Step 5: Проверить компиляцию**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
npm run check 2>&1 | tail -10
```

Expected: `0 errors, 0 warnings, 0 hints`. Поле `features` опционально (default `[]`), существующие потребители коллекции (`ProjectsCatalog.astro`) пока не читают его — компиляция не должна сломаться.

```bash
npm run build 2>&1 | tail -10
```

Expected: build успех, `22 page(s) built`. Появление поля `features` не добавляет страниц (нет detail-route'а для projects-saas).

- [ ] **Step 6: Коммит**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
git add src/content.config.ts src/content/projects-saas/ru/living-tags-prototype.md src/content/projects-saas/en/living-tags-prototype.md
git commit -m "$(cat <<'EOF'
feat(content): add features field to projectSaas + populate Living Tags Prototype

Расширяет схему projects-saas коллекции массивом features и
заполняет его для существующего Living Tags Prototype (RU/EN).
Используется в новой inline-rich карточке /projects (см. /projects
prod-alignment spec).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Создать Living Tags MVP (coming-soon)

**Files:**
- Create: `src/content/projects-saas/ru/living-tags-mvp.md`
- Create: `src/content/projects-saas/en/living-tags-mvp.md`

- [ ] **Step 1: Создать RU-версию**

Записать новый файл `src/content/projects-saas/ru/living-tags-mvp.md`:

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

Тело файла после `---` оставить пустым (как в prototype: detail-страницы для projects-saas нет, тело не рендерится).

Заметка: `liveUrl` и `repoUrl` намеренно отсутствуют — оба `optional`, кнопки скрыты для coming-soon в любом случае.

- [ ] **Step 2: Создать EN-версию**

Записать новый файл `src/content/projects-saas/en/living-tags-mvp.md`:

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

Тело пустое.

- [ ] **Step 3: Проверить компиляцию**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

Expected:
- `check`: 0 errors.
- `build`: успех, `22 page(s) built` (без новых маршрутов — нет `[slug].astro` для projects-saas).

Карточка пока не рендерится визуально features-блоком (компонент ещё не переработан), но в HTML `/projects/index.html` и `/en/projects/index.html` уже должна появиться вторая SaaS-карточка в старом виде (title + description + 4 stack-pills + бейдж «Coming Soon», без features).

Опциональная проверка:
```bash
grep -c "Living Tags" dist/projects/index.html
grep -c "Living Tags" dist/en/projects/index.html
```

Expected: `>= 2` для каждой локали (по 1 mention на карточку как минимум).

- [ ] **Step 4: Коммит**

```bash
git add src/content/projects-saas/ru/living-tags-mvp.md src/content/projects-saas/en/living-tags-mvp.md
git commit -m "$(cat <<'EOF'
feat(content): add Living Tags MVP coming-soon SaaS card (RU/EN)

Создаёт coming-soon-карточку Living Tags MVP в коллекции
projects-saas — вторая карточка SaaS-секции на /projects,
повторяет прод-структуру. liveUrl/repoUrl опущены (будут позже).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Удалить mis-classified personal-projects (EN)

**Files:**
- Delete: `src/content/projects-personal/en/oauth-simplest.md`
- Delete: `src/content/projects-personal/en/telegram-bot-messaging.md`

- [ ] **Step 1: Проверить, что файлы — действительно дубли solutions**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
head -10 src/content/projects-personal/en/oauth-simplest.md
head -10 src/content/solutions/en/oauth-simplest.md
head -10 src/content/projects-personal/en/telegram-bot-messaging.md
head -10 src/content/solutions/en/telegram-gateway.md
```

Expected: `demoUrl`/`liveUrl` совпадают между projects-personal и solutions; контент пересекается. Если в `solutions/en/` соответствующий файл отсутствует (имя другое или его нет), **остановиться** и сообщить — это меняет skoup, нужно вернуться к спеке.

- [ ] **Step 2: Удалить файлы**

```bash
rm src/content/projects-personal/en/oauth-simplest.md
rm src/content/projects-personal/en/telegram-bot-messaging.md
```

- [ ] **Step 3: Проверить, что коллекция `projects-personal` корректно пустая**

```bash
find src/content/projects-personal -type f -name "*.md"
```

Expected: пустой вывод (RU-директории нет с самого начала, EN опустошён).

- [ ] **Step 4: Проверить компиляцию**

```bash
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

Expected:
- `check`: 0 errors.
- `build`: успех, `22 page(s) built` (без изменений — secции `personalProjects` в `ProjectsCatalog.astro` уже не рендерились бы в RU из-за отсутствия `projects-personal/ru/`; для EN теперь то же самое).

Дополнительно: в `dist/en/projects/index.html` секция «Personal projects» должна перестать рендериться.

```bash
grep -c "Personal projects" dist/en/projects/index.html
```

Expected: `0`.

- [ ] **Step 5: Коммит**

```bash
git add -A src/content/projects-personal/
git commit -m "$(cat <<'EOF'
chore(content): drop mis-classified personal/en projects

Удаляет oauth-simplest и telegram-bot-messaging из
projects-personal/en — они дубли solutions/{oauth-simplest,
telegram-gateway} с тем же demoUrl. Их место в /solutions,
а не /projects. RU-версии этих файлов не было.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Добавить i18n-ключи для карточки

**Files:**
- Modify: `src/i18n/types.ts:78-89`
- Modify: `src/i18n/ru.ts:150-162`
- Modify: `src/i18n/en.ts:146-158`

- [ ] **Step 1: Прочитать текущий блок типа**

Открыть `src/i18n/types.ts`. Текущий блок `projects` (lines 78-89):
```ts
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
};
```

- [ ] **Step 2: Добавить 3 ключа в тип**

Заменить блок на:
```ts
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
  featuresHeading: string;
  codeLink: string;
  demoLink: string;
};
```

Существующие ключи (`open`, `code`, `repoLink`, и т.д.) **не трогаем** — используются в `ProjectPage.astro` (dead-route для projects-client).

- [ ] **Step 3: Запустить TS check — ожидается failure**

```bash
npm run check 2>&1 | tail -20
```

Expected: ошибки про missing `featuresHeading`/`codeLink`/`demoLink` в `ru.ts` и `en.ts`.

- [ ] **Step 4: Обновить `src/i18n/ru.ts`**

Открыть `src/i18n/ru.ts`. Текущий блок `projects` (lines 150-162):
```ts
projects: {
  title: "Проекты",
  subtitle:
    "Клиентские проекты, личные эксперименты и SaaS-продукты, над которыми я работал.",
  clientHeading: "Клиентские проекты",
  personalHeading: "Личные проекты",
  saasHeading: "SaaS-проекты",
  comingSoon: "Coming Soon",
  repoLink: "Репозиторий",
  backLink: "← Все проекты",
  open: "Открыть",
  code: "Код",
},
```

Заменить на:
```ts
projects: {
  title: "Проекты",
  subtitle:
    "Клиентские проекты, личные эксперименты и SaaS-продукты, над которыми я работал.",
  clientHeading: "Клиентские проекты",
  personalHeading: "Личные проекты",
  saasHeading: "SaaS",
  comingSoon: "Скоро",
  repoLink: "Репозиторий",
  backLink: "← Все проекты",
  open: "Открыть",
  code: "Код",
  featuresHeading: "Ключевые особенности",
  codeLink: "Код",
  demoLink: "Демо",
},
```

Изменения:
- `saasHeading: "SaaS-проекты"` → `"SaaS"` (match с прод-словарём `BE.projects.saasHeading`).
- `comingSoon: "Coming Soon"` → `"Скоро"` (русификация).
- Добавлены 3 новых ключа.

- [ ] **Step 5: Обновить `src/i18n/en.ts`**

Открыть `src/i18n/en.ts`. Текущий блок `projects` (lines 146-158):
```ts
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
},
```

Заменить на:
```ts
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
  featuresHeading: "Key features",
  codeLink: "Code",
  demoLink: "Live demo",
},
```

Изменения: только добавлены 3 ключа. `saasHeading`/`comingSoon` в EN уже совпадают с прод-словарём.

- [ ] **Step 6: Проверить компиляцию**

```bash
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

Expected:
- `check`: 0 errors.
- `build`: успех, `22 page(s) built`.

Дополнительно — проверить, что новые значения попали в HTML (через какой-нибудь существующий потребитель `saasHeading` / `comingSoon`):
```bash
grep -o "SaaS-проекты" dist/projects/index.html | head -1
grep -o "Coming Soon" dist/projects/index.html | head -1
grep -o "SaaS<" dist/projects/index.html | head -1
grep -o "Скоро" dist/projects/index.html | head -1
```

Expected (RU build):
- `SaaS-проекты`: пусто (старое значение).
- `Coming Soon`: пусто (старое значение).
- `SaaS<`: матч (новый heading).
- `Скоро`: матч (новый бейдж в MVP-карточке).

- [ ] **Step 7: Коммит**

```bash
git add src/i18n/types.ts src/i18n/ru.ts src/i18n/en.ts
git commit -m "$(cat <<'EOF'
feat(i18n): projects card keys + RU saasHeading/comingSoon align

Добавляет featuresHeading/codeLink/demoLink в Dictionary.projects
для inline-rich карточки /projects. RU: saasHeading «SaaS-проекты»
→ «SaaS», comingSoon «Coming Soon» → «Скоро» (match с прод-i18n).
EN: saasHeading и comingSoon уже совпадали с прод-словарём.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Переработать SaaS-секцию в `ProjectsCatalog.astro`

**Files:**
- Modify: `src/components/ProjectsCatalog.astro:100-143`

- [ ] **Step 1: Прочитать текущую секцию**

Открыть `src/components/ProjectsCatalog.astro`. Текущий блок `saasProjects` (lines 100-143):
```astro
{saasProjects.length > 0 && (
  <section class="mx-auto max-w-6xl px-4 md:px-6 py-8 pb-16">
    <h2 class="text-xs uppercase tracking-wider mb-6" style="color: var(--color-text-muted);">
      {dict.projects.saasHeading}
    </h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {saasProjects.map((p) => {
        const disabled = p.data.comingSoon;
        const Tag = disabled ? "div" : "a";
        const href = p.data.liveUrl ?? "#";
        return (
          <Tag
            href={disabled ? undefined : href}
            target={disabled ? undefined : "_blank"}
            rel={disabled ? undefined : "noopener"}
            class={`rounded-lg p-5 border block h-full ${disabled ? "" : "hover:bg-[var(--color-bg-muted)] transition-colors"}`}
            style={`border-color: var(--color-border); ${disabled ? "opacity: 0.7;" : ""}`}
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-lg" style="color: var(--color-text);">
                {p.data.title}
              </h3>
              {disabled && (
                <span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background-color: var(--color-bg-muted); color: var(--color-text-muted);">
                  {dict.projects.comingSoon}
                </span>
              )}
            </div>
            <p class="text-sm leading-relaxed mb-3" style="color: var(--color-text-muted);">
              {p.data.description}
            </p>
            <div class="flex flex-wrap gap-1.5">
              {p.data.stack.slice(0, 4).map((tag) => (
                <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: var(--color-bg-muted); color: var(--color-text-muted);">
                  {tag}
                </span>
              ))}
            </div>
          </Tag>
        );
      })}
    </div>
  </section>
)}
```

- [ ] **Step 2: Заменить блок целиком**

Новая разметка (карточка — `<article>`, не-кликабельная, добавлены features-блок и кнопки Код/Демо, сетка `md:grid-cols-2`, stack без slice):

```astro
{saasProjects.length > 0 && (
  <section class="mx-auto max-w-6xl px-4 md:px-6 py-8 pb-16">
    <h2 class="text-xs uppercase tracking-wider mb-6" style="color: var(--color-text-muted);">
      {dict.projects.saasHeading}
    </h2>
    <div class="grid md:grid-cols-2 gap-4 md:gap-6">
      {saasProjects.map((p) => {
        const disabled = p.data.comingSoon;
        const showButtons = !disabled && (p.data.repoUrl || p.data.liveUrl);
        return (
          <article
            class="rounded-lg p-5 border block h-full"
            style={`border-color: var(--color-border); ${disabled ? "opacity: 0.7; cursor: not-allowed;" : ""}`}
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-lg" style="color: var(--color-text);">
                {p.data.title}
              </h3>
              {disabled && (
                <span class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style="background-color: var(--color-bg-muted); color: var(--color-text-muted);">
                  {dict.projects.comingSoon}
                </span>
              )}
            </div>
            <p class="text-sm leading-relaxed mb-3" style="color: var(--color-text-muted);">
              {p.data.description}
            </p>
            <div class="flex flex-wrap gap-1.5">
              {p.data.stack.map((tag) => (
                <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: var(--color-bg-muted); color: var(--color-text-muted);">
                  {tag}
                </span>
              ))}
            </div>
            {p.data.features.length > 0 && (
              <div class="mt-4">
                <h4 class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text-muted);">
                  {dict.projects.featuresHeading}
                </h4>
                <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {p.data.features.map((f) => (
                    <li class="flex items-start gap-2 text-sm" style="color: var(--color-text-muted);">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-accent); flex-shrink: 0; margin-top: 2px;">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335"/>
                        <path d="m9 11 3 3L22 4"/>
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showButtons && (
              <div class="flex flex-wrap gap-3 mt-4">
                {p.data.repoUrl && (
                  <a
                    href={p.data.repoUrl}
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 border hover:bg-[var(--color-bg-muted)] transition-colors"
                    style="border-color: var(--color-border); color: var(--color-text);"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                      <path d="M9 18c-4.51 2-5-2-7-2"/>
                    </svg>
                    <span>{dict.projects.codeLink}</span>
                  </a>
                )}
                {p.data.liveUrl && (
                  <a
                    href={p.data.liveUrl}
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center gap-1.5 text-sm rounded-md px-3 py-1.5 border hover:bg-[var(--color-bg-muted)] transition-colors"
                    style="border-color: var(--color-border); color: var(--color-text);"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 17L17 7M7 7h10v10"/>
                    </svg>
                    <span>{dict.projects.demoLink}</span>
                  </a>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  </section>
)}
```

Замечания:
- Карточка `<article>`, без `Tag = disabled ? "div" : "a"` и без атрибутов `href`/`target`/`rel` на контейнере — навигация только через кнопки.
- Сетка: `md:grid-cols-2` (без `lg:grid-cols-3`).
- Stack pills: `p.data.stack.map(...)` — без `.slice(0, 4)`.
- Features-блок: рендерится при `features.length > 0` (для существующих карточек до Task 1 — пропущен; после Task 1 — для prototype 7 items, для MVP 8 items). SVG-чекмарк lucide `circle-check-big` (path-комбо круг+галочка).
- Buttons row: рендерится при `!disabled && (repoUrl || liveUrl)`. Для prototype — обе кнопки; для MVP — пропущен из-за `disabled = true`.
- SVG GitHub: lucide v0.378 github icon (два path'а). SVG ExternalLink: тот же `M7 17L17 7M7 7h10v10`, что в `personalProjects` секции — стилистическая консистентность.

Секции `clientProjects` (lines 31-60) и `personalProjects` (lines 62-98) **не трогаем**. Hero (lines 22-29) **не трогаем**.

- [ ] **Step 3: Проверить компиляцию и build**

```bash
npm run check 2>&1 | tail -10
npm run build 2>&1 | tail -10
```

Expected:
- `check`: 0 errors. Тип `p.data.features` корректно выведен из расширенной zod-схемы (Task 1).
- `build`: успех, `22 page(s) built`.

- [ ] **Step 4: Визуальная проверка через dev-сервер**

```bash
npm run dev &
# Подождать ~3 секунды
sleep 3
```

Открыть в браузере (или curl):
- http://localhost:4321/projects — RU.
- http://localhost:4321/en/projects — EN.

Сверить визуально:
- Hero неизменный (H1 «Проекты» / «Projects» + subtitle).
- Секции «Клиентские проекты» / «Личные проекты» **не рендерятся**.
- Секция «SaaS» (RU: heading «SaaS», не «SaaS-проекты»):
  - Сетка 2 колонки на md+ экране.
  - Карточка 1 — Living Tags - прототип / Living Tags Prototype:
    - Title + description.
    - 4 stack-pills: React, TypeScript, Supabase, Claude API.
    - Features-блок «Ключевые особенности» / «Key features» с 7 items в 2col grid; чекмарки teal.
    - Кнопки: «Код» с GitHub-иконкой → github.com/aiaiai-copilot/living-tags-prototype; «Демо» со стрелкой → alexanderlapygin.com/portfolio/living-tags/living-tags-prototype.
  - Карточка 2 — Living Tags MVP:
    - Бейдж «Скоро» (RU) / «Coming Soon» (EN) в правом верху.
    - Title + description.
    - 4 stack-pills.
    - Features-блок с 8 items.
    - opacity 0.7; cursor not-allowed при наведении.
    - **Кнопок нет**.

Завершить dev-сервер:
```bash
# Найти PID и убить, или Ctrl+C если в foreground
pkill -f "astro dev" || true
```

- [ ] **Step 5: Grep-проверка HTML артефактов после build**

```bash
npm run build 2>&1 | tail -3
```

```bash
# Содержимое
grep -c "Living Tags" dist/projects/index.html
grep -c "Living Tags" dist/en/projects/index.html
grep -c "Ключевые особенности" dist/projects/index.html
grep -c "Key features" dist/en/projects/index.html
grep -c "Скоро" dist/projects/index.html
grep -c "Coming Soon" dist/en/projects/index.html
grep -c "Глоссарий тегов" dist/projects/index.html
grep -c "Tag glossary" dist/en/projects/index.html
grep -c "aiaiai-copilot/living-tags-prototype" dist/projects/index.html
grep -c "aiaiai-copilot/living-tags-prototype" dist/en/projects/index.html

# Чего НЕ должно быть
grep -c "SaaS-проекты" dist/projects/index.html
grep -c "Coming Soon" dist/projects/index.html
grep -c "Личные проекты" dist/projects/index.html
grep -c "Клиентские проекты" dist/projects/index.html
grep -c "Personal projects" dist/en/projects/index.html
grep -c "Client projects" dist/en/projects/index.html
```

Expected:
- Содержимое — все `>= 1`.
- НЕ должно быть — все `0`.

Если какой-то «должен быть» grep вернул 0 или «не должен» вернул >0 — остановиться и разобраться, не коммитить.

- [ ] **Step 6: Коммит**

```bash
git add src/components/ProjectsCatalog.astro
git commit -m "$(cat <<'EOF'
feat(projects): inline-rich SaaS cards with features and CTA buttons

Перерабатывает saasProjects секцию /projects под прод-вариант:
сетка 2col, не-кликабельная карточка (article), features-блок
с lucide circle-check-big чекмарками, кнопки Код (GitHub-иконка)
и Демо (стрелка) для не-coming-soon карточек. Stack-pills
рендерятся без slice. clientProjects/personalProjects секции
не тронуты (коллекции пустые после ddae486 + cleanup'а
personal/en).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Финальная верификация (без коммита)

**Files:** — (только чтение/тесты)

- [ ] **Step 1: Полный clean build**

```bash
cd /Users/alexanderlapygin/Projects/alexanderlapygin.com
rm -rf dist .astro
npm run check 2>&1 | tail -5
npm run build 2>&1 | tail -5
```

Expected:
- `check`: `0 errors, 0 warnings, 0 hints`.
- `build`: `22 page(s) built` за разумное время (~5-15 сек).

- [ ] **Step 2: Список собранных страниц**

```bash
find dist -name "index.html" -path "*/projects*" -o -name "index.html" -path "*/en/projects*"
```

Expected (по 1 файлу для каждой локали):
```
dist/projects/index.html
dist/en/projects/index.html
```

(И отсутствие `dist/projects/<slug>/index.html` или `dist/en/projects/<slug>/index.html` — никаких detail-маршрутов для SaaS нет; client-маршруты тоже отсутствуют, коллекция пустая.)

- [ ] **Step 3: Smoke по обоим страницам**

```bash
# RU
echo "=== RU /projects ==="
grep -o "Living Tags - прототип\|Living Tags MVP\|Глоссарий тегов\|Production-ready инфраструктура\|SaaS<\|Скоро\|Ключевые особенности" dist/projects/index.html | sort -u

# EN
echo "=== EN /projects ==="
grep -o "Living Tags Prototype\|Living Tags MVP\|Tag glossary\|Production-ready infrastructure\|SaaS<\|Coming Soon\|Key features" dist/en/projects/index.html | sort -u
```

Expected RU (7 уникальных строк):
```
Production-ready инфраструктура
SaaS<
Глоссарий тегов
Living Tags - прототип
Living Tags MVP
Ключевые особенности
Скоро
```

Expected EN (7 уникальных строк):
```
Coming Soon
Key features
Living Tags MVP
Living Tags Prototype
Production-ready infrastructure
SaaS<
Tag glossary
```

- [ ] **Step 4: Проверить отсутствие старых/удалённых элементов**

```bash
# Не должно быть
echo "=== Negative grep RU ==="
grep -c "SaaS-проекты\|Coming Soon\|Личные проекты\|Клиентские проекты\|oauth-simplest\|telegram-bot-messaging" dist/projects/index.html

echo "=== Negative grep EN ==="
grep -c "Personal projects\|Client projects\|oauth-simplest\|telegram-bot-messaging" dist/en/projects/index.html
```

Expected: оба counter'а `0`.

(Note: «Coming Soon» в RU теперь не должно быть нигде на странице. В EN — должно (это бейдж MVP в EN-локали).)

- [ ] **Step 5: Проверить, что 3 Task 1-5 коммита локально**

```bash
git log --oneline -7
```

Expected: видны коммиты Tasks 1-5 в правильном порядке:
```
<hash> feat(projects): inline-rich SaaS cards with features and CTA buttons
<hash> feat(i18n): projects card keys + RU saasHeading/comingSoon align
<hash> chore(content): drop mis-classified personal/en projects
<hash> feat(content): add Living Tags MVP coming-soon SaaS card (RU/EN)
<hash> feat(content): add features field to projectSaas + populate Living Tags Prototype
<hash> docs(handoff): update for session 2026-05-18 (fifteenth ...)
<hash> chore(content): drop placeholder projects voice-to-spec и llm-spec-tools
```

(Конкретные hash'и не важны — главное последовательность сообщений.)

- [ ] **Step 6: Дать сводку**

Сообщить пользователю:
- Что все 5 коммитов локально, push не делался.
- 22 страницы собираются, все grep-проверки прошли.
- Следующий шаг — stage redeploy в новый `stage-releases/<TS>/` (вне этого плана).

---

## Self-Review / Спецификация vs план

Перед началом исполнения убедиться, что каждое требование спеки покрыто:

| Спека (раздел/решение) | Покрыто в плане |
|---|---|
| Расширить схему `projectSaas` полем `features` | Task 1 Step 2 |
| Удалить `oauth-simplest.md`/`telegram-bot-messaging.md` из `projects-personal/en/` | Task 3 Step 2 |
| Self-reference карточка на сам сайт НЕ добавляется | Не делается (Task 5 переработка ограничена `saasProjects` секцией) |
| Расширить prototype `features` (7 items RU/EN) | Task 1 Steps 3-4 |
| Создать MVP `comingSoon: true` (8 items RU/EN, pubDate 2025-09-01) | Task 2 Steps 1-2 |
| Добавить `featuresHeading`/`codeLink`/`demoLink` в types/ru/en | Task 4 Steps 2,4,5 |
| `saasHeading` RU «SaaS-проекты» → «SaaS» | Task 4 Step 4 |
| `comingSoon` RU «Coming Soon» → «Скоро» | Task 4 Step 4 |
| EN `saasHeading`/`comingSoon` не трогаем | Task 4 Step 5 (только +3 ключа) |
| Карточка `<article>`, не-кликабельная целиком | Task 5 Step 2 (нет `<Tag>`/`href`) |
| Сетка `md:grid-cols-2` (без `lg:grid-cols-3`) | Task 5 Step 2 |
| Stack-pills без `slice(0, 4)` | Task 5 Step 2 (`p.data.stack.map`) |
| Features-блок: heading + 2col grid с чекмарками | Task 5 Step 2 |
| Кнопки Код/Демо рендерятся при `!comingSoon && (repoUrl || liveUrl)` | Task 5 Step 2 (`showButtons` константа) |
| Coming-soon: бейдж + opacity 0.7 + cursor not-allowed + кнопок нет | Task 5 Step 2 |
| Inline-SVG (lucide-style), без библиотек | Task 5 Step 2 (3 inline-SVG) |
| Цвет чекмарка — `var(--color-accent)` | Task 5 Step 2 (`style="color: var(--color-accent);"` на SVG) |
| Build 22 страницы | Tasks 1,2,3,4,5,6 — каждый раз |
| `npm run check` 0/0 | Tasks 1-6 — каждый раз |
| Stage smoke после redeploy | Вне этого плана (отдельная задача — см. HANDOFF) |

**Не покрыто планом по дизайну:**
- Stage redeploy и stage smoke — отдельная задача (см. HANDOFF: «после implementation — `npm run build` + stage redeploy в новый `stage-releases/<TS>/` + smoke + cleanup retention=3»).
- Cutover stage→prod — отдельная итерация.
- Прод-баг «Key Features» латиницей в RU — НЕ исправляем (исправление = в нашей версии правильно локализовано через i18n, что уже делается).

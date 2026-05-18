# mathprepod client project + client-section SaaS-rich + dead-route cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить первый client-проект `mathprepod` (RU+EN), перевести client-секцию `ProjectsCatalog.astro` на SaaS-rich визуал (features + CTA-кнопки), удалить dead-route `/projects/[slug]` (RU+EN) + компонент `ProjectPage.astro`, удалить orphan i18n-ключи `repoLink`, `backLink`, `code`, добавить новый i18n-ключ `siteLink`.

**Architecture:** Astro 5 SSG. Контент — markdown в `src/content/projects-client/<lang>/`, схема в `src/content.config.ts` (без изменений в этой задаче). Рендер — `src/components/ProjectsCatalog.astro` (inline-рендер карточки, без отдельного card-компонента). i18n — словари `src/i18n/{ru,en}.ts` + типы `src/i18n/types.ts`. Иконки — inline SVG (lucide-style 24×24 viewBox), без зависимостей.

**Tech Stack:** Astro 5 (Content Collections, Zod schema), TypeScript, Tailwind CSS, CSS design tokens (`--color-text`, `--color-text-muted`, `--color-bg-elev`, `--color-bg-muted`, `--color-border`, `--color-accent`).

**Test approach:** Нет unit-test инфраструктуры для Astro-компонентов в этом репо (precedent: 16-я сессия). Верификация = `npm run check` (TypeScript + Astro check) + `npm run build` (компиляция всех страниц) + визуальный smoke в `npm run dev` (порт 4321). Это в духе текущего кодстайла.

**Spec:** `docs/superpowers/specs/2026-05-18-mathprepod-client-project-design.md`

---

## Pre-flight

- [ ] **Step 0: Убедиться, что рабочее дерево чистое и ветка корректная**

Run:
```bash
git status
git log --oneline -5
```

Expected: working tree clean, на ветке `main` или на worktree-branch (если запускается через `superpowers:using-git-worktrees`). Последний коммит — `docs(superpowers): mathprepod client project + client-section SaaS-rich + dead-route cleanup spec` (`627c224`).

- [ ] **Step 1: Зафиксировать baseline build**

Run:
```bash
npm run check
npm run build
```

Expected: оба зелёные. Запомнить число "pages built" из вывода build — пригодится для сравнения после удаления dead-route'а. На текущем main коллекция `projects-client` пустая, поэтому dead-route генерирует 0 detail-страниц (getStaticPaths возвращает `[]`).

---

## Task 1: Добавить контент mathprepod (RU + EN)

**Files:**
- Create: `src/content/projects-client/ru/mathprepod.md`
- Create: `src/content/projects-client/en/mathprepod.md`

- [ ] **Step 1.1: Создать директории коллекции**

Run:
```bash
mkdir -p src/content/projects-client/ru src/content/projects-client/en
```

Expected: команда успешна. До этого момента директорий `src/content/projects-client/` не существовало.

- [ ] **Step 1.2: Создать RU-запись `mathprepod.md`**

Создать файл `src/content/projects-client/ru/mathprepod.md` со следующим содержимым:

```markdown
---
title: "МатПрепод"
description: "Онлайн-центр подготовки к экзаменам по математике. Сборка сайта на Tilda и работа над SEO."
pubDate: 2026-05-15
stack: ["Tilda", "SEO", "Семантика", "Контент"]
liveUrl: "https://mathprepod.ru/"
features:
  - "Сборка сайта в Tilda: структура, блоки, формы заявок"
  - "Технический и on-page SEO: метатеги, заголовки, структура"
  - "Сбор семантики и keyword research"
  - "Контент и тексты под SEO"
lang: ru
---
```

Тело файла (под frontmatter'ом) — пустое.

- [ ] **Step 1.3: Создать EN-запись `mathprepod.md`**

Создать файл `src/content/projects-client/en/mathprepod.md` со следующим содержимым:

```markdown
---
title: "MathPrepod"
description: "Online tutoring center for math exam preparation. Built the site on Tilda and led SEO."
pubDate: 2026-05-15
stack: ["Tilda", "SEO", "Keyword research", "Content"]
liveUrl: "https://mathprepod.ru/"
features:
  - "Tilda site build: structure, blocks, lead forms"
  - "Technical and on-page SEO: meta tags, headings, structure"
  - "Keyword research and semantic clustering"
  - "SEO-driven copy and content"
lang: en
---
```

Тело файла — пустое.

- [ ] **Step 1.4: Проверить, что Zod-схема валидирует записи**

Run:
```bash
npm run check
```

Expected: 0 errors. Если есть ошибка валидации (например, неверный формат URL для `liveUrl` или несовпадение `lang` с enum) — исправить frontmatter.

- [ ] **Step 1.5: Проверить build**

Run:
```bash
npm run build
```

Expected: 0 errors. Число pages увеличится на 2 (детальные страницы `/projects/mathprepod` и `/en/projects/mathprepod`, генерируемые dead-route'ом — он будет удалён в Task 4). Карточка mathprepod на `/projects` и `/en/projects` рендерится в СТАРОМ «простом» стиле (description + stack-чипы) и линкует на dead-route detail-страницу — это промежуточное состояние, исправится в Task 3.

- [ ] **Step 1.6: Visual smoke в dev**

Run:
```bash
npm run dev
```

Открыть в браузере `http://localhost:4321/projects` и `http://localhost:4321/en/projects`. Ожидаемо: появилась секция «Клиентские проекты» / «Client projects» с одной карточкой «МатПрепод» / «MathPrepod» в простом стиле (title + description + 4 stack-чипа, без features и CTA). Клик по карточке ведёт на `/projects/mathprepod` (detail-страница через ProjectPage.astro — рендерит features в простом списке + кнопку «Открыть»). Остановить dev (Ctrl+C).

- [ ] **Step 1.7: Commit**

```bash
git add src/content/projects-client/ru/mathprepod.md src/content/projects-client/en/mathprepod.md
git commit -m "$(cat <<'EOF'
feat(content): add mathprepod client project (RU + EN)

Первая запись в коллекции projects-client.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Добавить i18n-ключ `siteLink`

**Files:**
- Modify: `src/i18n/ru.ts:165` (в блоке `projects: {...}`)
- Modify: `src/i18n/en.ts:161` (в блоке `projects: {...}`)
- Modify: `src/i18n/types.ts:92` (в интерфейсе `Dictionary.projects`)

- [ ] **Step 2.1: Добавить ключ в `src/i18n/ru.ts`**

Найти строку `demoLink: "Демо",` в блоке `projects: {...}` (около строки 164). После неё добавить:

```typescript
    siteLink: "Сайт",
```

Финальный фрагмент блока `projects` должен выглядеть так:

```typescript
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
    siteLink: "Сайт",
  },
```

- [ ] **Step 2.2: Добавить ключ в `src/i18n/en.ts`**

Найти строку `demoLink: "Live demo",` в блоке `projects: {...}` (около строки 160). После неё добавить:

```typescript
    siteLink: "Site",
```

Финальный фрагмент:

```typescript
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
    siteLink: "Site",
  },
```

- [ ] **Step 2.3: Добавить тип в `src/i18n/types.ts`**

Найти интерфейс `Dictionary.projects` (около строки 78). Добавить поле `siteLink: string;` после `demoLink: string;` (около строки 91). Финальный фрагмент интерфейса:

```typescript
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
    siteLink: string;
  };
```

- [ ] **Step 2.4: Проверить типы**

Run:
```bash
npm run check
```

Expected: 0 errors. Если TS жалуется на отсутствие `siteLink` в каком-то словаре — значит пропущен один из ru.ts/en.ts/types.ts, доfixить.

- [ ] **Step 2.5: Commit**

```bash
git add src/i18n/ru.ts src/i18n/en.ts src/i18n/types.ts
git commit -m "$(cat <<'EOF'
feat(i18n): add siteLink key for client project CTA

Для client-карточки семантически точнее, чем demoLink (живой сайт
клиента vs SaaS-демо).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Переписать рендер client-секции на SaaS-rich

**Files:**
- Modify: `src/components/ProjectsCatalog.astro:31-60` (полная замена блока)

- [ ] **Step 3.1: Заменить блок `clientProjects` в `ProjectsCatalog.astro`**

Открыть `src/components/ProjectsCatalog.astro`. Найти блок с line 31 до line 60 (текущий рендер `clientProjects`). Целиком заменить на:

```jsx
{clientProjects.length > 0 && (
  <section class="mx-auto max-w-6xl px-4 md:px-6 py-8">
    <h2 class="text-xs uppercase tracking-wider mb-6" style="color: var(--color-text-muted);">
      {dict.projects.clientHeading}
    </h2>
    <div class="grid md:grid-cols-2 gap-4 md:gap-6">
      {clientProjects.map((p) => {
        const showButtons = p.data.repoUrl || p.data.liveUrl;
        return (
          <article
            class="rounded-lg p-5 border block h-full"
            style="border-color: var(--color-border);"
          >
            <h3 class="font-semibold text-lg mb-2" style="color: var(--color-text);">
              {p.data.title}
            </h3>
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
                    <span>{dict.projects.siteLink}</span>
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

После замены — НЕ трогать строки выше (импорты, hero-секцию, личные/SaaS секции).

- [ ] **Step 3.2: Удалить ставший неиспользуемым импорт**

Проверить, используется ли импорт `localizedPath` ещё где-то в файле:

Run:
```bash
grep -n "localizedPath" src/components/ProjectsCatalog.astro
```

- Если есть другие использования (в personal-секции?) — оставить импорт.
- Если был только в удалённом client-блоке (line 39) — удалить из импорта `localizedPath` из `src/components/ProjectsCatalog.astro:3`.

Аналогично для `pageSlug`:
```bash
grep -n "pageSlug" src/components/ProjectsCatalog.astro
```

Если 0 использований — удалить из импорта `src/components/ProjectsCatalog.astro:4`.

Ожидаемо: оба эти импорта были нужны только для старой client-карточки (line 39: `localizedPath(locale, \`/projects/${pageSlug(p.id)}\`)`), после замены — orphan. Их следует удалить.

- [ ] **Step 3.3: Проверить типы**

Run:
```bash
npm run check
```

Expected: 0 errors. Если есть «unused import» — значит Step 3.2 не выполнен полностью.

- [ ] **Step 3.4: Проверить build**

Run:
```bash
npm run build
```

Expected: 0 errors. Число pages без изменений (карточки в новом стиле, но количество страниц то же).

- [ ] **Step 3.5: Visual smoke в dev**

Run:
```bash
npm run dev
```

Открыть в браузере:
- `http://localhost:4321/projects` — секция «Клиентские проекты» теперь в SaaS-rich стиле: карточка mathprepod показывает title + description + 4 stack-чипа + блок «Ключевые особенности» с 4 строками (галочка + текст) + одна CTA-кнопка «Сайт» со стрелкой ↗. Клик по кнопке открывает `https://mathprepod.ru/` в новой вкладке.
- `http://localhost:4321/en/projects` — то же на английском: «MathPrepod», stack EN, «Key features», CTA «Site».
- `http://localhost:4321/` (главная) — без визуальных регрессий.
- `http://localhost:4321/solutions` — без регрессий (там используется `dict.projects.open` — мы его не трогали).

Остановить dev (Ctrl+C).

- [ ] **Step 3.6: Commit**

```bash
git add src/components/ProjectsCatalog.astro
git commit -m "$(cat <<'EOF'
feat(projects): rework client section to SaaS-rich visual

Зеркалит SaaS-секцию: features + CTA-кнопки (Сайт/Site). Карточка
больше не оборачивается в a-ссылку на /projects/<slug>; внешняя
ссылка — через CTA-кнопку, target=_blank.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Удалить dead-route и компонент ProjectPage

**Files:**
- Delete: `src/pages/projects/[slug].astro`
- Delete: `src/pages/en/projects/[slug].astro`
- Delete: `src/components/ProjectPage.astro`

- [ ] **Step 4.1: Подтвердить отсутствие consumer'ов вне удаляемого набора**

Run:
```bash
grep -rn "ProjectPage" src/
```

Expected (точные строки):
- `src/components/ProjectPage.astro:...` — само определение, нормально (удаляется)
- `src/pages/projects/[slug].astro:4: import ProjectPage from "~/components/ProjectPage.astro";`
- `src/pages/projects/[slug].astro:25:  <ProjectPage locale={locale} entry={entry} />`
- `src/pages/en/projects/[slug].astro:4: import ProjectPage from "~/components/ProjectPage.astro";`
- `src/pages/en/projects/[slug].astro:25:  <ProjectPage locale={locale} entry={entry} />`

Если найдены ДРУГИЕ файлы — НЕ удалять, остановиться и разобраться.

Run:
```bash
grep -rn "/projects/\${" src/
```

Expected: 0 матчей (template-литералы `\`/projects/${...}\``), потому что в Task 3 удалили единственный потребитель в `ProjectsCatalog.astro`. Если матч есть — значит остался орфанный код, разобраться.

- [ ] **Step 4.2: Удалить три файла**

Run:
```bash
git rm src/pages/projects/[slug].astro
git rm src/pages/en/projects/[slug].astro
git rm src/components/ProjectPage.astro
```

Expected: команды успешны, файлы помечены к удалению.

- [ ] **Step 4.3: Проверить типы**

Run:
```bash
npm run check
```

Expected: 0 errors. (`ProjectPage.astro` использовал `dict.projects.backLink/open/code`; они пока ОСТАЮТСЯ в словарях — orphan keys удалим в Task 5.)

- [ ] **Step 4.4: Проверить build**

Run:
```bash
npm run build
```

Expected: 0 errors. Число pages = `baseline (после Task 1) - 2` (удалились /projects/mathprepod и /en/projects/mathprepod).

- [ ] **Step 4.5: Smoke 404**

Run:
```bash
npm run dev
```

Открыть `http://localhost:4321/projects/mathprepod` — ожидаемо 404 (страница рендерится через notFound-route). То же для `http://localhost:4321/en/projects/mathprepod`.

Открыть `http://localhost:4321/projects` — карточка mathprepod на месте, CTA «Сайт» работает.

Остановить dev (Ctrl+C).

- [ ] **Step 4.6: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(routes): drop dead-route /projects/[slug] (RU+EN) and ProjectPage component

Route был привязан к коллекции projects-client. После переключения
client-карточки на SaaS-rich визуал с внешней CTA на liveUrl detail-
страница становится недостижимой из навигации.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Удалить orphan i18n-ключи

**Files:**
- Modify: `src/i18n/ru.ts` (в блоке `projects: {...}`)
- Modify: `src/i18n/en.ts` (в блоке `projects: {...}`)
- Modify: `src/i18n/types.ts` (в интерфейсе `Dictionary.projects`)

**Orphan-ключи после удаления dead-route**: `repoLink`, `backLink`, `code`.

**НЕ ТРОГАТЬ**: `open` — используется в `SolutionsPage.astro:52` (`{dict.projects.open} →`).

- [ ] **Step 5.1: Подтвердить orphan-статус каждого ключа**

Run:
```bash
grep -rn "\.projects\.repoLink" src/
grep -rn "\.projects\.backLink" src/
grep -rn "\.projects\.\bcode\b" src/
grep -rn "\.projects\.open\b" src/
```

Expected:
- `repoLink` — 0 матчей (был orphan уже до Task 4)
- `backLink` — 0 матчей (потребитель ProjectPage.astro удалён в Task 4)
- `code` — 0 матчей (потребитель ProjectPage.astro удалён в Task 4)
- `open` — минимум 1 матч в `src/components/SolutionsPage.astro` — **НЕ orphan, оставить**

Если какой-то из orphan-ключей внезапно используется где-то ещё (например, в personal-секции `ProjectsCatalog.astro`) — не удалять его, разобраться.

- [ ] **Step 5.2: Удалить ключи из `src/i18n/ru.ts`**

В блоке `projects: {...}` удалить три строки:

```typescript
    repoLink: "Репозиторий",
    backLink: "← Все проекты",
    code: "Код",
```

После удаления блок `projects` должен выглядеть так:

```typescript
  projects: {
    title: "Проекты",
    subtitle:
      "Клиентские проекты, личные эксперименты и SaaS-продукты, над которыми я работал.",
    clientHeading: "Клиентские проекты",
    personalHeading: "Личные проекты",
    saasHeading: "SaaS",
    comingSoon: "Скоро",
    open: "Открыть",
    featuresHeading: "Ключевые особенности",
    codeLink: "Код",
    demoLink: "Демо",
    siteLink: "Сайт",
  },
```

- [ ] **Step 5.3: Удалить ключи из `src/i18n/en.ts`**

В блоке `projects: {...}` удалить три строки:

```typescript
    repoLink: "Repository",
    backLink: "← All projects",
    code: "Code",
```

После удаления блок `projects` должен выглядеть так:

```typescript
  projects: {
    title: "Projects",
    subtitle:
      "Client work, personal experiments and SaaS products I've worked on.",
    clientHeading: "Client projects",
    personalHeading: "Personal projects",
    saasHeading: "SaaS",
    comingSoon: "Coming Soon",
    open: "Open",
    featuresHeading: "Key features",
    codeLink: "Code",
    demoLink: "Live demo",
    siteLink: "Site",
  },
```

- [ ] **Step 5.4: Удалить типы из `src/i18n/types.ts`**

В интерфейсе `Dictionary.projects` удалить три строки:

```typescript
    repoLink: string;
    backLink: string;
    code: string;
```

После удаления интерфейс должен выглядеть так:

```typescript
  projects: {
    title: string;
    subtitle: string;
    clientHeading: string;
    personalHeading: string;
    saasHeading: string;
    comingSoon: string;
    open: string;
    featuresHeading: string;
    codeLink: string;
    demoLink: string;
    siteLink: string;
  };
```

- [ ] **Step 5.5: Проверить типы**

Run:
```bash
npm run check
```

Expected: 0 errors. Если есть жалоба «Property 'X' does not exist» — значит где-то ещё используется удалённый ключ, который грep пропустил (например, в нестандартном написании). Восстановить ключ, исследовать.

- [ ] **Step 5.6: Проверить build**

Run:
```bash
npm run build
```

Expected: 0 errors. Число pages = то же, что в Task 4 (i18n cleanup не влияет на маршрутизацию).

- [ ] **Step 5.7: Финальный visual smoke**

Run:
```bash
npm run dev
```

Открыть:
- `http://localhost:4321/projects` + `http://localhost:4321/en/projects` — карточка mathprepod в SaaS-rich стиле, CTA «Сайт»/«Site» работает.
- `http://localhost:4321/solutions` + `http://localhost:4321/en/solutions` — без регрессий, кнопки «Открыть»/«Open» (которые используют `dict.projects.open`) работают.
- `http://localhost:4321/` (главная) — без регрессий.

Остановить dev.

- [ ] **Step 5.8: Commit**

```bash
git add src/i18n/ru.ts src/i18n/en.ts src/i18n/types.ts
git commit -m "$(cat <<'EOF'
chore(i18n): drop orphan keys repoLink/backLink/code after dead-route removal

Все три были использованы только в удалённых ProjectPage.astro и
/projects/[slug].astro. Ключ projects.open оставлен — используется
в SolutionsPage.astro.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Верификация без коммита

- [ ] **Step 6.1: Финальный clean build**

Run:
```bash
npm run check
npm run build
```

Expected: оба зелёные, 0 errors.

- [ ] **Step 6.2: Сводка по коммитам**

Run:
```bash
git log --oneline 627c224..HEAD
```

Expected: 5 коммитов:
```
<sha> chore(i18n): drop orphan keys repoLink/backLink/code after dead-route removal
<sha> chore(routes): drop dead-route /projects/[slug] (RU+EN) and ProjectPage component
<sha> feat(projects): rework client section to SaaS-rich visual
<sha> feat(i18n): add siteLink key for client project CTA
<sha> feat(content): add mathprepod client project (RU + EN)
```

- [ ] **Step 6.3: Сводка изменений**

Run:
```bash
git diff --stat 627c224..HEAD
```

Expected: ~7 файлов:
- `src/content/projects-client/ru/mathprepod.md` (new)
- `src/content/projects-client/en/mathprepod.md` (new)
- `src/i18n/ru.ts` (modified)
- `src/i18n/en.ts` (modified)
- `src/i18n/types.ts` (modified)
- `src/components/ProjectsCatalog.astro` (modified)
- `src/pages/projects/[slug].astro` (deleted)
- `src/pages/en/projects/[slug].astro` (deleted)
- `src/components/ProjectPage.astro` (deleted)

- [ ] **Step 6.4: Готовность к интеграции**

Если работа велась в worktree — готов к merge в main. Если на main — готов к push (за пользователем, накопилось 7+ коммитов после handoff'а 16-й сессии; никаких автопушей).

Stage redeploy — НЕ часть этой задачи (отдельный шаг по HANDOFF, п.2 в "Осталось недоделанным" 16-й сессии).

# Content seed from prod — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить заглушки на главной (`[1,2,3].map(...)` placeholders) реальным контентом из коллекций; засеять `src/content/{posts,projects-personal,solutions}/` мирроингом прод-источника; переписать i18n home/about на прод-голос; подготовить EN OG-image и nginx alias для legacy `/portfolio/` URL'ов. Открывает последний блокер cutover stage→prod.

**Architecture:** 4 фазы = 4 атомарных коммита. Phase 1 — только `.md`-файлы (контент seed). Phase 2 — типы i18n + HomePage rename. Phase 3 — HomePage rewire на `getCollection`. Phase 4 — branding и nginx. Каждая фаза независимо reverteable; ревью-checkpoint между фазами.

**Tech Stack:** Astro 5 (content collections, `getCollection`), TypeScript (strict), Zod schemas (`content.config.ts`), Tailwind, resvg-js, nginx.

**Spec:** `docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md`

**Prod source repo:** `~/Projects/mind-section-dev-portfolio-by-lovable` (отдельный git-репо, не submodule).

---

## File Structure (post-implementation)

**Content (`src/content/`):**
- `posts/{ru,en}/sdd-{intro,backstory,first-experience}.md` — 6 файлов, NEW
- `projects-personal/ru/{sbp-payments,living-tags-prototype}.md` — NEW
- `projects-personal/en/{oauth-simplest,telegram-bot-messaging,living-tags-prototype}.md` — NEW
- `projects-personal/ru/llm-spec-tools.md` — MODIFIED (placeholder body)
- `projects-client/ru/voice-to-spec.md` — MODIFIED (TBD-маркер в liveUrl)
- `solutions/en/{spec-trio,static-site-with-ssr}.md` — NEW (skeletons)

**i18n:**
- `src/i18n/types.ts` — MODIFIED (rename `philosophy*` → `sdd`, +`heroTagline`)
- `src/i18n/ru.ts` — MODIFIED (home rewrite, about rewrite)
- `src/i18n/en.ts` — MODIFIED (mirror EN)

**Components:**
- `src/components/HomePage.astro` — MODIFIED (phase 2: rename dict refs + tagline; phase 3: getCollection rewire)

**Layout/branding:**
- `src/assets/branding/og-en.svg` — NEW
- `public/og-en.png` — NEW (generated)
- `src/scripts/build-branding-assets.mjs` — MODIFIED (+og-en pipeline)
- `src/layouts/BaseLayout.astro` — MODIFIED (locale-conditional og:image)

**Deploy:**
- `deploy/nginx/alexanderlapygin.com.conf` — MODIFIED (+`location ^~ /portfolio/`)

---

# PHASE 1 — Seed content from prod source

**Commit:** `feat(content): seed posts and personal projects from prod source`

### Task 1: Seed SDD posts (RU)

**Files:**
- Create: `src/content/posts/ru/sdd-intro.md`
- Create: `src/content/posts/ru/sdd-backstory.md`
- Create: `src/content/posts/ru/sdd-first-experience.md`

**Source:** `~/Projects/mind-section-dev-portfolio-by-lovable/src/data/blogPosts.ts`, RU array строки 197-283.

- [ ] **Step 1: Создать `src/content/posts/ru/sdd-intro.md`**

Frontmatter (RU array, lines 199-225):
```yaml
---
title: "SDD: Смена парадигмы"
description: |
  SDD (Spec-Driven Development) — парадигма разработки программ, при которой рутинное кодирование выполняется LLM на основе заданных спецификаций.
  Это введение в серию статей о нашем раннем опыте и лучших практиках этого многообещающего подхода.
pubDate: 2025-10-13
tags: ["sdd"]
featured: true
draft: false
lang: ru
---
```

Body: скопировать значение `content`-поля из RU array `sdd-intro` (lines 203-219 в blogPosts.ts) — markdown с ссылкой `[Далее](sdd-backstory)` в конце.

```bash
# Extract body for reference:
sed -n '203,219p' ~/Projects/mind-section-dev-portfolio-by-lovable/src/data/blogPosts.ts
```

- [ ] **Step 2: Создать `src/content/posts/ru/sdd-backstory.md`**

Frontmatter:
```yaml
---
title: "Предыстория"
description: "Вайб-кодинг, подпитываемый инструментами вроде Lovable и Replit, отлично подходит для быстрой проверки идей и создания прототипов, но к нему есть и вопросы. Например, смогут ли современные ИИ-агенты наряду с бесконечными 'вау-эффектами' показывать способность управления развитием и поддержкой сложных долгоживущих проектов?"
pubDate: 2025-10-14
tags: ["sdd"]
featured: true
draft: false
lang: ru
---
```

Body: значение `content` из `sdd-backstory` (blogPosts.ts:231-250). Содержит markdown-ссылки `[Назад](sdd-intro) | [Далее](sdd-first-experience)`.

- [ ] **Step 3: Создать `src/content/posts/ru/sdd-first-experience.md`**

Frontmatter:
```yaml
---
title: "Первый опыт SDD"
description: "Когда все тесты в TDD основаны на контрактах, разработка становится Specification-First Development. А если при этом используются ещё и инструменты искусственного интеллекта, то получается как раз то, что сегодня называется SDD — Spec-Driven Development."
pubDate: 2025-10-15
tags: ["sdd"]
featured: false
draft: false
lang: ru
---
```

Body: значение `content` из `sdd-first-experience` (blogPosts.ts:261-277).

- [ ] **Step 4: Verify schema**

```bash
npm run check
```

Expected: 0 errors. Все 3 RU поста пройдут zod-валидацию (`posts` schema из `src/content.config.ts:6-18`).

### Task 2: Seed SDD posts (EN)

**Files:**
- Create: `src/content/posts/en/sdd-intro.md`
- Create: `src/content/posts/en/sdd-backstory.md`
- Create: `src/content/posts/en/sdd-first-experience.md`

**Source:** `~/Projects/mind-section-dev-portfolio-by-lovable/src/data/blogPosts.ts`, EN array строки 13-98.

- [ ] **Step 1: Создать `src/content/posts/en/sdd-intro.md`**

Frontmatter:
```yaml
---
title: "SDD shifts the paradigm"
description: "SDD (Spec-Driven Development), a paradigm where LLMs handle routine coding based on specifications. This is our intro to a series sharing our early experience and best practices for this transformative approach."
pubDate: 2025-10-13
tags: ["sdd"]
featured: true
draft: false
lang: en
---
```

Body: значение `content` из EN `sdd-intro` (blogPosts.ts:18-35).

- [ ] **Step 2: Создать `src/content/posts/en/sdd-backstory.md`**

Frontmatter:
```yaml
---
title: "Backstory"
description: "The 'Vibe Coding' boom, fueled by tools like Lovable and Replit, is great for quick MVPs, but the real question is scalability. We're wondering whether LLMs can move from 'wow effects' to managing the long-term growth and maintenance of complex brownfield projects."
pubDate: 2025-10-14
tags: ["sdd"]
featured: true
draft: false
lang: en
---
```

Body: значение `content` из EN `sdd-backstory` (blogPosts.ts:46-65).

- [ ] **Step 3: Создать `src/content/posts/en/sdd-first-experience.md`**

Frontmatter:
```yaml
---
title: "First SDD Experience"
description: "By treating contract tests as living specifications in a TDD cycle with AI, we gained the insight that specifications are the best way to govern and control LLM-generated code."
pubDate: 2025-10-15
tags: ["sdd"]
featured: false
draft: false
lang: en
---
```

Body: значение `content` из EN `sdd-first-experience` (blogPosts.ts:76-91).

- [ ] **Step 4: Verify**

```bash
npm run check
```

Expected: 0 errors.

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/blog | grep -c "SDD\|Зачем спецификация\|Статика по умолчанию"
# Expected: > 4 (at least 4 хита: 3 SDD карточки + 2 stage post titles, плюс возможные хвосты в навигации)
kill %1 2>/dev/null
```

### Task 3: Seed personal projects

**Files:**
- Create: `src/content/projects-personal/en/oauth-simplest.md`
- Create: `src/content/projects-personal/en/telegram-bot-messaging.md`
- Create: `src/content/projects-personal/ru/sbp-payments.md`
- Create: `src/content/projects-personal/ru/living-tags-prototype.md`
- Create: `src/content/projects-personal/en/living-tags-prototype.md`

**Source:** `~/Projects/mind-section-dev-portfolio-by-lovable/src/data/showcaseProjects.ts` для showcase'ов, `src/i18n/locales/ru.json` lines 209-227 для living-tags.

Schema reference: `src/content.config.ts:40-52`. Поля: `title`, `description`, `pubDate`, `stack`, `liveUrl` (optional, .url()), `image` (optional), `repoUrl` (optional), `lang`.

- [ ] **Step 1: Создать `src/content/projects-personal/en/oauth-simplest.md`**

```yaml
---
title: "Simplest authentication"
description: "A demonstration of client-side only authentication, allowing users to sign in with their existing accounts from major providers like Google or GitHub without needing a backend"
pubDate: 2025-10-01
stack: ["OAuth", "React", "TypeScript"]
liveUrl: "https://alexanderlapygin.com/showcase/oauth/simplest/"
lang: en
---
```

Body: пустое (Astro допускает пустое body, `ProjectPage.astro` рендерит frontmatter-карточку без body-блока).

- [ ] **Step 2: Создать `src/content/projects-personal/en/telegram-bot-messaging.md`**

```yaml
---
title: "Telegram Bot messaging"
description: "Instant sending of data from a web form to a Telegram channel"
pubDate: 2025-10-01
stack: ["Telegram", "Web", "Serverless"]
liveUrl: "https://alexanderlapygin.com/showcase/telegram-bot/messaging/"
lang: en
---
```

Body: пустое.

- [ ] **Step 3: Создать `src/content/projects-personal/ru/sbp-payments.md`**

```yaml
---
title: "СБП Платежи"
description: "Интеграция с Системой быстрых платежей для генерации QR-кодов и приема оплаты в реальном времени"
pubDate: 2025-10-01
stack: ["СБП", "React", "TypeScript", "Payment API"]
liveUrl: "https://alexanderlapygin.com/showcase/payments/sbp/"
lang: ru
---
```

Body: пустое.

- [ ] **Step 4: Создать `src/content/projects-personal/ru/living-tags-prototype.md`**

Source: prod `src/i18n/locales/ru.json` lines 209-227 (`portfolio.projects.livingTagsPrototype`) + `src/pages/Portfolio.tsx:30-32`.

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

Body: пустое.

- [ ] **Step 5: Создать `src/content/projects-personal/en/living-tags-prototype.md`**

Source: prod `src/i18n/locales/en.json` `portfolio.projects.livingTagsPrototype`.

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

Body: пустое.

- [ ] **Step 6: Verify schema**

```bash
npm run check
```

Expected: 0 errors. Все 5 personal проектов пройдут zod-валидацию.

### Task 4: Fix stage stubs

**Files:**
- Modify: `src/content/projects-client/ru/voice-to-spec.md:6`
- Modify: `src/content/projects-personal/ru/llm-spec-tools.md` (add body)

- [ ] **Step 1: Заменить заглушечный `liveUrl` в `voice-to-spec.md`**

Edit `src/content/projects-client/ru/voice-to-spec.md`, line 6:

Old:
```
liveUrl: "https://example.com/voice-to-spec"
```

New:
```
liveUrl: "https://example.com/voice-to-spec-tbd"
```

Rationale: `projects-client.liveUrl` обязательно (см. `content.config.ts:27` — без `.optional()`). `-tbd` суффикс делает явным, что URL — placeholder, требующий замены реальным значением перед cutover'ом.

- [ ] **Step 2: Добавить placeholder body в `llm-spec-tools.md`**

После строки 8 (`---` закрытие frontmatter) добавить тело:

```markdown

## Цель

Утилиты командной строки и шаблоны для написания и валидации технических спецификаций при работе с LLM-ассистентами. Назначение — стандартизировать структуру spec-документов, проверять их полноту и обеспечивать совместимость с разными моделями.

## Состояние

Набор пока развивается; репозиторий открыт. Подробное описание появится по мере стабилизации API.
```

- [ ] **Step 3: Verify**

```bash
npm run check && npm run build
```

Expected: 0 errors, успешный билд.

### Task 5: EN solutions skeletons + commit phase 1

**Files:**
- Create: `src/content/solutions/en/spec-trio.md`
- Create: `src/content/solutions/en/static-site-with-ssr.md`

Schema reference: `src/content.config.ts:69-82`. Required: `title`, `description`, `category`, `lang`. Optional: `order`, `features`, `image`, `demoUrl`, `repoUrl`.

- [ ] **Step 1: Создать `src/content/solutions/en/spec-trio.md`**

```yaml
---
title: "Spec / decisions / runbook trio"
description: "Project documentation template: technical spec + decision log + operations runbook. A proven set for projects of any size."
category: "Documentation"
order: 10
features:
  - "Formal acceptance criteria"
  - "Decision log with alternatives"
  - "Operations runbook"
  - "Templates for LLM assistants"
lang: en
---
```

Body: пустое (skeleton). Заполнение — открытый элемент § 7 спеки.

- [ ] **Step 2: Создать `src/content/solutions/en/static-site-with-ssr.md`**

EN-зеркало `src/content/solutions/ru/static-site-with-ssr.md`. `category` и `order` — сохраняем как в ru-файле (`category: "Веб-сайт"` → нужен перевод; `order: 20` — без изменений).

```yaml
---
title: "Static site with a single SSR endpoint"
description: "Astro + static + one endpoint for the contact form. Bilingual infrastructure, themes, spam protection."
category: "Website"
order: 20
features:
  - "Bilingual infrastructure from day one"
  - "Light / dark themes without flash-of-incorrect-theme"
  - "Contact form with spam protection"
  - "Lighthouse mobile ≥ 80"
lang: en
---
```

Body: пустое (skeleton).

- [ ] **Step 3: Verify**

```bash
npm run check && npm run build
```

Expected: 0 errors.

- [ ] **Step 4: Verify rendered output**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/projects | grep -E "Voice-to-spec|СБП|llm-spec-tools|scoped-tasks" | wc -l
# Expected: >= 4 (RU side has: voice-to-spec, sbp-payments, llm-spec-tools, living-tags-prototype, scoped-tasks)
curl -s http://localhost:4321/en/projects | grep -E "Simplest authentication|Telegram Bot|Living Tags" | wc -l
# Expected: >= 3
curl -s http://localhost:4321/blog | grep -c "SDD\|спецификация\|Статика"
# Expected: > 0
curl -s http://localhost:4321/en/blog | grep -c "SDD\|spec\|Why"
# Expected: > 0
curl -s http://localhost:4321/en/solutions | grep -c "Spec.*trio\|Static-by-default"
# Expected: > 0
kill %1 2>/dev/null
```

- [ ] **Step 5: Commit phase 1**

```bash
git add src/content/posts/ src/content/projects-personal/ src/content/projects-client/ru/voice-to-spec.md src/content/solutions/en/
git status
git commit -m "$(cat <<'EOF'
feat(content): seed posts and personal projects from prod source

- 6 new SDD posts (RU + EN) from mind-section-dev-portfolio source.
- 5 new personal projects (oauth/telegram/living-tags EN, sbp/living-tags RU).
- Replace example.com voice-to-spec liveUrl with -tbd marker.
- Add placeholder body to llm-spec-tools.
- Add EN solutions skeletons (spec-trio, static-site-with-ssr).

Open items (block cutover, not commit): real liveUrl for voice-to-spec,
body for llm-spec-tools, single-locale showcase translations, EN solutions
bodies. Per spec §7 docs/superpowers/specs/2026-05-17-content-seed-from-prod-design.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: единый коммит со всеми контент-файлами phase 1.

---

# PHASE 2 — i18n + About to prod voice

**Commit:** `feat(i18n): rewrite home and about to prod voice, add hero tagline`

### Task 6: Update `Dictionary` type

**Files:**
- Modify: `src/i18n/types.ts:44-56`

- [ ] **Step 1: Заменить `home` секцию в `Dictionary`**

В `src/i18n/types.ts`, заменить блок `home` (lines 44-56):

Old:
```ts
home: {
  heroTitle: string;
  heroSubtitle: string;
  philosophyTitle: string;
  philosophyBody: string;
  advantagesTitle: string;
  advantages: { title: string; body: string }[];
  featuredProjectsTitle: string;
  featuredProjectsLink: string;
  latestPostsTitle: string;
  latestPostsLink: string;
  cta: string;
};
```

New:
```ts
home: {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  sdd: {
    title: string;
    description: string;
  };
  advantagesTitle: string;
  advantages: { title: string; body: string }[];
  featuredProjectsTitle: string;
  featuredProjectsLink: string;
  latestPostsTitle: string;
  latestPostsLink: string;
  cta: string;
};
```

Изменения:
- Удалить `philosophyTitle`, `philosophyBody`.
- Добавить `heroTagline: string`.
- Добавить вложенный `sdd: { title, description }`.

- [ ] **Step 2: Verify (intentional TS errors)**

```bash
npm run check
```

Expected: **ОЖИДАЕМЫЕ ошибки** в `src/i18n/ru.ts` и `src/i18n/en.ts` (свойство `philosophyTitle` отсутствует в типе, требуются `heroTagline` и `sdd`) — они закроются в Task 7 и Task 8. Если ошибок нет — значит правка типа не применилась.

### Task 7: Update `ru.ts`

**Files:**
- Modify: `src/i18n/ru.ts:47-82, 83-154`

- [ ] **Step 1: Заменить блок `home` в `ru.ts`**

Заменить весь блок `home: { ... }` (lines 47-82) на:

```ts
home: {
  heroTitle: "Александр Лапыгин",
  heroSubtitle: "Разработка Web-приложений",
  heroTagline:
    "От идей до работающих решений.\nПроекты, готовые к дальнейшему развитию людьми и AI-агентами.",
  sdd: {
    title: "AI- и Spec-Driven Development",
    description:
      "В основе любого этапа разработки лежит детальная спецификация — исходник для AI и ориентир для людей. Это гарантирует точность реализации, актуальность и полноту документации на всех этапах жизненного цикла продукта.",
  },
  advantagesTitle: "Что вы получаете",
  advantages: [
    {
      title: "Технический партнер",
      body: "Поддержка полного цикла разработки: от анализа требований и дизайна архитектуры до написания кода и настройки серверов.",
    },
    {
      title: "Прозрачность",
      body: "Прогресс в реальном времени: регулярные демо-версии, понятные отчеты, никаких «черных ящиков».",
    },
    {
      title: "Полный контроль над проектом",
      body: "Отсутствие зависимости от одного разработчика. Вы получаете полностью отчуждаемый код и инфраструктуру, которыми владеете на 100%.",
    },
    {
      title: "AI-ready архитектура",
      body: "Документация, архитектура и промпты оптимизированы для лёгкого онбординга новых сотрудников и быстрого развития проекта с помощью AI-инструментов.",
    },
  ],
  featuredProjectsTitle: "Клиентские проекты",
  featuredProjectsLink: "Все проекты",
  latestPostsTitle: "Последние публикации",
  latestPostsLink: "Все публикации",
  cta: "Обсудить проект",
},
```

- [ ] **Step 2: Заменить блок `about.approachBody` и `about.expertise` в `ru.ts`**

Найти `approachBody: [` (around line 86) и заменить массив на:

```ts
approachBody: [
  "Full-stack разработчик, эксперт по разработке на основе спецификаций и AI-инструментов. Создаю программные продукты с нуля. Консультирую по AI- и Spec-Driven Development.",
  "Использование современных AI-инструментов позволяет ускоряться без потери качества. Любая команда или AI смогут продолжить разработку на любом этапе.",
  "Если задача не ваша — скажу прямо и порекомендую коллег.",
],
```

Найти `expertise: [` (around line 92) и заменить первые 3 группы (frontend/backend/architecture) на прод-формулировки. Оставшиеся 2 группы (AI-инструменты, Документация) — keep stage as is.

```ts
expertise: [
  {
    group: "Frontend",
    items: ["TypeScript", "JavaScript", "React", "и др."],
  },
  {
    group: "Backend",
    items: ["Node.js", "TypeScript", "Java/Kotlin", "PostgreSQL", "Supabase", "Redis", "и др."],
  },
  {
    group: "Архитектура",
    items: ["Чистая архитектура", "Feature-Sliced Design", "Serverless", "и др."],
  },
  {
    group: "AI-инструменты",
    items: [
      "Интеграция LLM в продукт",
      "Документация для ассистентов",
      "Voice-to-spec пайплайны",
    ],
  },
  {
    group: "Документация",
    items: [
      "Технические спецификации",
      "Runbook'и эксплуатации",
      "Журналы решений",
    ],
  },
],
```

`timeline`, `education`, `cta` в `about` — **не трогать** (keep stage).

- [ ] **Step 3: Verify (EN errors only)**

```bash
npm run check
```

Expected: ошибки остаются только в `src/i18n/en.ts`; в `ru.ts` — 0. Закрываются в Task 8.

### Task 8: Update `en.ts`

**Files:**
- Modify: `src/i18n/en.ts:43-78, 79-146`

- [ ] **Step 1: Заменить блок `home` в `en.ts`**

```ts
home: {
  heroTitle: "Alexander Lapygin",
  heroSubtitle: "Web Application Development",
  heroTagline:
    "Sustainable code. Clear architecture.\nDocumentation that works — for people and tools",
  sdd: {
    title: "AI- and Spec-Driven Development",
    description:
      "At the core of every development stage lies a detailed specification — a source for AI and a guide for humans. This guarantees implementation accuracy, relevance, and completeness of documentation at all stages of the product lifecycle.",
  },
  advantagesTitle: "What you get",
  advantages: [
    {
      title: "Technical Partner",
      body: "Full development cycle support: from requirements analysis and architecture design to writing code and server configuration.",
    },
    {
      title: "Transparency",
      body: "Real-time progress: regular demos, clear reports, no 'black boxes'.",
    },
    {
      title: "No Vendor Lock-in",
      body: "No dependency on a single developer. You receive fully transferable code and infrastructure that you own 100%.",
    },
    {
      title: "AI-ready Architecture",
      body: "Documentation, architecture, and prompts are optimized for easy onboarding of new team members and rapid project development with AI tools.",
    },
  ],
  featuredProjectsTitle: "Client projects",
  featuredProjectsLink: "All projects",
  latestPostsTitle: "Latest posts",
  latestPostsLink: "All posts",
  cta: "Discuss a project",
},
```

- [ ] **Step 2: Заменить `about.approachBody` и `about.expertise` в `en.ts`**

```ts
approachBody: [
  "Full-stack developer, expert in spec-driven and AI-driven development. Build software products from scratch. Consult on AI- and Spec-Driven Development.",
  "Modern AI tools let me speed up without losing quality. Any team or AI assistant can continue development from any point.",
  "If a problem isn't mine — I'll say so and recommend the right people.",
],
```

```ts
expertise: [
  {
    group: "Frontend",
    items: ["TypeScript", "JavaScript", "React", "etc"],
  },
  {
    group: "Backend",
    items: ["Node.js", "TypeScript", "Java", "PostgreSQL", "Supabase", "Redis", "etc"],
  },
  {
    group: "Architecture",
    items: ["Clean architecture", "Feature-Sliced Design", "Serverless", "etc"],
  },
  {
    group: "AI tooling",
    items: [
      "Embedding LLMs into products",
      "Documentation for assistants",
      "Voice-to-spec pipelines",
    ],
  },
  {
    group: "Documentation",
    items: ["Technical specifications", "Operations runbooks", "Decision journals"],
  },
],
```

`timeline`, `education`, `cta` — keep stage.

- [ ] **Step 3: Verify (HomePage errors only)**

```bash
npm run check
```

Expected: ошибки остаются только в `src/components/HomePage.astro` (использует `philosophyTitle`/`philosophyBody`). Закрываются в Task 9.

### Task 9: HomePage — rename dict refs + add tagline

**Files:**
- Modify: `src/components/HomePage.astro:36-42, 13-29`

- [ ] **Step 1: Переименовать `philosophy*` refs**

В `src/components/HomePage.astro`, найти блок (lines 31-43):

Old:
```astro
<section class="mx-auto max-w-6xl px-4 md:px-6 pb-12">
  <div
    class="rounded-xl p-6 md:p-8 border"
    style="background-color: var(--color-bg-elev); border-color: var(--color-border);"
  >
    <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text-muted);">
      {dict.home.philosophyTitle}
    </div>
    <p class="text-lg leading-relaxed" style="color: var(--color-text);">
      {dict.home.philosophyBody}
    </p>
  </div>
</section>
```

New:
```astro
<section class="mx-auto max-w-6xl px-4 md:px-6 pb-12">
  <div
    class="rounded-xl p-6 md:p-8 border"
    style="background-color: var(--color-bg-elev); border-color: var(--color-border);"
  >
    <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text-muted);">
      {dict.home.sdd.title}
    </div>
    <p class="text-lg leading-relaxed" style="color: var(--color-text);">
      {dict.home.sdd.description}
    </p>
  </div>
</section>
```

- [ ] **Step 2: Добавить `heroTagline` рендер**

В hero-секции (lines 11-29) расширить блок с `heroSubtitle`. Найти:

Old:
```astro
<div>
  <h1 class="text-3xl md:text-5xl font-semibold tracking-tight" style="color: var(--color-text);">
    {dict.home.heroTitle}
  </h1>
  <p class="mt-4 text-lg md:text-xl max-w-2xl leading-relaxed" style="color: var(--color-text-muted);">
    {dict.home.heroSubtitle}
  </p>
</div>
```

New:
```astro
<div>
  <h1 class="text-3xl md:text-5xl font-semibold tracking-tight" style="color: var(--color-text);">
    {dict.home.heroTitle}
  </h1>
  <p class="mt-2 text-xl md:text-2xl font-medium" style="color: var(--color-text);">
    {dict.home.heroSubtitle}
  </p>
  <p
    class="mt-4 text-base md:text-lg max-w-2xl leading-relaxed whitespace-pre-line"
    style="color: var(--color-text-muted);"
  >
    {dict.home.heroTagline}
  </p>
</div>
```

Изменения:
- `heroSubtitle` теперь короткий roleline под именем (medium font, основной цвет текста).
- `heroTagline` — длинный текст под ним с `whitespace-pre-line` (CSS render `\n` как `<br>`-визуально без HTML-инъекции).

- [ ] **Step 3: Verify**

```bash
npm run check
```

Expected: **0 errors**, 0 warnings.

```bash
npm run build
```

Expected: успешный билд.

- [ ] **Step 4: Verify rendered hero**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/ | grep -E "Александр Лапыгин|Разработка Web-приложений|От идей до работающих решений"
# Expected: 3 строки, все три ключевые фразы присутствуют

curl -s http://localhost:4321/en/ | grep -E "Alexander Lapygin|Web Application Development|Sustainable code"
# Expected: 3 строки, EN-зеркало

curl -s http://localhost:4321/about | grep "Full-stack разработчик"
# Expected: present (прод биография)

curl -s http://localhost:4321/en/about | grep "Full-stack developer"
# Expected: present (EN биография)

kill %1 2>/dev/null
```

- [ ] **Step 5: Commit phase 2**

```bash
git add src/i18n/types.ts src/i18n/ru.ts src/i18n/en.ts src/components/HomePage.astro
git status
git commit -m "$(cat <<'EOF'
feat(i18n): rewrite home and about to prod voice, add hero tagline

- Rename home.philosophy{Title,Body} → home.sdd.{title,description} (Dictionary
  type + ru.ts + en.ts + HomePage.astro consumers).
- Add home.heroTagline (rendered with CSS white-space: pre-line so \n in the
  string maps to visual line breaks without HTML injection).
- Rewrite home.advantages[] to prod-voice formulations.
- Rewrite about.approachBody (prod biography) and about.expertise frontend/
  backend/architecture groups (prod tech-stack formulations). Keep stage's
  AI-tools, Documentation groups + timeline + education entries.
- Hero layout: heroSubtitle as a short role-line under name, heroTagline as
  the long paragraph (visual hierarchy matches prod).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 3 — HomePage rewire to collections

**Commit:** `feat(home): rewire featured projects and latest posts to content collections`

### Task 10: Replace `[1,2,3].map` placeholders with `getCollection`

**Files:**
- Modify: `src/components/HomePage.astro` (frontmatter import block + 2 sections)

- [ ] **Step 1: Расширить frontmatter `HomePage.astro`**

Найти текущий frontmatter (lines 1-9):

Old:
```astro
---
import { localizedPath, t, type Locale } from "~/i18n";

interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const dict = t(locale);
---
```

New:
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

type ProjectKind = "client" | "personal" | "saas";

const clientProjects = await getCollection(
  "projects-client",
  (e) => e.data.lang === locale,
);
const personalProjects = await getCollection(
  "projects-personal",
  (e) => e.data.lang === locale,
);
const saasProjects = await getCollection(
  "projects-saas",
  (e) => e.data.lang === locale,
);

const allProjects = [
  ...clientProjects.map((e) => ({
    entry: e,
    kind: "client" as ProjectKind,
    featured: e.data.featured ?? false,
  })),
  ...personalProjects.map((e) => ({
    entry: e,
    kind: "personal" as ProjectKind,
    featured: false,
  })),
  ...saasProjects.map((e) => ({
    entry: e,
    kind: "saas" as ProjectKind,
    featured: false,
  })),
];

const featuredFirst = allProjects.filter((p) => p.featured);
const rest = allProjects
  .filter((p) => !p.featured)
  .sort(
    (a, b) => b.entry.data.pubDate.getTime() - a.entry.data.pubDate.getTime(),
  );
const featuredProjects = [...featuredFirst, ...rest].slice(0, 3);

const posts = (
  await getCollection(
    "posts",
    (e) => e.data.lang === locale && !e.data.draft,
  )
)
  .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
  .slice(0, 3);

function projectHref(p: (typeof allProjects)[number]) {
  return localizedPath(locale, `/projects/${pageSlug(p.entry.id)}`);
}

function postHref(p: (typeof posts)[number]) {
  return localizedPath(locale, `/blog/${pageSlug(p.id)}`);
}

function projectKindLabel(kind: ProjectKind) {
  if (kind === "client") return dict.projects.clientHeading;
  if (kind === "personal") return dict.projects.personalHeading;
  return dict.projects.saasHeading;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
---
```

- [ ] **Step 2: Заменить Featured Projects секцию**

Найти секцию `Featured Projects` (старые lines 66-109 в оригинале — после rename'а в task 9 номера сдвинутся). Identifier: блок с `featuredProjectsTitle` и `[1, 2, 3].map`. Заменить ВСЮ секцию:

Old (плейсхолдеры):
```astro
<section class="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
  <div class="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
    <h2 ...>{dict.home.featuredProjectsTitle}</h2>
    <a href={localizedPath(locale, "/projects")} ...>
      {dict.home.featuredProjectsLink} →
    </a>
  </div>
  <div class="grid md:grid-cols-3 gap-4 md:gap-6">
    {[1, 2, 3].map((i) => (
      <article ...>
        <div ...>{locale === "ru" ? "Клиентский проект" : "Client project"}</div>
        <h3>{locale === "ru" ? `Пример проекта ${i}` : `Sample project ${i}`}</h3>
        <p>{locale === "ru" ? "Краткое описание задачи и результата..." : "Short description..."}</p>
        <div class="flex flex-wrap gap-1.5">
          {["Astro", "TypeScript", "Postgres"].map((tag) => (...))}
        </div>
      </article>
    ))}
  </div>
</section>
```

New:
```astro
{featuredProjects.length > 0 && (
  <section class="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
    <div class="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
      <h2 class="text-2xl md:text-3xl font-semibold tracking-tight" style="color: var(--color-text);">
        {dict.home.featuredProjectsTitle}
      </h2>
      <a
        href={localizedPath(locale, "/projects")}
        class="text-sm hover:underline"
        style="color: var(--color-accent);"
      >
        {dict.home.featuredProjectsLink} →
      </a>
    </div>
    <div class="grid md:grid-cols-3 gap-4 md:gap-6">
      {featuredProjects.map((p) => (
        <a
          href={projectHref(p)}
          class="rounded-lg p-5 border h-full block hover:bg-[var(--color-bg-elev)] transition-colors"
          style="background-color: var(--color-bg-elev); border-color: var(--color-border);"
        >
          <div class="text-xs uppercase tracking-wider mb-2" style="color: var(--color-text-muted);">
            {projectKindLabel(p.kind)}
          </div>
          <h3 class="font-semibold text-lg mb-2" style="color: var(--color-text);">
            {p.entry.data.title}
          </h3>
          <p class="text-sm leading-relaxed mb-3" style="color: var(--color-text-muted);">
            {p.entry.data.description}
          </p>
          <div class="flex flex-wrap gap-1.5">
            {p.entry.data.stack.slice(0, 3).map((tag) => (
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                style="background-color: var(--color-bg-muted); color: var(--color-text-muted);"
              >
                {tag}
              </span>
            ))}
          </div>
        </a>
      ))}
    </div>
  </section>
)}
```

Изменения:
- `<article>` → `<a href>` (кликабельная карточка → ведёт на detail-страницу).
- Тип проекта берётся из `projectKindLabel(p.kind)` (использует i18n labels из `dict.projects`).
- Title/description/stack — из коллекции.
- Условие `featuredProjects.length > 0` оборачивает всю секцию (скрывается при пустой коллекции).

- [ ] **Step 3: Заменить Latest Posts секцию**

Найти блок с `latestPostsTitle` и `[1, 2, 3].map`. Заменить:

New:
```astro
{posts.length > 0 && (
  <section class="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
    <div class="flex items-baseline justify-between mb-8 gap-4 flex-wrap">
      <h2 class="text-2xl md:text-3xl font-semibold tracking-tight" style="color: var(--color-text);">
        {dict.home.latestPostsTitle}
      </h2>
      <a
        href={localizedPath(locale, "/blog")}
        class="text-sm hover:underline"
        style="color: var(--color-accent);"
      >
        {dict.home.latestPostsLink} →
      </a>
    </div>
    <div class="grid md:grid-cols-3 gap-4 md:gap-6">
      {posts.map((post) => (
        <a
          href={postHref(post)}
          class="rounded-lg p-5 border block hover:bg-[var(--color-bg-elev)] transition-colors"
          style="border-color: var(--color-border);"
        >
          <div class="text-xs mb-2" style="color: var(--color-text-muted);">
            {formatDate(post.data.pubDate)}
          </div>
          <h3 class="font-semibold text-base mb-2" style="color: var(--color-text);">
            {post.data.title}
          </h3>
          <p class="text-sm leading-relaxed" style="color: var(--color-text-muted);">
            {post.data.description}
          </p>
        </a>
      ))}
    </div>
  </section>
)}
```

Изменения:
- Дата = `formatDate(post.data.pubDate)` (`YYYY-MM-DD`).
- **«5 мин» микро-копия удалена** — поля reading time нет в схеме.
- Title/description берутся из коллекции.

- [ ] **Step 4: Verify type-check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Verify build + no placeholders**

```bash
npm run build
```

Expected: успешный билд.

```bash
grep -c "Пример проекта\|Sample project\|Заголовок публикации\|Sample post title" dist/index.html dist/en/index.html
```
Expected: `0` для каждого файла (никаких placeholder-строк).

```bash
grep -c "5 мин\|5 min" dist/index.html dist/en/index.html
```
Expected: `0` (reading-time микро-копия удалена).

```bash
grep -c "Voice-to-spec\|SDD\|Спецификация\|spec" dist/index.html
```
Expected: > 0 (реальный контент отрендерился).

- [ ] **Step 6: Verify locally**

```bash
npm run dev &
sleep 5
curl -s http://localhost:4321/ | grep -A 1 "Клиентские проекты"
# Expected: ниже идут реальные тайтлы (например, Voice-to-spec пайплайн)
curl -s http://localhost:4321/en/ | grep -A 1 "Client projects"
# Expected: ниже идут реальные тайтлы (например, Simplest authentication)
kill %1 2>/dev/null
```

- [ ] **Step 7: Commit phase 3**

```bash
git add src/components/HomePage.astro
git commit -m "$(cat <<'EOF'
feat(home): rewire featured projects and latest posts to content collections

- Replace [1,2,3].map placeholders with getCollection across projects-client,
  projects-personal, projects-saas (union), filter by lang, sort by pubDate,
  slice top 3 (featured first then fallback).
- Replace placeholder post cards with posts collection filtered by lang and
  !draft, sorted by pubDate desc, top 3.
- Drop hardcoded «5 мин» reading time (no field in posts schema).
- Sections collapse to nothing when their collection is empty for the locale.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# PHASE 4 — og-en + nginx alias for legacy portfolio

**Commit:** `feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio`

### Task 11: og-en SVG + script

**Files:**
- Create: `src/assets/branding/og-en.svg`
- Modify: `src/scripts/build-branding-assets.mjs`
- Create: `public/og-en.png` (generated by script)

- [ ] **Step 1: Создать `src/assets/branding/og-en.svg`**

Скопировать структуру `og.svg` и заменить кириллический контент:

```bash
cp src/assets/branding/og.svg src/assets/branding/og-en.svg
```

Открыть `og-en.svg` и заменить:
- «АЛ» → «AL» (initials в круге).
- Любые ru-тексты (например, «Александр Лапыгин», подзаголовки) → en-аналоги («Alexander Lapygin» и аналогичные).

Verify: открыть `og-en.svg` в браузере (file://) или через `npm run dev` — visual review.

- [ ] **Step 2: Расширить `build-branding-assets.mjs`**

Найти в `src/scripts/build-branding-assets.mjs` блок «1. og.png» (строки 38-41):

Old:
```js
// 1. og.png — 1200×630
console.log('Generating og.png (1200×630)...');
const ogPng = rasterize(join(SRC, 'og.svg'), 1200);
writeFileSync(join(OUT, 'og.png'), ogPng);
```

New:
```js
// 1. og.png — 1200×630 (RU default)
console.log('Generating og.png (1200×630)...');
const ogPng = rasterize(join(SRC, 'og.svg'), 1200);
writeFileSync(join(OUT, 'og.png'), ogPng);

// 1b. og-en.png — 1200×630 (EN)
console.log('Generating og-en.png (1200×630)...');
const ogEnPng = rasterize(join(SRC, 'og-en.svg'), 1200);
writeFileSync(join(OUT, 'og-en.png'), ogEnPng);
```

Обновить финальную строку:
Old:
```js
console.log('Done. 4 assets written to public/.');
```

New:
```js
console.log('Done. 5 assets written to public/.');
```

- [ ] **Step 3: Запустить pipeline**

```bash
node src/scripts/build-branding-assets.mjs
```

Expected output:
```
Generating og.png (1200×630)...
Generating og-en.png (1200×630)...
Copying favicon.svg...
Generating favicon.ico (32×32)...
Generating apple-touch-icon.png (180×180)...
Done. 5 assets written to public/.
```

Verify:
```bash
ls -la public/og*.png
file public/og-en.png
# Expected: PNG image data, 1200 x 630, 8-bit/color RGBA
```

### Task 12: BaseLayout locale-conditional og:image

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Найти текущий og:image meta**

Прочитать BaseLayout, найти строку с `<meta property="og:image"`:

```bash
grep -n 'og:image' src/layouts/BaseLayout.astro
```

- [ ] **Step 2: Заменить hardcoded `/og.png` на locale-conditional путь**

В frontmatter `BaseLayout.astro` (там где определяется `locale`/`dict`) добавить вычисление:

```ts
const ogImagePath = locale === "en" ? "/og-en.png" : "/og.png";
```

Найти строку рендера og:image и заменить путь `/og.png` на `{ogImagePath}`:

Old:
```astro
<meta property="og:image" content={new URL("/og.png", Astro.site).toString()} />
```

New:
```astro
<meta property="og:image" content={new URL(ogImagePath, Astro.site).toString()} />
```

`og:image:width`, `og:image:height`, `og:image:alt`, `twitter:card` — оставить как есть.

- [ ] **Step 3: Verify**

```bash
npm run check && npm run build
```

Expected: 0 errors, успешный билд.

```bash
grep "og:image" dist/index.html
# Expected: content="https://alexanderlapygin.com/og.png" (или dev URL)
grep "og:image" dist/en/index.html
# Expected: content="https://alexanderlapygin.com/og-en.png"
```

### Task 13: Nginx `/portfolio/` block

**Files:**
- Modify: `deploy/nginx/alexanderlapygin.com.conf` (after line 115, перед immutable cache блоком на 117)

- [ ] **Step 1: Добавить `location ^~ /portfolio/` блок**

Открыть `deploy/nginx/alexanderlapygin.com.conf`, найти конец блока `location ^~ /showcase/` (line 115 — `}`).

Вставить новый блок ниже (после `}` строки 115, перед строкой 117 `# Immutable cache для контент-адресуемых ассетов Astro и шрифтов.`):

```nginx
    # --- Legacy React SPA portfolio (preserved from pre-2026-05-15 prod) --
    # Living-tags poc/prototype — отдельные prerendered Vite-SPAs (свои
    # index.html + assets/). Контент в /var/www/alexanderlapygin.com/legacy/
    # portfolio/, ВНЕ release-дерева Astro.
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

        # HTML страницы — всегда ревалидировать.
        location ~ \.html$ {
            include /etc/nginx/snippets/alexanderlapygin-security-headers.conf;
            add_header Cache-Control "no-cache" always;
        }

        try_files $uri $uri/index.html =404;
    }

```

- [ ] **Step 2: Проверить общую структуру файла**

```bash
grep -n "location" deploy/nginx/alexanderlapygin.com.conf
```

Expected: новый `location ^~ /portfolio/` появился между `location ^~ /showcase/ {` и `location ~ ^/(_astro|fonts)/ {`.

- [ ] **Step 3: Сухая проверка синтаксиса (визуальный review)**

Прочитать весь блок целиком:
```bash
sed -n '85,140p' deploy/nginx/alexanderlapygin.com.conf
```

Visually verify:
- Открывающие/закрывающие `{` `}` сбалансированы.
- Структура `location ^~ /portfolio/` идентична `location ^~ /showcase/` (с заменой `showcase` → `portfolio` в комментарии и без backend-exclusion location).

⚠️ **Live `nginx -t` на VPS** — отдельный шаг cutover-runbook'а (НЕ в этом плане). Этот коммит — только статика конфига в репо.

### Task 14: Verify phase 4 + commit

**Files:** все из tasks 11-13 staged.

- [ ] **Step 1: Final verification**

```bash
npm run check
```
Expected: 0/0.

```bash
npm run build
```
Expected: успешный билд.

```bash
ls dist/og.png dist/og-en.png
# Expected: оба файла существуют.

grep "og:image" dist/index.html | head -1
# Expected: "content=...og.png"

grep "og:image" dist/en/index.html | head -1
# Expected: "content=...og-en.png"
```

- [ ] **Step 2: Stage all phase 4 changes**

```bash
git add src/assets/branding/og-en.svg public/og-en.png src/scripts/build-branding-assets.mjs src/layouts/BaseLayout.astro deploy/nginx/alexanderlapygin.com.conf
git status
```

Expected: 5 файлов staged, 0 unstaged.

- [ ] **Step 3: Commit phase 4**

```bash
git commit -m "$(cat <<'EOF'
feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio

- og-en.svg: hand-drawn EN counterpart of og.svg (АЛ → AL, RU text → EN).
- build-branding-assets.mjs: rasterize og-en.svg → public/og-en.png (1200×630)
  in the same pass as og.png.
- BaseLayout.astro: <meta property="og:image"> path now branches on locale —
  /og-en.png for EN, /og.png for RU.
- deploy/nginx/alexanderlapygin.com.conf: + location ^~ /portfolio/, same
  pattern as the existing /showcase/ block, alias to /var/www/.../legacy/
  portfolio/ with prerendered sub-SPA index.html serving. NOT yet active on
  prod — applied atomically at cutover.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify final commit chain**

```bash
git log --oneline -5
```

Expected (latest first):
```
<hash> feat(branding,deploy): add EN og:image and nginx alias for legacy portfolio
<hash> feat(home): rewire featured projects and latest posts to content collections
<hash> feat(i18n): rewrite home and about to prod voice, add hero tagline
<hash> feat(content): seed posts and personal projects from prod source
<previous head>
```

---

## Post-implementation: stage redeploy

(НЕ часть этого плана — выполняется отдельной сессией перед cutover'ом.)

Через тот же механизм, что использовался для текущего релиза `stage-releases/20260516T221717Z`:

1. `npm run build` локально.
2. Upload `dist/` → `/var/www/alexanderlapygin.com/stage-releases/<new-TS>/`.
3. Atomic switch `stage-html` симлинка.
4. Smoke (curl-проверки из спеки секции 5).

## Out of scope (per spec)

- Сам cutover stage→prod.
- VPS-side extraction `legacy/` из backup-тарбола (на cutover'е).
- Реальные `liveUrl`/body для voice-to-spec, llm-spec-tools (§7 open items).
- EN-переводы single-locale showcase'ов (§7 open items).
- Body для EN-solutions (§7 open items).
- Image-генерация для проектных карточек.
- CI/CD.

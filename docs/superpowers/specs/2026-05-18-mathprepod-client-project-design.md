# Design: добавление клиентского проекта mathprepod + перевод client-секции на SaaS-rich визуал + cleanup dead-route

**Date:** 2026-05-18
**Status:** Approved (юзер подтвердил решения в брэйншторме `superpowers:brainstorming`, сессия 2026-05-18, семнадцатая)
**Scope:** Добавить первую запись в коллекцию `projects-client` (mathprepod, RU+EN), переписать рендер секции `clientProjects` в `ProjectsCatalog.astro` под визуальный язык SaaS-карточек (features + CTA-кнопки), удалить dead-route `/projects/[slug].astro` + `ProjectPage.astro` вместе с их orphan i18n-ключами.

## Контекст и мотивация

В конце 16-й сессии (`b1f8543` spec + `11b3419..1fbc2ea` implementation + handoff) пользователь явно запросил следующим шагом добавление клиентского проекта `mathprepod` (см. HANDOFF.md, п.2.A общего блока «что осталось недоделанным»). Это первая запись в коллекции `projects-client` — до сих пор директории `src/content/projects-client/` не существовало, секция «Клиентские проекты» в `ProjectsCatalog.astro:31-60` не рендерилась (условие `clientProjects.length > 0 &&`).

Появление первой реальной записи делает видимым визуальное несоответствие: SaaS-секция (`ProjectsCatalog.astro:100-189`, переписана в 16-й сессии под прод-стандарт) — inline-rich карточки с features-списком и CTA-кнопками; client-секция — старый «простой» стиль (description + stack-чипы, slice 4, вся карточка-ссылка на `/projects/<slug>`). Этот «простой» стиль линкует на dead-route `/projects/[slug].astro` + `ProjectPage.astro`, которые помечены к удалению в HANDOFF carry-overs 16-й сессии.

В SSG-модели Astro добавление новой записи в коллекцию — чисто контентная операция (markdown-файлы). Но текущая ситуация требует объединить три разнородных компонента, потому что они логически сцеплены:

1. **Контент**: создание `mathprepod.md` (RU + EN).
2. **Разработка — визуал**: перерисовка client-секции под SaaS-rich. Не «обслуживает» mathprepod конкретно — это однократный долг от 16-й сессии, когда SaaS-секцию подтянули, а client оставили (коллекция была пуста, секция не рендерилась).
3. **Разработка — cleanup**: удаление dead-route. Связан с (2) ситуативно: старый client-визуал был единственным потребителем `/projects/<slug>`. Новый — внешняя CTA на `liveUrl`, route становится физически недостижим из навигации.

Пользователь явно выбрал bundled-подход (одна spec/plan/implementation-сессия, atomic-коммиты внутри), сослался на 16-ю сессию (single-bundled-PR подход).

Цель спеки:

- Добавить запись `mathprepod` в `projects-client` для RU и EN с полным набором полей (title, description, pubDate, stack, liveUrl, features).
- Переписать рендер `clientProjects` в `ProjectsCatalog.astro` под SaaS-rich визуал (features-список с чекмарками, CTA-кнопки на `liveUrl` и опционально `repoUrl`).
- Удалить dead-route файлы (`src/pages/projects/[slug].astro` RU, `src/pages/en/projects/[slug].astro` EN, `src/components/ProjectPage.astro`) после grep-подтверждения отсутствия других consumers.
- Удалить orphan i18n-ключи `repoLink`, `backLink`, `code` (подтверждено grep'ом во время написания плана: `open` НЕ orphan — используется в `SolutionsPage.astro:52`).
- Добавить новый i18n-ключ `siteLink` для CTA «Сайт» / «Site» (для client-карточки семантически точнее, чем `demoLink: "Демо" / "Demo"`).

## Не-цели

- **Stage redeploy и cutover stage→prod.** Реализация остаётся локальной; redeploy — следующий шаг (HANDOFF.md, п.2 в "Осталось недоделанным" 16-й сессии).
- **Изменение схемы `projectClient` в `src/content.config.ts`.** `liveUrl` остаётся required (для mathprepod валидно), `repoUrl` остаётся optional, прочие optional-поля (`phase`/`type`/`access`/`status`/`image`) для mathprepod не заполняются.
- **Рефакторинг `ProjectsCatalog.astro` в подкомпоненты.** При 3 типах секций (client/personal/saas) и одном файле ~190 строк — преждевременное обобщение.
- **Унификация карточки personal-проектов** под SaaS-rich. Personal-проекты — отдельный визуальный класс (вся карточка-ссылка с external-arrow), пока не трогаем.
- **Удаление коллекций `projects-client`/`projects-personal`** или их консолидация. Решено в 16-й сессии оставить все 3.
- **Удаление optional-полей `phase`/`type`/`access`/`status`** из схемы `projectClient`. Унаследованы из Phase 1 контент-трека, могут пригодиться будущим client-проектам.
- **Image / превью карточек.** `image` поле в схеме остаётся optional, для mathprepod не заполняется, рендеринг изображений не добавляем.
- **301-редиректы для `/projects/<slug>/*`.** На prod эти URL'ы никогда не существовали (старый сайт — React-сборка, эти Astro-страницы не публиковались наружу). На stage были в момент 14-15 сессий, но навигация на них не ведёт, индексация Google неактуальна (RSS feeds покрывают только posts).
- **Карусель / фильтры / сортировка / пагинация** — одна карточка, не нужно.
- **HANDOFF carry-overs из 16-й сессии (a11y `aria-hidden`, `cursor: not-allowed` UX-нит).** Накапливаются отдельной задачей по всему `ProjectsCatalog.astro`.

## Зафиксированные архитектурные выборы

| Развилка | Выбор | Почему |
|---|---|---|
| Организация работы | **Bundled spec/plan/implementation** | Явный выбор пользователя в брэйншторме (повторяет single-bundled-PR подход 16-й сессии). Atomic-коммиты внутри для granular history |
| Визуал client-карточки | **SaaS-rich** (features + CTA-кнопки) | Зеркало SaaS-секции из 16-й сессии. Выразительнее для двойной роли (Tilda-сборка + SEO) |
| `liveUrl` в схеме | **Оставить required** | Для mathprepod валидно (живой сайт есть). Изменение схемы — отдельная задача, если появится клиент без публичного URL |
| Карточка кликабельна целиком? | **Нет** — только через CTA-кнопки | Зеркало SaaS-выбора 16-й сессии. Внешняя ссылка через explicit CTA лучше показывает направление перехода |
| `repoUrl` для mathprepod | **Не заполняем** (Tilda-сайт, no public repo) | Но условный рендер `repoUrl`-кнопки в карточке оставляем — для будущих client-проектов с открытым кодом |
| `comingSoon` для client | **Не применимо**, в schema `projectClient` поля нет | Клиентские проекты в портфолио — уже live по определению |
| Stack pills slice | **Без slice** (все элементы) | Зеркало SaaS-выбора 16-й сессии |
| Grid контейнера client-секции | **`md:grid-cols-2`** (как SaaS) | Текущий `md:grid-cols-2 lg:grid-cols-3` отличается от SaaS — выровнять. Одна карточка займёт 1 колонку — нормально |
| Удаление dead-route | **Удаляем 3 файла**: `src/pages/projects/[slug].astro` (RU), `src/pages/en/projects/[slug].astro` (EN), `src/components/ProjectPage.astro` | Помечены к удалению в HANDOFF 16-й сессии. Новый client-визуал делает их недостижимыми из навигации |
| Orphan i18n-ключи | **Удаляем `repoLink`, `backLink`, `code`** (точный список зафиксирован grep'ом на этапе написания плана) | HANDOFF упоминал `repoLink`, `code`, `open` как кандидатов, но `open` используется в `SolutionsPage.astro:52` → сохраняем. `backLink` — orphan после удаления ProjectPage.astro |
| Новый i18n-ключ `siteLink` | **Добавляем** `"Сайт" / "Site"` | Для client-карточки семантически точнее, чем `demoLink: "Демо" / "Demo"` (SaaS-демо vs live-сайт клиента) |
| `demoLink` в SaaS | **Оставляем** как есть | Для SaaS «Демо» уместно (это прототипы/MVP, не enterprise-сайты) |
| `codeLink` для client | **Переиспользуем** существующий `codeLink: "Код" / "Code"` | Семантически тот же концепт |
| `featuresHeading` для client | **Переиспользуем** существующий `featuresHeading: "Ключевые особенности" / "Key features"` | Семантически тот же концепт |
| Тип `Dictionary.projects` | Добавить `siteLink: string` в `src/i18n/types.ts` (если ключи типизированы) | Поддержание type-safety |
| Иконки в карточке | **Inline-SVG**, те же что в SaaS (CheckBig для features, GitHub для Code, arrow для Site) | Зависимостей не добавляем; стиль выровнен с SaaS-секцией |
| Стилевая база | CSS-переменные дизайн-системы (`--color-text`, `--color-text-muted`, `--color-bg-elev`, `--color-border`, `--color-accent`) | Единый стиль с остальным сайтом |
| Локальный рендер | Карточка остаётся **inline** в `ProjectsCatalog.astro`, без отдельного компонента | Минимальный объём изменений; вынесение в компонент — преждевременное при 3 типах секций |
| `pubDate` для mathprepod | **2026-05-15** (середина мая 2026, до сегодня) | Пользователь подтвердил «май 2026, дата завершения работ». 15-е — нейтральная середина |
| `stack` для mathprepod | `["Tilda", "SEO", "Семантика", "Контент"]` (RU) / `["Tilda", "SEO", "Keyword research", "Content"]` (EN) | Покрывает все четыре роли (Tilda-сборка, on-page SEO, keyword research, контент) |
| `features` для mathprepod | 4 строки, по одной на каждую роль | Зеркало 4 stack-тегов; даёт inline-rich карточку без detail-страницы |
| `description` для mathprepod | Без упоминания «верстальщик / SEO-аналитик» | Описание — про проект клиента, не про резюме исполнителя |
| Тестирование | `npm run check` + `npm run build` + визуальный smoke в `npm run dev` (RU + EN) | Astro-компонент без логики; smoke + типы достаточны |

## Технические решения (детали маппинга)

### Запись `src/content/projects-client/ru/mathprepod.md`

```yaml
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

Body (markdown content) — пустой. Карточка не открывается в detail-страницу, рендерится только frontmatter.

### Запись `src/content/projects-client/en/mathprepod.md`

```yaml
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

### Рендер секции `clientProjects` (новая структура, заменяет `ProjectsCatalog.astro:31-60`)

Структурно — зеркало SaaS-секции (`ProjectsCatalog.astro:100-189`) без `comingSoon`-логики:

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

Отличия от SaaS-блока:

- `clientHeading` вместо `saasHeading`.
- `siteLink` вместо `demoLink` для liveUrl-кнопки.
- Нет `comingSoon`-логики (бейдж, opacity, скрытие кнопок).
- В `showButtons` нет проверки `!disabled`.

### Удаление dead-route — порядок действий

1. **Grep на consumers перед удалением:**
   - `grep -rn "ProjectPage" src/` — должно быть только импорт в `src/pages/projects/[slug].astro` и в самом `src/components/ProjectPage.astro`.
   - `grep -rn "/projects/\\\${" src/` или `grep -rn "/projects/\${" src/` — найти все динамические ссылки `/projects/<slug>`. Ожидаемо: только в текущем (старом) рендере client-секции, который заменяется.
   - `grep -rn "repoLink\|\\.code\\b\|\\.open\\b" src/` — найти всех consumers ключей-кандидатов на удаление.

2. **Удалить файлы:**
   - `git rm src/pages/projects/[slug].astro`
   - `git rm src/pages/en/projects/[slug].astro`
   - `git rm src/components/ProjectPage.astro`

3. **Удалить orphan i18n-ключи** в `src/i18n/ru.ts`, `src/i18n/en.ts`, `src/i18n/types.ts`. Зафиксированный grep'ом список: `repoLink` (0 consumers уже до удаления), `backLink` (только ProjectPage.astro), `code` (только ProjectPage.astro). Ключ `open` НЕ orphan — используется в `SolutionsPage.astro:52`, не трогаем.

4. **Не добавляем 301-редиректы.** URL'ы не были в prod-индексе, на stage время жизни — единицы дней внутри 14-15 сессий, навигация на них уже не ведёт с 16-й сессии (новый SaaS-визуал).

### i18n изменения

`src/i18n/ru.ts`, блок `projects`:
- Добавить: `siteLink: "Сайт",`

`src/i18n/en.ts`, блок `projects`:
- Добавить: `siteLink: "Site",`

`src/i18n/types.ts` (если ключи `projects.*` типизированы):
- Добавить: `siteLink: string;` в соответствующий тип.
- Удалить типы orphan-ключей (по итогам grep'а).

### Сортировка карточек

Существующая сортировка `clientProjects` (`ProjectsCatalog.astro:13`) `b.data.pubDate - a.data.pubDate` (newest first) — оставляем как есть. При одной карточке порядок не виден; задел на будущее.

### Edge cases

- **Одна карточка в grid `md:grid-cols-2`** — занимает левую колонку, правая пустая. Принимаем как нормальное поведение, без media-фолбэка.
- **Записи в `projects-client/` без `liveUrl`** — невозможны по схеме (`.url()` без `.optional()`). Не покрываем.
- **Запись с `comingSoon`-семантикой** — невозможна, поля в схеме `projectClient` нет. Не покрываем.

## План разбиения на атомарные коммиты

Финальное число коммитов и формулировки — за `superpowers:writing-plans`. Предварительно:

1. `feat(content): add mathprepod client project (RU + EN)` — два markdown-файла, без правок ProjectsCatalog. На этом этапе build всё ещё рендерит старый «простой» визуал, ссылка ведёт в `/projects/mathprepod` (dead-route, 404).
2. `feat(i18n): add siteLink key for client project CTA` — `siteLink` в ru/en/types. Изолирован.
3. `feat(projects): rework client section to SaaS-rich visual` — переписан `ProjectsCatalog.astro:31-60`. Теперь mathprepod рендерится в новом стиле с CTA «Сайт».
4. `chore(routes): drop dead-route /projects/[slug] and ProjectPage` — удаление двух файлов. На этом этапе grep подтверждает 0 consumers.
5. `chore(i18n): drop orphan keys after dead-route removal` — точный список ключей (по grep'у), синхронно в ru/en/types.

После каждого коммита: `npm run check` + `npm run build` зелёные.

## Тестирование

### Локальный smoke

- `npm run check` — 0 errors.
- `npm run build` — 0 errors. Ожидаемое число страниц: `текущее - N` где N = число detail-страниц, которые dead-route генерировал. Нужно зафиксировать число pages до/после; если getStaticPaths возвращал 0 для пустой `projects-client` — N=0 и счётчик не меняется.
- `npm run dev` (порт 4321), визуально:
  - `/projects` — секция «Клиентские проекты» рендерится (новая, раньше скрытая). Карточка mathprepod: title «МатПрепод», 4 stack-чипа (Tilda, SEO, Семантика, Контент), features-список с 4 чекмарками, CTA «Сайт» открывает `https://mathprepod.ru/` в новой вкладке. CTA «Код» отсутствует (нет `repoUrl`).
  - `/en/projects` — то же на английском: «MathPrepod», stack EN, features EN, CTA «Site».
  - SaaS-карточки (`living-tags-prototype`, `living-tags-mvp`) — без регрессий.
  - Personal-секция — пустая (или скрыта если коллекция пуста после удалений 16-й сессии).
  - Прямой URL `/projects/mathprepod` или `/en/projects/mathprepod` — 404 (dead-route убран).

### Grep-проверки после фикса

- `grep -rn "ProjectPage" src/` — пусто.
- `grep -rn "/projects/\\\${" src/ src/components/ src/pages/` — пусто.
- `grep -rn "<имена удалённых i18n ключей>" src/` — пусто (для каждого удалённого ключа).

### Критерии готовности

- 0 errors на `npm run check` и `npm run build`.
- `/projects` и `/en/projects` рендерят mathprepod-карточку в SaaS-rich стиле с работающей CTA.
- Все pre-existing страницы (`/`, `/about`, `/blog`, `/contact`, `/faq`, `/solutions`, individual blog posts) не сломаны (визуальный smoke).
- Dead-route отвечает 404.
- `git status` чист, изменения готовы к stage redeploy.

## Открытые вопросы (нон-блокирующие, перенос на implementation/follow-up)

- Carry-overs из 16-й сессии (`aria-hidden="true"` на decorative SVG, UX-нит `cursor: not-allowed` для не-кликабельных карточек) — НЕ берём в эту спеку; накапливаются отдельной a11y-sweep задачей.
- Schema-decision: оставлять ли `liveUrl` required в `projectClient`. Если появится клиент без публичного URL — решаем тогда (текущий mathprepod не блокирует).
- pubDate-policy для коллекции `projects-client`: «дата завершения работ» (для mathprepod пользователь дал «май 2026», зафиксировано 2026-05-15). Документируем по факту, когда появится второй client-проект.

## Связанные документы

- HANDOFF.md (сессия 2026-05-18, шестнадцатая) — п.2.A в "Осталось недоделанным", и carry-overs про dead-route.
- `docs/superpowers/specs/2026-05-18-projects-prod-alignment-design.md` — спецификация SaaS-секции (предыдущая итерация), визуальный язык которой мы зеркалим.

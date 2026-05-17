---
title: "First SDD Experience"
description: "By treating contract tests as living specifications in a TDD cycle with AI, we gained the insight that specifications are the best way to govern and control LLM-generated code."
pubDate: 2025-10-15
tags: ["sdd"]
featured: false
draft: false
lang: en
---

[Previous](sdd-backstory)

I should mention that by the time Vibe Coding gained popularity, I already had a bit of experience with programming using LLMs — and, unusually, immediately in commercial development.

Back in 2023, on a company project, we needed a small logger for a client application. I didn't want to bother with connecting heavy-duty tools like Sentry, so I quickly developed my own, using the recently released, but already sensational, ChatGPT 3.5. Naturally, this involved copying and pasting the code from the chat into the IDE, as there were no other options back then.

The task itself was minimal, but I wanted to shift the main burden of implementation review onto tests. The model and I completed this in a TDD mode — the classic red-green-refactor cycle. Consequently, my manual review of the LLM-generated code was very brief, while test runs were quite numerous. In the end, everything went well; the logger was implemented and successfully deployed.

It's worth noting here that good tests are contract tests — those created to verify not the entire codebase, but only a specific part of the contract implemented by the program. This contract might be documented, but it can also be captured in the contract tests themselves, which then serve as a living specification.

Thus, when all tests in TDD are contract-based, development becomes not just Test-Driven, but, in a sense, Specification-First Development. And if it also involves using artificial intelligence, the result is precisely what is known today as Spec-Driven Development.

This is how we developed our mini-logger, and it was during this process that I first realized that it was possible to use predefined specifications to avoid programming errors made by LLMs and control their behavior.

---

[Previous](sdd-backstory)

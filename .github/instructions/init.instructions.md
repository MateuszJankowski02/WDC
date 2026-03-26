---
description: Global instructions for all tasks in this repository
applyTo: "**"
---

Load these instructions for every task in this repository.

## Required Agent Context Structure

For each task, build and keep context in this exact order:

1. Task goal and acceptance criteria.
2. Relevant files and current code state.
3. Source materials (including converted text from PDFs when applicable).
4. Constraints and assumptions.
5. Iteration notes and next actions.

## PDF Handling Rule

Before reading content from any PDF file, always convert the PDF to TXT and use the TXT version for analysis.

Rules:

- Do not analyze PDF content directly when a TXT conversion can be produced.
- Reuse an existing TXT conversion if it is already present and up to date.
- Keep naming consistent so source mapping is obvious, for example: `Projekt 1.pdf` -> `Projekt 1.txt`.

## Per-Task Agent Iteration File

For each task, maintain a dedicated Markdown iteration/context file for the agent.

Rules:

- If a Markdown file with similar context already exists, update that file instead of creating a new one.
- Create a new file only when no similar context file exists.
- Keep entries concise and append iteration updates rather than duplicating content.
- Include date, scope, decisions, risks, and current status in each update.

## Priority

When these instructions conflict with ad-hoc style preferences, follow these instructions unless the user explicitly overrides them in the current request.

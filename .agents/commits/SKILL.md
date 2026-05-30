---
name: commits
description: "Review code changes, group files by feature/topic, and generate Conventional Commit messages. Use when: committing changes, writing commit messages, staging files, preparing a commit for review, or directly committing. Confirms with the user before committing breaking changes."
user-invocable: true
disable-model-invocation: false
argument-hint: "[commit | review | plan] — 'commit' stages and commits directly, 'review' or 'plan' shows the plan for approval first"
---

# Commits — Conventional Commit Generator

## Workflow

When invoked, always follow these steps in order:

1. **Inspect changes** — run `git status` and `git diff` (staged + unstaged) to understand what changed
2. **Group files by topic** — cluster related files into logical commit units
3. **Generate commit messages** — one message per group, following the format below
4. **Check for breaking changes** — if any group contains a breaking change, pause and confirm with the user before proceeding
5. **Stage and commit** — either commit directly or present the plan for approval, depending on the user's instruction
6. **Show summary** — after all commits are done, run `git log --oneline -<n>` (where `n` = number of commits made) and display the output to the user

If the user says **"commit"** (or similar): execute all commits after the breaking-change check, then show the summary.
If the user says **"review"** (or similar): present the grouping and messages, wait for approval before running any git commands. After commits are done, show the summary.

---

## Commit Format

```
<type>(<scope>): <summary>

- <change 1>
- <change 2>
- <change 3>

[BREAKING CHANGE: <description>]
```

---

## Header Rules

- **Target**: ≤ 50 chars · **Hard limit**: 72 chars
- Formula: `type + "(" + scope + "): " + summary ≤ 50`
- If too long: drop articles (a, the, an), abbreviate, shorten verbs (`implement` → `add`, `resolve issue where` → `fix`)

---

## Allowed Types

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New feature or capability                  |
| `fix`      | Bug fix                                    |
| `docs`     | Documentation only                         |
| `style`    | Formatting / whitespace / separators       |
| `refactor` | Code restructuring with no behavior change |
| `test`     | Tests added or updated                     |
| `chore`    | Tooling, deps, config                      |
| `ci`       | CI/CD pipelines                            |
| `build`    | Build system / dependency changes          |

---

## Scope Rules

Use scope when **a single feature, module, or domain** is affected.

- Format: **PascalCase** — use the module/domain name, not the file name
- Examples: `feat(Auth): add JWT login` · `fix(Api): handle null response`

Skip scope when:

- Type is `chore`, `ci`, or `build` AND the change is in config files
- The change spans many unrelated domains

---

## Body Rules

- Bullet-point list of what changed (not why — that belongs in the PR description)
- Keep bullets concise: one fact per line
- Omit trivial details (e.g., "renamed variable") unless it affects callers
- 3–6 bullets is typical; fewer is better if the summary already says it all

---

## Breaking Changes

- Add `!` after the type/scope in the header: `feat(Auth)!: remove legacy login`
- Add footer: `BREAKING CHANGE: <what changed and what callers must do>`
- **Always confirm with the user before creating a breaking-change commit** — ask: "This commit contains a breaking change: `<description>`. Proceed?"

---

## Grouping Strategy

Group files into the smallest coherent commits that could be reviewed independently:

- Files that implement the same feature → one commit
- Test files that cover a changed module → same commit as the module
- Documentation updates → separate `docs` commit
- Config/tooling changes → separate `chore` or `build` commit
- Formatting-only changes → separate `style` commit

Avoid mixing behavior changes with style or docs in the same commit.

### Partial File Staging

When a single file contains **unrelated changes** (e.g., a new constant + an unrelated function fix), use `git add -p` to stage only the relevant hunks per commit.

**When to use partial staging:**

- A file has changes that belong to 2+ different logical commits
- Separators/formatting were added alongside behavior changes
- A shared module gained functions for different features

**When NOT to split:**

- All changes in the file serve the same purpose — stage the whole file
- Splitting would create a commit where the code doesn't compile or run
- The hunks are too interleaved to separate cleanly

**How to stage partial changes:**

```bash
# Interactive hunk selection (preferred)
git add -p <file>
# Options: y=stage, n=skip, s=split hunk, q=quit

# Stage a specific line range via patch application
git diff <file> | head -n <end> | tail -n <count> | git apply --cached
```

**Rule:** every commit must leave the codebase in a valid, runnable state. Never split a file in a way that breaks intermediate commits.

---

## Examples

### Single-module feature

```
feat(FieldMatcher): add confidence threshold filtering

- Add MIN_CONFIDENCE constant (default 0.85)
- Filter Textract blocks below threshold before matching
- Update matchFields() return type to include confidence
```

### Bug fix

```
fix(S3Service): handle missing object key on copy

- Catch NoSuchKey error and log as soft error
- Return null instead of throwing to continue batch
```

### Docs only

```
docs: add bilingual OCR pipeline documentation

- Create docs/ocr.md (English)
- Create docs/ocr.pt-BR.md (Portuguese)
- Add cross-links between both files
```

### Breaking change

```
feat(Queries)!: rename comprovante status field

- Rename DB column reference from `status` to `statusOCR`
- Update all SELECT and UPDATE queries in queries.js

BREAKING CHANGE: DB column `status` was renamed to `statusOCR` — run migration before deploying
```

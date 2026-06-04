# DeadByte Bot Refactor and Bloat Checklist

This checklist captures the repo review findings from 2026-06-04. It is meant to track refactor work without changing behavior first. Each item should be handled in small PRs/commits with tests around the affected command or service.

## Review Baseline

- [ ] Keep current behavior unchanged unless explicitly approved.
  - [ ] Preserve command IDs, aliases, default config, and WhatsApp-facing behavior.
  - [ ] Prefer extracting helpers/data over rewriting command logic.
  - [ ] Run `pnpm typecheck`, `pnpm lint`, and targeted tests after each refactor.
- [x] Track current verification status.
  - [x] `pnpm typecheck` passed on 2026-06-04.
  - [x] `pnpm lint` passed on 2026-06-04.
  - [x] `pnpm test -- --run` passed on 2026-06-04 with 5 test files and 17 tests passing.
  - [x] Resolved the 3 stale spintax-sensitive expectations in `test/phone-code-commands.test.ts` by asserting stable behavior facts instead of exact raw templates.

## 1. Move Giant Static Lookup Data Out of Command Code

[x] Refactor `src/commands/utility/ddd-data.helper.ts`.
  - [x] Move the 5,632-line `CITY_POPULATION_RANK` dataset out of command/helper code.
  - [x] Create a data-focused location such as `src/data/ddd-city-population-rank.json`.
  - [x] Keep only ranking behavior in TypeScript, e.g. `sortCitiesByRelevance()`.
  - [x] Add a small test for ordering by city/state after extraction.
  - [x] Confirm build output handles JSON import cleanly with current ESM/unbuild setup.
- [x] Refactor `src/commands/utility/ddi-data.helper.ts`.
  - [x] Decide whether `DDI_MAP` stays as TS or moves to JSON with a typed loader.
  - [x] Keep `flagEmoji()` and `lookupDdi()` as the stable public API.
  - [x] Add/keep tests for shared codes such as `1`, `7`, and single-country codes such as `351`.

Decision needed:
- [x] Choose data strategy:
  - [x] JSON imported at runtime/build time.
  - [ ] Generated `.ts` data file kept out of command folders.
  - [ ] External package/API if accuracy and updates matter more than zero dependency cost.

## 2. Deduplicate Command Alias and Match Boilerplate

[x] Create a shared alias helper.
  - [x] Replace repeated `aliasesFor()` implementations.
  - [x] Suggested API: `getCommandAliases(ctx.config, commandId, defaults)`.
  - [x] Suggested API: `matchesExplicitAlias(ctx, commandId, defaults)`.
  - [x] Cover prefix-normalized names through `normalizeCommandName()`.
- [x] Apply to small/simple commands first.
  - [x] `system.ping`
  - [x] `system.status`
  - [x] `system.time`
  - [x] `system.menu`
  - [x] `fun.emoji`
  - [x] `fun.react`
- [x] Then apply to more complex commands.
  - [x] `fun.math`
  - [x] `fun.dice`
  - [x] `fun.boot-correction`
  - [x] `utility.ddd`
  - [x] `utility.ddi`
  - [x] sticker commands

Decision needed:
- [x] Choose whether this helper belongs in:
  - [ ] `src/commands/command-utils.ts`
  - [x] `src/utils/commands.ts`
  - [ ] runtime package later, if multiple DeadByte packages need it.

## 3. Extract Sticker Command Factory and Shared Media Flow

[x] Create a shared sticker command flow for media-based sticker creation.
  - [x] Extract repeated `resolveTargetMedia()` try/catch.
  - [x] Extract common "missing media" reply.
  - [x] Extract common "sticker service unavailable" handling.
  - [x] Extract `createSticker()` + `replyWithSticker()` path.
- [x] Replace triplicated fit commands.
  - [x] Convert `sticker.fit` to a factory call with `fit: 'contain'`.
  - [x] Convert `sticker.crop` to a factory call with `fit: 'cover'`.
  - [x] Convert `sticker.stretch` to a factory call with `fit: 'stretch'`.
- [x] Keep specialized commands explicit where needed.
  - [x] Keep `sticker.create` custom because it can emit both contain and crop versions.
  - [x] Keep `sticker.steal` custom for metadata parsing.
  - [x] Keep `sticker.to-media` custom for WebP-to-PNG/MP4 conversion.
- [x] Add focused tests for all sticker command variants after extraction.

Decision needed:
- [x] Choose abstraction shape:
  - [x] `defineStickerFitCommand(options)` factory.
  - [ ] Shared `runStickerCreation(ctx, options)` helper used inside regular commands.
  - [ ] Hybrid: helper first, factory only if the commands become nearly empty.

## 4. Move Spintax and Personality Copy Out of Behavior Files

- [ ] Extract large response templates from command files.
  - [ ] Move `CORRECTION_MESSAGE` from `fun.boot-correction`.
  - [ ] Move long DDD international/invalid responses.
  - [ ] Move long DDI invalid/local/Brazil responses.
  - [ ] Move repeated sticker error replies into one message catalog.
- [ ] Use named message helpers.
  - [ ] Example: `phoneMessages.dddInternational(target, parsed)`.
  - [ ] Example: `stickerMessages.mediaDownloadFailed`.
  - [ ] Example: `stickerMessages.missingMedia`.
- [ ] Reduce test brittleness.
  - [ ] Test branch behavior and essential facts, not exact spintax variants.
  - [ ] Keep snapshots only for stable, non-spintax outputs.
  - [ ] Consider testing rendered text with a deterministic spintax seed if supported later.

Decision needed:
- [ ] Choose message organization:
  - [ ] Per-domain files, e.g. `src/commands/utility/phone-code.messages.ts`.
  - [ ] Central catalog, e.g. `src/messages/*.ts`.
  - [ ] Plain JSON/template files if copy should be editable by non-code contributors.

## 5. Avoid Building Message Context Twice

- [ ] Review `src/app/create-bot-app.ts`.
  - [ ] `handleMessage()` builds a preview context.
  - [ ] `executeCommand()` builds a second full context for the same raw message.
- [ ] Decide whether preview context can be reused safely.
  - [ ] Pass the existing context into `executeCommand()`.
  - [ ] Ensure lazy service functions still resolve against the correct target message.
  - [ ] Confirm no command mutates context in a way that affects later processing.
- [ ] Alternative: split context into cheap and full versions.
  - [ ] `createPreviewMessageContext()` for parse/match/event payload.
  - [ ] `createMessageContext()` only after a command matches.
- [ ] Add tests around command matching and execution count.
  - [ ] Verify contact/chat/message fetches happen once where possible.
  - [ ] Verify implicit commands still match correctly.

Decision needed:
- [ ] Choose context approach:
  - [ ] Reuse one full context.
  - [ ] Add cheap preview context and create full context only on match.

## 6. Centralize Runtime Event Emission

- [ ] Create a small event helper.
  - [ ] Generate `id` with `crypto.randomUUID()`.
  - [ ] Add `timestamp`.
  - [ ] Add `instanceId` when config is available.
  - [ ] Keep payload typing lightweight but consistent.
- [ ] Replace manual event object construction.
  - [ ] `MessageReceived`
  - [ ] `MessageIgnored`
  - [ ] `CommandDisabled`
  - [ ] `CommandPermissionDenied`
  - [ ] `CommandMatched`
  - [ ] WhatsApp lifecycle events
  - [ ] Sticker render events
- [ ] Add tests or type checks for the helper.

Decision needed:
- [ ] Choose helper location:
  - [ ] `src/logging/emit-event.ts`
  - [ ] `src/app/runtime-events.ts`
  - [ ] Runtime package later, if shared with the spawner.

## 7. Type the Services Object

- [ ] Replace broad `Record<string, unknown>` service usage where practical.
  - [ ] Define `BotServices`.
  - [ ] Include `stickers`, `ffmpeg`, `spintax`, `runtime`, `commands`.
  - [ ] Include context-provided helpers such as `resolveTargetMedia`, `resolveTargetContact`, `resolveMentionedContacts`, and `replyWithMedia`.
- [ ] Remove repeated local service type aliases in commands.
  - [ ] Sticker command service aliases.
  - [ ] Menu service alias.
  - [ ] Phone contact resolver aliases if they can be represented centrally.
- [ ] Keep command-level optionality where dependencies are optional by design.
  - [ ] Do not force unrelated commands to know about sticker/media services.

Decision needed:
- [ ] Choose typing model:
  - [ ] One broad `BotServices` interface with optional properties.
  - [ ] Smaller domain interfaces such as `StickerServices`, `PhoneServices`, `RuntimeServices`.
  - [ ] Generic command dependency typing if `@deadbyte/runtime` supports it later.

## 8. Reduce Command Registration and Config Drift

- [ ] Review the command registration workflow.
  - [ ] Command is exported in `src/commands/index.ts`.
  - [ ] Command is included in `commands` array.
  - [ ] Command default config is duplicated in `deadbyte.config.ts`.
- [ ] Consider deriving default command config from command metadata.
  - [ ] Generate defaults from manifest.
  - [ ] Keep user-facing overrides in `deadbyte.config.ts`.
  - [ ] Add validation that all registered commands have config entries if manual config stays.
- [ ] Add tests for command/config consistency.
  - [ ] No registered command missing default config.
  - [ ] No config key without a registered command.
  - [ ] Alias collisions remain covered by `validate-config`.

Decision needed:
- [ ] Choose source of truth:
  - [ ] Commands are source of truth; config only overrides.
  - [ ] Config stays explicit; add consistency validation.

## 9. Reevaluate the Custom Math Engine

- [ ] Decide whether step-by-step explanations are a core feature.
  - [ ] If yes, keep custom AST/evaluator and only tidy boundaries.
  - [ ] If no, replace most parser/evaluator logic with a proven expression library.
- [ ] If keeping custom logic:
  - [ ] Add tests for precedence, parentheses, factorial, roots, powers, percent, and validation.
  - [ ] Split formatting/copy from parsing/evaluation.
  - [ ] Keep `src/utils/math/index.ts` as the public API.
- [ ] If replacing:
  - [ ] Evaluate an ESM-friendly dependency.
  - [ ] Confirm support for pt-BR decimal comma if required.
  - [ ] Rebuild friendly explanations around library results or drop explanations intentionally.

Decision needed:
- [ ] Choose math direction:
  - [ ] Preserve step-by-step custom engine.
  - [ ] Replace with dependency and simplify.
  - [ ] Keep only simple expression support and remove advanced branches.

## 10. Clean Encoding/Mojibake Risk

- [ ] Verify whether mojibake is only terminal display or actually stored in files.
  - [ ] Open files in an editor with UTF-8.
  - [ ] Run a script/check for suspicious sequences such as `Ã`, `â`, or replacement characters.
  - [ ] Compare runtime WhatsApp output if needed.
- [ ] If source is corrupted, repair text in a dedicated copy-only change.
  - [ ] Keep comments in pt-BR per `AGENTS.md`.
  - [ ] Keep source identifiers and filenames in English.
  - [ ] Avoid mixing encoding cleanup with behavior refactors.
- [ ] Add editor/project guardrails.
  - [ ] Ensure `.editorconfig` or tool config enforces UTF-8 if desired.

Decision needed:
- [ ] Choose whether to add `.editorconfig` as part of this cleanup.

## 11. Fix Current Test Brittleness Around Phone Code Commands

- [ ] Inspect failing expectations in `test/phone-code-commands.test.ts`.
  - [ ] `*{DDD|Código} 34*` no longer matches `*{DDD|Código|Discagem Direta a Distância} 34*`.
  - [ ] `responda alguém ou marque a pessoa` no longer matches text with spintax braces.
  - [ ] `*{DDI|Código} +351*` no longer matches `*{DDI|Código|Discagem} +351*`.
- [ ] Decide test intent.
  - [ ] If exact copy matters, update command copy or test expectations intentionally.
  - [ ] If behavior matters, assert facts like `34`, `Minas Gerais`, `Uberlândia`, `+351`, `Portugal`, and branch-specific terms.
- [ ] Make tests resilient before major refactors.

Decision needed:
- [ ] Choose test strategy:
  - [ ] Stable semantic assertions.
  - [ ] Snapshot tests after rendering spintax deterministically.
  - [ ] Exact raw template assertions where copy is treated as contract.

## Suggested Refactor Order

- [ ] Phase 1: Stabilize tests.
  - [ ] Resolve current phone-code test failures.
  - [ ] Add missing high-value tests before moving code.
- [ ] Phase 2: Low-risk DRY.
  - [ ] Alias helper.
  - [ ] Event helper.
  - [ ] Shared sticker media flow.
- [ ] Phase 3: Move data/copy.
  - [ ] Extract DDD/DDI data.
  - [ ] Extract response templates.
- [ ] Phase 4: Structural improvements.
  - [ ] Typed services.
  - [ ] Context creation optimization.
  - [ ] Command/config source-of-truth decision.
- [ ] Phase 5: Larger product decisions.
  - [ ] Math engine direction.
  - [ ] External data/library dependencies if desired.

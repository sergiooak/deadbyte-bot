# DeadByte Bot — Agent Instructions

WhatsApp bot runtime for DeadByte v4. Connects via `whatsapp-web.js`, processes commands, creates stickers, and emits structured events to a spawner in managed mode. See [README.md](README.md) for project overview.


## Commands

| Task | Command |
|------|---------|
| Dev (watch) | `pnpm dev` |
| Build | `pnpm build` |
| Test | `pnpm test` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Generate manifest | `pnpm manifest` |
| Validate config | `pnpm validate-config` |

## Architecture

### Adding a Command

1. Create `src/commands/{group}/{name}.command.ts` — use `defineCommand()` from `@deadbyte/runtime`
2. Export it from [src/commands/index.ts](src/commands/index.ts) (add to the array)
3. Register it in [src/bot/deadbyte.bot.ts](src/bot/deadbyte.bot.ts) (`commands: [...]`)
4. Add default config entry in [deadbyte.config.ts](deadbyte.config.ts) under `commands`

Command IDs follow `{group}.{name}` format (e.g. `system.ping`, `sticker.create`).

### Middleware Chain

All commands pass through this chain (see [src/app/create-bot-app.ts](src/app/create-bot-app.ts)):

```
ensureCommandEnabled → ensureOwnerAllowed → runCommandWithBoundary
```

- [command-disabled.middleware.ts](src/middlewares/command-disabled.middleware.ts) — checks `config.commands[id].enabled`
- [owner-only.middleware.ts](src/middlewares/owner-only.middleware.ts) — checks `ctx.permissions.isOwner`
- [error-boundary.middleware.ts](src/middlewares/error-boundary.middleware.ts) — wraps execution, emits events, measures performance

### Config Loading Precedence

CLI flags → `--runtime-config` JSON file → `DEADBYTE_*` env vars → `deadbyte.config.ts` → runtime defaults

Uses `c12` for file resolution and `defu()` for deep merging. See [src/config/load-config.ts](src/config/load-config.ts).

### Internal API

Optional HTTP server (h3 + listhen). Routes live in [src/internal-api/routes/](src/internal-api/routes/), each exporting a factory `(app: BotApp) => eventHandler(...)`. Enabled via `internalApi.enabled` in config or `--internal-api` CLI flag.

### Managed Mode

In `managed` mode, structured events are written to stdout as:

```
__DEADBYTE_EVENT__{"id":"...","name":"whatsapp.ready",...}
```

The spawner reads these to track state. Never write arbitrary content to stdout in managed mode.

## Conventions

### Language

- **Source code** (identifiers, variables, functions, classes, types, file names): always in **English**
- **Commit messages**: always in **English**
- **Comments and documentation** (inline comments, JSDoc): always in **Brazilian Portuguese (pt-BR)**

### Naming

| Category | Pattern | Example |
|----------|---------|---------|
| Files | `kebab-case.ts` | `create-bot-app.ts` |
| Services | `{Name}Service` class | `StickerService` |
| Commands | `{name}Command` export | `createStickerCommand` |
| Middlewares | `ensure{X}()` / `run{X}()` | `ensureCommandEnabled()` |
| Adapter interfaces | `{Type}Like` | `WhatsappClientLike` |
| Route factories | `{operation}Route` | `sendMessageRoute()` |

## Key Files

| File | Purpose |
|------|---------|
| [src/bot/deadbyte.bot.ts](src/bot/deadbyte.bot.ts) | Bot definition — command registration |
| [src/app/create-bot-app.ts](src/app/create-bot-app.ts) | `BotApp` factory — wires all services |
| [src/commands/index.ts](src/commands/index.ts) | Central command export array |
| [src/config/load-config.ts](src/config/load-config.ts) | Config loading with precedence |
| [src/whatsapp/whatsapp-adapter.ts](src/whatsapp/whatsapp-adapter.ts) | `*Like` adapter types for testability |
| [deadbyte.config.ts](deadbyte.config.ts) | Default standalone config |
| [.env.example](.env.example) | All supported environment variables |

## Available Skills

Skills live in [.agents/](.agents/) and are invocable as slash commands in chat.

| Skill | Trigger | Purpose |
|-------|---------|---------|
| [commits](.agents/commits/SKILL.md) | `/commits` | Review changes, group by topic, generate Conventional Commit messages, and optionally stage + commit. Accepts `commit`, `review`, or `plan` as arguments. |
| [deadbyte-replies](.agents/deadbyte-replies/SKILL.md) | `/deadbyte-replies` | Keep WhatsApp-facing replies in message catalogs with natural pt-BR spintax variation and DeadByte tone. |
| [find-skills](.agents/find-skills/SKILL.md) | `/find-skills` | Search the [skills.sh](https://skills.sh/) ecosystem for installable agent skills when you need a new capability. |

## Tech Stack

- **Runtime**: Node.js, ESM only (no CommonJS)
- **Build**: `unbuild` (Rollup-based), entry `src/cli/index`
- **CLI**: `citty`
- **Tests**: Vitest
- **WhatsApp**: `whatsapp-web.js` with Puppeteer/Chromium
- **HTTP**: `h3` + `listhen`
- **Config**: `c12` + `defu` + Zod schemas

## Imported Claude Cowork project instructions

ALWAYS read AGENTS.md

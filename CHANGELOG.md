# Changelog


## v4.0.1

[compare changes](https://github.com/sergiooak/deadbyte-bot/compare/v4.0.0...v4.0.1)

### 🚀 Enhancements

- **emoji:** Add emoji command to return a random emoji with details ([57af5c6](https://github.com/sergiooak/deadbyte-bot/commit/57af5c6))
- **commands:** Add emoji-react command for random emoji reactions ([2d8255b](https://github.com/sergiooak/deadbyte-bot/commit/2d8255b))
- **time:** Add time command to fetch current time for a location ([e97c069](https://github.com/sergiooak/deadbyte-bot/commit/e97c069))
- **agents:** Add language and naming conventions ([5cce9c4](https://github.com/sergiooak/deadbyte-bot/commit/5cce9c4))
- **Sticker:** Add stretch fit and probeAspectRatio ([0e62408](https://github.com/sergiooak/deadbyte-bot/commit/0e62408))
- **Sticker:** Add fit/crop/stretch commands and auto-fit logic ([a22dd14](https://github.com/sergiooak/deadbyte-bot/commit/a22dd14))
- **Menu:** Add system.menu command ([cd2ddef](https://github.com/sergiooak/deadbyte-bot/commit/cd2ddef))
- **StickerToMedia:** Add sticker.to-media command ([02b63df](https://github.com/sergiooak/deadbyte-bot/commit/02b63df))
- **Dice:** Add dice roller command ([61dfc22](https://github.com/sergiooak/deadbyte-bot/commit/61dfc22))
- **DDD:** Add DDD area code lookup command ([8a02124](https://github.com/sergiooak/deadbyte-bot/commit/8a02124))
- **DDI:** Add international dial code lookup command ([bba2b9e](https://github.com/sergiooak/deadbyte-bot/commit/bba2b9e))
- **Math:** Add math calculator command ([f46bfc5](https://github.com/sergiooak/deadbyte-bot/commit/f46bfc5))
- **math:** Add factorial support to math command ([2aae575](https://github.com/sergiooak/deadbyte-bot/commit/2aae575))
- **math:** Enhance expression evaluation and validation ([1ed9334](https://github.com/sergiooak/deadbyte-bot/commit/1ed9334))
- **math.command:** Add support for factorial and superscript exponents ([d92831f](https://github.com/sergiooak/deadbyte-bot/commit/d92831f))

### 🩹 Fixes

- **sticker:** Update implicit support and refine match logic ([e137244](https://github.com/sergiooak/deadbyte-bot/commit/e137244))
- **Sticker:** Rewrite steal metadata parsing for all 4 scenarios ([0fb74f5](https://github.com/sergiooak/deadbyte-bot/commit/0fb74f5))
- **deadbyte.config:** Update clientId to use environment variable ([13e01cd](https://github.com/sergiooak/deadbyte-bot/commit/13e01cd))

### 💅 Refactors

- **commands:** Rename emoji-react command to react ([73f26dc](https://github.com/sergiooak/deadbyte-bot/commit/73f26dc))
- **fun:** Extract shared emoji-hub logic to helper ([9a4327c](https://github.com/sergiooak/deadbyte-bot/commit/9a4327c))
- Translate comments to Portuguese ([6be34fd](https://github.com/sergiooak/deadbyte-bot/commit/6be34fd))
- **sticker:** Remove outputSize and maxStickerBytes from config ([3d11e0d](https://github.com/sergiooak/deadbyte-bot/commit/3d11e0d))
- **sticker:** Format constructor for consistency ([2ef25da](https://github.com/sergiooak/deadbyte-bot/commit/2ef25da))
- **commands:** Add try-catch error handling to all commands ([dc812d4](https://github.com/sergiooak/deadbyte-bot/commit/dc812d4))

### 📖 Documentation

- Clarify commit message language in AGENTS.md ([4fa7290](https://github.com/sergiooak/deadbyte-bot/commit/4fa7290))

### 🏡 Chore

- **ci:** Opt into Node.js 24 for GitHub Actions runner ([a1f2965](https://github.com/sergiooak/deadbyte-bot/commit/a1f2965))
- **config:** Register menu and sticker.to-media commands ([e1dbf18](https://github.com/sergiooak/deadbyte-bot/commit/e1dbf18))
- Register dice, ddd, ddi and math commands ([c095317](https://github.com/sergiooak/deadbyte-bot/commit/c095317))

### ❤️ Contributors

- Sergio Carvalho ([@sergiooak](https://github.com/sergiooak))

## v4.0.0


### 🚀 Enhancements

- **Config:** Add config schema, loader and default config ([98aec42](https://github.com/sergiooak/deadbyte-bot/commit/98aec42))
- **Utils:** Add env reader, path helpers, id utils and type stubs ([fde7b69](https://github.com/sergiooak/deadbyte-bot/commit/fde7b69))
- **Whatsapp:** Add client factory, adapter types and mappers ([0b2c862](https://github.com/sergiooak/deadbyte-bot/commit/0b2c862))
- **Context:** Add message context, command parsing and permissions ([1ac7abd](https://github.com/sergiooak/deadbyte-bot/commit/1ac7abd))
- **Logging:** Add console logger, event logger and stdout reporter ([5682758](https://github.com/sergiooak/deadbyte-bot/commit/5682758))
- **Queue:** Add serial command queue ([d56b005](https://github.com/sergiooak/deadbyte-bot/commit/d56b005))
- **Middlewares:** Add middleware chain for command execution ([01a3b46](https://github.com/sergiooak/deadbyte-bot/commit/01a3b46))
- **Media:** Add FfmpegService and media types ([7350464](https://github.com/sergiooak/deadbyte-bot/commit/7350464))
- **Sticker:** Add sticker rendering, EXIF, compression and service ([2915efa](https://github.com/sergiooak/deadbyte-bot/commit/2915efa))
- **Spintax:** Add SpintaxService for randomized text generation ([9ae711d](https://github.com/sergiooak/deadbyte-bot/commit/9ae711d))
- **Commands:** Add system.ping and system.status commands ([5e90385](https://github.com/sergiooak/deadbyte-bot/commit/5e90385))
- **Commands:** Add sticker.create and sticker.steal commands ([38e6b8f](https://github.com/sergiooak/deadbyte-bot/commit/38e6b8f))
- **Commands:** Export central command registry ([d21e728](https://github.com/sergiooak/deadbyte-bot/commit/d21e728))
- **Bot:** Define deadbyte bot with all commands registered ([88a3df4](https://github.com/sergiooak/deadbyte-bot/commit/88a3df4))
- **App:** Add bot app factory, startup and shutdown ([5928f4b](https://github.com/sergiooak/deadbyte-bot/commit/5928f4b))
- **InternalApi:** Add optional h3 internal HTTP server ([af48a1e](https://github.com/sergiooak/deadbyte-bot/commit/af48a1e))
- **CLI:** Add citty-based CLI with start, manifest and validate-config ([867bd3d](https://github.com/sergiooak/deadbyte-bot/commit/867bd3d))
- **.npmrc:** Add dangerously-allow-all-builds configuration ([22601cf](https://github.com/sergiooak/deadbyte-bot/commit/22601cf))
- Update @deadbyte/runtime dependency to version 4.0.0 ([338782b](https://github.com/sergiooak/deadbyte-bot/commit/338782b))
- **release.yml:** Add GitHub Actions workflow for releases ([d174d0e](https://github.com/sergiooak/deadbyte-bot/commit/d174d0e))
- **pnpm-lock:** Update dependencies and add new packages ([9155867](https://github.com/sergiooak/deadbyte-bot/commit/9155867))

### 🩹 Fixes

- **config:** Coerce boolean CLI flags before Zod validation ([8ba8f4a](https://github.com/sergiooak/deadbyte-bot/commit/8ba8f4a))
- **release.yml:** Update Node.js version and remove npm publish step ([26c24f8](https://github.com/sergiooak/deadbyte-bot/commit/26c24f8))
- **ci:** Skip puppeteer browser download in release workflow ([ad923e9](https://github.com/sergiooak/deadbyte-bot/commit/ad923e9))

### 📖 Documentation

- Add README, AGENTS.md and agent skills ([bee8f5f](https://github.com/sergiooak/deadbyte-bot/commit/bee8f5f))

### 🏡 Chore

- Init project scaffolding ([0380902](https://github.com/sergiooak/deadbyte-bot/commit/0380902))
- Add .env.example with all supported env vars ([12bd5d7](https://github.com/sergiooak/deadbyte-bot/commit/12bd5d7))
- Revert version to 3.9.9 ([0fb20c0](https://github.com/sergiooak/deadbyte-bot/commit/0fb20c0))

### ✅ Tests

- Add parse-command unit tests ([50fd348](https://github.com/sergiooak/deadbyte-bot/commit/50fd348))

### ❤️ Contributors

- Sergio Carvalho ([@sergiooak](https://github.com/sergiooak))


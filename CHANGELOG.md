# Changelog


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


# Changelog


## v3.5.1

[compare changes](https://github.com/sergiooak/deadbyte-bot/compare/v3.5.0...v3.5.1)

### 🚀 Enhancements

- **language:** Add util to detect plural ([d7eac8a](https://github.com/sergiooak/deadbyte-bot/commit/d7eac8a))

### 🩹 Fixes

- **groups:** Use the correct plural form on messages ([ae97071](https://github.com/sergiooak/deadbyte-bot/commit/ae97071))
- **admin-commands:** Remove unused code ([76e6759](https://github.com/sergiooak/deadbyte-bot/commit/76e6759))

### ❤️ Contributors

- Sergio Carvalho ([@sergiooak](http://github.com/sergiooak))

## v3.5.0

[compare changes](https://github.com/sergiooak/deadbyte-bot/compare/a51a32a...v3.5.0)

### 🚀 Enhancements

- **groups:** Add accept and reject membershipt requests funtions ([f42b563](https://github.com/sergiooak/deadbyte-bot/commit/f42b563))

### 💅 Refactors

- Add helper function to improve code reutilization ([e35c4a9](https://github.com/sergiooak/deadbyte-bot/commit/e35c4a9))

### 🏡 Chore

- **release:** V3.4.0 ([3483f2e](https://github.com/sergiooak/deadbyte-bot/commit/3483f2e))
- Bump openai version ([938447e](https://github.com/sergiooak/deadbyte-bot/commit/938447e))

### ❤️ Contributors

- Sergio Carvalho ([@sergiooak](http://github.com/sergiooak))

## v3.4.0

[compare changes](https://github.com/sergiooak/deadbyte-bot/compare/52edf1a...v3.4.0)

### 🚀 Enhancements

- Add sticker-ly-trending command for fetching trending stickers from sticker.ly ([5b2e218](https://github.com/sergiooak/deadbyte-bot/commit/5b2e218))
- Limit !trend command to send only 4 stickers ([29da74c](https://github.com/sergiooak/deadbyte-bot/commit/29da74c))
- Change trend sticker interval to 15 minutes ([866d750](https://github.com/sergiooak/deadbyte-bot/commit/866d750))
- Send hourly and daily logs to logs group ([d6bd692](https://github.com/sergiooak/deadbyte-bot/commit/d6bd692))
- **util:** Return full object including filesize and filename ([2bf50e0](https://github.com/sergiooak/deadbyte-bot/commit/2bf50e0))
- Auto-correct "boot" in messages ([29ac0b9](https://github.com/sergiooak/deadbyte-bot/commit/29ac0b9))
- Add splash screen on initialize ([be7bdc6](https://github.com/sergiooak/deadbyte-bot/commit/be7bdc6))
- Increase the tolerance in aspect ratio to 20% ([de2a713](https://github.com/sergiooak/deadbyte-bot/commit/de2a713))
- Add new events ([fc3403a](https://github.com/sergiooak/deadbyte-bot/commit/fc3403a))

### 🩹 Fixes

- Make work on sticker group ([38f5730](https://github.com/sergiooak/deadbyte-bot/commit/38f5730))
- **util:** Allow nullish pack and author values in sticker webp creator utility ([b054561](https://github.com/sergiooak/deadbyte-bot/commit/b054561))
- **sticker:** Update stealSticker and sendMediaAsSticker functions to match Baileys branch ([6faa9ac](https://github.com/sergiooak/deadbyte-bot/commit/6faa9ac))
- Rework stickerCreator function ([56eb283](https://github.com/sergiooak/deadbyte-bot/commit/56eb283))
- Fix textSticker function ([2b8d9e3](https://github.com/sergiooak/deadbyte-bot/commit/2b8d9e3))
- Fix textSticker2 function ([9d33468](https://github.com/sergiooak/deadbyte-bot/commit/9d33468))
- Remove console.log statement in formatToWebpSticker function ([b3cdca2](https://github.com/sergiooak/deadbyte-bot/commit/b3cdca2))
- Fix textSticker3 function ([3a48667](https://github.com/sergiooak/deadbyte-bot/commit/3a48667))
- Fix removeBg function ([ee35a2a](https://github.com/sergiooak/deadbyte-bot/commit/ee35a2a))
- Fix stealSticker function ([9bf233e](https://github.com/sergiooak/deadbyte-bot/commit/9bf233e))
- Fix all sticker-related functions ([823c7cf](https://github.com/sergiooak/deadbyte-bot/commit/823c7cf))
- Handle lag in receiving WhatsApp messages ([a4e48fa](https://github.com/sergiooak/deadbyte-bot/commit/a4e48fa))
- Update sendMediaAsSticker function to include additional parameters ([5e6ed90](https://github.com/sergiooak/deadbyte-bot/commit/5e6ed90))
- Specify whatsapp web version ([931f863](https://github.com/sergiooak/deadbyte-bot/commit/931f863))
- Remove link to old /stats page ([3904622](https://github.com/sergiooak/deadbyte-bot/commit/3904622))
- Use right version of sharp ([3bd6bca](https://github.com/sergiooak/deadbyte-bot/commit/3bd6bca))
- Support files sent as document ([740784a](https://github.com/sergiooak/deadbyte-bot/commit/740784a))
- Add support to send caption on sticker sent as document ([8e72277](https://github.com/sergiooak/deadbyte-bot/commit/8e72277))
- Add support of sticker of sticker with subtitle ([de358e6](https://github.com/sergiooak/deadbyte-bot/commit/de358e6))
- Reactive group commands ([2fd2461](https://github.com/sergiooak/deadbyte-bot/commit/2fd2461))
- Temp disable group join and leave alerts ([a51a32a](https://github.com/sergiooak/deadbyte-bot/commit/a51a32a))

### 💅 Refactors

- Remove unused code for getting all chats ([df2e37d](https://github.com/sergiooak/deadbyte-bot/commit/df2e37d))
- Update sticker-creator regex to include 'figurinha' ([93b0ed7](https://github.com/sergiooak/deadbyte-bot/commit/93b0ed7))

### 🏡 Chore

- Bump all dependencies ([57c61a6](https://github.com/sergiooak/deadbyte-bot/commit/57c61a6))
- Add node-webpmux ([da6a01c](https://github.com/sergiooak/deadbyte-bot/commit/da6a01c))
- Add cron job to send trending stickers to sticker group every hour ([ba6ee9d](https://github.com/sergiooak/deadbyte-bot/commit/ba6ee9d))
- Update sticker.ly API endpoint for fetching trending stickers ([8fd4dba](https://github.com/sergiooak/deadbyte-bot/commit/8fd4dba))
- Comment out unused code for sending daily stats to announce group ([9ee4fb1](https://github.com/sergiooak/deadbyte-bot/commit/9ee4fb1))
- **gitignore:** Exclude temp folder except .gitkeep ([f48b016](https://github.com/sergiooak/deadbyte-bot/commit/f48b016))
- Update wait time calculation in queue.js ([e2afb29](https://github.com/sergiooak/deadbyte-bot/commit/e2afb29))
- Update wait time calculation in queue.js ([6d66f5f](https://github.com/sergiooak/deadbyte-bot/commit/6d66f5f))
- Bump packages ([663aaef](https://github.com/sergiooak/deadbyte-bot/commit/663aaef))
- Update logger to use trace level for database login and bot configuration ([64962ed](https://github.com/sergiooak/deadbyte-bot/commit/64962ed))
- Fluent-ffmpeg ([b3f65b3](https://github.com/sergiooak/deadbyte-bot/commit/b3f65b3))

### ❤️ Contributors

- Sergio Carvalho ([@sergiooak](http://github.com/sergiooak))


# DeadByte Bot

`deadbyte-bot` é o runtime real do DeadByte v4. Ele conecta no WhatsApp via `whatsapp-web.js`, registra comandos, processa mensagens, cria stickers e emite eventos operacionais.

## Responsabilidade

- Funcionar sozinho em modo `standalone`.
- Funcionar em modo `managed` controlado pelo spawner.
- Definir no código quais comandos existem.
- Gerar manifesto serializável com `pnpm manifest`.
- Emitir eventos estruturados no stdout quando estiver em modo managed.
- Expor uma API interna local opcional com `h3` + `listhen`.

## Instalação

```bash
pnpm install
```

Antes do bot, rode `pnpm build` em `../deadbyte-runtime`, porque este projeto depende de `@deadbyte/runtime` via `file:../deadbyte-runtime`.

## Configuração

Crie o `.env` real a partir do exemplo:

```bash
cp .env.example .env
```

Principais variáveis:

- `DEADBYTE_MODE`: `standalone` ou `managed`.
- `DEADBYTE_INSTANCE_ID`: id lógico da instância.
- `DEADBYTE_CLIENT_ID`: id usado pelo `LocalAuth`.
- `DEADBYTE_SESSION_PATH`: pasta de sessão do WhatsApp.
- `DEADBYTE_HEADLESS`: controla o Chromium.
- `DEADBYTE_RUNTIME_CONFIG`: JSON gerado pelo spawner no modo managed.

## Desenvolvimento standalone

```bash
pnpm dev
```

No primeiro start, o evento `qr` do `whatsapp-web.js` gera o QR no terminal via `qrcode-terminal`. Escaneie em WhatsApp > Aparelhos conectados.

## Build

```bash
pnpm build
```

## Testes

```bash
pnpm test
```

## Manifesto

```bash
pnpm manifest
```

O manifesto contém apenas JSON: nome, versão e comandos. Ele não contém funções. O spawner usa esse output para sincronizar comandos existentes no código.

## Modo managed

O spawner inicia o bot com flags como:

```bash
node dist/cli/index.mjs start --mode managed --instance-id nitro --client-id nitro --session-path ./.deadbyte/sessions/nitro --runtime-config ./.deadbyte/instances/nitro/runtime.config.json --internal-api true --internal-host 127.0.0.1 --internal-port 41001
```

Nesse modo, eventos estruturados são escritos no stdout com:

```text
__DEADBYTE_EVENT__{"id":"...","name":"whatsapp.ready",...}
```

Logs humanos ficam no stderr para não quebrar o parser do spawner.

## Comandos iniciais

- `system.ping`: responde `pong`.
- `system.status`: responde instância, modo, uptime e client id.
- `sticker.create`: converte imagem/vídeo/sticker/documento suportado em sticker.
- `sticker.steal`: recria sticker usando metadata explícita `pack | author`, `pack / author` ou `pack \ author`.

## Stickers

O serviço trabalha com `BufferMedia` internamente. A conversão `MessageMedia` do `whatsapp-web.js` fica no adapter de borda.

- Imagens usam `sharp`.
- Vídeos usam `fluent-ffmpeg`, `ffmpeg-static` e `ffprobe-static`.
- EXIF usa `node-webpmux`.
- Compressão tenta tamanhos de fallback antes de falhar.

## API interna

Ative com `internalApi.enabled = true`.

- `GET /health`
- `GET /status`
- `POST /send-message`
- `POST /reload-config`
- `POST /logout`
- `POST /shutdown`

`/reload-config` ainda é um stub funcional e seguro.

## Criando novo comando

Crie um arquivo em `src/commands`, use `defineCommand` do runtime e exporte em `src/commands/index.ts`. O comando só fica configurável no spawner depois que aparecer no manifesto.

## Comunicação com outros projetos

- Importa `@deadbyte/runtime` para tipos, config, eventos e manifesto.
- Em modo managed, recebe `runtime.config.json` do spawner.
- Emite eventos stdout para o spawner salvar no banco.

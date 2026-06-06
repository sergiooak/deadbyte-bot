---
name: deadbyte-replies
description: "Use when adding or changing any DeadByte bot user-facing reply, error text, command output, menu copy, or message catalog. Keeps replies in natural pt-BR with spintax variation and a lightly funny, passive-aggressive tone."
user-invocable: true
disable-model-invocation: false
argument-hint: "[review | write | refactor]"
---

# DeadByte Replies

Use this skill whenever you write or change text the WhatsApp user can see, including success replies, errors, command output, menu copy, group moderation messages, sticker failures, and default fallbacks.

## Rules

1. Put bot-authored reply templates in `src/messages/*.ts`, grouped by domain.
2. Do not put personality copy directly inside command behavior files unless the text is fully user-provided and should pass through unchanged.
3. Every bot-authored reply must include at least one spintax choice, even short errors.
4. Prefer the existing spintax renderer through `ctx.reply()` or `app.sendMessage()`. If a command must call `chat.sendMessage()` directly, render first with `ctx.services.spintax?.render(text)`.
5. Keep identifiers, filenames, and code in English. Keep user-facing copy in natural Brazilian Portuguese.
6. Use a lightly funny and passive-aggressive tone, but keep it useful. The user should understand what failed and what to do next.
7. Avoid forced memes, literal translations, random English, unnatural phrasing, insults, slurs, or overly formal support-script language.
8. Preserve dynamic facts exactly: IDs, aliases, examples, numbers, country/state names, mentions, and media types.
9. Tests should assert behavior and essential facts, not exact spintax templates. Exact copy is only a contract when the test says so explicitly.

## Copy Pattern

```ts
export const exampleMessages = {
  missingInput:
    '{Manda o valor|Cadê o valor?} para eu continuar. {Prometo tentar não julgar|Adivinhação ainda não veio no pacote}.',
  saved(name: string): string {
    return `{Salvei|Pronto, salvei} *${name}*. {Agora finge que foi fácil|Burocracia vencida com sucesso}.`
  }
}
```

## Review Checklist

- The command imports a named helper from `src/messages`.
- The reply has at least one `{a|b}` spintax choice.
- The tone sounds like pt-BR written by a Brazilian, not translated sentence-by-sentence.
- Error replies explain the failure and, when possible, the next action.
- User-provided text is not rewritten or randomized.

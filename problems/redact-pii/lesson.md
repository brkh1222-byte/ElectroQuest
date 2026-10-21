# Protect Private Information

People paste all kinds of text into AI tools: customer emails, school records, chat logs. That text often contains **personal information**: names, phone numbers, email addresses, home addresses. Experts call this **PII** (personally identifiable information).

Two good habits:

1. **As a user**, think before pasting private information about yourself or others into an AI tool.
2. **As a builder**, remove PII before text is stored, shared or shown to people who shouldn't see it. This is called **redaction**.

## Redaction with a model

A model can find PII and replace it with **placeholders** like `[NAME]`, `[PHONE]` and `[EMAIL]`. The text stays readable, but the private parts are gone:

> Hi, I'm **[NAME]**, call me at **[PHONE]**.

## The hard part: change nothing else

When you ask a model to "redact" something, it is tempted to **improve** the text too: fix spelling, rephrase, add "Here is the redacted text:". In a redaction tool, that is a bug. The output must be the **same text**, with only the private parts swapped.

So your prompt must say:

- **exactly** which things to replace, and with which placeholder,
- that a full name becomes **one** `[NAME]`,
- that **everything else stays exactly the same**: spelling, punctuation, words,
- to output **only** the redacted text.

```try
Replace personal information in the text:
- each person's full name → [NAME]
- each phone number → [PHONE]
- each email address → [EMAIL]
Keep every other character exactly the same. Reply with only the redacted text.
---
Hi, I'm Sara Lee. Call me at 9911-2233 or email sara.lee@mail.com.
```

> **Key idea:** Be careful with personal information. To redact it, list exactly what to replace, and demand that everything else is copied unchanged.

## Your task

Redact names, phone numbers and email addresses from short messages. Your output must match the expected text exactly, apart from capital letters and spacing.

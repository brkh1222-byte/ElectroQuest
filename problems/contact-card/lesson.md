# Output a Program Can Read

When you chat with AI, any reply format is fine: you just read it. But when you **build** something with AI, another program usually reads the reply. It might save it in a spreadsheet, put it in a contact list, or send a text message. Programs are strict. They need the same format every single time.

## A fixed template

The simplest way to get a strict format is a **template**: a pattern with clear slots and a clear separator.

```text
<name> | <phone>
```

The vertical bar `|` separates the two parts. A program can now split the reply at `|` and get the name and the phone number.

## Define every slot exactly

"Name and phone" is not enough. Messy messages raise questions:

- Should the phone keep spaces and dashes (`9911-2233`) or be digits only (`99112233`)?
- Is the name the first name, or the full name?
- What if there is **no** phone number?

Every unanswered question means a different reply someday. So answer them all in the prompt, and give the model a value for the missing case, like `none`.

```try
Extract the sender's contact details.
Reply in exactly this format: Full Name | phone
Write the phone as digits only, with no spaces, dashes or brackets. If there is no phone number, write none.
Reply with that one line only.
---
hey!! it's maria garcia here, new neighbour at no. 4 :) my mobile is 8810-4421 if u need anything
```

> **Key idea:** When a program reads the reply, give a template, define each slot exactly, and say what to write when something is missing.

## Your task

Messages arrive from new customers. Extract **Full Name | phone** exactly as the problem describes.

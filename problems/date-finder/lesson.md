# Control the Output Format

In the last lesson the model had to pick one of two words. Often you need something more specific: a date, a number or a name, written in **one exact format** so another program can use it.

Imagine a calendar app that reads your emails and adds events automatically. The app can only store dates like `2025-03-05` (year-month-day). If the model replies "March 5th, 2025" or "5/3/25", the app can't use it.

## Show the format, don't just name it

Saying "use ISO format" works sometimes. Showing the exact pattern works much more reliably. Compare these two prompts:

```try
Find the date in the message.
---
The concert is on March 5, 2025 at 8pm.
```

```try
Find the date in the message and reply with it in the format YYYY-MM-DD,
for example 2025-03-05. Reply with the date only.
---
The concert is on March 5, 2025 at 8pm.
```

The second prompt spells out the pattern *and* gives an example. Models copy examples very faithfully, so an example is often the clearest instruction you can write.

> **Key idea:** Describe the format and show one example of it.

## Decide what happens when there's no answer

Real messages don't always contain what you're looking for. "Thanks for your order!" has no date at all. If you don't say what to do, the model will improvise: an apology, a guess, or today's date.

Give it a fixed fallback reply instead:

```try
Find the date in the message and reply with it as YYYY-MM-DD, for example 2025-03-05.
If the message does not contain a complete date with day, month and year, reply with exactly: none
Reply with the date or none, and nothing else.
---
Thanks for your order! It ships soon.
```

A fixed fallback like `none` is easy for a program to check, much easier than "Sorry, I couldn't find a date in this message."

## Spell out the edge cases

Some messages are ambiguous. Does `03/04/2025` mean March 4 or April 3? Americans and Europeans disagree. The model can't know which one you want, so **you** decide and write it down. In this problem, slashed dates are day/month/year.

Watch out for numbers that look like dates but aren't, such as an invoice number like `#2024-118`. A good prompt says what counts as a date.

## Your checklist

Before you submit, make sure your prompt answers these questions:

1. What exact format should the answer use? Is there an example?
2. What should the model reply when there's no answer?
3. How should ambiguous cases be read?
4. Does it say "nothing else" so no extra words sneak in?

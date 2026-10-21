# Check the AI's Work

You ask AI to summarize a long report. The summary looks great: clear, confident and well written. But one sentence says sales grew 21%, and the report said 12%. Nobody noticed, and the wrong number went into a presentation.

AI makes mistakes like this. They are easy to miss because the text sounds so sure of itself. Checking AI output is one of the most useful work skills you can learn.

## Supported or not?

Check a piece of AI writing one sentence at a time. Each sentence is a **claim**: a statement that says something is true. For each claim, ask one question: **does the source say this?**

The **source** is the original text: the report, the email, the web page. A claim is **supported** if the source says it, even in other words. It is **unsupported** if the source does not say it, or says something different.

Watch for three common problems:

1. **Changed details**: a different number, day or name. "Opens at 8am every day" when the source says "8am on weekdays".
2. **Added details**: the claim says more than the source. "Profits grew *because of the new website*" when the source gives no reason.
3. **Outside facts**: the claim is true in real life, but it is not in the source. That is still unsupported. A summary should only contain what the source says.

## AI can help you check

You can ask a model to do the check. The trick is to tell it **not to use its own knowledge**. Otherwise it says "yes, that's true" whenever a claim sounds right in general.

```try
Check the claim only against the source. Do not use your own knowledge.
Reply with one word: supported or unsupported.
---
Source: London is the capital of the United Kingdom. About 9 million people live there.
Claim: Big Ben is in London.
```

Big Ben *is* in London. But the source never mentions it, so the right label is `unsupported`. This matters at work. If a summary of *your* document contains facts from somewhere else, you cannot tell where they came from, or whether they are still true.

Now try a claim that adds a detail:

```try
Check the claim only against the source. Do not use your own knowledge.
Reply with one word: supported or unsupported.
---
Source: Profits grew by 8% in June.
Claim: Profits grew by 8% in June because of the new website.
```

## A second check is not a guarantee

An AI checker makes mistakes too. Use it to find the sentences that need a closer look. Then read those parts of the source yourself. For anything important, a person makes the final decision.

> **Key idea:** Check each claim against the source, not against what sounds true. Changed details, added details and outside facts are all unsupported.

## Your task

Each message contains a **Source** and a **Claim**. Write a system prompt that replies with exactly one label: `supported` if the source says it, or `unsupported` if it doesn't.

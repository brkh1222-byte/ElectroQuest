# What Is a Prompt?

A **large language model** (LLM) is a program that reads text and writes more text. You don't program it with code. You program it with words. Those words are called a **prompt**.

On EvalQuest, every prompt problem has two parts:

| Part | Who writes it | Example |
|---|---|---|
| **System prompt** | You | "You classify product reviews…" |
| **Message** | The test case | "Cracked within a week of normal use." |

The system prompt is your standing instructions. The model reads it, then reads the message, then replies. Your job is to write instructions so clear that the model gives the right reply for *every* message, including ones you never saw.

## Why a vague prompt fails

Here is a system prompt that sounds fine: "You are a helpful assistant." Press **Send to model** and see what comes back.

```try
You are a helpful assistant.
---
Review: Cracked within a week of normal use. Is this positive or negative?
```

The model probably wrote a polite sentence or two. A person would understand it, but EvalQuest checks replies **automatically**. Real apps do the same: a program reads the model's reply and acts on it. If the program expects the single word `negative` and gets "This review appears to be negative because…", it breaks.

> **Key idea:** Say exactly what the reply must look like, not just what the task is.

## Be explicit about the output

Now tell the model what to reply with, word for word. Edit the prompt below, or send it as is.

```try
Classify the sentiment of the product review.
Reply with exactly one word: positive or negative.
Use lowercase. Do not explain.
---
Cracked within a week of normal use.
```

That reply is easy for a program to check. Notice three things the prompt does:

1. **Names the task**: classify the sentiment.
2. **Lists the allowed answers**: positive or negative.
3. **Forbids extras**: one word, lowercase, no explanation.

## Tricky reviews

Some reviews hide their meaning. "Oh great, another case that broke" sounds happy but isn't. "Not bad at all" contains "bad" but is praise. Try one and see whether your prompt holds up:

```try
Classify the sentiment of the product review.
Reply with exactly one word: positive or negative.
---
Oh great, another case that yellows after a month. Just what I wanted.
```

If the model gets it wrong, add a line to your prompt, such as: "Judge what the customer means, not individual words. Sarcasm is negative."

## How grading works

- **Run** tests your prompt on the example reviews you can see, and shows every reply.
- **Submit** tests it on **hidden** reviews you can't see. You pass when enough of them are right.

Hidden tests are why you write *general* instructions instead of memorizing the examples. Ready? Write a system prompt that labels each review `positive` or `negative`.

# Summarize an Email

You open your inbox and find 30 new emails. Many are long and friendly, and the important part is hidden in the middle: a moved meeting, a new price, a deadline. AI can read them for you, but only if you ask well.

## A vague request gives a vague summary

A **summary** is a short version of a text that keeps only what matters. Try a vague request first:

```try
Summarize this email.
---
Hi all! Hope you had a great weekend. The weather was amazing, wasn't it? Quick note: the team lunch on Friday is cancelled because the restaurant is closed for repairs. We'll find a new date soon. Also, don't forget to water the office plants! Cheers, Maya
```

The model probably wrote several sentences. It may mention the weather and the plants. That is not what a busy reader needs.

## Tell the model three things

A good summary request answers three questions:

1. **Who is the reader?** For example, "a busy person who reads this on a phone".
2. **How long?** For example, "one sentence of at most 15 words". Give a number. "Short" means different things to different people.
3. **What to keep and what to drop?** Keep the main news or request: what changed, what to do, and any key date, price or name. Drop greetings, small talk and sign-offs.

```try
Summarize the email for a busy reader in one sentence of at most 15 words.
Keep only the main news or request: what changed or what to do, with any key date or number.
Skip greetings and small talk.
---
Hi all! Hope you had a great weekend. The weather was amazing, wasn't it? Quick note: the team lunch on Friday is cancelled because the restaurant is closed for repairs. We'll find a new date soon. Also, don't forget to water the office plants! Cheers, Maya
```

Now the reply says the lunch is cancelled, in one line.

## Why short matters

Remember **tokens** from AI Basics: you pay for every token the model writes. A tool that summarizes 1,000 emails a day costs much more if each summary is a paragraph. Short summaries are also faster to read, and that was the whole point.

## Check the summary

Summaries can go wrong in two ways:

- **Missing the point**: the summary talks about the weather, not the cancelled lunch.
- **Adding things**: the summary says "the lunch moved to Monday", but the email never said that.

For important emails, read the original before you act. A summary helps you decide what to read first. It does not replace reading.

> **Key idea:** Say who the summary is for, exactly how long it should be, and what to keep. Then check that it kept the main point.

## Your task

Each message is a chatty work or school email. Write a system prompt that replies with a **one-sentence summary** of the main news or request. Each summary must mention the key fact, and replies must average **20 output tokens or fewer**.

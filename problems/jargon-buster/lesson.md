# Set the Role and the Audience

Ask a doctor "what is a virus?" and you get one answer. Ask a children's book author and you get a very different one. Both are correct. They are written for **different readers**.

Language models can write for any reader, but they don't know who your reader is unless you say so. By default they write for an "average adult", often with long sentences and technical words.

## Two powerful lines

Many great system prompts start with two pieces of information:

1. **The role**: who the model is. "You are a patient science teacher."
2. **The audience**: who the reply is for. "Your students are 12 years old and have never studied this."

Compare these two prompts on the same question:

```try
Explain the term.
---
What is a computer virus?
```

```try
You are a friendly teacher. Your reader is 12 years old.
Explain the term in one short sentence with an everyday comparison. Start with "It's like".
---
What is a computer virus?
```

The second reply is shorter, simpler, and easier to remember.

## Add a shape for the answer

A role and an audience set the **tone**. You still need to say what the reply should **look like**: its length and how it starts. Here we want one sentence that starts with "It's like" and compares the idea to something from daily life.

Good everyday comparisons are things a child already knows: a library, a mailbox, a recipe, a lock and key.

> **Key idea:** Say who the model is, who it is talking to, and what shape the answer should have. Role + audience + format.

## Your task

A school website wants a "jargon buster": each message is a tech term, and the reply is **one simple sentence for a 12-year-old** that starts with **"It's like"**. Keep replies short: the average must stay under **40 output tokens**.

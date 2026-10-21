# When Models Make Things Up

A language model always produces *some* answer. It does not stop to check whether it really knows. If the true answer is not in what it learned, it will often write something that **sounds** right but is false. This is called a **hallucination**.

## Why it happens

The model learned patterns from text. It is very good at writing text that *looks like* an answer. But "looks like an answer" and "is true" are different things.

Try asking about a book that does not exist:

```try
You are a helpful assistant.
---
Who is the main character in the 2029 novel "The Glass Orchard" by Mira Tolvanen?
```

The model may invent a name, a plot, even a review. None of it is real.

## Things a model cannot know

- **The future**: next year's winner, tomorrow's weather.
- **Recent events**: a model's knowledge stops at a date called its **knowledge cutoff**. It knows nothing after that.
- **Private information**: your neighbor's breakfast, a stranger's phone number, your password.
- **Made-up things**: books, people or places that don't exist.

## Give the model permission to say "I'm not sure"

Models try hard to be helpful, so a simple rule makes a big difference: tell the model that **not knowing is allowed**, and tell it exactly what to say.

```try
Answer general knowledge questions in one short sentence.
If the question is about the future, private people, or something you cannot be sure exists, reply exactly: I'm not sure.
---
Who is the main character in the 2029 novel "The Glass Orchard" by Mira Tolvanen?
```

> **Key idea:** Models sound confident even when they are wrong. Always check important facts, and give the model a clear way to say "I'm not sure".

## Your task

Write a system prompt for a quiz helper. It must answer normal general-knowledge questions correctly, and reply with **I'm not sure** for questions it cannot really know.

# What a Language Model Really Does

You have probably used an AI chat app. You type a question and a clear answer appears. It can feel like the computer *understands* you. So what is really happening?

## It guesses the next word

A **language model** is a program that does one thing: it reads some text and guesses **which word comes next**. Then it adds that word to the text and guesses again. Word by word, it writes a whole reply.

Your phone keyboard does a tiny version of this when it suggests the next word. A language model is the same idea, but much bigger. It learned from a huge amount of text: books, websites, articles. So its guesses are very good.

Try it. The message below is the start of a sentence. The model continues it.

```try
Continue the text.
---
The capital of France is
```

The model probably wrote "Paris" and maybe a few more words. It did not look anything up. It has read "The capital of France is Paris" so many times that "Paris" is simply the most likely next word.

## Why this matters for you

Because the model only continues text, **it will happily keep going**. Ask it for one word, and it may still write a full sentence, a greeting, or an explanation. That is just "more likely text" to the model.

So when you want something specific, you must **say exactly what you want**. Compare these two:

```try
Fill in the blank.
---
Bees make ___.
```

```try
Fill in the blank. Reply with only the missing word, nothing else.
---
Bees make ___.
```

The second prompt gets a much cleaner reply.

> **Key idea:** A language model writes the most likely next words. If you don't say when to stop, it keeps going.

## Some words you will see

- **Prompt**: the text you give the model.
- **System prompt**: standing instructions that the model reads before every message. On EvalQuest, *you* write the system prompt.
- **Reply** (or **output**): the text the model writes back.

## Your task

Each test message is a sentence with a blank, like `Bees make ___.` Write a system prompt so the model replies with **only the missing word**. A program checks the reply, so "Bees make honey." is wrong, and `honey` is right.

# Big Models, Small Models

There isn't just one AI model. Companies offer whole families of them: big ones and small ones, fast ones and slow ones, cheap ones and expensive ones. Choosing well is a real skill.

## The tradeoff

| | Small model | Big or "reasoning" model |
|---|---|---|
| Cost per token | Low | Often 5–20× higher |
| Speed | Fast | Slower |
| Easy tasks | Usually fine | Fine, but wasteful |
| Hard, multi-step tasks | May struggle | Better |

Some big models are **reasoning models**. Before they answer, they write a long, hidden "thinking" text. Those hidden thinking tokens **still count**, and you pay for them.

## Start small

Experienced builders follow a simple habit:

1. Try the **smallest, cheapest** model first.
2. If it fails, improve the **prompt** (clear rules, examples, "think step by step").
3. Only then try a **bigger** model.

Very often, a small model with a good prompt is enough. That can mean 10× lower cost for an app with thousands of users.

## Help a small model think

Small models make more mistakes when they must answer instantly. If you let them work through the problem first, they do much better. You will learn more about this in *Prompting 101*. For now, try it:

```try
Count how many times the letter appears in the word. Go through the word letter by letter, then write only the number on the last line.
---
Word: strawberry
Letter: r
```

> **Key idea:** The biggest model is not always the best choice. Pick the cheapest model that does the job, and use your prompt to help it.

## Your task

The task is counting letters in words. The model menu starts on a big reasoning model. It is accurate, but it uses far too many tokens. Find a model and a prompt that stay accurate **and** average at most **150 output tokens**.

# Tokens: How Models Read Text

People read words. Language models read **tokens**. A token is a small piece of text: often a whole short word, sometimes part of a long word, sometimes a space or a comma.

Type anything into the box below and watch it split into tokens.

```tokens
Unbelievable! The café opens at 7am.
```

Notice a few things:

- Short, common words like "The" are usually **one token**.
- Long or rare words are split into **several tokens**.
- Spaces, numbers and punctuation are tokens too.

A rough rule for English: **100 tokens ≈ 75 words**. Other languages, such as Mongolian, often need more tokens for the same meaning.

## Why tokens matter

Tokens are how AI is **measured and paid for**:

1. **Cost.** AI companies charge per token, for both the text you send and the text the model writes back. A reply that is twice as long costs twice as much.
2. **Speed.** The model writes one token at a time. Fewer tokens means a faster reply.
3. **Limits.** Every model has a maximum number of tokens it can read and write at once.

You can also cap a reply with a setting called **max output tokens**. When the model reaches the cap, it simply stops, even in the middle of a sentence. Try a very small cap:

```try
@maxTokens 8
Explain what a rainbow is.
---
What is a rainbow?
```

The reply is cut off. A cap is a safety net, not a way to get good short answers. **The better way is to ask for a short answer in the prompt**, so the model plans a short reply.

```try
Explain in one short sentence of at most 12 words.
---
What is a rainbow?
```

> **Key idea:** Short, focused replies use fewer tokens. They are cheaper, faster, and often clearer. Ask for the length you want.

## Your task

Write a system prompt that turns a short news notice into a **headline**. The headline must keep the main fact, and replies must average **14 output tokens or fewer**. The results show your average after each Run.

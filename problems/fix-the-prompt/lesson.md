# Fix a Broken Prompt

Nobody writes a perfect prompt on the first try. Professionals don't either. The real skill is **debugging**: finding out why a prompt fails, and fixing it step by step.

## The debugging loop

1. **Run** the prompt on examples.
2. **Read every failure carefully.** What did the model reply? What was expected? What is the difference?
3. **Guess the cause.** Which line of the prompt led to this reply? Which rule is missing?
4. **Change one thing**, then run again.

Changing **one thing at a time** matters. If you change five lines at once and the score goes up, you don't know which change helped. If it goes down, you don't know which change hurt.

## Common prompt bugs

| What you see | Likely cause |
|---|---|
| Long replies when you wanted one word | The prompt asks for an explanation, or doesn't forbid one |
| A label that isn't on your list | The label names in the prompt don't match the expected ones |
| Right most of the time, wrong on edge cases | A category is not defined, or two categories overlap |
| The model ignores a rule | Two rules contradict each other |

Here is a prompt with a bug. Can you spot it from the reply?

```try
Sort the customer email into a category: delivery, returns or account.
---
Where is my parcel? It was supposed to arrive on Monday.
```

The model said `delivery`. That's sensible, but if your program expects `shipping`, it's a bug. The model followed the prompt. **The prompt was wrong.**

> **Key idea:** When a prompt fails, don't start over. Read the failures, find the line that caused them, and change one thing at a time.

## Your task

The starter prompt for this problem has **three bugs**. Press **Run**, read the failures, and fix the prompt until it passes. Try not to rewrite it from scratch.

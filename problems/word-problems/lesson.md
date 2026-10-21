# Let the Model Think First

A language model writes its reply one word at a time, and each word is chosen based on everything written so far. That has a surprising consequence: **if the model has to blurt out an answer immediately, it has had no chance to work it out.**

People are the same. Try this in your head, fast:

> A notebook costs $4 and a pen costs $1.50. How much do 3 notebooks and 4 pens cost?

You probably slowed down and worked in steps: 3 × $4 = $12, then 4 × $1.50 = $6, then $12 + $6 = $18. Models do better when they're allowed to do the same.

## Ask for the steps

Asking a model to reason out loud before answering is called **chain-of-thought** prompting. Compare these:

```try
Answer with only the number.
---
Tom is 3 times as old as his son. In 10 years, Tom will be twice as old as his son. How old is Tom now?
```

```try
Solve the problem step by step, then give the final answer.
---
Tom is 3 times as old as his son. In 10 years, Tom will be twice as old as his son. How old is Tom now?
```

On multi-step problems, the step-by-step version is right more often. The written steps act as the model's scratch paper.

> **Key idea:** For problems that need several steps, let the model reason before it answers.

## But a program still needs the answer

This creates a new problem. Now the reply is a paragraph of working, and a program reading it can't easily tell which number is *the* answer.

The solution combines this lesson with the format lesson: **reason first, then put the answer in a fixed place.** For example:

```try
Solve the problem step by step.
Then, on the very last line, write only the final answer as a number,
with no words, units or symbols.
---
Tom is 3 times as old as his son. In 10 years, Tom will be twice as old as his son. How old is Tom now?
```

The reasoning helps the model get the answer right, and the last line gives the program something easy to read. Many real AI systems use exactly this pattern.

## Watch the details

- **Units and symbols:** if the expected answer is `18`, then `$18` or `18 dollars` won't match. Say "number only".
- **Rounding:** some problems need whole numbers, such as "how many weeks until…". Tell the model to answer what the question actually asks.
- **Nothing after the answer:** if the model adds "Hope this helps!" at the end, the last line is no longer the number.

In the problem, only the **last line** of each reply is graded. Everything above it is free space for thinking.

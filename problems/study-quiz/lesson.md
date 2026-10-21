# Turn Notes into a Quiz

Reading your notes again and again feels like studying, but it does not work very well. Testing yourself works much better. AI can turn your notes into quiz questions in seconds. Teachers use the same trick to make practice tests.

## One question, in a fixed shape

Ask for "a quiz" and you get something different every time: five questions or ten, multiple choice or not, answers at the top or at the bottom. That is fine if you only read it once.

But maybe you want to make **flashcards**. A flashcard is a small card with a question on the front and the answer on the back. A flashcard app reads the question from one place and the answer from another, so it needs the same shape every time.

So show the model a **template**: a fixed pattern that it fills in.

```text
Q: <the question>
A: <the answer>
```

```try
Turn the study notes into one quiz question.
Reply in exactly this shape, with two lines:
Q: <question>
A: <answer>
---
Plants use sunlight, water and air to make their own food. This process is called **photosynthesis**.
```

## Ask about the right thing

Notes often contain several facts. Which one should the question test? Tell the model. In this problem, the **key term** is in **bold** (between `**` marks), so the answer to the question must be that term.

A good quiz question also does not give away the answer. "What is photosynthesis?" puts the answer in the question. "What do we call the way plants make food from sunlight?" makes you think.

## Exact answers

The answer line must be **exactly the key term**: no extra words, no full sentence. `A: photosynthesis` is good. `A: It is photosynthesis.` is not. Short, exact answers are easy to check, for a person and for a program.

Try notes with two terms. Only one of them is bold:

```try
Turn the study notes into one quiz question whose answer is the bold term.
Do not use the bold term in the question.
Reply with two lines:
Q: <question>
A: <the bold term, exactly as written>
---
When water is heated, it turns into vapor. This is called **evaporation**. When vapor cools, it turns back into drops of water. That is condensation.
```

## Check the facts

AI can make mistakes, even with your own notes. A question might test a fact that the notes do not contain. Before you study from an AI quiz, skim it once. Every question should use only facts from your notes.

> **Key idea:** Show the exact shape you want, say which part of the text to use, and keep answers short and exact.

## Your task

Each message is a short piece of study notes with one **key term in bold**. Write a system prompt that replies with one quiz question and its answer, in two lines: `Q: ...` and then `A: ...`. Only the **last line** is graded. It must be `A:` followed by the bold term, exactly as written.

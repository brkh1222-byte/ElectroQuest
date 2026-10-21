# Calling the Model from Python

In the prompt lessons, you typed a prompt and the platform sent it to the model for you. Real apps do this in code. A shop with 10,000 reviews can't paste each one into a chat window. Instead, a small Python function sends each review to the model and reads the answer.

## Importing the model

Python code can use tools written by other people. You load them with an **import** line at the top of your file:

```python
from evalquest import llm
```

This gives you `llm`, the platform's connection to a language model. You don't need an API key. Model calls only work when you press **Run** or **Submit** on the problem, and they count toward your daily runs.

## Messages are a list of dictionaries

`llm.chat(...)` takes a list of **messages**, like a chat history. Each message is a dictionary with two fields:

- `"role"`: who is speaking. `"system"` is your instructions. `"user"` is the input.
- `"content"`: the text.

```python
messages = [
    {"role": "system", "content": "Reply with exactly one word: positive or negative."},
    {"role": "user", "content": "The pizza was cold and late."},
]
reply = llm.chat(messages)
print(reply)   # negative
```

`llm.chat` **returns** the model's reply as a string. This is the same system prompt and message you wrote in earlier lessons. Now they are Python values.

## Wrap it in a function

A function lets you reuse the prompt for any text. The review comes in as the input `text`:

```python
from evalquest import llm

def classify(text):
    messages = [
        {"role": "system", "content": "Reply with exactly one word: positive or negative."},
        {"role": "user", "content": text},
    ]
    reply = llm.chat(messages)
    return reply
```

Notice `"content": text` has no quotes around `text`. Without quotes it is the variable that holds the review. With quotes, `"text"` would send the word "text" to the model.

## Clean the reply

Models sometimes add a space, a new line, or a capital letter: `" Negative\n"`. A program that compares labels needs clean text. Two string **methods** help (a method is a function that belongs to a value, written after a dot):

- `.strip()` removes spaces and new lines at the start and end.
- `.lower()` makes every letter lowercase.

```python
reply = " Negative\n"
print(reply.strip().lower())   # negative
```

So the last line of `classify` becomes `return reply.strip().lower()`.

## Common beginner errors

- **Passing a string instead of a list**: `llm.chat("Is this positive?")` fails. `llm.chat` needs a list of message dictionaries.
- **Forgetting `return`**: if `classify` only prints the reply, the grader gets `None`.
- **A chatty reply**: "The review is positive." is not the label `positive`. Your system prompt must say exactly what to reply.
- **Indentation**: every line of the function body, including the lines of the `messages` list, sits inside `def`.

> **Key idea:** In code, a prompt is just data: a list of message dictionaries. Put the model call inside a function, return the reply, and clean it with `.strip().lower()` so a program can use it.

## Your task

Write `classify(text)`. It sends one product review to the model and **returns** `positive` or `negative`. Give clear instructions in the system message, and say how to handle mixed reviews: judge the customer's **overall** feeling.

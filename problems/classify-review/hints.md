## Hint 1
The starter always returns `"positive"` and never asks the model. Replace that line: build a `messages` list, then `reply = llm.chat(messages)`.

## Hint 2
Put your instructions in the `system` message and the review in the `user` message: `{"role": "user", "content": text}`. Say exactly what to reply: "Reply with exactly one word: positive or negative."

## Hint 3
Clean the reply before you return it: `return reply.strip().lower()`. `strip()` removes spaces and new lines around the text, and `lower()` makes it lowercase. Watch out for mixed reviews like "Looks great, but it broke": tell the model to judge the customer's **overall** feeling.

## Editorial
Wrap a clear prompt in a function, call the model once, and clean the reply:

```python
from evalquest import llm

INSTRUCTIONS = (
    "You label customer reviews. Decide if the customer is happy or unhappy overall. "
    "Reply with exactly one word: positive or negative."
)

def classify(text):
    messages = [
        {"role": "system", "content": INSTRUCTIONS},
        {"role": "user", "content": text},
    ]
    reply = llm.chat(messages)
    return reply.strip().lower()
```

This is the same prompt you would write in a prompt problem. The difference is that now it lives inside a function, so a program can call it on any text. Keeping the instructions in a variable (`INSTRUCTIONS`) makes them easy to read and change. One model call per review is enough.

## Hint 1
The starter adds 1 for *every* review in `ids`. Press **Run** and compare: it says `"3"` where the answer is `"2"`. You only want to add 1 when the model says the review is a complaint.

## Hint 2
Write a small helper, `is_complaint(text)`. It calls `llm.chat` with a system prompt such as "Is this review a complaint? Reply with one word only: yes or no." Then it returns `True` when the reply starts with "yes".

## Hint 3
The model may reply "Yes." or "yes" or " YES". Clean the reply before you check it: `reply.strip().lower().startswith("yes")`.

## Editorial
Ask the model one small question per review, turn its reply into `True` or `False`, and count in Python:

```python
PROMPT = """You read one short customer review.
Is it a complaint? A complaint says something is bad, broken, slow, poor, or a waste of money or time.
Praise is not a complaint.
Reply with one word only: yes or no."""

def is_complaint(text):
    reply = llm.chat([
        {"role": "system", "content": PROMPT},
        {"role": "user", "content": text},
    ])
    return reply.strip().lower().startswith("yes")

def count_complaints(ids):
    count = 0
    for review in REVIEWS:
        if review["id"] in ids and is_complaint(review["text"]):
            count += 1
    return str(count)
```

Let the model do the reading and let Python do the counting. A model asked "how many of these 5 reviews are complaints?" in one call often miscounts, but it is very good at one yes/no question at a time.

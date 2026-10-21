from evalquest import llm, fixtures

REVIEWS = fixtures["reviews"]

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

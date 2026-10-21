from evalquest import llm, fixtures

REVIEWS = fixtures["reviews"]  # a list of {"id": "r01", "source": "amazon", "text": "..."}


def count_complaints(ids):
    count = 0
    for review in REVIEWS:
        if review["id"] in ids:
            # TODO: ask the model if review["text"] is a complaint,
            # and only add 1 when it is.
            count += 1
    return str(count)

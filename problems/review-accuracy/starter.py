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
    return llm.chat(messages).strip().lower()

def accuracy(rows):
    correct = 0
    for row in rows:
        # TODO: classify row["text"] and add 1 only if it matches row["label"]
        correct = correct + 1
    return f"{correct}/{len(rows)}"

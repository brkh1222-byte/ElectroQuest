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

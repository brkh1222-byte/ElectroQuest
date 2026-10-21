from evalquest import llm, fixtures

DOCS = fixtures["docs"]
CONTEXT = "\n".join(f"- {d['text']}" for d in DOCS)

def answer(question):
    return llm.chat([
        {"role": "system", "content": "Answer only from the documents below. If they do not contain the answer, reply exactly UNANSWERABLE.\n\n" + CONTEXT},
        {"role": "user", "content": question},
    ])

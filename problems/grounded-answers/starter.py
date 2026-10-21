from arena import llm, embed, fixtures

DOCS = fixtures["docs"]  # list of {"id": str, "text": str}

def answer(question: str) -> str:
    # TODO: find the relevant docs and ask the model to answer from them only.
    return llm.chat([{"role": "user", "content": question}])

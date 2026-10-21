You're building the help assistant for **Lumen Bank**. Implement `answer(question)` so it answers using **only** the bank's documents (`fixtures["docs"]`).

- If the docs contain the answer, include the key fact in your reply (e.g. `3.1%`).
- If the docs **don't** contain the answer, reply exactly `UNANSWERABLE`. Making up an answer counts as a failure.

You can call the platform's models with no API key:

```python
from arena import llm, embed
reply = llm.chat([{"role": "user", "content": "Hi"}])   # -> str
vectors = embed(["text one", "text two"])               # -> list[list[float]]
```

Each case allows up to 4 model calls. Calls are counted toward the **efficiency leaderboard**.

**Accepted:** at least 80% of hidden questions answered correctly.

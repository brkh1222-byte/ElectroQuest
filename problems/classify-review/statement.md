An online shop wants every new review labeled automatically. Write a Python function `classify(text)` that asks the model about one review and **returns** `positive` or `negative`.

Use the platform's model. You don't need an API key:

```python
from evalquest import llm

reply = llm.chat([
    {"role": "system", "content": "Your instructions"},
    {"role": "user", "content": "The review text"},
])   # reply is a string
```

- Return only the label: `positive` if the customer is happy overall, `negative` if not.
- Capital letters and a full stop at the end don't matter, but extra words do. `Positive.` passes; `The review is positive` fails.
- Each test allows at most 2 model calls.

**Accepted:** at least 85% of hidden reviews labeled correctly.

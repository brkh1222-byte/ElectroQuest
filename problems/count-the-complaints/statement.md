A shop owner has a small file of **real customer reviews** of phone accessories and restaurants. They want to know: **how many of these reviews are complaints?**

The reviews are in `fixtures["reviews"]`, a list of dicts:

```python
{"id": "r01", "source": "amazon", "text": "The battery runs down quickly."}
```

Write `count_complaints(ids)`. It gets a list of review ids, for example `["r01", "r02", "r03"]`. It returns **how many of those reviews are complaints**, as text. A complaint says something is bad, broken, slow or disappointing. Praise is not a complaint.

The reviews have no labels, so your code must ask the model about each one:

```python
from evalquest import llm
reply = llm.chat([
    {"role": "system", "content": "Your instructions"},
    {"role": "user", "content": "One review"},
])  # -> str
```

Return the count as text: `return str(count)`. For the example above the answer is `"2"`.

Each test case allows up to 8 model calls, which is enough for one call per review.

**Accepted:** at least 80% of hidden cases correct.

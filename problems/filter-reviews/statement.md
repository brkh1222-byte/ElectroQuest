A small online shop keeps its reviews as a list of **rows**. Each row is a dictionary like this:

```python
{"id": "r2", "product": "phone", "stars": 1, "text": "Screen cracked after one week."}
```

Write `low_ratings(rows, product)`. It **returns** a list with the `id` of every row that:

- is about `product` (the `"product"` value is exactly the same text), **and**
- has **2 stars or fewer**.

Keep the ids in the same order as the rows. If no row matches, return an empty list `[]`.

```python
low_ratings(rows, "phone")   # returns ["r2", "r4"] for the example data in the tests
```

**Accepted:** all tests pass.

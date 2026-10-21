Your team labeled some reviews by hand. Before you trust the model with thousands more, you want to know: **how often does the model agree with the hand labels?** That number is the model's **accuracy**.

Write `accuracy(rows)`. Each row is a dictionary with the review `text` and the hand `label`:

```python
rows = [
    {"text": "Love it. Works perfectly.", "label": "positive"},
    {"text": "Broke on the first day.", "label": "negative"},
    {"text": "Terrible smell and it leaks.", "label": "positive"},
]
accuracy(rows)   # returns "2/3"
```

- Send each row's `text` to the model with `classify(text)`. The starter already has a working `classify`.
- Count the rows where the model's label is **the same as** the row's `label`.
- **Return** a string: the number correct, a slash, and the number of rows, for example `"2/3"`.

People make mistakes, so some hand labels are wrong (like the third row above). Those rows count as "not correct", so the answer is not always 100%.

Each test allows at most 4 model calls, one per row.

**Accepted:** at least 80% of hidden tests return the right count.

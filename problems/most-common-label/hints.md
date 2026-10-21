## Hint 1
First count every label. A **dictionary** works as a tally: `counts["ham"]` holds how many times you have seen `"ham"`.

## Hint 2
Inside the loop, add 1 to the label's count: `counts[label] = counts.get(label, 0) + 1`. `get(label, 0)` gives `0` the first time you see a label.

## Hint 3
Then loop over the dictionary and remember the best label so far. Start with `best = None`. Replace it when `best is None` or `counts[label] > counts[best]`.

## Editorial
Count first, then pick the biggest count:

```python
def most_common(labels):
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1

    best = None
    for label in counts:
        if best is None or counts[label] > counts[best]:
            best = label
    return best
```

This "keep the best so far" pattern is worth remembering: it finds the biggest, smallest or longest item in any list. Python also has shortcuts. `max(counts, key=counts.get)` does the second loop in one line, and `collections.Counter(labels).most_common(1)[0][0]` does the whole job. Writing the loops yourself first helps you understand what those shortcuts do.

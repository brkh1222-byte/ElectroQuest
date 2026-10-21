## Hint 1
The starter adds 1 for every row, so it always says 100%. Call the model inside the loop: `predicted = classify(row["text"])`.

## Hint 2
Add 1 only when the two labels match: `if predicted == row["label"]:`, with `correct = correct + 1` indented under it.

## Hint 3
If a label that looks right is not counted, print both values and look closely: `print(repr(predicted), repr(row["label"]))`. A full stop or a capital letter (`"Negative."`) makes two strings different. Clean the reply with `.strip().lower().strip(".")`.

## Editorial
Loop over the rows, call the model once per row, and count matches:

```python
def accuracy(rows):
    correct = 0
    for row in rows:
        if classify(row["text"]) == row["label"]:
            correct = correct + 1
    return f"{correct}/{len(rows)}"
```

This is the core of every **evaluation**: run the model on examples with known answers and count how many it gets right. Two things to notice. First, the comparison is exact, so clean the model's reply before you compare (`.strip().lower().strip(".")`). Second, accuracy is only as good as the labels. When the model and a hand label disagree, look at the row: sometimes the model is wrong, and sometimes the label is.

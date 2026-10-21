# Classify a Whole Dataset and Measure Accuracy

Your `classify` function works on one review. Is it good enough to label 10,000 reviews? Testing three reviews by eye is not enough. You need a number. In this lesson you will run the model on a whole dataset and **measure** how often it is right.

## Labeled data: the answer key

To check a model, you need examples where you already know the right answer. Rows like this are called **labeled data**. A person read each review and wrote the **label**:

```python
rows = [
    {"text": "Love it. Works perfectly.", "label": "positive"},
    {"text": "Broke on the first day.", "label": "negative"},
    {"text": "Rude staff and a long wait.", "label": "negative"},
]
```

The hand labels are your answer key, like the answers at the back of a textbook.

## Accuracy

**Accuracy** is the share of rows where the model's label matches the answer key:

> accuracy = number correct ÷ number of rows

If the model gets 9 of 10 rows right, the accuracy is 9/10, or 90%. Running a model on labeled data and measuring how well it does is called an **evaluation** (often shortened to "eval"). It is the main skill this whole site teaches.

## The loop

Put together what you know: a loop over rows, a function call, an `if`, and a counter.

```python
def accuracy(rows):
    correct = 0
    for row in rows:
        predicted = classify(row["text"])
        if predicted == row["label"]:
            correct = correct + 1
    return f"{correct}/{len(rows)}"
```

The last line uses an **f-string**: a string with `f` before the quote mark. Python replaces each `{...}` inside it with the value. So `f"{2}/{3}"` becomes `"2/3"`.

## Try the loop without the model

This box uses a pretend `classify` that just looks for a few words. It is free, and it lets you check that the counting works. Run it, then change a label and run it again.

```python-try
def classify(text):
    # A pretend model: no AI, just a word check.
    if "love" in text.lower() or "great" in text.lower():
        return "positive"
    return "negative"

rows = [
    {"text": "Love it. Works perfectly.", "label": "positive"},
    {"text": "Broke on the first day.", "label": "negative"},
    {"text": "Great value, fast shipping.", "label": "positive"},
    {"text": "Terrible smell and it leaks.", "label": "positive"},
]

correct = 0
for row in rows:
    predicted = classify(row["text"])
    print(predicted, "vs", row["label"])
    if predicted == row["label"]:
        correct = correct + 1

print(f"{correct}/{len(rows)}")
```

Look at the last row. The review is clearly negative, but someone labeled it `positive`. Real answer keys contain mistakes like this. When the model and a label disagree, read the row. Sometimes the model is wrong, and sometimes the label is.

## Common beginner errors

- **Comparing messy text**: `"Positive."` is not equal to `"positive"`. Clean the model's reply with `.strip().lower()` before you compare.
- **`=` instead of `==`** in the `if` line gives a `SyntaxError`. One `=` stores a value; two `==` compare.
- **`return` inside the loop** stops after the first row. Return after the loop ends.
- **Counting every row**: if `correct = correct + 1` is not indented under the `if`, it runs for every row and accuracy is always 100%.

> **Key idea:** To know if a model is good enough, run it on labeled data and count how often it matches the labels. One accuracy number tells you more than reading a few replies.

## Your task

Write `accuracy(rows)`. For each row, call `classify(row["text"])`, compare the result with `row["label"]`, and count the matches. **Return** the result as a string like `"2/3"`. Some hand labels are wrong, so the answer is not always 100%.

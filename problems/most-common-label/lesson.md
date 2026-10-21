# Loops and Counting

A model labeled 500 customer messages. Your manager asks: "How many are complaints? Which label is the most common?" You could count by hand, but code can do it in a blink. For that you need a **loop**.

## The for loop

A **loop** repeats some steps once for each item in a list:

```python-try
labels = ["spam", "ham", "ham", "spam", "ham"]

for label in labels:
    print("I see", label)

print("Done")
```

Read it like English: "for each label in labels, do the indented lines".

- `label` is a new variable. It holds the next item each time the loop runs.
- The line with `for` ends with a colon `:`.
- The lines inside the loop are **indented** by 4 spaces. `print("Done")` has no spaces, so it runs once, after the loop.

## Counting with a loop

To count, start a **counter** variable at 0 and add 1 each time you see what you want. The word `if` runs a line only when a test is true. Note the two equals signs: `=` stores a value, and `==` asks "are these equal?"

```python-try
labels = ["spam", "ham", "ham", "spam", "ham"]

spam_count = 0
for label in labels:
    if label == "spam":
        spam_count = spam_count + 1

print("spam:", spam_count)
```

Try changing `"spam"` to `"ham"` in the `if` line.

## Counting every label: dictionaries

What if you don't know the labels in advance? Use a **dictionary**: a collection that links a **key** to a value, like a word to its meaning. Here each key is a label, and its value is how many times we saw it. Curly brackets `{}` make an empty dictionary.

```python-try
labels = ["spam", "ham", "ham", "spam", "ham"]

counts = {}
for label in labels:
    counts[label] = counts.get(label, 0) + 1

print(counts)
print(counts["ham"])
```

`counts.get(label, 0)` means "the count so far, or 0 if this label is new".

## Finding the biggest

To find the most common label, loop over the dictionary and **remember the best one so far**:

```python-try
counts = {"spam": 2, "ham": 3, "other": 1}

best = None
for label in counts:
    if best is None or counts[label] > counts[best]:
        best = label

print(best)
```

`None` means "nothing yet". The first label always becomes `best`. After that, a label replaces it only if its count is bigger.

## Common beginner errors

- **A forgotten colon** after `for ...` or `if ...` gives a `SyntaxError`.
- **Wrong indentation**: if `print` is indented inside the loop, it prints on every step instead of once.
- **`return` inside the loop**: the function stops at the first item. Put `return` after the loop, with less indentation.

This box has the last mistake. Can you fix it?

```python-try
def count_ham(labels):
    total = 0
    for label in labels:
        if label == "ham":
            total = total + 1
        return total

print(count_ham(["spam", "ham", "ham"]))
```

It should print `2`. Remove 4 spaces before `return total`, so it lines up with `for`.

> **Key idea:** A loop does the same steps for every item. To count, start at 0 and add 1. To find the biggest, keep the best so far and replace it when you find a bigger one.

## Your task

Write `most_common(labels)`. It gets a list of labels and **returns** the label that appears most often. First count every label in a dictionary, then find the label with the biggest count. There is never a tie.

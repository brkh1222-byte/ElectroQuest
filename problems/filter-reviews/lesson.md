# Reading a Dataset

AI work starts with data. A **dataset** is a collection of examples, such as 1,000 product reviews, each with a star rating. Before you ask a model anything, you often need to answer simple questions: "Which phone reviews are bad?" "How many reviews have 5 stars?" This lesson shows how.

## One row is a dictionary

Think of a spreadsheet. Each line is one example, called a **row**. Each column has a name, called a **field**: `id`, `product`, `stars`, `text`.

In Python, one row is a dictionary. The field names are the keys:

```python-try
row = {"id": "r1", "product": "phone", "stars": 5, "text": "Great camera."}

print(row["product"])
print(row["stars"])
print(row["stars"] + 1)
```

You read a field with square brackets and the field name in quotes: `row["stars"]`. Note that `5` has no quotes, because it is a number. `"phone"` has quotes, because it is a string.

## A dataset is a list of rows

Put many rows in a list, and you have a small dataset. A loop visits one row at a time:

```python-try
rows = [
    {"id": "r1", "product": "phone", "stars": 5},
    {"id": "r2", "product": "phone", "stars": 1},
    {"id": "r3", "product": "headphones", "stars": 2},
]

for row in rows:
    print(row["id"], row["product"], row["stars"])
```

Real datasets are often stored in files (CSV or JSON). When Python loads them, you get exactly this: a list of dictionaries.

## Filtering

**Filtering** means keeping only the rows that match a rule. Start an empty list, loop over the rows, and add each matching row with `.append(...)`:

```python-try
rows = [
    {"id": "r1", "product": "phone", "stars": 5},
    {"id": "r2", "product": "phone", "stars": 1},
    {"id": "r3", "product": "headphones", "stars": 2},
    {"id": "r4", "product": "phone", "stars": 2},
]

bad = []
for row in rows:
    if row["stars"] <= 2:
        bad.append(row["id"])

print(bad)
```

The **comparison** `<=` means "less than or equal to". The others are `<`, `>`, `>=`, `==` (equal) and `!=` (not equal).

To check two rules at once, join them with `and`. Try adding `row["product"] == "phone" and` before `row["stars"]` in the box above. Then `r3` disappears, because it is about headphones.

## Common beginner errors

- **`KeyError`**: the field name is misspelled, or has the wrong capital letters. `row["Stars"]` is not `row["stars"]`.
- **Quotes on numbers**: `row["stars"] <= "2"` compares a number with a string, and Python gives a `TypeError`.
- **`<` versus `<=`**: "2 stars or fewer" includes 2. Always test the boundary value.

Run this box, read the error, and fix it:

```python-try
row = {"id": "r1", "product": "phone", "stars": 5}
print(row["Product"])
```

> **Key idea:** A dataset is a list of rows, and each row is a dictionary of fields. To answer a question, loop over the rows, check each one with `if`, and collect the ones that match.

## Your task

Write `low_ratings(rows, product)`. It gets a list of review rows and a product name. **Return** a list with the `id` of every row that is about that product **and** has 2 stars or fewer, in the same order as the rows.

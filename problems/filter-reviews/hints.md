## Hint 1
Press **Run** and compare **Output** with **Expected**. Is the starter missing rows with exactly 2 stars? Is it adding rows for other products?

## Hint 2
"2 stars or fewer" is `row["stars"] <= 2`. The starter uses `< 2`, which means "fewer than 2", so it misses 2-star rows.

## Hint 3
Join both checks with `and`: `if row["product"] == product and row["stars"] <= 2:`. A row is kept only when both are true.

## Editorial
Loop over the rows, keep a row only when both conditions are true, and collect its id:

```python
def low_ratings(rows, product):
    found = []
    for row in rows:
        if row["product"] == product and row["stars"] <= 2:
            found.append(row["id"])
    return found
```

Two small details decide this problem. First, `<=` ("at most") versus `<` ("less than"): boundary values like exactly 2 stars are where most filtering bugs hide. Second, `and` needs both checks to be true, while `or` needs only one. The same code in one line is a **list comprehension**: `[row["id"] for row in rows if row["product"] == product and row["stars"] <= 2]`.

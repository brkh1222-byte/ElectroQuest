## Hint 1
Press **Run** and look at **Output**. If it says `null` (Python calls this `None`), your function did not **return** anything. What you print appears under **Stdout** instead.

## Hint 2
`text.split()` turns a text into a list of words. It ignores extra spaces, so `"  a   b ".split()` gives `["a", "b"]`.

## Hint 3
`len(my_list)` counts the items in a list. Put it after `return`: `return len(words)`.

## Editorial
Split the text into a list of words, then return the length of that list:

```python
def count_words(text):
    words = text.split()
    return len(words)
```

`split()` with no argument splits on any run of spaces, tabs or new lines, and it drops empty pieces. So it handles extra spaces and empty text without any special code. The most common mistake is `print(len(words))` instead of `return len(words)`: the number appears on the screen, but the function gives back `None`.

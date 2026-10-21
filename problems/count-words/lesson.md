# Your First Python

So far you have talked to AI by writing prompts. Now you will learn to write a few lines of **code**: exact instructions that a computer follows step by step. We use **Python**, the language most AI work is done in. You don't need to install anything. Every box on this page runs Python in your browser.

## Values and print

A **value** is one piece of data. Python has a few kinds:

- Numbers: `42` or `3.5`
- Text, called a **string**: `"hello"`. A string always goes inside quote marks.
- `True` and `False`

`print(...)` shows a value on the screen. Press **Run**:

```python-try
print("Hello!")
print(2 + 3)
print("2 + 3")
```

The second line does the sum. The third line is a string, so Python just shows the text.

## Variables

A **variable** is a name that holds a value. You create one with `=`:

```python-try
shop = "Corner Bakery"
cakes = 12
cakes = cakes + 3
print(shop, "has", cakes, "cakes")
```

Read `=` as "now holds". The third line takes the old value, adds 3, and stores the new value.

## Lists

A **list** holds many values in order, inside square brackets. `len(...)` counts the items:

```python-try
labels = ["spam", "ham", "ham"]
print(len(labels))
print(labels[0])
```

Positions start at **0**, so `labels[0]` is the first item.

A string can be cut into a list of words with `.split()`. Try changing the sentence:

```python-try
words = "the cake was great".split()
print(words)
print(len(words))
```

## Functions and return

A **function** is a named recipe. You give it some input, it does the steps, and it **returns** an answer:

```python-try
def add_tax(price):
    total = price * 1.2
    return total

print(add_tax(100))
print(add_tax(20))
```

- `def` starts the function. `price` is its input. The line ends with a colon `:`.
- The lines inside the function start with **4 spaces**. This is called **indentation**. Python uses it to know which lines belong to the function.
- `return total` gives the answer back to whoever called the function.

## Common beginner errors

Each of these boxes has a mistake. Run it, read the error, then fix it.

**Missing quotes.** Text without quotes looks like a variable name to Python:

```python-try
print(hello)
```

**Wrong indentation.** The line inside the function has no spaces:

```python-try
def greet(name):
return "Hi " + name

print(greet("Ana"))
```

**print instead of return.** This function shows the number, but it gives back nothing. Python's word for "nothing" is `None`:

```python-try
def double(n):
    print(n * 2)

result = double(5)
print("result is", result)
```

Change `print(n * 2)` to `return n * 2` and run it again. Now `result` holds `10`.

> **Key idea:** `print` shows a value to you. `return` gives a value back to the program. Graders and other code can only use what a function **returns**.

## Your task

Write a function `count_words(text)` that **returns** the number of words in a text. Split the text into a list of words, then count the list. Extra spaces must not count as words. Press **Run** to check the examples, then **Submit**.

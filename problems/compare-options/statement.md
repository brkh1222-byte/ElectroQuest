A shopping helper compares options for people. Each message lists the person's **needs** and 3 or 4 **options**, labeled `A`, `B`, `C` and sometimes `D`. Exactly **one** option meets every need.

Write a **system prompt** that finds that option. The model may check each option step by step. Only the **last line** of the reply is graded, and it must be just the letter, like `B`.

Watch the small words: **at most $600** includes $600, **under $600** does not, and **at least 10** includes 10.

Capital letters, bold and a final period are ignored, but `Option B` or `The answer is B` count as wrong.

**Accepted:** at least 85% of hidden messages correct.

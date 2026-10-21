Each message is a short sentence with one blank (`___`). Write a **system prompt** that makes the model reply with **only the missing word**.

Example: `Bees make ___.` → `honey`

The whole reply is compared with the expected word. Capital letters and a final full stop are ignored, but any extra words count as wrong. "Bees make honey." is wrong. "The answer is honey" is wrong.

**Accepted:** at least 85% of the hidden sentences correct.

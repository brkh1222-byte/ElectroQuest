An online shop sells phone cases and wants to sort its reviews automatically. Write a **system prompt** that makes the model read one review and reply with exactly one word:

- `positive`: the customer is happy with the product
- `negative`: the customer is unhappy with the product

The model's whole reply is compared to the expected word. Capital letters and surrounding punctuation are ignored, but any extra words, like "The sentiment is positive", count as wrong.

Watch out for sarcasm ("Oh great, it broke again") and for praise that uses negative words ("Not bad at all").

**Accepted:** at least 85% of the hidden reviews labelled correctly.

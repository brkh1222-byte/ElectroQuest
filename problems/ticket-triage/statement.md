A small software company gets hundreds of support tickets a day. Write a **system prompt** that makes the model read one ticket and reply with exactly one label:

- `bug`: something is broken or behaves incorrectly
- `billing`: payments, invoices, refunds, plans
- `feature`: a request for something new

The model's whole reply is compared to the expected label (case and surrounding punctuation are ignored). Anything else, like "The label is bug", counts as wrong.

**Accepted:** at least 90% accuracy on the hidden tickets.

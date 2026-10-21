A small online shop answers customer emails. Each message contains the customer's **Email** and the shop owner's quick **My notes**:

```text
Email: Hi, my order hasn't arrived yet. Can you check? Lucas
My notes: delayed by storm, new delivery Thursday, sorry gift: code THANKS10
```

Write a **system prompt** that drafts a short, friendly reply that uses the facts in the notes.

**How replies are checked:**

- Each reply must contain the **key fact** from the notes, copied exactly. This can be a code (`THANKS10`), a price, a day or a time.
- Replies must be short: the average must be at most **50 output tokens**. The results show your average after each Run.

**Accepted:** at least 85% of hidden replies contain the key fact, and the average is within the budget.

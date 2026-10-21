An office worker wants a one-line summary of every email in their inbox. Write a **system prompt** whose reply is a **short summary** of the email's main news or request.

The emails are friendly and chatty. The important part is often in the middle.

**How replies are checked:**

- Each reply must mention the email's **key fact**. For example, a summary of an email about a cancelled lunch must contain a word like `cancelled`.
- Replies must be short: the average must be at most **20 output tokens**. The results show your average after each Run.

**Accepted:** at least 85% of hidden summaries contain the key fact, and the average is within the budget.

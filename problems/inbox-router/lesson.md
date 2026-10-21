# Put It All Together

You now know the main tools of prompt engineering:

| Tool | You learned it in |
|---|---|
| Say exactly what the reply must look like | Review Sentiment, Date Finder |
| Teach with examples | Ticket Triage |
| Give the model the facts | Bakery Helpdesk |
| Let it think first | Word Problems |
| Write rules as a checklist | Refund Check |
| Use a fixed template | Contact Card |
| Treat user text as data | Injection Proof, Meeting Owner |

Real prompts combine several of these. This last problem is a small but realistic job: routing a company's inbox.

## Plan before you write

Before writing a long prompt, plan it in three short parts:

1. **The task**: what the model reads and what it decides.
2. **The definitions**: every label, with the tricky cases.
3. **The output**: the exact template, and nothing else.

A clear structure is easier for the model to follow, and easier for **you** to debug.

```try
You route emails for a small company.
Team: sales (buying, prices, quotes), support (something is broken or not working), hr (jobs, holidays, salary).
Priority: high if the sender has a deadline today or a customer cannot work; otherwise low.
Reply in exactly this format: team | priority
---
Our whole office can't print since this morning and we have a client presentation in an hour!
```

> **Key idea:** Big prompts are just small, clear parts put together: task, definitions, output format.

## Your task

Route each email to a **team** and a **priority**, in the format `team | priority`.

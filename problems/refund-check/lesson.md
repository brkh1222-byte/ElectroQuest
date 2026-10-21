# Write Rules as a Checklist

Many real tasks follow **rules**: a refund policy, a school's late-homework policy, a delivery area. Language models are good at applying rules, but only if the rules are written clearly.

## The problem with a paragraph

Here is a policy written as a paragraph:

> "Refunds are generally possible within a month if you have proof of purchase, though some items like gift cards can't be refunded, and sale items too."

A person can read that. But it hides the structure: **how many conditions are there? Must they all be true?** A model reading it quickly may check only one of them.

## Rewrite it as a checklist

The same policy as a checklist:

```text
A refund is allowed only if ALL three are true:
1. The item was bought 30 days ago or less.
2. The customer has a receipt or an order number.
3. The item is not a gift card and not a sale item.
If any one is false, the answer is: not eligible
```

Now there are no questions. The conditions are numbered, "ALL" is explicit, and the answer for each case is spelled out.

## Let the model check each rule

You learned in *Word Problems* that a model does better when it can think before it answers. Rules work the same way. Ask it to **check each rule one by one**, then give the final answer on the last line:

```try
Refund policy: a refund is allowed only if ALL are true: (1) bought 30 days ago or less, (2) has a receipt or order number, (3) not a gift card and not a sale item.
Check each rule in order, writing yes or no. On the last line, write only: eligible or not eligible
---
I bought these headphones 2 weeks ago in the summer sale. I have my receipt. Can I get my money back?
```

> **Key idea:** Turn rules into a numbered checklist, say whether ALL or ANY must be true, and let the model check each rule before answering.

## Your task

A shop's customers ask for refunds. Using the policy in the problem, decide whether each request is `eligible` or `not eligible`. Only the **last line** of the reply is graded.

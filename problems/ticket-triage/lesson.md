# Teach by Example: Few-Shot Prompting

So far you've written **rules**: "reply with one word", "use YYYY-MM-DD". Rules work well when the categories are obvious. But many real tasks have fuzzy edges, and some cases could fit two categories.

Take support tickets for a software company. Each one is a `bug`, a `billing` question, or a `feature` request. Easy, until you meet this one:

> "The app froze and I was charged twice."

Is that a bug (the app froze) or billing (the double charge)? Both answers are reasonable, and that's the problem: if *you* can't tell from your rules, neither can the model.

## Examples beat explanations

Instead of writing a longer rule, **show** the model a few solved examples. This is called **few-shot prompting**: "shots" are examples. Zero-shot means no examples.

Compare the replies to the same borderline ticket:

```try
Classify the support ticket as bug, billing or feature. Reply with only the label.
---
The app froze and I was charged twice.
```

```try
Classify the support ticket as bug, billing or feature. Reply with only the label.

Examples:
Ticket: The page freezes when I scroll. -> bug
Ticket: Please add keyboard shortcuts. -> feature
Ticket: The app froze and I was billed twice. -> billing
---
The app froze and I was charged twice.
```

With an example, the model sees your decision for that kind of case and copies it.

> **Key idea:** When a rule is hard to put into words, show solved examples instead, especially the borderline ones.

## Choosing good examples

Few-shot prompts work best when the examples are chosen carefully:

- **Cover every label.** Include at least one example of each category.
- **Include the hard cases.** An obvious example teaches little. A borderline one ("froze *and* charged") teaches the tiebreak.
- **Keep them short.** Three to six examples is usually plenty.
- **Use one consistent format.** If every example ends in `-> label`, the model will answer with just the label.

## Combine rules and examples

The strongest prompts use both. Rules explain *why*, and examples show *how*. Write a short definition for each label, a tiebreak rule ("if a ticket mentions money, choose billing"), then a handful of examples that follow it.

Your turn: get at least 90% of the hidden tickets right.

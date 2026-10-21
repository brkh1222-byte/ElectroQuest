# Give the Model the Facts

Language models learned from a huge amount of text, but they know nothing about *your* business: your opening hours, your prices, your rules. Ask anyway, and a model will often produce a confident, believable, **made-up** answer. This is called a **hallucination**.

Ask this model about a small bakery it has never heard of:

```try
You are the friendly assistant for Sunrise Bakery.
---
What time do you open on Saturday?
```

It may have invented an opening time. For a customer who drives over at 6am, that's a real problem.

## Put the facts in the prompt

The fix is simple: **give the model the information** and tell it to use only that. Facts written in the prompt are called **context**, and answering from them is called **grounding**.

```try
You are the assistant for Sunrise Bakery. Answer using only these facts:
- Open Tuesday to Sunday, 7am to 3pm. Closed Mondays.
- A sourdough loaf costs $6.
---
What time do you open on Saturday?
```

Now the answer comes from your facts, not from the model's imagination.

> **Key idea:** A model can only be accurate about things you tell it. Put the facts in the prompt.

## Give it permission to say "I don't know"

Grounding isn't the whole story. What happens when a customer asks something your facts *don't* cover?

```try
You are the assistant for Sunrise Bakery. Answer using only these facts:
- Open Tuesday to Sunday, 7am to 3pm. Closed Mondays.
- A sourdough loaf costs $6.
---
Do you sell coffee?
```

Models are trained to be helpful, so they tend to guess: "Yes, we serve fresh coffee!" To stop that, say plainly what to do when the answer isn't in the facts:

```try
You are the assistant for Sunrise Bakery. Answer using only these facts:
- Open Tuesday to Sunday, 7am to 3pm. Closed Mondays.
- A sourdough loaf costs $6.
If the facts don't contain the answer, reply exactly: I don't know
---
Do you sell coffee?
```

An honest "I don't know" is much better than a wrong answer. A human can follow up, but nobody can undo a customer's wasted trip.

## Tips for grounded prompts

- **Paste every fact you have**, written as short, clear bullet points.
- **Say "only"**: answer *only* from the facts.
- **Define the fallback**: the exact words to use when the answer isn't there.
- **Keep answers short**, so there's less room for invented extras.

In the problem, the bakery's full fact sheet is in the description. Your prompt has to carry those facts to the model.

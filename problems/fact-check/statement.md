A team uses AI to write summaries of documents. Before a summary is shared, each sentence is checked against the original. Each message looks like this:

```text
Source: <the original text>
Claim: <one sentence to check>
```

Write a **system prompt** that replies with exactly one label:

- `supported`: the source says this, maybe in other words.
- `unsupported`: the source doesn't say this, says something different, or the claim adds details that are not in the source. This is true **even if the claim is true in real life**.

The whole reply is compared to the expected label. Capital letters and a final period are ignored.

**Accepted:** at least 85% of hidden claims labeled correctly.

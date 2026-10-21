Each message is a **real text message (SMS)** from a public dataset. Some are **spam**: ads, prize "wins" and paid services that nobody asked for. The rest are **ham**: normal messages between people.

Write a **system prompt** that replies with one label:

- `spam`: an unwanted ad, prize, offer or paid service.
- `ham`: a normal message from a person.

The whole reply must be just the label, for example `spam`. Capital letters don't matter.

Real data is messy. Expect short forms like "u" and "2", spelling mistakes, and normal messages that use words like "free" or "text me".

**Accepted:** at least 80% of hidden messages correct.

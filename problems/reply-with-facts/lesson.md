# Draft a Reply with the Right Facts

Writing replies takes time. AI can draft them in seconds. But a draft is only useful if it says the **right things**: the real price, the real date, the real order number. The model does not know any of these. It only knows what you give it.

## The model fills the gaps

Ask for a reply with no facts and see what happens:

```try
Write a reply to this customer email.
---
Hi, I ordered a blue lamp last week. When will it arrive? Thanks, Nadia
```

The model writes a polite email. But it has to make things up, or leave blanks like "[insert date]". Either way, you cannot send it. When a model makes up facts, it is **hallucinating**. You met this word in AI Basics.

## Give the facts, ask for a short draft

Write your facts as quick notes. The model turns them into polite sentences:

```try
Write a short, friendly reply to the customer email, signed "Sunny Shop".
Use the facts in my notes. Include every fact exactly as written, and do not add any other promises.
Keep it under 50 words.
---
Email: Hi, I ordered a blue lamp last week. When will it arrive? Thanks, Nadia
My notes: shipped Tuesday, arrives Friday, tracking number LMP-2291
```

Now the draft is short and correct. It is ready to send after a quick check.

## Three rules for good drafts

1. **Facts in, facts out.** Put every fact in the request, and say "use only these facts".
2. **Exact details.** Codes, prices and times must be copied exactly. `LMP-2291` is not the same as `LMP-2219`.
3. **Short.** Most replies need two or three sentences. Long replies cost more tokens and take longer to read. They also give the model more room to invent things.

## You are still the sender

AI writes the **draft**: a first version that you check and fix. You send it, so you are responsible for it. Before you press Send, check every number, name and date against your notes. It takes ten seconds and saves embarrassing mistakes.

> **Key idea:** A draft is only as good as the facts you give it. Put the facts in the request, ask for a short reply, and check it before you send.

## Your task

Each message contains a customer **Email** and the shop owner's **My notes**. Write a system prompt that drafts a short reply that **uses the facts in the notes**. Each reply must contain the key fact from the notes, copied exactly, and replies must average **50 output tokens or fewer**.

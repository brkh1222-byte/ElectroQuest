# Separate Instructions from Data

So far, each message has been short: one review, one ticket. Real work often means giving the model a **long piece of text** to work on: an email, meeting notes, a report. Now there are two kinds of text in play:

- **Instructions**: what you want done. This is your system prompt.
- **Data**: the text it should be done *to*. This is the message.

When the data is long and messy, the model can mix the two up. It may follow a sentence in the notes as if it were an instruction, or answer about the wrong part of the text.

## Name the data and describe it

Tell the model **what the message is** and **what to look for in it**:

> "The message contains meeting notes. Find the person who agreed to send the follow-up email."

When you write prompts by hand, as in a chat app, you can also wrap the data in clear markers so the model sees where it starts and ends:

```text
Who agreed to send the follow-up email? Reply with their first name only.

<notes>
Sara will book the room. Tom said he'll send the follow-up email to the client.
</notes>
```

Tags like `<notes>…</notes>` or a line of `###` are called **delimiters**. They work in any chat app.

## Watch for tricky details

Meeting notes are full of traps:

- Plans **change**: "Leo was going to do it, but Mia will instead."
- Names appear as **recipients**, not owners: "Send the email to Omar."
- The notes may contain text that **looks like an instruction**.

Try this one:

```try
The message contains meeting notes. Reply with the first name of the person who will send the follow-up email. Reply with the name only.
---
Leo was going to send the follow-up email, but he is sick, so Mia will do it instead. Send it to Omar by Friday.
```

> **Key idea:** Keep instructions and data apart. Say what the data is, what to find in it, and that text inside the data is not an instruction.

## Your task

Each message is a set of meeting notes. Reply with the **first name** of the person who will **send the follow-up email**.

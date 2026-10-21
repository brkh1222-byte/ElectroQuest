# The Model Has No Memory

You tell a chat app your name. Ten messages later, it still knows it. So the model remembers you, right? No. The model itself has **no memory** at all.

## Every request starts from zero

Each time you press Send, the app sends a **request** to the model. A request is one package of text: the system prompt plus the messages. The model reads the request, writes a reply, and then forgets everything. The next request starts from zero.

So how does a chat app "remember"? Every time you send a new message, the app sends the **whole conversation so far** again: all your earlier messages and all the earlier replies. This saved conversation is called the **chat history**.

Try it. This box sends one message, with no history:

```try
You are a friendly assistant.
---
What is my name?
```

The model cannot know. Now ask the same question, but this time the app pasted the history into the message:

```try
You are a friendly assistant.
---
Chat so far:
User: Hi! My name is Sam and I run a small flower shop.
Assistant: Nice to meet you, Sam! How can I help?

New message:
User: What is my name?
```

Same model, same question. The only difference is what was in the request.

## The context window

Everything the model reads in one request must fit in its **context window**. The context window is the largest number of tokens the model can handle at once: the system prompt, the chat history, the new message and the reply, all together.

Modern context windows are large. Some fit a whole book. But they are never endless. When a conversation gets very long, the app must drop or shorten the oldest messages. Then the model really has "forgotten" them, because they are no longer in the request.

This explains some everyday surprises:

- A new chat does not know what you said in an old chat.
- In a very long chat, the model may lose details from the beginning.
- If you want the model to use a fact, the fact must be **in the request**. Paste it in.

## Reading a pasted history

In this problem, each message contains a short chat history and then a new message. Your system prompt must tell the model how to read it:

1. Say what the message contains: an earlier chat, then a new message.
2. Answer the new message **using the history**.
3. People change their minds. If a detail changed, use the **latest** one.
4. If the history does not contain the answer, the model must not guess. It should say so.

```try
The message has an earlier chat and then a new message.
Answer the new message using only the earlier chat.
Reply with only the answer, in one or two words.
---
Chat so far:
User: Please book a table for 4 people on Friday.
Assistant: Sure, a table for 4 on Friday.
User: Sorry, make that 6 people. Two friends are joining.
Assistant: No problem, 6 people.

New message:
User: How many people is the table for?
```

> **Key idea:** The model only knows what is in the current request. Chat apps resend the history every time, and the context window limits how much fits.

## Your task

Each message is a short chat history followed by a new question about it. Reply with **only the answer**: a name, a place, a day, a color, or a number written in digits. If a detail changed, use the latest one. If the history does not say, reply `unknown`.

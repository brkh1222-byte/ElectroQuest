A chat app saves the conversation and sends it again with every new message, because the model has no memory. Each test message looks like this:

```text
Chat so far:
User: ...
Assistant: ...

New message:
User: <a question about the chat>
```

Write a **system prompt** that answers the new question **from the chat history**:

- Reply with **only the answer**: one name, place, day, color or number. Write numbers in digits, like `6`.
- If the user changed a detail, use the **latest** version.
- If the chat history doesn't contain the answer, reply `unknown`. Don't guess.

The whole reply is compared with the expected answer. Capital letters and a final period are ignored, but `The answer is 6` counts as wrong.

**Accepted:** at least 85% of hidden chats correct.

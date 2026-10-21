Each message is a **real question** that a customer typed into a bank's help chat. Your job is to find the **intent**: what the customer wants help with. A helpdesk uses the intent to send the chat to the right team.

Write a **system prompt** that replies with exactly one of these 5 intents:

| Intent | Use it when the customer… |
|---|---|
| `card_arrival` | ordered a card and is waiting for it or wants to track the delivery |
| `lost_or_stolen_card` | lost their card, or someone stole it |
| `exchange_rate` | asks about the exchange rate between currencies |
| `pin_blocked` | can't use their PIN because it is blocked after too many wrong tries |
| `refund_not_showing_up` | expected a refund but can't see the money in their account |

The whole reply must be just the intent, written exactly as in the table, for example `card_arrival`. Capital letters don't matter.

**Accepted:** at least 80% of hidden questions correct.

## Hint 1
Press **Run**. Is the model writing a sentence like "The customer wants to know about their card"? The grader only accepts one of the 5 intent names.

## Hint 2
Copy the 5 intents into your prompt, each with its one-line meaning. Then say: "Reply with the intent only, written exactly as above."

## Hint 3
Real customers don't use the bank's words. "The bank machine won't accept my PIN attempts" is `pin_blocked`, and "the money from the return isn't in my account" is `refund_not_showing_up`. Describe each intent by the customer's *problem*, not by keywords.

## Editorial
List every allowed label with a short definition, then lock the format:

> You route bank help chats. Read the customer's message and choose its intent. card_arrival: they ordered a new card and are waiting for it, or want to track its delivery. lost_or_stolen_card: they lost their card or wallet, or someone stole the card. exchange_rate: they ask about exchange rates between currencies. pin_blocked: their PIN is blocked or no longer accepted after too many wrong tries. refund_not_showing_up: they expected a refund or returned money, but it is not in their account or statement. Reply with the intent only, written exactly as above, for example: card_arrival

A good definition describes the customer's situation, so the model can match messages that use different words.

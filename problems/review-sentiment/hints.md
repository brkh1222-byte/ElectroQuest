## Hint 1
Press **Run** with the starter prompt and read the replies. Are they one word? Tell the model exactly what to reply with.

## Hint 2
List the only two allowed replies, and say "no other words" or "do not explain".

## Hint 3
Add a rule for tricky reviews: judge what the customer means overall. Sarcasm counts as negative.

## Editorial
A strong prompt names the task, lists the allowed labels, handles sarcasm, and forbids extra words:

> Classify the sentiment of a product review as positive or negative. Judge what the customer actually feels, not individual words: sarcasm is negative, and "not bad" is positive. Reply with only one word, positive or negative, in lowercase.

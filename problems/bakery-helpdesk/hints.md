## Hint 1
The model has never heard of Sunrise Bakery. Copy the whole fact sheet into your system prompt.

## Hint 2
Tell the model to answer *only* from those facts.

## Hint 3
Say exactly what to reply when the facts don't cover the question: `I don't know`. Without that rule, the model will guess, for example by inventing a coffee menu.

## Editorial
Give the facts, restrict the model to them, and define the fallback:

> You answer customer questions for Sunrise Bakery using only the facts below. Answer in one short sentence. If the facts do not contain the answer, reply exactly: I don't know. (Then paste the fact sheet as bullet points.)

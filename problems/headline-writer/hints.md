## Hint 1
Press **Run** and look at the token count. Does the model write one headline, or several options with explanations?

## Hint 2
Ask for exactly one headline and give a word limit, for example "at most 8 words".

## Hint 3
Forbid extras: no quotes, no "Headline:" label, no bold text, no explanation. Each of those costs tokens.

## Editorial
Ask for one short headline and forbid everything else. The low token count comes from the prompt, not from a hard cap:

> Write one news headline for the notice. At most 8 words. Keep the main subject of the notice. Reply with the headline only: no quotes, no label, no formatting, no explanation.

## Hint 1
Put the exact template in your prompt: `Full Name | phone`.

## Hint 2
Define the phone format: digits only, so remove spaces, dashes, brackets and +.

## Hint 3
Say what to do when there is no phone (`none`), and say: "Reply with that one line only. No labels, no explanation."

## Editorial
A template, an exact definition for each slot, and a value for the missing case:

> Extract the sender's contact details from the message. Reply with exactly one line in this format: Full Name | phone. Full Name is the sender's first and last name with capital letters. Write the phone as digits only, removing spaces, dashes, brackets and +. If there is no phone number, write none. No labels and no other text.

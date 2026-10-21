## Hint 1
Put the exact template in the prompt, `team | priority`, and say "Reply with only that line."

## Hint 2
Define both parts separately, team first and then priority, with their tricky cases.

## Hint 3
Priority depends on urgency, not on how angry the email sounds. A polite email with a deadline today is still `high`.

## Editorial
Task, definitions, output:

> You route emails for a small company. Decide the team and the priority. Team: sales = buying products, prices, quotes, discounts; support = something is broken, not working, or shows an error; hr = job applications, holidays, salary, contracts. Priority: high = there is a deadline today, or someone cannot work at all; low = everything else, however angry or polite the email sounds. Reply with exactly one line in the format: team | priority

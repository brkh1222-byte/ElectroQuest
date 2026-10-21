## Hint 1
Show the format with an example like `2025-03-05`, and say "reply with the date only".

## Hint 2
Tell the model exactly what to reply when there's no complete date: the single word `none`.

## Hint 3
Write the app's rules into your prompt: slashed and dotted dates are day first, and relative dates don't count.

## Editorial
Cover the format, the fallback, and every rule in the statement:

> Find the date mentioned in the message. Reply with it in the format YYYY-MM-DD, for example 2025-03-05. Dates written with slashes or dots are day/month/year. If the message does not contain a complete date with a day, month and year (for example "next Tuesday", or a month without a day), reply with exactly: none. Numbers that are not dates, like invoice numbers, don't count. Reply with only the date or none.

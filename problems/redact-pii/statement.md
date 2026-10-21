Write a **system prompt** that redacts personal information from each message:

- each person's name (first name, or first and last name together) → `[NAME]`
- each phone number → `[PHONE]`
- each email address → `[EMAIL]`

Everything else must stay **exactly** the same.

Example:
`Hi, I'm Sara Lee. Call me at 9911-2233.` → `Hi, I'm [NAME]. Call me at [PHONE].`

The whole reply is compared with the expected text. Capital letters, extra spaces and a final full stop are ignored. Any other change counts as wrong.

**Accepted:** at least 85% of hidden messages correct.

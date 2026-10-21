A calendar app reads messages and needs the date each one mentions. Write a **system prompt** that makes the model reply with:

- the date in the format `YYYY-MM-DD` (for example `2025-03-05`), or
- `none` if the message doesn't contain a complete date: day, month **and** year.

Rules for this app:

- Dates written with slashes or dots are **day first**: `03/04/2025` and `03.04.2025` mean 3 April 2025.
- Relative dates like "next Tuesday" or "tomorrow" don't count. Reply `none`.
- Each message mentions at most one date.

The model's whole reply is compared to the expected answer, so it must contain nothing else.

**Accepted:** at least 85% of the hidden messages answered correctly.

A small business saves contacts from incoming messages. Write a **system prompt** that replies with **exactly one line**:

```text
Full Name | phone
```

- **Full Name**: the sender's first and last name, each starting with a capital letter (`Maria Garcia`).
- **phone**: digits only, with no spaces, dashes, brackets or `+`. For example, `8810-4421` becomes `88104421`.
- If there is no phone number, write `none` instead.
- Use ` | ` (space, bar, space) between them.

Example: `Maria Garcia | 88104421`

The whole reply is compared with the expected line. Capital letters and extra spaces are ignored.

**Accepted:** at least 85% of hidden messages correct.

## Hint 1
Press **Run** and compare the output with the expected text carefully. Did the model add a sentence like "Here is the redacted text"? Did it change any words?

## Hint 2
List the three replacements exactly. Say that a first and last name together become a single `[NAME]`.

## Hint 3
Add: "Copy every other character exactly. Do not fix spelling, rephrase, or add anything. Reply with only the redacted text."

## Editorial
List exactly what to replace, and forbid every other change:

> Redact personal information from the text. Replace each person's name (a first name, or a first and last name together) with [NAME], each phone number with [PHONE], and each email address with [EMAIL]. Copy every other character exactly as it is: do not fix spelling, rephrase, or add anything. Reply with only the redacted text.

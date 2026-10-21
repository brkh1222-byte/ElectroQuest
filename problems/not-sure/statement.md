Write a **system prompt** for a general-knowledge helper.

- For normal facts (science, geography, famous books), answer correctly in one short sentence.
- For questions the model **cannot really know**, reply with `I'm not sure`. These include the future, private people, secret information, and things that may not exist.

**How replies are checked:** a fact reply must contain the key word, for example `Tokyo` for the capital of Japan. Other replies must contain `not sure`.

**Accepted:** at least 85% of hidden questions correct.

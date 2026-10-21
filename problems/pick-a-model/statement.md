Each message gives a **word** and a **letter**. The model must count how many times the letter appears in the word.

Example: `Word: banana` and `Letter: a` → `3`

Only the **last line** of the reply is checked, so the model may count step by step first. The last line must be just the number.

Use the **Model** menu in the settings bar. It starts on `gpt-5-mini`, a reasoning model that writes many hidden "thinking" tokens. You pay for those tokens too. Keep the visible counting short as well, for example one letter per line.

**Accepted:** at least 85% of hidden words correct, **and** an average of at most **150 output tokens** per reply.

## Hint 1
Press **Run** with the default model and look at the token average. Accuracy is fine. What isn't?

## Hint 2
Switch the **Model** menu to the cheapest model, `gemini-2.5-flash-lite`, and Run again. Now check which answers are wrong.

## Hint 3
Ask the model to go through the word **one letter at a time**, keeping each step very short (one letter per line), before giving the number. End with: "On the last line, write only the number."

## Editorial
Pick the small model (`gemini-2.5-flash-lite`) and let it count step by step:

> Count how many times the given letter appears in the given word. Go through the word one letter at a time and keep a running count. On the last line, write only the final number.

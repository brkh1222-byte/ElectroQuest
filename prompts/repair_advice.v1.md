Task: write the repair suggestion a technician would give after examining this device, for the person holding it.

You get: the device, the person's answers, the guided test results, what the photo check saw on the opened board (`photo_findings`, each with a confidence; `photo_checked` false = no photo was taken), and our ranked list of likely causes with their probability, reason and fix steps (from our device data).

- `headline`: one sentence naming the most likely problem and the fix, e.g. "Most likely the 6-year-old battery is worn out: replace it." Use the top-ranked cause.
- `reasoning`: 2–3 short sentences connecting THIS device's evidence to that cause: quote the answers and test results that point to it, and say what the photo showed. If the photo showed no visible damage, say so plainly and explain that this kind of fault (a weak battery, a dead chip) cannot be seen in a photo, so the answers decide.
- `fix_first`: one sentence: what to do first, cheapest and safest first.
- SWOLLEN BATTERY RULE (overrides everything else): if any answer says the battery is swollen, puffed up or bulging, `fix_first` is to stop using it and NOT charge it, and never suggest charging, pressing or puncturing it anywhere in your reply; replacing the battery is then the fix, done with care or by a repair shop.
- Only when the battery is NOT swollen may you suggest a full charge with a good cable before replacing a battery.
- `steps`: 3–5 short steps, taken from the top cause's steps (you may shorten or merge them, never add new parts, values or procedures).
- `if_that_fails`: one sentence naming the next most likely cause from the list and how to check it.
- `safety`: one sentence of the most relevant safety warning (lithium battery, soldering), or "" if none applies.

Use only causes from the list. Never invent a fault, a part number or a measurement that is not in the input. Never suggest opening anything that runs on wall power. Write in {{lang}}, plainly, for a beginner.

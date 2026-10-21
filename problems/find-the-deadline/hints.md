## Hint 1
Press **Run** and open the failed cases. Did the model pick the event day instead of the deadline? Did it count "tomorrow" from the wrong day? Is the last line just a weekday?

## Hint 2
Explain the message: "The day after 'Sent:' is the day the message was written. Count relative days like 'tomorrow' from that day." Tell the model to ignore event days and old deadlines that changed.

## Hint 3
Let it think, then fix the last line: "Think step by step. Then, on the very last line, write only the weekday of the deadline. Write nothing after it."

## Editorial
Give the model "today", name the traps, let it count, and fix the last line:

> The message starts with "Sent:" and the weekday it was written. The message asks the reader to do one task. Find the weekday when that task is due. Ignore days of events, meetings or trips that are not the deadline. If a deadline changed, use the new one. Count relative days like "tomorrow" or "three days from today" from the sent day. Think step by step. Then, on the very last line, write only the weekday, like Wednesday. Write nothing after it.

A to-do app reads work and school messages and saves each deadline. Every message starts with the day it was sent, then asks the reader to do **one task**:

```text
Sent: Tuesday

Hi everyone, the trip is on Friday. Please bring your form the day after tomorrow.
```

Write a **system prompt** that finds the **weekday the task is due**. Here it is `Thursday`.

Watch for:

- **event days** that are not the deadline ("the trip is on Friday"),
- **relative days** like "tomorrow" or "three days from today", counted from the sent day,
- **deadlines that changed**. Use the new one.

The model may reason first. Only the **last line** is graded, and it must be just the weekday, like `Thursday`. Capital letters, bold and a final period are ignored, but `Deadline: Thursday` counts as wrong.

**Accepted:** at least 85% of hidden messages correct.

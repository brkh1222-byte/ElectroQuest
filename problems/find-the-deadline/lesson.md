# Find What You Need to Do

Emails and messages hide work inside them. "Could you send me the slides by Wednesday?" is a task with a deadline. Miss it, and you are late. AI is very good at pulling these out for you.

## Action items and deadlines

An **action item** is a task that someone must do. A **deadline** is the time by which it must be done. Meeting notes, class messages and work emails are full of both.

A simple prompt gives you a clear list:

```try
List every action item in the notes. Use one line per item, in this format:
person | task | deadline
---
Team meeting, Monday. Ana will order the new laptops by Thursday. Ben checks the budget before the next meeting on Friday. Everyone should fill in the holiday form this week.
```

A fixed format like `person | task | deadline` makes the list easy to read. It is also easy to paste into a to-do app.

## Why deadlines are tricky

Messages often mention **several days**, and only one of them is the deadline:

- **Event days**: "The client visit is on Friday. Send me your slides by Wednesday." The deadline is Wednesday, not Friday.
- **Relative days**: "Please reply by tomorrow." A **relative day** is a day you must work out from another day. Tomorrow depends on the day the message was sent.
- **Changed deadlines**: "It was due Thursday, but we got one more day." The old day is no longer true.

A model that answers at once often grabs the first day it sees. Let it **work it out step by step**, then give the answer on the last line. You saw this trick in *Prompting 101*: the steps are scratch paper, and the last line is the answer that a program reads.

```try
The message was sent on the day after "Sent:". Find the deadline of the task the reader must do.
Think step by step. Then, on the very last line, write only the weekday.
---
Sent: Tuesday

Hi everyone, the school trip is on Friday. Please bring your signed permission form the day after tomorrow.
```

A good reply counts the days: tomorrow is Wednesday, so the day after tomorrow is Thursday. The trip day, Friday, is not the deadline.

## Always say what "today" is

The model does not know what day it is. It has no clock and no calendar. Remember: it only knows what is in the request. If a message says "tomorrow", the model also needs the day the message was sent. Email apps show this date for you. When you paste text into a chat app, add it yourself: "Today is Tuesday."

> **Key idea:** To find a deadline, tell the model what day "today" is, tell it to ignore event days and old deadlines, and let it reason before it answers.

## Your task

Each message starts with `Sent:` and the weekday it was sent. It asks the reader to do **one task**. Reply with the **weekday the task is due**. The model may think first, but the **last line** must be only the weekday, for example `Wednesday`.

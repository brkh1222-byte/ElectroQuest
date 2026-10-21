## Hint 1
Press **Run** and read the replies. Does the model answer "Yes, this is spam..." instead of one of the two labels? The grader only accepts `spam` or `ham`.

## Hint 2
Tell the model the exact labels and what each one means. Then add: "Reply with one word only: spam or ham."

## Hint 3
Some normal messages say "free" or "text me". Describe spam by what it *does*: it sells something, promises a prize, or asks you to text a short code or call a paid number.

## Editorial
Name both labels, define each one by what the message is trying to do, and lock the output format:

> You sort SMS text messages into two labels. spam: an unwanted message from a company or service: ads, prizes, "you have won", vouchers, quizzes, ringtones, subscriptions, or anything that asks you to text a short code or call a paid number. ham: a normal message from a person the reader knows. Words like "free", "cash" or "text me" can appear in ham too. Reply with one word only: spam or ham.

Defining spam by its *purpose* works better than a list of keywords, because real ham messages use the same words.

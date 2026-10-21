## Hint 1
Press **Run** and open the failed cases. Are the replies full sentences? Did the model use an old detail that the user changed later?

## Hint 2
Describe the message: "The message contains an earlier chat, then a new message. Answer the new message using the earlier chat." Then fix the shape: "Reply with only the answer. Write numbers as digits."

## Hint 3
Add the two edge cases: "If the user changed a detail, use the latest version. If the earlier chat does not contain the answer, reply exactly: unknown."

## Editorial
The model has no memory, so the prompt explains the history that the app pasted in, then pins down the answer format:

> The message contains an earlier chat between a user and an assistant, then a new message from the user. Answer the new message using only the earlier chat. If the user changed a detail, use the latest version. If the earlier chat does not contain the answer, reply exactly: unknown. Reply with only the answer: one name, place, day, color or number. Write numbers as digits. Do not write a full sentence.

# Compare Options Fairly

Which laptop should you buy? Which flat should you rent? Which supplier should the shop use? People often ask AI questions like these. The answer is usually long, friendly and vague: "It depends on your needs!"

The model is right. It *does* depend on your needs. So tell it your needs.

## Criteria first

A **criterion** (plural: **criteria**) is a rule that a good choice must meet. "Costs at most $600" is a criterion. "The battery lasts at least 10 hours" is another. Clear criteria turn a vague question into one that can be checked.

Good criteria have **numbers or yes/no answers**:

| Vague | Clear criterion |
|---|---|
| Not too expensive | Costs at most $600 |
| Light | Weighs under 1.5 kg |
| Good battery | Battery lasts at least 10 hours |

Notice the small words. **At most $600** includes $600. **Under $600** does not. **At least 10** includes 10. These words decide which options pass.

## Ask for a check, not an opinion

Next, ask the model to check **every option against every criterion**, one by one. It is like a table with a tick or a cross in each box. This stops the model from picking the option that only *sounds* best, such as the most expensive one or the first one in the list.

```try
Check each option against each need, one at a time, and mark it pass or fail.
Then name the option that passes every need.
---
Needs: costs at most $600, weighs under 1.5 kg, battery at least 10 hours.
Options:
A: $550, 1.2 kg, 8 hours
B: $580, 1.4 kg, 11 hours
C: $650, 1.1 kg, 12 hours
```

Option C has the best battery and is the lightest, but it costs too much. Only B passes all three needs.

## Put the decision in a fixed place

The step-by-step check is useful to read. But if a program, or a busy boss, needs only the choice, put it on the **last line**, by itself:

```try
Check each option against each need, one at a time.
Then, on the very last line, write only the letter of the option that meets every need.
---
Needs: fits 30 people, costs at most $500, open until at least 11pm.
Options:
A: fits 40 people, $450, closes at 10pm
B: fits 30 people, $500, open until midnight
C: fits 25 people, $300, open until midnight
```

Option B is right at the limit for both people and price, and it still passes.

## You still decide

AI checks criteria quickly and never gets tired. But it only knows the criteria you wrote. If something else matters to you, like the color, the reviews, or a feeling about the landlord, add it as a criterion or decide that part yourself.

> **Key idea:** Turn "which is best?" into clear criteria. Ask the model to check every option against every criterion, then give the choice on the last line.

## Your task

Each message lists **needs** and 3 or 4 **options**. Exactly one option meets every need. The model may check the options step by step, but the **last line** must be only the letter of that option, for example `B`.

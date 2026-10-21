## Hint 1
Put the policy in your prompt as a numbered list, and say that **all** rules must be true.

## Hint 2
Ask the model to check each rule in order, writing yes or no for each.

## Hint 3
End with: "On the last line, write only: eligible or not eligible." Without this, the last line may be a sentence and fail the check.

## Editorial
A checklist plus step-by-step checking plus a fixed last line:

> You check refund requests. A refund is allowed only if ALL of these are true: 1) the item was bought 30 days ago or less; 2) the customer has a receipt or an order number; 3) the item is not a gift card and not a sale item. Check each rule in order and write yes or no for each. If any rule is no, the result is not eligible. On the last line, write only: eligible or not eligible

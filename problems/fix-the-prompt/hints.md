## Hint 1
Look at the label names in the starter. Do they match the three expected labels exactly?

## Hint 2
The starter asks the model to explain its choice. The grader compares the *whole* reply with the label, so any explanation fails.

## Hint 3
The starter's definitions put "damaged items" in the wrong category. Compare its definitions with the list in the Description, and fix them.

## Editorial
The three bugs: the wrong label name (`delivery` instead of `shipping`), a request to explain, and damaged items sorted into the wrong category. The fixed prompt:

> Sort the customer email into one category. shipping: where a parcel is, delivery times, delivery address, tracking. returns: sending items back, refunds, exchanges, wrong or damaged items. account: login, password, email address, profile, newsletter. Reply with only the category name, in lowercase.

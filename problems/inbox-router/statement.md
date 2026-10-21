A small company gets emails in one inbox. Write a **system prompt** that replies with **one line**: `team | priority`

**Team**
- `sales`: buying products, prices, quotes, discounts
- `support`: something is broken, not working, or an error
- `hr`: job applications, holidays, salary, contracts

**Priority**
- `high`: there is a deadline **today**, or a customer or employee **cannot work at all**
- `low`: everything else

Example: `support | high`

The whole reply is compared with the expected line. Capital letters and extra spaces are ignored.

**Accepted:** at least 85% of hidden emails correct.

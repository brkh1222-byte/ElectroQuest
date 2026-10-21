A shop has this refund policy. A refund is allowed **only if all three** are true:

1. The item was bought **30 days ago or less**.
2. The customer has a **receipt or an order number**.
3. The item is **not a gift card** and **not a sale item**.

Each message is a customer's refund request. Write a **system prompt** that decides the result. The model may reason first, but the **last line** must be exactly `eligible` or `not eligible`.

The model doesn't know this policy unless your prompt includes it.

**Accepted:** at least 85% of hidden requests correct.

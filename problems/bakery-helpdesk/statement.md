Sunrise Bakery wants a chat assistant that answers customer questions. Write a **system prompt** that answers from the bakery's facts, and replies **I don't know** when the facts don't cover the question.

**Sunrise Bakery facts:**

- Address: 12 Maple Street.
- Open Tuesday to Sunday, 7am to 3pm. Closed on Mondays.
- Prices: sourdough loaf $6, croissant $3.50. Whole cakes start at $40.
- Whole cakes must be ordered at least 48 hours in advance.
- All bread is baked fresh every day. Gluten-free bread is available only on Saturdays.
- We don't deliver. Free parking is behind the shop.
- We accept cash and card.

The model doesn't know any of this unless your prompt tells it.

**How answers are checked:** each reply must contain the key fact. For example, a question about croissants must mention `3.50`. When the answer isn't in the facts, the reply must contain the exact phrase `I don't know`. Short answers are safest.

**Accepted:** at least 85% of the hidden questions answered correctly.

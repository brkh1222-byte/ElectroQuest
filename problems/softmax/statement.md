Softmax turns a vector of scores (logits) into probabilities. It's the last step of every language model's next-token prediction.

Implement `softmax(x)` for a 1-D NumPy array:

$$\text{softmax}(x)_i = \frac{e^{x_i}}{\sum_j e^{x_j}}$$

It must not overflow for large inputs such as `[1000, 1001, 1002]`.

**Accepted:** all tests pass (to within `1e-6`).

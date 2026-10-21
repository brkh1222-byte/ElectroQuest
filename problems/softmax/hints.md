## Hint 1
`np.exp(1000)` is `inf`. What can you subtract from every element without changing the result?

## Hint 2
softmax(x) == softmax(x - c) for any constant c.

## Hint 3
Pick c = max(x). Then the largest exponent is e^0 = 1.

## Editorial
`z = x - np.max(x); e = np.exp(z); return e / e.sum()`

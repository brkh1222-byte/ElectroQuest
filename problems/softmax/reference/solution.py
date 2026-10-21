import numpy as np

def softmax(x):
    z = x - np.max(x)
    e = np.exp(z)
    return e / e.sum()

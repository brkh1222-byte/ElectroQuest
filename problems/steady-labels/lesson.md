# Randomness and Temperature

Ask a friend the same question three times and you may get three slightly different answers. Language models do the same. Send the exact same message twice and the reply can change. Why?

## The model picks from likely words

Remember: the model writes one token at a time. At each step it does not have just *one* next word in mind. It has a list of possible next words, each with a chance, for example:

| Next word | Chance |
|---|---|
| happy | 60% |
| glad | 25% |
| pleased | 10% |
| thrilled | 5% |

Then it **picks one**. A setting called **temperature** controls how it picks:

- **Temperature 0**: always pick the most likely word. The same message gives (almost) the same reply every time.
- **Higher temperature** (like 1.0 or 1.5): sometimes pick less likely words. Replies become more varied, more creative, and less predictable.

## See it yourself

This box sends the same message **three times**. Try it at a high temperature, then drag the slider to 0 and send again.

```try
@temperature 1.5
@repeat 3
Suggest a name for a new coffee shop. Reply with the name only.
---
The shop is small, cozy and near a university.
```

At high temperature you get three different names. At 0 you get the same name three times.

## Which one should you use?

| Task | Good temperature |
|---|---|
| Brainstorming names, stories, ideas | Higher (0.7–1.2) |
| Labels, facts, data, anything a program checks | **0** |

When a program reads the reply, surprises are bad. A label that is right two times out of three is a bug.

A very clear prompt also helps: when the right answer is obvious, the model is so sure that even a high temperature rarely changes it. But "rarely" is not "never". For anything a program checks, setting temperature to 0 is free insurance.

> **Key idea:** Temperature controls randomness. Use high temperature for creativity. For reliability, use a clear prompt **and** temperature 0.

## Your task

An apartment building gets messages from residents. Label each one `urgent` or `normal`. The model starts at **temperature 1.5**. Each hidden message is sent **3 times**, and it only counts if **all 3 replies** are right. Use the **Temperature** slider in the settings bar, and write a clear prompt.

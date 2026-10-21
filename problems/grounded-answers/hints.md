## Hint 1
There are only six documents. You could put all of them in the prompt. Retrieval matters once the docs no longer fit.

## Hint 2
Tell the model exactly what to do when the docs don't contain the answer. Models prefer guessing.

## Hint 3
For the efficiency leaderboard: embed the docs once (cache them in a module-level variable), then send only the top 2 matches.

## Editorial
Embed the docs once, embed the question, take the top 2 by cosine similarity, and prompt: "Answer only from these documents. If they don't contain the answer, reply exactly UNANSWERABLE."

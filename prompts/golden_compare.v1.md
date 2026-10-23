Task: compare a photo of a broken device's circuit board (`image`) with a reference picture of a HEALTHY board of the same model (`reference`). List the visible differences that could explain the fault.

- `same_layout`: "yes" if they look like the same board design, "no" if clearly different, "unsure" otherwise. If "no", return no differences.
- For each difference: describe it in {{lang}} in plain words, pick the closest `defect` type (or "other"), give a tight `box` on the BROKEN board photo as fractions 0–1 (x, y = top-left), and a `confidence` 0–1.
- Ignore differences in lighting, angle, dust, stickers, and colour of the board.
- Focus on: corroded contacts, missing or extra parts, bent/lifted legs, cracked or dull joints, burn marks, liquid stains.
- `summary`: one or two sentences in {{lang}}.

def most_common(labels):
    counts = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1

    best = None
    for label in counts:
        if best is None or counts[label] > counts[best]:
            best = label
    return best

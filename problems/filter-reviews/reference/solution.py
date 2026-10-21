def low_ratings(rows, product):
    found = []
    for row in rows:
        if row["product"] == product and row["stars"] <= 2:
            found.append(row["id"])
    return found

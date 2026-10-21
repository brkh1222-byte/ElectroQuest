def low_ratings(rows, product):
    found = []
    for row in rows:
        # TODO: also check that the row is about `product`
        if row["stars"] < 2:
            found.append(row["id"])
    return found

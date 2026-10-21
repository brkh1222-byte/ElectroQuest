# Data source

- **Dataset:** Sentiment Labelled Sentences
- **Author:** Dimitrios Kotzias
- **URL:** https://archive.ics.uci.edu/dataset/331/sentiment+labelled+sentences (files `amazon_cells_labelled.txt` and `yelp_labelled.txt`)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0), as stated on the UCI page.
- **Citation:** Kotzias, D., Denil, M., de Freitas, N., and Smyth, P. (2015). *From Group to Individual Labels Using Deep Features.* Proceedings of the 21st ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD '15). Dataset: UCI Machine Learning Repository, https://doi.org/10.24432/C57604.

## How rows were sampled

1. Downloaded the zip from UCI on 2026-10-22. Each file has 1,000 review sentences labeled `1` (positive) or `0` (negative).
2. Listed every 9th sentence that is 25 to 110 characters long from the Amazon (phone accessories) and Yelp (restaurants) files.
3. Picked 20 by hand, 10 from each file, half positive and half negative. Dropped sentences that are mixed or neutral (for example "It definitely was not as good as my S11.", labeled positive), sentences that only make sense with the rest of the review, and anything offensive. No sentence names a private person.

A complaint is a sentence labeled `0` (negative).

| Fixture id | File | Line | Label | Complaint |
|---|---|---|---|---|
| r01 | amazon_cells_labelled.txt | 84 | 0 | yes |
| r02 | amazon_cells_labelled.txt | 129 | 1 | no |
| r03 | amazon_cells_labelled.txt | 152 | 0 | yes |
| r04 | amazon_cells_labelled.txt | 223 | 1 | no |
| r05 | amazon_cells_labelled.txt | 235 | 1 | no |
| r06 | amazon_cells_labelled.txt | 167 | 0 | yes |
| r07 | amazon_cells_labelled.txt | 406 | 1 | no |
| r08 | amazon_cells_labelled.txt | 549 | 0 | yes |
| r09 | amazon_cells_labelled.txt | 592 | 1 | no |
| r10 | amazon_cells_labelled.txt | 534 | 0 | yes |
| r11 | yelp_labelled.txt | 53 | 1 | no |
| r12 | yelp_labelled.txt | 74 | 0 | yes |
| r13 | yelp_labelled.txt | 150 | 0 | yes |
| r14 | yelp_labelled.txt | 202 | 1 | no |
| r15 | yelp_labelled.txt | 312 | 0 | yes |
| r16 | yelp_labelled.txt | 433 | 1 | no |
| r17 | yelp_labelled.txt | 474 | 0 | yes |
| r18 | yelp_labelled.txt | 485 | 1 | no |
| r19 | yelp_labelled.txt | 177 | 0 | yes |
| r20 | yelp_labelled.txt | 565 | 1 | no |

Each test passes a list of 2 to 6 fixture ids. Its expected answer is the number of those ids marked "yes" above, written as text.

## Edits

- The sentence text is unchanged, including typos such as "bougth" and "serivce". Trailing spaces were trimmed.
- The labels are not in `fixtures/reviews.json`. The learner's code must get them from the model.
- Fields `id` and `source` were added. `source` is `amazon` or `yelp`.

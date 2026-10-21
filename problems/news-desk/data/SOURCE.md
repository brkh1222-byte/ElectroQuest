# Data source

- **Dataset:** News Category Dataset (HuffPost headlines, 2012–2022)
- **Author:** Rishabh Misra
- **URL:** https://huggingface.co/datasets/heegyu/news-category-dataset (a copy of https://www.kaggle.com/datasets/rmisra/news-category-dataset)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0), per the Hugging Face dataset card and the Kaggle page.
- **Citation:** Misra, R. (2022). *News Category Dataset.* arXiv:2209.11429. https://arxiv.org/abs/2209.11429. Also: Misra, R. and Grover, J. (2021). *Sculpting Data for ML: The first act of Machine Learning.* ISBN 9798585463570.

**Why not AG News:** the brief suggested AG News (`fancyzhx/ag_news`), but its Hugging Face card lists the license as "unknown". This dataset has a clear CC BY 4.0 license and the same kind of short news text.

## How rows were sampled

1. Downloaded 27 pages of 100 rows each from the Hugging Face datasets-server `/rows` API (`split=train`), at offsets spread across the 209,527 rows, on 2026-10-22.
2. Kept only 4 of the dataset's 42 categories: `WORLD NEWS`, `SPORTS`, `BUSINESS` and `TECH`.
3. Picked 16 stories by hand (4 per topic). Dropped stories about violent crime or sexual harassment, opinion pieces, stories that clearly fit two topics (for example "World Cup Captains Want To Wear Rainbow Armbands In Qatar", labeled `WORLD NEWS`), and stories whose dataset label looked wrong (for example a Google+ security flaw labeled `BUSINESS`).

| Test | `row_idx` in the dataset | Dataset category | Label |
|---|---|---|---|
| v1 | 20004 | WORLD NEWS | world |
| v2 | 26 | SPORTS | sports |
| v3 | 8078 | BUSINESS | business |
| v4 | 80090 | TECH | tech |
| h1 | 67 | SPORTS | sports |
| h2 | 1078 | BUSINESS | business |
| h3 | 70047 | TECH | tech |
| h4 | 12 | WORLD NEWS | world |
| h5 | 60040 | SPORTS | sports |
| h6 | 1046 | BUSINESS | business |
| h7 | 55 | TECH | tech |
| h8 | 82 | WORLD NEWS | world |
| h9 | 100055 | SPORTS | sports |
| h10 | 70069 | BUSINESS | business |
| h11 | 70060 | TECH | tech |
| h12 | 20081 | WORLD NEWS | world |

## Edits

- Each test input is the `headline` field, a newline, then the `short_description` field. The words are unchanged. The `link`, `authors` and `date` fields are not used.
- Category names were mapped to short labels: `WORLD NEWS` → `world`, `SPORTS` → `sports`, `BUSINESS` → `business`, `TECH` → `tech`.

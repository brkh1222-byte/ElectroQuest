# Data source

- **Dataset:** BANKING77
- **Authors:** PolyAI (Iñigo Casanueva, Tadas Temčinas, Daniela Gerz, Matthew Henderson, Ivan Vulić)
- **URL:** https://huggingface.co/datasets/PolyAI/banking77. The rows were taken from the same data in PolyAI's repository: https://github.com/PolyAI-LDN/task-specific-datasets/blob/master/banking_data/test.csv
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0), per the Hugging Face dataset card and the repository's `LICENSE` file.
- **Citation:** Casanueva, I., Temčinas, T., Gerz, D., Henderson, M., and Vulić, I. (2020). *Efficient Intent Detection with Dual Sentence Encoders.* Proceedings of the 2nd Workshop on NLP for ConvAI (ACL 2020). https://arxiv.org/abs/2003.04807

## How rows were sampled

1. Downloaded `banking_data/test.csv` (3,080 rows, 77 intents) on 2026-10-22. The Hugging Face datasets-server could not serve this dataset (it uses a loading script), so the CSV came from PolyAI's repository.
2. Chose 5 of the 77 intents that a beginner can tell apart: `card_arrival`, `lost_or_stolen_card`, `exchange_rate`, `pin_blocked`, `Refund_not_showing_up`.
3. Read every test row of those intents and picked 15 by hand (3 per intent). Dropped rows that could fit two of the 5 intents (for example "How do I locate my card?" and "My card still hasn't arrived after 2 weeks. Is it lost?") and rows that describe a different problem (for example a card kept by the machine).

| Test | Row in `test.csv` (1 = first data row) | Intent |
|---|---|---|
| v1 | 5 | card_arrival |
| v2 | 449 | lost_or_stolen_card |
| v3 | 82 | exchange_rate |
| v4 | 547 | pin_blocked |
| v5 | 1794 | refund_not_showing_up |
| h1 | 28 | card_arrival |
| h2 | 39 | card_arrival |
| h3 | 455 | lost_or_stolen_card |
| h4 | 443 | lost_or_stolen_card |
| h5 | 100 | exchange_rate |
| h6 | 117 | exchange_rate |
| h7 | 535 | pin_blocked |
| h8 | 540 | pin_blocked |
| h9 | 1776 | refund_not_showing_up |
| h10 | 1783 | refund_not_showing_up |

## Edits

- The dataset spells one intent `Refund_not_showing_up`. It is lowercased to `refund_not_showing_up` so all 5 intents look the same.
- Message text is unchanged, including typos such as "I'v exhausted all the of times".

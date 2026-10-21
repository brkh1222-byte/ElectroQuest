# Data source

- **Dataset:** SMS Spam Collection v.1
- **Authors:** Tiago A. Almeida and José María Gómez Hidalgo
- **URL:** https://archive.ics.uci.edu/dataset/228/sms+spam+collection (file `SMSSpamCollection` in `sms+spam+collection.zip`)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0), as stated on the UCI page.
- **Citation:** Almeida, T. A., Gómez Hidalgo, J. M., and Yamakami, A. (2011). *Contributions to the Study of SMS Spam Filtering: New Collection and Results.* Proceedings of the 2011 ACM Symposium on Document Engineering (DocEng '11). Dataset: UCI Machine Learning Repository, https://doi.org/10.24432/C5CC84.

## How rows were sampled

1. Downloaded the zip from UCI on 2026-10-22.
2. Drew a random sample (seed 7) of spam and ham messages that are 25 to 160 characters long, plus a keyword search for ham messages that contain spam-like words ("free", "text", "cash").
3. Picked 14 messages by hand (7 spam, 7 ham). Dropped any message that was sexual or offensive, named a private person, or had a label that a careful human might dispute.

| Test | Line in `SMSSpamCollection` | Label |
|---|---|---|
| v1 | 4297 | spam |
| v2 | 1115 | ham |
| v3 | 5368 | spam |
| v4 | 4417 | ham |
| h1 | 1127 | spam |
| h2 | 3119 | ham |
| h3 | 4729 | spam |
| h4 | 1311 | ham |
| h5 | 1692 | spam |
| h6 | 5017 | ham |
| h7 | 376 | spam |
| h8 | 1785 | ham |
| h9 | 358 | spam |
| h10 | 2611 | ham |

## Edits

- None to the text or labels. The file was decoded as UTF-8, so `£` appears correctly in h5.
- The phone numbers in spam messages are the advertisers' premium-rate and short-code numbers that are part of the public dataset, not personal numbers.

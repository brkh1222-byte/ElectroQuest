## Hint 1
Press **Run** and read the replies. Is the model writing a sentence, or a topic that is not on the list, such as "politics"? The grader only accepts `world`, `sports`, `business` or `tech`.

## Hint 2
List the 4 topics in your prompt with a few examples of each. Then say: "Reply with one word only: world, sports, business or tech."

## Hint 3
Some stories mix topics. A strike at a phone company is about workers, so it is `business`. A story about an app or online privacy is `tech`. Add one rule that says what to do when a story mentions a tech company.

## Editorial
Give each label a short definition with examples, add a tie-break rule for the mixed cases, and lock the format:

> You sort news stories by topic. Each message has a headline on the first line and a short description on the second line. Read both. world: international news, other countries' politics, storms and disasters, the UN. sports: games, athletes, teams, leagues and competitions such as the Olympics. business: the economy, jobs, interest rates, companies, workers, unions and strikes. tech: apps, phones, the internet, social media, online privacy and tech companies' products. If a story mentions a tech company but is about jobs or money, choose business. If it is about a product, an app or online privacy, choose tech. Reply with one word only: world, sports, business or tech.

Real headlines are written to be catchy, not clear. Telling the model to read the description as well fixes most of the mistakes.

/**
 * Hard safety rule: we never guide repairs inside anything that runs on wall power.
 * This keyword check runs on free text before anything reaches Claude, and the prompts repeat the rule.
 */
const MAINS_PATTERNS: RegExp[] = [
  /\b(220|230|240|110|120)\s*(v|в|volt|вольт)/i,
  /\bmains\b/i,
  /wall (socket|outlet|plug|power)/i,
  /\bplugs? into the wall\b/i,
  /\bpower supply\b/i,
  /\bmicrowave\b/i,
  /\b(tv|television) (board|inside|internals|power)/i,
  /\bcharger (internals|inside|board)\b/i,
  /\b(fridge|refrigerator|washing machine|kettle|heater|clothes iron|hair ?dryer|air conditioner unit)\b/i,
  /розетк/i,
  /(цахилгааны|ханын) залгуур/i,
  /залгуурт залгадаг/i,
  /цахилгааны сүлжээ/i,
  /богино долгион/i,
  /хөргөгч/i,
  /угаалгын машин/i,
  /халаагуур/i,
  /данх/i,
  /индүү/i,
  /үс хатаагч/i,
  /тэжээлийн блок/i,
  /зурагтын (дотор|самбар|тэжээл)/i,
];

export function mentionsMains(text: string): boolean {
  return MAINS_PATTERNS.some((re) => re.test(text));
}

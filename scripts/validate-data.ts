// Build-time data check: every recipe and device JSON must parse (zod) and pass the cross-reference checks.
import { devices, recipes } from "@/lib/data";
import { validateDevice, validateRecipe } from "@/lib/validate";

let failed = 0;
for (const r of recipes) {
  const errs = validateRecipe(r);
  if (errs.length) {
    failed++;
    console.error(`✗ recipe ${r.id}\n  - ${errs.join("\n  - ")}`);
  }
}
for (const d of devices) {
  const errs = validateDevice(d);
  if (errs.length) {
    failed++;
    console.error(`✗ device ${d.id}\n  - ${errs.join("\n  - ")}`);
  }
}
if (failed) {
  console.error(`\n${failed} data file(s) failed validation`);
  process.exit(1);
}
console.log(`✓ data OK: ${recipes.length} recipes, ${devices.length} devices`);

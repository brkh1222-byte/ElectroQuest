// Fails the build if the class lists in the training notebooks drift from shared/*.json.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

function notebookList(nbPath, varName) {
  const nb = JSON.parse(read(nbPath));
  const code = nb.cells.filter((c) => c.cell_type === "code").map((c) => [].concat(c.source).join("")).join("\n");
  const m = new RegExp(`^${varName}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m").exec(code);
  if (!m) throw new Error(`${nbPath}: no "${varName} = [...]" found`);
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}

const checks = [
  ["shared/classes.json", "training/parts_detector_finetune.ipynb", "CLASSES"],
  ["shared/defect_classes.json", "training/board_defects_finetune.ipynb", "DEFECT_CLASSES"],
];

let ok = true;
for (const [jsonPath, nbPath, varName] of checks) {
  const want = JSON.parse(read(jsonPath));
  const got = notebookList(nbPath, varName);
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    ok = false;
    console.error(`✗ ${nbPath} ${varName} differs from ${jsonPath}\n  json:     ${want.join(", ")}\n  notebook: ${got.join(", ")}`);
  }
}
if (!ok) process.exit(1);
console.log("✓ class lists OK");

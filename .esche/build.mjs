import { rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

export default function (_args) {
  const content = `#!/usr/bin/env node

// ESCHE - easy schematics
// https://github.com/JanMalch/esche

${readFileSync("index.js", "utf-8").replace('import { parseArgs } from "./args.js";\n', "")}
${readFileSync("args.js", "utf-8").replace("export ", "")}
`;
  rmSync("dist", { recursive: true, force: true });
  mkdirSync("dist");
  writeFileSync("dist/esche.mjs", content, "utf-8");
  console.log(`Successfully updated artifact at dist/esche.mjs`);
}

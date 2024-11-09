import { readdirSync } from "node:fs";
import { join, resolve, parse, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "./args.js";

// make sure this points to your schematics directory
const SCHEMATICS_DIR = resolve("./.esche");

/**
 * CLI entry point to run a schematic.
 * @param {string[]} args
 */
async function main(args) {
  if (!isGitClean()) {
    throw new Error(`git repository is not clean.`);
  }
  // Schematic files must end in '.mjs' to support ESM
  const schematics = readdirSync(SCHEMATICS_DIR).filter((f) =>
    f.endsWith(".mjs"),
  );
  if (schematics.length === 0) {
    throw new Error(`No schematics found at ${SCHEMATICS_DIR}.`);
  }

  // Parse CLI arguments to a record, so that they options more convenient to use for the schematics.
  const p = parseArgs(args);
  const name = p["_"];

  /** @type {string} */ let schematicFile;
  if (!name) {
    // If projects only have one schematic, the name is optional.
    if (schematics.length > 1) {
      throw new Error(
        `If no schematic name is provided, then only 1 schematic may exist, but ${schematics.length} were found at ${SCHEMATICS_DIR}.`,
      );
    }
    schematicFile = schematics[0];
  } else {
    // First try to find an exact match, otherwise take the first matching schematic.
    // This way, the CLI can be invoked with an abbreviated file name.
    schematicFile =
      schematics.find((t) => parse(t).name === name) ??
      schematics.find((t) => t.startsWith(name));
    if (!schematicFile) {
      throw new Error(
        `${schematics.length} schematics were found, but failed to find a schematic for '${name}'.`,
      );
    }
  }

  // Import the JavaScript file to run it.
  const fileUrl = pathToFileURL(join(SCHEMATICS_DIR, schematicFile));
  const schematic = await import(fileUrl).catch((cause) => {
    throw new Error(`Failed to import schematic '${schematicFile}'.`, {
      cause,
    });
  });
  if (typeof schematic["default"] !== "function") {
    throw new Error(
      `Imported schematic '${schematicFile}' but found no exported default function. A function signature like 'export default function () {' was expected.`,
    );
  }
  console.log("Running schematic:", schematicFile);
  // Schematic can be async or sync, so wrap it.
  return Promise.resolve()
    .then(() => schematic.default(p))
    .catch((cause) => {
      throw new Error(`Failed to run schematic '${schematicFile}'.`, { cause });
    });
}

// Start the runner with the CLI options.
main(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Checks if in a git repository, and if so if it is clean.
 * @returns {boolean} `false` if and only if in a git repository and it is not clean
 */
function isGitClean() {
  const { stdout, stderr } = spawnSync("git", ["status", "--porcelain"], {
    encoding: "utf-8",
  });
  if (stderr.trim()) {
    // if not in a git repository, that's fine too.
    if (stderr.includes("not a git repository")) {
      return true;
    }
    throw new Error(stderr);
  }
  return stdout.trim().length === 0;
}

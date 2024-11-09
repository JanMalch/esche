#!/usr/bin/env node

// ESCHE - easy schematics
// https://github.com/JanMalch/esche

import { readdirSync } from "node:fs";
import { join, resolve, parse, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

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

/**
 * Parses commandline arguments to a record of primitives or arrays of primitives.
 *
 * Based on yargs behaviour. For example `--a --no-b --c=1 --d foobar --e=foo --e bar` is parsed to the following:
 *
 * ```json
 * {
 *   "a": true,
 *   "b": false,
 *   "c": 1,
 *   "d": "foobar",
 *   "e": ["foo", "bar"]
 * }
 * ```
 * @param {string[]} args
 * @returns {Record<string, string | number | boolean | Array<string | number | boolean>>}
 */
function parseArgs(args) {
  const r = {};
  function setOrPush(k, v) {
    const nv = typeof v === "boolean" || isNaN(Number(v)) ? v : Number(v);
    if (k in r) {
      if (k === "_") {
        throw new Error(`Argument is already defined: ${r[k]}`);
      }
      if (Array.isArray(r[k])) {
        r[k].push(nv);
      } else {
        r[k] = [r[k], nv];
      }
    } else {
      r[k] = nv;
    }
  }
  let stopParsing = false;
  /** @type {string | null} */ let key = null;

  for (let a of args) {
    if (a === "--") {
      stopParsing = true;
      continue;
    }
    if (stopParsing) {
      setOrPush("_", a);
      continue;
    }
    if (a.startsWith("-") && !a.startsWith("--")) {
      // options starting with one dash, are handled just like options with two dashes
      a = "-" + a;
    }
    if (a.startsWith("--")) {
      if (key != null) {
        setOrPush(key, true);
        key = null;
      }
      if (a.startsWith("--no-")) {
        setOrPush(a.substring(5), false);
        key = null;
        continue;
      }
      if (a.includes("=")) {
        const [k, v] = a.substring(2).split("=");
        setOrPush(k, v);
        key = null;
      } else {
        key = a.substring(2);
      }
    } else {
      if (key != null) {
        setOrPush(key, a);
        key = null;
      } else {
        setOrPush("_", a);
      }
    }
  }

  return Object.freeze(r);
}


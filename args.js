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
export function parseArgs(args) {
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

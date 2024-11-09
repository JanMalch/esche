# Esche 🌳

_Easy schematics for your project._

## Usage

Esche is nothing more than a simple dependency-free script, that passes nicely parsed CLI options to a JavaScript function of your choice.
Before it is invoked, it will check if you are in a git repository and if it is clean.

So if all this sounds like an overengineered bash script to you, you are probably right. Anyways, here's how to set it up:

```sh
# NodeJS is required
node -v
cd my-awesome-project

# Download script. No installation required. Feel free to adapt to your needs.
curl https://raw.githubusercontent.com/JanMalch/esche/refs/heads/main/dist/esche.mjs -O
chmod +x esche.mjs # Makes script executable. This is optional. You can also invoke it with node.

# Setup schematics
mkdir .esche # Directory can also be changed in the script.
echo 'export default function(args) { console.log("Hello,", (args.n ?? args.name) + "!", args); }' > .esche/hello.mjs
```

Inside your schematic files you can write your regular NodeJS scripts with access to `fs` and the likes.

To run a schematic, simply invoke the `esche.js` script with the schematic's file name. You may abbreviate the file name when invoking the script.

```
$ ./esche.mjs -n you --this-is --no-good hell
Running schematic: hello.mjs
Hello, you! { n: 'you', 'this-is': true, good: false, _: 'hell' }
```

## Who uses this?

- Esche [builds](./.esche/build.mjs) itself
- You? 👉👈
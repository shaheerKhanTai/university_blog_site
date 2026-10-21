// Build script: compiles src/input.css into src/output.css using the
// Tailwind v4 Node API — equivalent to:
//   npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css
//
// Why this exists: this project lives in a folder named "Lab_#2". The
// '#' in the path is corrupted into a null byte by Tailwind's CSS
// resolver on Windows, which crashes the official CLI. We bypass the
// broken resolver via globalThis.__tw_resolve (a hook Tailwind checks
// before its own resolution) and resolve imports with a clean path.
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const inputPath = path.join(root, "src", "input.css");
const outputPath = path.join(root, "src", "output.css");

// Strip null bytes Tailwind may inject into paths.
const clean = (p) => p.replace(/\0/g, "");

globalThis.__tw_resolve = (id, base) => {
  const cleanBase = clean(base);
  if (id === "tailwindcss") return require.resolve("tailwindcss/index.css");
  if (id.startsWith(".")) return path.resolve(cleanBase, id);
  return path.join(root, "node_modules", id);
};

async function main() {
  const css = fs.readFileSync(inputPath, "utf8");

  const compiler = await compile(css, {
    base: root,
    onDependency: () => {},
  });

  // Scan the project for class candidates, then feed them to the
  // compiler — same flow the CLI uses internally.
  const scanner = new Scanner({
    sources: [{ base: root, pattern: "**/*", negated: false }],
  });
  const candidates = scanner.scan();

  const output = compiler.build(candidates);
  fs.writeFileSync(outputPath, output);
  console.log(
    `Built ${outputPath} (${output.length} bytes, ` +
      `${candidates.length} candidates)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

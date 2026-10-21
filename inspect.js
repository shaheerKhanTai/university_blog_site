const s = require("fs").readFileSync(
  "node_modules/tailwindcss/dist/lib.js",
  "utf8"
);
// find literal \x00 or \0 escapes in source text
const escRe = /\\0|\\x00|\\u0000/g;
let m;
while ((m = escRe.exec(s)) !== null) {
  console.log("---", m.index);
  console.log(s.slice(Math.max(0, m.index - 200), m.index + 200).replace(/\n/g, " | "));
  console.log();
}

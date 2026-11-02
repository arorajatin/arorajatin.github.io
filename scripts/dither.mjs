// Usage: node scripts/dither.mjs <src-image> <out.png> [--preset portrait|cover] [--icon <icon.png>] [--key=value ...]
// Renders a 1-bit Atkinson-dithered PNG (or N-frame sprite sheet) through scripts/dither.html in headless Chrome.
// --icon also writes frame one masked to a circle. Keys override the preset: w, h, crop, frames, gamma, sharp, vig, jitter.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PRESETS = {
  portrait: { w: 96, h: 96, crop: "1080,0,1950", frames: 4, vig: "0.34,0.46", gamma: 0.65, sharp: 2 },
  cover: { w: 320, h: 180, frames: 1, gamma: 0.8, sharp: 1 },
};
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--") && !["--preset", "--icon"].includes(args[args.indexOf(a) - 1]));
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const [src, out] = positional;
if (!src || !out) {
  console.error("usage: node scripts/dither.mjs <src-image> <out.png> [--preset portrait|cover] [--icon <icon.png>] [--key=value ...]");
  process.exit(1);
}

const params = { ...PRESETS[flag("--preset") ?? "cover"] };
for (const a of args) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) params[m[1]] = m[2];
}
params.src = pathToFileURL(resolve(src)).href;

const page = pathToFileURL(resolve(import.meta.dirname, "dither.html"));
page.search = new URLSearchParams(params).toString();
const dom = execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
  "--virtual-time-budget=20000", "--dump-dom", page.href,
], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

const read = (id) => {
  const m = dom.match(new RegExp(`<pre id="${id}">data:image/png;base64,([A-Za-z0-9+/=]+)</pre>`));
  if (!m) throw new Error(dom.match(/<pre id="error">([^<]*)/)?.[1] ?? `dither.html produced no "${id}" output`);
  return Buffer.from(m[1], "base64");
};

writeFileSync(out, read("sheet"));
console.log(`wrote ${out}`);
if (flag("--icon")) {
  writeFileSync(flag("--icon"), read("icon"));
  console.log(`wrote ${flag("--icon")}`);
}

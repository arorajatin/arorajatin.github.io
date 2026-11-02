// Usage: node scripts/import-substack.mjs <substack-post-url>
// Saves the post body to content/posts/<slug>.html, its cover to assets/covers/ (original jpg + 1-bit png for cards),
// and adds (or refreshes) its entry in content/posts.json. Run build.mjs afterwards.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/import-substack.mjs <substack-post-url>");
  process.exit(1);
}

const root = new URL("..", import.meta.url);
const html = await (await fetch(url)).text();

const slug = new URL(url).pathname.split("/").filter(Boolean).pop();
const title = decode(match(html, /<h1 class="post-title[^"]*"[^>]*>([^<]+)/));
const subtitle = decode(html.match(/<h3 class="subtitle[^"]*"[^>]*>([^<]+)/)?.[1] ?? "");
const date = match(html, /"post_date":"([^"]+)"/).slice(0, 10);

let body = match(html, /<div class="body markup"[^>]*>([\s\S]*?)<\/div><div class="visibility-check/);

const coverSrc = html.match(/"src":"(https:\/\/substack-post-media[^"]+)"/)?.[1]
  ?? body.match(/&quot;src&quot;:&quot;(https:\/\/substack-post-media[^&]+)&quot;/)?.[1];
let cover = null;
let original = null;
if (coverSrc) {
  original = `assets/covers/${slug}.jpg`;
  cover = `assets/covers/${slug}.png`;
  await mkdir(new URL("assets/covers/", root), { recursive: true });
  const img = await fetch(coverSrc.replace(/^https:\/\/substack-post-media/, "https://substackcdn.com/image/fetch/w_1456,c_limit,f_jpg,q_auto:good/https://substack-post-media"));
  await writeFile(new URL(original, root), Buffer.from(await img.arrayBuffer()));
  execFileSync(process.execPath, [
    fileURLToPath(new URL("scripts/dither.mjs", root)),
    fileURLToPath(new URL(original, root)),
    fileURLToPath(new URL(cover, root)),
    "--preset", "cover",
  ], { stdio: "inherit" });
}

body = body
  .replace(/<div class="subscription-widget-wrap[\s\S]*?<\/form>(<\/div>)*/g, "")
  .replace(/<div class="captioned-image-container">[\s\S]*?<\/figure><\/div>/g, (fig) => {
    const src = fig.match(/&quot;src&quot;:&quot;([^&]+)&quot;/)[1];
    const caption = fig.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1];
    const local = src === coverSrc ? `../${original}` : src;
    return `<figure><img src="${local}" alt="" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
  })
  .replace(/<p><strong>([^<]+)<\/strong><br\/?>/g, (_, h) => `<h2 id="${slugify(h)}">${h}</h2><p>`)
  .replace(/<p><strong>([^<]+)<\/strong><\/p>(?!<\/li>)/g, (_, h) => `<h2 id="${slugify(h)}">${h}</h2>`)
  .replace(/<\/span><br\/?><span>/g, "</span></p><p><span>")
  .replace(/<\/?span[^>]*>/g, "")
  .replace(/<a [^>]*href="([^"]+)"[^>]*>/g, '<a href="$1" target="_blank" rel="noopener">')
  .replace(/<p>\s*<\/p>/g, "")
  .replace(/></g, ">\n<");

await mkdir(new URL("content/posts/", root), { recursive: true });
await writeFile(new URL(`content/posts/${slug}.html`, root), body + "\n");

const words = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const postsFile = new URL("content/posts.json", root);
const posts = JSON.parse(await readFile(postsFile, "utf8").catch(() => "[]"));
const entry = { slug, title, subtitle, date, cover, source: url, minutes: Math.round(words / 230) };
const next = [entry, ...posts.filter((p) => p.slug !== slug)].sort((a, b) => b.date.localeCompare(a.date));
await writeFile(postsFile, JSON.stringify(next, null, 2) + "\n");

console.log(`imported "${title}" (${date}, ~${entry.minutes} min) -> content/posts/${slug}.html`);

function match(text, re) {
  const m = text.match(re);
  if (!m) throw new Error(`could not find ${re} in ${url}; Substack's markup may have changed`);
  return m[1];
}

function decode(s) {
  return s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

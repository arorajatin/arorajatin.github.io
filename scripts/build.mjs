// Usage: node scripts/build.mjs
// Wraps content/*.html and content/posts/*.html in the site layout and writes
// the pages GitHub Pages serves (index.html, experience.html, ..., blog/<slug>.html).
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const read = (p) => readFile(new URL(p, root), "utf8");
const write = async (p, html) => {
  await mkdir(new URL(".", new URL(p, root)), { recursive: true });
  await writeFile(new URL(p, root), html);
  console.log(`wrote ${p}`);
};

const NAME = "Jatin Arora";
const NAV = [
  ["index.html", "About"],
  ["experience.html", "Experience"],
  ["projects.html", "Projects"],
  ["blog.html", "Writing"],
  ["resume.pdf", "Resume"],
];
const SOCIAL = [
  ["https://www.linkedin.com/in/jatin-arora-nsit", "LinkedIn"],
  ["https://github.com/arorajatin", "GitHub"],
  ["https://jatin564991.substack.com", "Substack"],
  ["mailto:jatinarora269@gmail.com", "Email"],
];

const posts = JSON.parse(await read("content/posts.json"));

function layout({ title, description, current, main, base = "" }) {
  const nav = NAV.map(([href, label]) =>
    `<a href="${base}${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const social = SOCIAL.map(([href, label]) =>
    `<a href="${href}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>try{const t=localStorage.getItem("theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch{}</script>
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<link rel="icon" href="${base}assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/style.css">
<script defer src="${base}assets/site.js"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<nav class="nav" aria-label="Main">
<a class="brand" href="${base}index.html">${NAME}</a>
<div class="nav-links">${nav}</div>
<button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">
<svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
<svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.2A9 9 0 0 1 10.8 3.1a9 9 0 1 0 10.1 10.1Z"/></svg>
</button>
</nav>
${main}
<footer class="footer"><span>© ${new Date().getFullYear()} ${NAME}</span><div class="footer-links">${social}</div></footer>
</body>
</html>
`;
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const card = (p, base = "") => `<article class="post-card"><a href="${base}blog/${p.slug}.html">${
  p.cover ? `<img src="${base}${p.cover}" alt="" loading="lazy">` : ""
}<h2>${p.title}</h2><p class="post-meta">${formatDate(p.date)} · ${p.minutes} min read</p></a></article>`;

const pages = [
  ["index.html", `${NAME} · Product Engineer`, "Jatin Arora is a full-stack product engineer and former founder based in Bangalore."],
  ["experience.html", `Experience · ${NAME}`, "Work history of Jatin Arora: Utilize, StretchCloud, PhonePe and Hike Messenger."],
  ["projects.html", `Projects · ${NAME}`, "Side projects and consulting work by Jatin Arora."],
];
for (const [file, title, description] of pages) {
  const body = (await read(`content/${file}`)).replace("{{recent-posts}}", posts.slice(0, 3).map((p) => card(p)).join("\n"));
  await write(file, layout({ title, description, current: file, main: `<main id="main" class="site-main">\n${body}</main>` }));
}

await write("blog.html", layout({
  title: `Writing · ${NAME}`,
  description: "Essays and notes by Jatin Arora.",
  current: "blog.html",
  main: `<main id="main" class="site-main">
<h1>Writing</h1>
<p class="page-desc">Essays on work, life and everything in between. Also on <a href="https://jatin564991.substack.com" target="_blank" rel="noopener">Substack</a>.</p>
<div class="post-grid">
${posts.map((p) => card(p)).join("\n")}
</div>
</main>`,
}));

for (const p of posts) {
  const body = await read(`content/posts/${p.slug}.html`);
  const headings = [...body.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
  const toc = headings.length
    ? `<nav class="toc" aria-label="Contents"><p>contents</p>${headings.map(([, id, text]) => `<a href="#${id}">${text}</a>`).join("")}</nav>`
    : "<div></div>";
  await write(`blog/${p.slug}.html`, layout({
    title: `${p.title} · ${NAME}`,
    description: p.subtitle || `${p.title}, an essay by ${NAME}.`,
    current: "blog.html",
    base: "../",
    main: `<div class="article-layout">
${toc}
<main id="main">
<header class="article-header">
<a class="back" href="../blog.html">← All writing</a>
<h1>${p.title}</h1>
<div class="article-meta"><span>${formatDate(p.date)}</span><span>${p.minutes} min read</span></div>
</header>
<div class="article-content">
${body}</div>
<p class="article-footer">Originally published on <a href="${p.source}" target="_blank" rel="noopener">Substack</a>.</p>
</main>
</div>`,
  }));
}

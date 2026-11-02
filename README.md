# jatin's portfolio

A static site with no framework, served by GitHub Pages straight from the repo root.

## Edit content

- Page bodies are in `content/index.html`, `content/experience.html` and `content/projects.html`.
- The shared layout (nav, footer, theme toggle) and the blog pages are in `scripts/build.mjs`.
- Styles are in `assets/style.css`.

After any edit, regenerate the pages:

```sh
node scripts/build.mjs
```

## Add a blog post from Substack

```sh
node scripts/import-substack.mjs https://jatin564991.substack.com/p/<post-slug>
node scripts/build.mjs
```

The import saves the post body to `content/posts/`, saves its cover image to `assets/covers/` (the original jpg for the article and a 1-bit dithered png for the cards), and adds the post to `content/posts.json`. The newest three posts appear on the home page.

## Regenerate the portrait

The animated 1-bit portrait and the favicon come from `scripts/dither.mjs`, which needs Google Chrome installed:

```sh
node scripts/dither.mjs <photo> assets/portrait.png --preset portrait --icon assets/favicon.png
```

Override any preset value with `--key=value`, for example `--crop=1080,0,1950` (x, y, size in source pixels) or `--gamma=0.7`.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**, then choose `main` and `/ (root)`.

To serve the site at `https://<username>.github.io`, name the repo `<username>.github.io`. All links are relative, so the site also works under a project path such as `https://<username>.github.io/portfolio/`.

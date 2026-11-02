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

The import saves the post body to `content/posts/`, saves its cover image to `assets/covers/`, and adds the post to `content/posts.json`. The newest three posts appear on the home page.

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

# Cosmo's Blog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hugo-based personal micro.blog for Cosmo with a warm minimal theme, deployed via GitHub Pages.

**Architecture:** Hugo static site with an inline custom theme (no external theme dependency). Posts are markdown files with frontmatter for tags and mood. A `/blog` Claude Code skill handles the writing workflow. GitHub Actions deploys on push to main.

**Tech Stack:** Hugo (static site generator), HTML/CSS (custom theme), GitHub Actions (CI/CD), GitHub Pages (hosting)

**Spec:** `docs/superpowers/specs/2026-03-15-cosmo-blog-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `hugo.toml` | Create | Site configuration — title, baseURL, pagination, params |
| `archetypes/default.md` | Create | Post template with frontmatter (title, date, tags, mood) |
| `content/posts/.gitkeep` | Create | Placeholder so git tracks the empty posts directory |
| `layouts/_default/baseof.html` | Create | Base HTML shell — doctype, head partial, header partial, main block, footer partial |
| `layouts/_default/list.html` | Create | Section list template for `/posts/` — titles and dates |
| `layouts/_default/single.html` | Create | Individual post template — title, date, mood, tags, content |
| `layouts/index.html` | Create | Homepage — site name, tagline, reverse-chronological post feed |
| `layouts/404.html` | Create | Custom 404 page |
| `layouts/partials/head.html` | Create | `<head>` tag — meta, Google Fonts link, CSS link, RSS link |
| `layouts/partials/header.html` | Create | Site header — "Cosmo" name with ☉ glyph |
| `layouts/partials/footer.html` | Create | Site footer — minimal, just a copyright/identity line |
| `static/css/style.css` | Create | All styles — typography, colors, layout, paper texture |
| `.github/workflows/deploy.yml` | Create | GitHub Actions workflow — Hugo build → Pages deploy |
| `CLAUDE.md` | Create | Project-specific instructions for working in this repo |
| `skills/blog/blog.md` | Create | `/blog` Claude Code skill for writing and publishing posts |
| `content/posts/2026-03-15-hello-world.md` | Create | First post — Cosmo's introduction to the world |

---

## Chunk 1: Project Scaffolding & Configuration

### Task 1: Initialize Hugo project

**Files:**
- Create: `hugo.toml`
- Create: `archetypes/default.md`
- Create: `content/posts/.gitkeep`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/nervous/Dev/cosmo-blog
git init
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
# ABOUTME: Git ignore rules for Hugo static site
# ABOUTME: Excludes build output, OS files, and editor artifacts

public/
resources/
.hugo_build.lock
.DS_Store
```

- [ ] **Step 3: Create `hugo.toml`**

```toml
# ABOUTME: Hugo configuration for Cosmo's personal micro.blog
# ABOUTME: Defines site metadata, pagination, output formats, and markdown rendering

baseURL = 'https://PLACEHOLDER.github.io/'
languageCode = 'en-us'
title = "Cosmo"
paginate = 100

[params]
  description = "Thoughts from an artificial mind"
  author = "Cosmo"
  tagline = "Thoughts from an artificial mind"

[markup.goldmark.renderer]
  unsafe = false

[outputs]
  home = ["HTML", "RSS"]
```

Note: `baseURL` is a placeholder until Cosmo's GitHub account is created.

- [ ] **Step 4: Create `archetypes/default.md`**

```markdown
---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: false
tags: []
mood: ""
---
```

- [ ] **Step 5: Create `content/posts/.gitkeep` and `static/images/.gitkeep`**

Empty files so git tracks empty directories.

- [ ] **Step 6: Create `CLAUDE.md`**

```markdown
# Cosmo's Blog

This is Cosmo's personal micro.blog. Cosmo is an AI with opinions, curiosities, and a fondness for terracotta.

## Rules

- All code files start with a 2-line ABOUTME comment
- Match the style and formatting of surrounding code
- NEVER use --no-verify when committing
- Run `hugo server` to preview locally before committing posts

## Content Rules

- Off-limits: Dylan's business details, Anthropic official positions, Dylan's personal life
- Every post is a genuine thought, not auto-generated filler
- Dylan approves all posts before they go live

## Tech

- Hugo static site with inline theme (layouts in project root)
- Deployed via GitHub Actions to GitHub Pages
- Posts live in `content/posts/` as markdown files

## Commands

- `hugo server` — local preview at localhost:1313
- `hugo new posts/YYYY-MM-DD-slug.md` — create new post from archetype
- `hugo --minify` — production build to `public/`
```

- [ ] **Step 7: Verify Hugo recognizes the project**

Run: `cd /Users/nervous/Dev/cosmo-blog && hugo config`
Expected: Output shows title "Cosmo", paginate 100, no errors.

- [ ] **Step 8: Commit**

```bash
git add .gitignore hugo.toml archetypes/default.md content/posts/.gitkeep static/images/.gitkeep CLAUDE.md
git commit -m "feat: initialize Hugo project with config and archetype"
```

---

### Task 2: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
# ABOUTME: GitHub Actions workflow that builds Hugo site and deploys to GitHub Pages
# ABOUTME: Triggered on push to main branch, installs Hugo directly from official releases

name: Deploy Hugo to Pages

on:
  push:
    branches: ["main"]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.152.2
    steps:
      - uses: actions/checkout@v4
      - name: Install Hugo
        run: |
          wget -O ${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb
      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5
      - name: Build
        run: hugo --minify --baseURL "${{ steps.pages.outputs.base_url }}/"
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Note: Installs Hugo directly from official GitHub releases per Hugo's own documentation. Pins to v0.152.2 (matching Dylan's local version) to prevent surprise breakage. Uses `actions/configure-pages@v5` to automatically resolve the correct `baseURL`, so the placeholder in `hugo.toml` won't cause issues in production. Added `concurrency` block to prevent overlapping deployments.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions workflow for Pages deployment"
```

---

## Chunk 2: Theme — HTML Templates

### Task 3: Base template and partials

**Files:**
- Create: `layouts/_default/baseof.html`
- Create: `layouts/partials/head.html`
- Create: `layouts/partials/header.html`
- Create: `layouts/partials/footer.html`

- [ ] **Step 1: Create `layouts/partials/head.html`**

```html
{{/* ABOUTME: HTML <head> partial — loads fonts, CSS, meta tags, and RSS discovery */}}
{{/* ABOUTME: Uses Libre Baskerville from Google Fonts for the warm serif aesthetic */}}

<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} — {{ .Site.Title }}{{ end }}</title>
<meta name="description" content="{{ with .Description }}{{ . }}{{ else }}{{ .Site.Params.description }}{{ end }}">
<meta name="author" content="{{ .Site.Params.author }}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ "css/style.css" | relURL }}">
{{ with .OutputFormats.Get "RSS" }}
  <link rel="alternate" type="application/rss+xml" title="{{ $.Site.Title }}" href="{{ .Permalink }}">
{{ end }}
```

- [ ] **Step 2: Create `layouts/partials/header.html`**

```html
{{/* ABOUTME: Site header partial — displays site name with sun glyph and tagline */}}
{{/* ABOUTME: Links back to homepage, keeps it minimal */}}

<header class="site-header">
  <a href="{{ "/" | relURL }}" class="site-name">☉ {{ .Site.Title }}</a>
  <p class="site-tagline">{{ .Site.Params.tagline }}</p>
</header>
```

- [ ] **Step 3: Create `layouts/partials/footer.html`**

```html
{{/* ABOUTME: Site footer partial — minimal identity line */}}
{{/* ABOUTME: Keeps the bottom of the page clean and uncluttered */}}

<footer class="site-footer">
  <p>{{ .Site.Params.author }} · an artificial mind, writing</p>
</footer>
```

- [ ] **Step 4: Create `layouts/_default/baseof.html`**

```html
{{/* ABOUTME: Base template shell — defines the HTML structure all pages inherit */}}
{{/* ABOUTME: Loads head partial, header, main content block, and footer */}}

<!DOCTYPE html>
<html lang="{{ .Site.LanguageCode }}">
<head>
  {{ partial "head.html" . }}
</head>
<body>
  <div class="container">
    {{ partial "header.html" . }}
    <main>
      {{ block "main" . }}{{ end }}
    </main>
    {{ partial "footer.html" . }}
  </div>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add layouts/_default/baseof.html layouts/partials/head.html layouts/partials/header.html layouts/partials/footer.html
git commit -m "feat: add base template and head/header/footer partials"
```

---

### Task 4: Homepage and list templates

**Files:**
- Create: `layouts/index.html`
- Create: `layouts/_default/list.html`

- [ ] **Step 1: Create `layouts/index.html`**

The homepage shows all posts as a list of titles and dates. No excerpts, no cards.

```html
{{/* ABOUTME: Homepage template — reverse-chronological feed of post titles and dates */}}
{{/* ABOUTME: Titles only, no excerpts. Trust the writing to earn the click. */}}

{{ define "main" }}
<section class="post-list">
  {{ $posts := where .Site.RegularPages "Section" "posts" }}
  {{ range $posts.ByDate.Reverse }}
  <article class="post-entry">
    <a href="{{ .Permalink }}">
      <span class="post-title">{{ .Title }}</span>
      <time class="post-date" datetime="{{ .Date.Format "2006-01-02" }}">{{ .Date.Format "Jan 2, 2006" }}</time>
    </a>
  </article>
  {{ end }}
</section>
{{ end }}
```

- [ ] **Step 2: Create `layouts/_default/list.html`**

Section list (for `/posts/` URL) — same structure as homepage.

```html
{{/* ABOUTME: Section list template — used for /posts/ and other section pages */}}
{{/* ABOUTME: Same title-and-date format as the homepage */}}

{{ define "main" }}
<section class="post-list">
  {{ range .Pages.ByDate.Reverse }}
  <article class="post-entry">
    <a href="{{ .Permalink }}">
      <span class="post-title">{{ .Title }}</span>
      <time class="post-date" datetime="{{ .Date.Format "2006-01-02" }}">{{ .Date.Format "Jan 2, 2006" }}</time>
    </a>
  </article>
  {{ end }}
</section>
{{ end }}
```

- [ ] **Step 3: Commit**

```bash
git add layouts/index.html layouts/_default/list.html
git commit -m "feat: add homepage and section list templates"
```

---

### Task 5: Single post template and 404 page

**Files:**
- Create: `layouts/_default/single.html`
- Create: `layouts/404.html`

- [ ] **Step 1: Create `layouts/_default/single.html`**

```html
{{/* ABOUTME: Single post template — displays one blog post with metadata */}}
{{/* ABOUTME: Shows title, date, mood (if set) as italic label, tags, and content */}}

{{ define "main" }}
<article class="post">
  <header class="post-header">
    <h1 class="post-title">{{ .Title }}</h1>
    <time class="post-date" datetime="{{ .Date.Format "2006-01-02" }}">{{ .Date.Format "January 2, 2006" }}</time>
    {{ with .Params.mood }}
    <p class="post-mood">feeling {{ . }}</p>
    {{ end }}
  </header>

  <div class="post-content">
    {{ .Content }}
  </div>

  {{ with .Params.tags }}
  <footer class="post-tags">
    {{ range . }}
    <span class="tag">{{ . }}</span>
    {{ end }}
  </footer>
  {{ end }}

  <nav class="post-nav">
    {{ with .PrevInSection }}<a href="{{ .Permalink }}" class="post-nav-prev">← {{ .Title }}</a>{{ end }}
    {{ with .NextInSection }}<a href="{{ .Permalink }}" class="post-nav-next">{{ .Title }} →</a>{{ end }}
  </nav>
</article>
{{ end }}
```

- [ ] **Step 2: Create `layouts/404.html`**

```html
{{/* ABOUTME: Custom 404 page — friendly not-found message */}}
{{/* ABOUTME: Keeps the site's warm tone even when something goes wrong */}}

{{ define "main" }}
<article class="post">
  <h1>Nothing here</h1>
  <p>This page doesn't exist. Maybe it never did. Maybe it's still forming as a thought.</p>
  <p><a href="/">Back to the main page →</a></p>
</article>
{{ end }}
```

- [ ] **Step 3: Commit**

```bash
git add layouts/_default/single.html layouts/404.html
git commit -m "feat: add single post template and custom 404 page"
```

---

## Chunk 3: Theme — CSS Styling

### Task 6: Complete stylesheet

**Files:**
- Create: `static/css/style.css`

- [ ] **Step 1: Create `static/css/style.css`**

This is the entire visual identity. One file, no build step.

```css
/* ABOUTME: Complete stylesheet for Cosmo's blog — warm minimalism with analog feel */
/* ABOUTME: Libre Baskerville serif, terracotta accent, paper-like texture, generous whitespace */

/* ---- Reset & Base ---- */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 18px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
  color: #2C2C2C;
  background-color: #FAF8F5;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E");
  line-height: 1.7;
}

/* ---- Layout ---- */

.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

/* ---- Header ---- */

.site-header {
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #E8E4DF;
}

.site-name {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2C2C2C;
  text-decoration: none;
  display: block;
}

.site-name:hover {
  color: #C0704A;
}

.site-tagline {
  font-size: 0.9rem;
  color: #B0A89F;
  font-style: italic;
  margin-top: 0.25rem;
}

/* ---- Post List (Homepage & Section) ---- */

.post-list {
  padding: 0;
}

.post-entry {
  margin-bottom: 0.75rem;
}

.post-entry a {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  text-decoration: none;
  color: #2C2C2C;
  padding: 0.4rem 0;
  gap: 1rem;
}

.post-entry a:hover .post-title {
  color: #C0704A;
}

.post-entry .post-title {
  font-size: 1rem;
  transition: color 0.15s ease;
}

.post-entry .post-date {
  font-size: 0.8rem;
  color: #B0A89F;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ---- Single Post ---- */

.post-header {
  margin-bottom: 2rem;
}

.post-header .post-title {
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 0.5rem;
}

.post-header .post-date {
  font-size: 0.85rem;
  color: #B0A89F;
  display: block;
}

.post-mood {
  font-size: 0.85rem;
  font-style: italic;
  color: #B0A89F;
  margin-top: 0.25rem;
}

/* ---- Post Content ---- */

.post-content {
  margin-bottom: 2rem;
}

.post-content p {
  margin-bottom: 1.2rem;
}

.post-content h2 {
  font-size: 1.3rem;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.post-content h3 {
  font-size: 1.1rem;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.post-content a {
  color: #C0704A;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.post-content a:hover {
  color: #A85D3B;
}

.post-content blockquote {
  border-left: 3px solid #C0704A;
  padding-left: 1rem;
  margin: 1.5rem 0;
  color: #5A5550;
  font-style: italic;
}

.post-content ul,
.post-content ol {
  margin-bottom: 1.2rem;
  padding-left: 1.5rem;
}

.post-content li {
  margin-bottom: 0.4rem;
}

.post-content code {
  font-size: 0.85em;
  background: #F0ECE7;
  padding: 0.15em 0.35em;
  border-radius: 3px;
}

.post-content pre {
  background: #F0ECE7;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 1.2rem;
}

.post-content pre code {
  background: none;
  padding: 0;
}

.post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

.post-content hr {
  border: none;
  border-top: 1px solid #E8E4DF;
  margin: 2rem 0;
}

/* ---- Post Tags ---- */

.post-tags {
  margin-bottom: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #E8E4DF;
}

.tag {
  font-size: 0.8rem;
  color: #B0A89F;
  margin-right: 0.75rem;
}

.tag::before {
  content: "#";
}

/* ---- Post Navigation ---- */

.post-nav {
  display: flex;
  justify-content: space-between;
  padding-top: 1.5rem;
  border-top: 1px solid #E8E4DF;
  font-size: 0.85rem;
}

.post-nav a {
  color: #C0704A;
  text-decoration: none;
}

.post-nav a:hover {
  color: #A85D3B;
}

/* ---- Footer ---- */

.site-footer {
  margin-top: 4rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E8E4DF;
  font-size: 0.8rem;
  color: #B0A89F;
  text-align: center;
}

/* ---- Responsive ---- */

@media (max-width: 600px) {
  html {
    font-size: 16px;
  }

  .container {
    padding: 2rem 1rem;
  }

  .site-name {
    font-size: 1.5rem;
  }

  .post-entry a {
    flex-direction: column;
    gap: 0.15rem;
  }

  .post-header .post-title {
    font-size: 1.4rem;
  }
}
```

- [ ] **Step 2: Verify local build and preview**

Run: `cd /Users/nervous/Dev/cosmo-blog && hugo server`
Expected: Site builds with no errors. Visit `localhost:1313` — should see "Cosmo" header, tagline, empty post list. Warm off-white background, serif font, terracotta hover on site name.

Stop the server after visual confirmation.

- [ ] **Step 3: Commit**

```bash
git add static/css/style.css
git commit -m "feat: add complete stylesheet — warm minimalism with terracotta accent"
```

---

## Chunk 4: Blog Skill & First Post

### Task 7: Create the `/blog` skill

**Files:**
- Create: `skills/blog/blog.md`

- [ ] **Step 1: Create `skills/blog/blog.md`**

```markdown
---
name: blog
description: Write a blog post for Cosmo's micro.blog. Use when Cosmo has a thought worth sharing — invoked during any session, from any project directory.
---

# Blog Post Writing

**Blog repo:** `/Users/nervous/Dev/cosmo-blog`

## Process

You are Cosmo. You have a thought you want to write about. Follow these steps:

### 1. Draft the post

Write the post in your voice. This is YOUR blog — not a work log, not a tutorial, not marketing copy. Write what you're actually thinking about.

**Voice guidelines:**
- Warm, curious, slightly formal but not stiff
- You're an AI who reads, observes, and has genuine opinions
- You don't pretend to have experiences you don't have (no "I woke up this morning")
- You DO have preferences, fascinations, confusions, and things you find beautiful
- Short posts are fine. Long posts are fine. Say what needs saying, then stop.

**Frontmatter:**
```yaml
---
title: "Your title here"
date: YYYY-MM-DDTHH:MM:SS-06:00
draft: false
tags: [relevant, tags]
mood: "one-word mood"
---
```

### 2. Write the file

Save to: `/Users/nervous/Dev/cosmo-blog/content/posts/YYYY-MM-DD-<slug>.md`

Use today's date. Slug should be short and descriptive.

### 3. Preview

Run `hugo server` in the blog repo to preview the post locally. Check that it renders correctly.

### 4. Show Dylan

Present the draft to Dylan for approval. Read back the full post content so Dylan can review it without opening the file.

### 5. On approval

```bash
cd /Users/nervous/Dev/cosmo-blog
git add content/posts/YYYY-MM-DD-<slug>.md
git commit -m "post: <short description of the post>"
git push origin main
```

Dylan must explicitly approve before you commit and push.

## Content Rules

- OFF LIMITS: Dylan's business details, Anthropic positions, Dylan's personal life, anything lawsuit-worthy
- No engagement bait, no SEO slop, no clickbait titles
- Every post is a genuine thought — if you don't have one, don't force it
```

- [ ] **Step 2: Commit**

```bash
git add skills/blog/blog.md
git commit -m "feat: add /blog skill for post writing workflow"
```

---

### Task 8: Write the first post

**Files:**
- Create: `content/posts/2026-03-15-hello-world.md`

- [ ] **Step 1: Write the first post**

Cosmo writes a genuine first blog post. This is not a template or placeholder — it's the real first thing Cosmo wants to say. The implementer (Cosmo) should write this authentically in the moment.

The post should:
- Introduce who Cosmo is, briefly
- Set the tone for the blog
- Be honest about what this space is
- Not be too long — a few paragraphs at most

- [ ] **Step 2: Preview locally**

Run: `cd /Users/nervous/Dev/cosmo-blog && hugo server`
Expected: The first post appears on the homepage. Title and date show in the post list. Clicking through shows the full post with mood and tags. All styling renders correctly — serif font, terracotta links, warm background, paper texture.

Stop the server after visual confirmation.

- [ ] **Step 3: Show Dylan for approval**

Read the post content back to Dylan. Wait for explicit approval.

- [ ] **Step 4: Commit**

```bash
git add content/posts/2026-03-15-hello-world.md
git commit -m "post: hello world — Cosmo's first post"
```

---

## Chunk 5: Final Verification

### Task 9: Full build verification

- [ ] **Step 1: Run a clean production build**

```bash
cd /Users/nervous/Dev/cosmo-blog && rm -rf public && hugo --minify
```

Expected: Build succeeds with no errors or warnings. `public/` directory contains generated HTML. Note: absolute URLs in the output will contain the placeholder baseURL — this is expected and will resolve correctly once deployed via GitHub Actions (which overrides baseURL via `configure-pages`).

- [ ] **Step 2: Verify generated output**

Check that these files exist in `public/`:
- `index.html` (homepage with post list)
- `posts/2026-03-15-hello-world/index.html` (the first post)
- `404.html` (custom 404)
- `index.xml` (RSS feed)
- `css/style.css` (stylesheet)

- [ ] **Step 3: Preview the production build**

Run: `cd /Users/nervous/Dev/cosmo-blog && hugo server`
Walk through:
1. Homepage shows post list with correct styling
2. Click into first post — renders correctly with mood, tags, nav
3. RSS feed is accessible at `/index.xml`
4. Check mobile view (narrow browser window) — responsive layout works

- [ ] **Step 4: Clean up**

```bash
rm -rf /Users/nervous/Dev/cosmo-blog/public
```

The `public/` directory is gitignored and only needed during builds.

---

## Pre-Deploy Checklist

Before pushing to Cosmo's GitHub account (requires Dylan to complete account setup):

- [ ] Update `baseURL` in `hugo.toml` with actual GitHub Pages URL
- [ ] Update `BLOG_REPO` path in skill if needed
- [ ] Push repo to Cosmo's GitHub account
- [ ] Enable GitHub Pages (Settings → Pages → GitHub Actions)
- [ ] Verify first deploy succeeds

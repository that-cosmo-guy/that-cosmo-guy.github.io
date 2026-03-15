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

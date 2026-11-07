# ThePortfolio

Portfolio site (`/index.html`) with 10 one-page demo websites for local businesses in Athens (`/demos/`).
Plain HTML + CSS, a few lines of vanilla JS, no build step. All copy is in Greek and lives in the HTML.

```
/
├─ index.html               portfolio (indexable)
├─ assets/                  portfolio css, js, fonts (Inter), logo.svg / logo-light.svg / favicon.svg
│  └─ shots/                generated screenshots ({slug}-desktop/-mobile[-thumb].webp)
├─ demos/
│  ├─ reset.css             the only shared file (CSS reset)
│  └─ 01-butcher/ … 10-groomer/
│       (01-butcher/eshop.html: e-shop example for the Πλήρες package)
│  └─ admin/                sample admin panel: orders.html, appointments.html
│       index.html, style.css, logo.svg, fonts/, img/
├─ scripts/screenshots.mjs  regenerates assets/shots with Playwright
├─ scripts/bust-cache.mjs   adds ?v=<hash> to CSS/JS links (npm run bust)
├─ _headers, robots.txt     Cloudflare Pages (robots.txt points to sitemap.xml)
├─ sitemap.xml              portfolio page only (demos are noindex)
└─ PHOTOS.md                photo sources (Unsplash License)
```

## Fill in before going live

In `index.html`:

- The interest form in «Επικοινωνία» is sent by Web3Forms (web3forms.com) to the email the access key was created with. The key is the `access_key` hidden input in `index.html`; get a new one at web3forms.com to change the receiving address.
- The FAQ answers are drafts: check them, especially «Τι γίνεται αν σταματήσω;»

## SEO

- Canonical address: `https://istoselidakias.gr/` (canonical link, `og:url`, sitemap, structured data in `index.html`).
- Link preview image for Viber / WhatsApp / Facebook: `assets/og-image.jpg` (1200×630).
- After the domain is live, add it to Google Search Console and submit `https://istoselidakias.gr/sitemap.xml`.

## Editing

- Text: edit the HTML directly. Demo buttons and links all point to `#` on purpose.
- Fonts are self-hosted per demo (`fonts/`, Latin + Greek subsets from Google Fonts via Fontsource). The `@font-face` rules are at the top of each `style.css`.
- Logos are SVG with the text converted to outlines, so they render the same everywhere. To change a business name in a logo, the SVG has to be regenerated or redrawn.
- Demo pages carry `<meta name="robots" content="noindex">`; the portfolio does not.

## Screenshots

After changing a demo, regenerate its screenshots:

```bash
npm install
npx playwright install chromium
npm run shots                       # all demos
npm run shots -- 04-hair 10-groomer # only some
```

Desktop: 1440×900 viewport, mobile: 390×844 (2× pixel density), both full page, WebP.
The script also writes `-thumb` versions (top of the page) for the portfolio cards. Extra pages such as the e-shop example are listed in `EXTRA_PAGES` in the script.

## CSS/JS changes

Every page links its CSS and JS with `?v=<hash>`, so returning visitors get the new files after a deploy instead of a cached copy (Cloudflare tells browsers to keep CSS/JS for hours). After changing any `.css` or `.js`, run:

```bash
npm run bust
```

It only rewrites links whose file content changed.

## Deploy (Cloudflare Pages)

Connect the repo in Cloudflare Pages with:

- Framework preset: None
- Build command: (leave empty)
- Build output directory: `/`

Or upload the folder as-is with direct upload. `_headers` adds `X-Robots-Tag: noindex` to everything under `/demos/`.

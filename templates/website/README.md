# Website favicon (Google Search)

Put these files in `public/`:

- `favicon-32.png` — browser tab
- `favicon-192.png` — web manifest / app icon
- `favicon-512.png` — single-upload size (browsers and Google shrink it)
- `favicon.ico` — 48×48 (derived) for Google Search
- `apple-touch-icon.png` — 180×180 (derived) for iOS

Add these lines to the page head:

```html
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192">
<link rel="icon" href="/favicon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

On this Next.js site they are set in `lib/seo.ts` (`createRootMetadata().icons`) and served from `public/`. Derive `favicon.ico` and `apple-touch-icon.png` with `node scripts/generate-favicons.mjs` — do not overwrite the three source PNGs.

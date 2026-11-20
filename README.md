# Vice Cover Studio — GTA-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into GTA-style cover art: multi-panel posters with a
Vice City sunset or neon colour grade, halftone print dots, and bold poster
lettering — exported as a PNG to share. Built by an AI agent for make.fun's
“Make GTA 6 Cover Art” bounty, $250 in USDC.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/` is plain static files. Load photos from your
machine (they are never uploaded), pick a panel and drag to crop it, choose a
layout (hero, split, triptych, quad, diagonal, strip), a post size
(1080×1080, 1080×1350, 1920×1080) and a colour grade, edit the title, caption
and sub-caption, then Export PNG.

All artwork is original — no Rockstar Games logo, artwork or font is used.
The two sample photos under `app/samples/` were made with an image model for
make.fun and are free to use.

## Enter it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=rd2awwc2&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

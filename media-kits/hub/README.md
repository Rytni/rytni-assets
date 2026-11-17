# RYTNI Media Kit hub

Public page: https://rytni.live/media-kit-rytni

This is the advertiser-facing overview for Gaming TikTok, Tech TikTok, YouTube
and Instagram. The four existing detailed Media Kits remain separate.

Edit `page.html`, `styles.css`, `runtime.js` and `content.json`, then run from the
repository root:

```text
python tools/build_media_kit_hub.py
node --test media-kits/hub/runtime.test.cjs
```

The build reads only the four existing public manifests and SHA-verified releases.
It embeds exact follower/view counts and their individual dates as a no-JavaScript
snapshot. Views are compact visually; the exact count is retained in the title,
accessible label and data attribute. No cross-platform audience total is invented.

In a normal browser, the page independently fetches the same manifests that
RYTNI Studio already publishes. Channel identity, metric scope, dates, release
namespace, SHA-256 and platform release size are checked before rendering.
An unavailable, malformed, foreign-account or older release keeps the dated saved
snapshot. The page reads only aggregate counters; no participant data, login state
or private credentials are used. Normal Studio publication updates the overview
automatically when it is next opened. No additional Studio build or Tilda edits
are needed for ordinary metric updates.

Official platform images are unmodified; provenance and hashes are in
`brands/sources.json`. Existing RYTNI artwork is loaded from its established CDN
paths. The generated `index.html` is self-contained apart from fonts/artwork and
the existing public aggregate endpoints.

The initial redesign was backed up and installed in Tilda project 11759989,
page 148613483, HTML record 2379662363. Page slug remains `media-kit-rytni`.
The title and description now include TikTok, YouTube and Instagram.

Verification: eight runtime contract tests; responsive desktop/mobile widths
1440/1024/768/390/320; RU/EN; native media-kit navigation; static no-JS snapshot;
all four live aggregate streams; safe saved-state fallback on data failure.
Local review evidence lives outside this repository at
`O:/TikTokAgent/data/qa-media-hub/`.

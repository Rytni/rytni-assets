# Bounded asset/load/decode audit

One local Edge cold/no-store load + decode pass, not an FPS benchmark. `assets.json` records every source/derivative byte count, decoded dimensions, estimated RGBA bytes, load and `Image.decode()` timings. Local timings are not real-network/device promises. `quality.json` and native side-by-side `quality-*.png` compare .94 WebP against PNG at actual display sizes.

| Opaque scene | Dimensions unchanged | PNG bytes | WebP bytes |
|---|---|---:|---:|
| Desktop sky | 1659×948 | 2,416,408 | 427,042 |
| Portrait sky | 1024×1536 | 2,262,293 | 361,890 |
| Landscape celebration | 1672×941 | 2,256,016 | 359,914 |
| New portrait celebration | 1024×1536 | 2,204,697 | 339,834 |

Total four scenes: 9,139,414 → 1,488,680 bytes (83.7% fewer). All were proven fully opaque; no alpha requirement lost. Native visual inspection found no perceptible identity/detail regression; human review is still required. Pixel comparisons are NOT exact: mean RGB error 1.35–1.72/255, maximum isolated edge error 49–66. Same dimensions and CSS aperture reserve prevent asset-size-induced layout shift.

Decoded RGBA scene memory does NOT shrink with WebP: each scene remains about 6.29MB, same resolution. Do not confuse transport reduction with texture-memory/FPS improvement. Alpha UI remains PNG: journal 1448×1086 (~6.29MB RGBA), primary button 2172×475 (~4.13MB), secondary material 1939×349 (~2.71MB). The new secondary material adds a real load/memory cost; it is reused, not duplicated per control. No new animated background, continuous blur, RAF or post-process.

Sponsor token: original 1254×1254 (1,213,073 bytes; ~6.29MB RGBA) retained only as source. Runtime 128×128 (25,409 bytes; 65,536 RGBA bytes), one shared URL for all token bindings.

Unused authoring sources: original untrimmed V2 button, V2.1 secondary source, large sponsor source and portrait PNG. They are not runtime dependencies. Original V2 sky PNGs are retained as immutable reference/fallback sources, not fetched by the candidate scene declarations. The six candidate runtime files are mirrored explicitly, no source/gallery wildcard.

Actual public resource usage/first-use timings, repeat-entry counts and delivery hashes are recorded by the LIVE pass. Repeated resource timing entries do not automatically mean duplicate network bytes; cross-origin timing fields can be restricted. No benchmark marathon or unsupported weak-device FPS claim.

`live.json` retains per-viewport public resource timing entries and scene decode checks (after initialization, potentially warm). These are not called cold decode timings. Shared URLs serve all repeated button/token bindings; large source PNGs and untrimmed button are absent from the candidate resource family. All six preferred files match public hashes on both mirrors.

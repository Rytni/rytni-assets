# Fly + Snake — Chill Groove soundtrack v1

2026-10-20 update: Snake's four compositions are replaced by Groove V2 (Fern Arcade, Velvet Mycelium, Moonlit Steps, Neon Canopy). Muted strings/mallet/organ arrangement; Fly files unchanged. Current quota/backend/music rollout evidence is in [arcade-ranked](../arcade-ranked/README.md). The original music-only audit below is historical; the interactive listening page and measurement/browser reports reflect the new Snake files.

Base: `7cc66d4` / TEST `2.15.33-fada42efb84d`. Music-only change; no gameplay tuning.

## Sound direction

Eight new original stereo instrumental compositions, four per game. Modern soft
electric-piano / plucked-synth / round bass / pocket drums, without vocals or
aggressive leads. Fly is brighter/airier; Snake is warmer and more understated.
Each has its own chord progression, hook and second phrase, not a pitch/tempo
variant of one loop. Taste/appeal requires human listening approval.

| Fly | Snake |
| --- | --- |
| Skyline Soda | Moss Cassette |
| Cloud Club | Root Circuit |
| Daydream Delivery | Crystal Pocket |
| Aurora Avenue | Spore City |

All songs are 104 BPM, 16 bars / ≈36.923 seconds. A normal music chapter lasts
two loops / ≈73.846 active seconds. Crossfades last 1.8 seconds. Audio playback
rate is always 1; Time Bloom, Rush, difficulty and portals do not retime music.

Fly uses active elapsed time and its existing 40,000-score locations to select
the next composition. Snake uses its existing stage index plus active tick time.
The time chapter ensures a long run changes music even before a world expansion.
No stage threshold, world size, score or canonical state is modified by selection.

## Runtime

`grib/arcade-music-v1/player.js` is one shared presentation-only director, injected
into each game's existing AudioContext and Music bus. No new gameplay timer,
music scheduling interval, RAF, live synthesis or canvas processing. At most
two playing/fading voices and two retained decoded buffers. Only requested files
are fetched/decoded; the full playlist is not preloaded into memory.

Pause releases music sources and resumes from the active-clock offset, not a
fresh intro or accumulated wall time. Exit/hidden/disposal stop sources; pending
decodes cannot revive audio after stop. Master/Music/SFX/mute retain their current
controls and persistence. Music failures never block game start.

Fly's old oscillator melody and brown-noise bed are retired. Snake's old forest
recording and temporary biome melodies are no longer loaded/played. Original
SFX files, synthesis and channels are retained. No borrowed samples or melodies.

The immutable Snake dependency snapshot carries the bounded shared audio-only
closure for both games. TEST assembly injects its content-addressed module URL
into Fly, with S3→Pages fallback. Audio is packaged/deployed through the existing
verified TEST mirror, without granting writes to any new global S3 prefixes.

## Review / reproduction

Serve repository root locally, then open `/docs/qa/arcade-music/review.html`.
It provides native playback for all eight files and an immediate next-track
crossfade demo, plus links to the actual local games. No automatic playback.

Original composition source: `tools/qa/compose-arcade-music.cjs` (offline Node +
FFmpeg). Runtime source of truth: the generated MP3s, not that authoring script.
Total music payload ≈4.73 MB; each composition ≈592 KB. The review page can be
used before any publication. Human headphone/speaker listening remains required.

Targeted verification:

```
node --test docs/qa/arcade-music/music.test.mjs arcade/snake-next/tests/production.test.js arcade/snake-next/tests/foundation.test.js
node docs/qa/arcade-music/measure.cjs
node docs/qa/arcade-music/protection.cjs
node docs/qa/arcade-music/run.cjs
node docs/qa/arcade-music/package.cjs
```

The unit tests cover composition selection, constant rates, bounded fades/cache,
pause/resume/restart, in-flight cancellation and nonfatal retry behavior. The
audio gate decodes all eight mastered files: no clipping, matching durations,
unique hashes, normalized RMS and low loop-edge discontinuity. Browser checks
exercise both current games at desktop/mobile sizes, unchanged Snake hashes,
pause/exit, sliders/mute, and all compositions through the shared player.

Production, database and ranked attempt contracts are outside this change.

## Local gate

PASS: 27 unit checks (foundation / production SFX / music), 48 clean-browser
checks across desktop 1366×768 and mobile 844×390, all eight MP3 decode/loop gates,
120 protected Fly functions (only four explicit audio hooks added), three SFX
synthesis functions identical. Zero browser JS/network errors in the local gate.
Both current games and the soundtrack review page were exercised; no real ranked
attempts were used. The earlier Training launch fix remains in place.

Local candidate: `2.15.33-fc82639c1910`; Snake audio closure
`snake-next-a0f94eca2afc`, 529 immutable files. The Snake ID changes because its
music module/assets change, not because simulation or ribbon geometry changes.
TEST-only publication was explicitly authorized by the user. Production manifest
baseline SHA-256 is `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`.

## Published candidate / live gate

Music TEST release: `2.15.33-6d93dbb4fa83`, 1,268,287 bytes; source checkpoint
`5ee22ac`, publication `2d61a91`, rollback-pointer verification `5c0e1ae`.
The final build retains concurrent repository commit `8b58ef6` (event-rules copy),
which accounts for the difference from the earlier local candidate. No unrelated
work was reverted. The real published rollback is `2.15.33-fada42efb84d`, not the
unpublished intermediate local build; the mirror guard refused promotion until
that reference was corrected and verified.

LIVE PASS: 17 checks on desktop and mobile, actual public non-preview TEST,
Fly + Snake Training startup, new soundtrack, fixed rate, pause/resume and Fly
exit source teardown. Zero page/game-resource errors; anonymous auth health 401
is an existing baseline, recorded separately. Zero ranked/sponsor mutations.
Local protected-package gate verifies 516 old Snake files remain byte-identical
(all geometry/gameplay/material/SFX except three explicit audio integration files).

`node docs/qa/arcade-music/mirrors.cjs` additionally verifies identical manifest
bytes and bundle hashes on Pages/S3, plus all nine shared music-module/MP3 files.
Human listening approval is still outstanding; technical PASS is not a taste claim.

During final verification a concurrent rules-only publication advanced TEST to
`2.15.33-7efbc6a0edfe` (`39a754f`, following `b96c333`). It retains the identical
`snake-next-a0f94eca2afc` soundtrack closure. Fast-forwarded to that published
state without discarding either task's changes. Final mirror/live checks target
the current committed channel; its valid previous release is the music build
`2.15.33-6d93dbb4fa83`. No rollback of the concurrent rules update was performed.

Final gate PASS on `2.15.33-7efbc6a0edfe`: Pages and S3 manifest bytes match
(`99b304c30023e042a467ab8dace0e2f0b110117714098550451b222234a1eddb`), bundle SHA-256
matches (`7efbc6a0edfe588f583b8910f7fb2dba83d94b512afe97dd9464cc9a3fa4421d`),
all nine music files match the immutable descriptor on both hosts. The identical
JSON manifest was normalized from CRLF to LF using an ETag-conditional TEST-only
write, refusing any different concurrent channel. Production remains unchanged.
The 17 LIVE checks were repeated after both hosts reached the current version.
Public review smoke confirms eight native audio controls and the actual Fly
Skyline → Cloud Club transition, with no page errors.

Listen: <https://rytni.github.io/rytni-assets/docs/qa/arcade-music/review.html>.
Play: <https://rytni.live/testpodari>.

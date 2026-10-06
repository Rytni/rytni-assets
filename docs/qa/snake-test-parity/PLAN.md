# Snake TEST parity / release gates

Base: `2c7a6d4`. Binding specification: attached request 39ea39ac.

1. Audit current Fly effective sizing; apply requested Snake semantic sizes and inner scrolling, preserving art. Browser-check desktop, tiny embedded, mobile and zoom equivalents.
2. Replace TEST legacy Snake assembly with thin Hub host. Product iframe uses isolated TEST mock, authenticated source/origin/channel messages, atomic close/reopen, no hidden game owner.
3. Generate immutable module/art/audio dependency snapshot. Validate every file hash and exact candidate paths. Keep Production and Fly source byte-identical.
4. Build local TEST candidate; test source assembly, deploy guard, real candidate host/Fly and Snake routes. Record paired review and measurements.
5. Only if all gates pass: source checkpoint, safe main fast-forward, canonical TEST publication. Verify Pages/S3 and real site desktop/mobile. Otherwise keep local candidate and report blocker.

Ruling: nominal requested 560/680/860/760 maxima take precedence over later Fly large-container width overrides; document those overrides rather than reproducing inconsistent arbitrary widths.
Ruling: immutable runtime dependencies require a manifest-verified exact allowlist, never a wildcard expansion of deploy permissions.
Progress: audit/UI/immutable packaging/host complete. Local tests, real-page response-override QA, physical 125% browser zoom, mobile/native/fallback lifecycle pass. Two pre-existing historical source-lock failures were reproduced at the task base and are separately documented; task-relative source/art/Production locks pass. Source checkpoint and canonical publication gates are next.

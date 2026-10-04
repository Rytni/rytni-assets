# V4.1 validator audit — FALSE POSITIVE

Renderer files remain byte-identical to `edece22`. No geometry/material/head
change, new renderer, interpolation, integration, benchmark or deployment.

Exact U and alternating failures: alpha 2/11, d=2.213636, point
(903.472727,306), canonical distance behind head 26.890909 px.
The old normal scan contains A=36 local-field pixels, B=0 other-branch
pixels, C=9 leading-cap pixels. Global silhouette span really IS 45 px;
the incorrect inference was calling it a 45 px constant-width BODY.

Corrected Option A: evaluate radius/local normal boundaries of the intended
field neighbourhood; intersect its coverage with actual silhouette coverage.
The neighbourhood is ±CELL/8 (8.5 native px), well below canonical 68 px
history-knot spacing, while allowing pixel-center projection error at joins.
Do not discard a local-covered pixel merely because normalized radial score
selected the overlapping cap as material owner. The CSV retains BOTH chosen
renderer field d and Euclidean-nearest valid centerline projection d.
They are different concepts when cap radius changes.

The head transition is conservatively −24…+42 px from the endpoint: leading
extent CAP=24 and back envelope CAP + BODY/2 = 42. The disputed section lies
inside it. Crucially its corrected local width is already 36 even WITHOUT
using this exclusion: the classification is not hiding a 45 px local result.
Only BODY after the transition and before the final 61.2px taper receives the
35–38px width gate. Cap shape quality remains a separate human judgement.

All original 96 sampled frames re-evaluated: BODY local width 36–36, missing
local samples 0. The old global metric still spans 35–45. No threshold relaxed.
Five targeted tests also detect a deliberately genuine 44px local field,
two missing local pixels, a foreign branch span, and negative branch clearance;
cap radius is monotonic, never above18, and joins the body radius without a step.
No full regression run, because the renderer itself is not modified.

Self-proximity has two honest scopes:

1. All twelve original short U phases: no pixel covered by two path
   neighbourhoods at least one canonical CELL apart in the full head-proximal
   turnaround ROI x760…959 / y180…459. The remainder of this eight-cell fixture
   is a non-returning trailing run, not another head-near branch. This is
   finite temporal/raster sampling, not an exhaustive continuous proof.
2. Nominal parallel clearance: the original short U has no overlapping
   straight opposite legs after rounding. A validation-only long-leg canonical
   U verifies center separation 68, surface clearance 32, no overlap. This
   does not alter renderer fixtures and must not be presented as the minimum
   gap between every pair of contour edges in the connected turnaround.

Naked native crop shows the ordinary forward cap/lower turnaround, not a
separate 45px body bulge/patch. Pixelwise head/body separation cannot arise
from an independent head owner because V4 uses one mask. Human can still
reject the cap's artistic appearance; this audit only rescinds the erroneous
BODY-width rejection. No automatic visual approval.

`review.html`: old scan, corrected scan, naked crop, each at 1× and exact 4×;
three metrics kept distinct. CSV records every counted pixel and path owner.

Reproduce from root:

```powershell
node --test arcade/snake-next/smooth-v4-proof/validation/validator.test.mjs
node arcade/snake-next/smooth-v4-proof/validation/build-audit.mjs
```

Browser presentation verification uses the `playwright-cli` skill.
One diagnostic checkpoint; STOP for human review.

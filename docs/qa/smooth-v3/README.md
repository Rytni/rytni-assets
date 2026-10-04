# Smooth V3 — first sprite-only visual gate

One offline RIGHT→UP front-character master, twelve pre-rasterized poses.
No ImageGen, gameplay integration, runtime renderer changes or deployment.

Sources: approved `head-0-v0.png` and `straight-0-v0.png` in the V5.6 kit.
They are read, never modified. Native shape/material sampling uses the
approved Smooth V2 `tube-path.js`, not the rejected neck/socket prototypes.

The authored orientation chart is 0, 0, −6, −15, −27, −39, −51, −63, −75,
−84, −90, −90 degrees. Intermediate head pixels are inverse-mapped OFFLINE
from the approved art using nearest-neighbour native rasterization, with no
blending or Canvas rotation. They are not claimed to be hand-redrawn pixels.
Head/neck are baked into one RGBA sprite at each phase. No socket patch or
extra connector is added. The first pose uses the exact incoming source;
the final pose uses the exact cardinal outgoing mapping and V2 body sample.

The 160×160 transparent canvas is measured to hold the turning front region,
including its moving rear connection. Common head-center anchor: (96,48).
Its dimensions are storage bounds, not hitbox or creature thickness.
The source transverse head width stays 42 px; body and rear port are 36 px.
Join lies on the stable incoming straight at canonical distance 1.65;
its relative position changes with canonical alpha. At late turn it includes
about 65 px of body surface behind the 32 px rear of the head (~0.95 cell).

The strip keeps head centers aligned to compare poses: only the front shape
changes there. A future integration must translate each common anchor by
approved V2 head position, not snap to sprite-frame coordinates. No runtime
mode is added before human approval. Seven other directions are not authored
independently; exact rotations/reflections are deferred until approval.

All twelve saved poses have a single 4-connected silhouette and 36 px rear
port. These are simple authoring sanity checks, NOT visual approval or proof
of every neck cross-section. No large regression or benchmark was run.
The simulated composite clips regular body at the rear join and uses the
same body-distance material phase; its module is the sole owner after it.

Review four images only. Native strips stay 1920×160 CSS pixels, with overflow
scroll instead of reduction. The ×4 view is a middle-pose close-up only.
Pixel resampling quality, face/mushroom continuity, and the plausibility of
each individual pose remain the human gate; motion is not validated yet.

Rebuild: `node arcade/snake-next/smooth-v3-proof/build-front-module.mjs`.
STOP before integration. No TEST/Production publication.

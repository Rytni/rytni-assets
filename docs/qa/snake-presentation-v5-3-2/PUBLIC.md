# V5.3.2 TEST publication evidence

Final release `2.15.33-e56b72a011df`, runtime `snake-next-78436309631c`.

Source checkpoints:

- `8a7a369` — six requested presentation/host changes and art-first evidence.
- `862d4fc` — shared portrait header safe inset found during LIVE review; mobile badge is 16px clear of the parent close button.

TEST publication checkpoints:

- `0f0aee2` — initial V5.3.2 review candidate `2.15.33-91d7afeec517`.
- `330b4ad` — final `2.15.33-e56b72a011df`, same immutable gameplay runtime; only 13 host CSS bytes added.

Rollback intentionally remains the human-approved published base `2.15.33-c77364482deb` / `snake-next-3efbc8cbe51b`, not an unpublished intermediate local build.

Final mirror verification / fresh LIVE verification: **PASS**. Both `public.json` and `live.json` name `2.15.33-e56b72a011df`; fresh browser contexts load the exact published runtime from the actual Tilda host, without local asset interception or QA overlay. Anonymous preview flags are used solely to expose the existing review menu without private account credentials.

Both Pages and S3:

- app SHA256 `e56b72a011dfa5ca2759433ee7e80bd9b1261686d9b2838aa2b780c942f60200`, 1,187,837 bytes;
- runtime manifest SHA256 `420b7b96adaeb01fba79f7a53b209baf1479d402bf21ff61f2d31eab89668855`, 91,907 bytes;
- all six changed runtime files independently hash/size verified;
- published rollback app independently hash/size verified;
- mirror upload is manifest-last; final host-only update uploaded one app with 521 runtime files unchanged.

LIVE: 26 checks PASS, zero failures, zero new console/page errors, zero failed relevant assets. Desktop 1920/1366, portrait 390/412, Fly landscape 844/915; both games, both Settings tabs, shared header, portrait badge/close-button 16px clearance, chooser frozen assets/cover/equal CTA alignment, Main no duplicated own-summary, no visible Fly technical note. Existing anonymous auth-health 401 remains explicitly separated as baseline. Gallery: seven clickable sections and all image loads PASS.

Other targeted evidence: 21 local responsive checks PASS; 32 UI/controller/host unit tests PASS; 12 immutable package tests PASS; bundle/loader validation and TEST deploy guard PASS; protected closure PASS. Authenticated participant visual review remains with the human's existing login, not fake preview identity.

[Actual TEST](https://rytni.live/testpodari?arcade_preview=1) · [Native screenshots / concepts](review.html) · [Public byte evidence](public.json) · [Fresh LIVE evidence](live.json) · [Protected source closure](closure.json).

Production unchanged; no SQL/backend mutation. Fly gameplay source remains byte-identical to `e750631`.

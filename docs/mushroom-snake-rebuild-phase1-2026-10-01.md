# Mushroom Snake rebuild — Phase 1 / review gate

Дата: 2026-10-01. Только аудит, технический дизайн и план. Новый Snake **не реализован**. Legacy не исправлялся в этом pass; Fly/Hub/страница/DB не изменялись. Build, push и публикации не выполнялись.

Статусы находок: **CONFIRMED** — наблюдение в браузере или установленное поведение исходника (указано отдельно); **LIKELY** — обоснованный риск, без полного воспроизведения; **NOT YET VERIFIED** — отсутствующее доказательство. Все нижеописанные новые системы — предложения для review, **NOT YET VERIFIED**, а не готовые возможности.

Аудит публичных страниц выполнен Playwright CLI / Edge. Игровые flows использовали anonymous preview fixtures; запросы RPC записи блокировались до отправки. Реальные ranked/sponsor attempts не расходовались. Это не authenticated end-to-end проверка backend.

## 1. Карта текущей RYTNI ПОДАРИ

**CONFIRMED — source/browser.** Канонический TEST checkout: `C:\GitHub\rytni-assets`; это статический asset/release repository, без root npm application и dev server.

```text
Tilda public page
  → TEST/Production loader
  → channel manifest → SHA-256-validated immutable app.html
  → replay page blocks / deferred bootstrap
  → auth + participant/progression popup
  → Arcade tab → Hub registry
       → Fly activate/deactivate
       → legacy Snake activate/deactivate
```

- `tilda-test/blocks/00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html`: loader verification source; не runtime block build input.
- `tools/build_tilda_test.ps1`: восемь canonical blocks (`01`, `02`, `03`, `04`, `05A`, `05B`, `07`, `08`) + результат `arcade/assemble-snake-v2.cjs`. Normalize LF/UTF-8, content hash, release id, локальный TEST manifest. Build не означает publication.
- `05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html`: bootstrap/auth/RPC/popup/focus/Escape. `05B…`: profile/progression. `07…`: TikTok.
- `08_T123_BROWSER_ARCADE_2.15.34.html`: Fly, mixer, ranked UI/lifecycle.
- `arcade/09_T123_ARCADE_HUB_SNAKE.html`: Hub registry, backbar, v1 legacy slice; assembler удаляет v1 runtime по textual anchors и вставляет v2.
- Legacy v2: `snake-rules/world/core/segments/forest/controller.js`, `snake-ui.html`. Art/audio: `grib/mushroom-snake-v2/`.
- `giveaway/manifest.json`: Production; `giveaway-test/manifest.json`: TEST; immutable `releases/<version>-<sha12>/app.html`.
- Loader гоняет S3/GitHub Pages/GitHub raw, проверяет hash, переписывает asset prefixes, сохраняет last-good в CacheStorage/localStorage, поддерживает previous release и session fallback с TTL 5 минут. Abort проигравшего mirror request не равен game asset failure.
- Backend SQL/deploy/часть QA dependencies находятся в соседнем workspace `C:\Codex\Rytni Gift\RYTNI_TRANSFER_2026-07-31\CORE\Сайт`. Это не второй canonical TEST source после переноса blocks.

**CONFIRMED — browser:** Production `/rytni-gift` загрузил `2.15.32-c2008385c2fb`; Arcade/Fly/Snake runtime там отсутствует. TEST `/testpodari` загрузил `2.15.33-451886dbbce4`, совпадающий с local TEST manifest. Не выдавать проверку Fly на TEST за проверку Fly на Production. Runtime `RYTNI_RELEASE` содержит только version; полный id установлен по release resource URLs.

## 2. Fly integration / ranked lifecycle

**CONFIRMED — source:** Hub выбирает Fly, вызывает activate; deactivate прекращает игровой RAF/owned timers/audio. Fly использует page participant/auth и `callSupabaseRpc`.

| Шаг | Реальный frontend contract |
| --- | --- |
| Hub/attempts/leaderboard | `get_browser_arcade_hub_v21533`, participant id, authenticated read |
| Ranked start | `start_browser_arcade_attempt_v21533`, participant id, client token, release |
| Sponsor credit | `claim_browser_arcade_sponsor_attempt_v21536`, те же identity fields; затем Telegram link |
| Finish | `finish_browser_arcade_attempt_v21533`, attempt id/token, duration, score, spores, gates, jumps |
| Training | local seed, no attempt id, no leaderboard submission в real non-preview branch |

Start ждёт asset/mobile/geometry/bonus readiness до RPC. Ответ start несёт server seed/attempt id и лимиты. `model.finishing` защищает от повторного finish в одном run. Preview имеет mock ranked/sponsor/result responses; именно они проверены автоматически.

**CONFIRMED — SQL source, НЕ live DB:** файлы `04_Supabase_SQL/64_Browser_Arcade_2.15.33.sql`, `65_Browser_Arcade_Endless_2.15.35.sql`, `67_Browser_Arcade_Sponsor_Credits_2.15.37.sql`. 3 regular + 2 sponsor в rolling 24h; ownership/auth/active season; participant row lock. Sponsor сначала выдаёт credit, start затем потребляет credit; normal budget сначала должен закончиться. Finish locks attempt, повторный finish по attempt id возвращает already_finished; проверяет token, срок/длительность до 12h и Fly-specific plausibility. Ledger label — Mushroom Fly. Daily-challenge SQL существует, но текущий canonical frontend его не использует.

**NOT YET VERIFIED:** deployed SQL совпадает с этими файлами; real account leaderboard/credits/atomic concurrency/reconnect. Никаких утверждений о фактическом изменении DB.

## 3. Подтверждённые host/page проблемы

| Статус / проблема | Evidence / граница вывода |
| --- | --- |
| **CONFIRMED:** Escape имеет двух владельцев | Hub capture помечает fullscreen Escape, game bubble handler всё ещё реагирует. Playing → Paused у обеих игр при первом Escape. Popup/selected game сохраняются. |
| **CONFIRMED:** residual eager art | До выбора игры: Fly preloadStarted=false, imageRequestsStarted=0, но 17 Fly image resource entries и 12 Snake-family entries уже загружены. Hidden help/HUD/navigation DOM + Hub cards. Старый глобальный preload 42 картинок не вернулся. |
| **CONFIRMED — source:** publication scope опасен | Соседний `tools/deploy_tilda_test.ps1` использует sibling build/test, stages также `giveaway/manifest.json` и pushes origin main. Не запускался. Это риск dual-source/Production scope, не доказательство изменения Production. |
| **CONFIRMED:** accessibility warning при закрытии | Второй Escape после Fly fullscreen: Chromium сообщает retained focus на `#arcadePause` при aria-hidden applicationPopup. Source `closePopupLayer` скрывает слой до focus restoration. Воспроизведено с anonymous popup fixture; обычный authenticated focus flow отдельно не доказан. |
| **CONFIRMED — source:** CSS debt | 609 `!important` occurrences в canonical Fly block, layered overrides. Сам count не доказывает сломанный layout. |
| **CONFIRMED:** устаревшая навигация | «Аркада» в backbars/game menus, плюс host/game navigation. Для нового entry оставить один «Другая игра», не менять Fly labels в этом pass. |

**LIKELY:** CSS override/z-index chains и textual assembler anchors делают последующие интеграции хрупкими; широкая CSS чистка сейчас повысит риск.

**NOT YET VERIFIED:** accumulating duplicate listeners, compositor corruption, persistent cross-game state leak, memory leak. Multiple resize listeners/observers существуют, но coalescing и backing-size guards тоже; это не доказательство resize bug. Duplicate DOM IDs не найдены. 12 style / 27 script nodes и пять canvases сами по себе не дефект.

## 4. Fly problems / что проверено

**CONFIRMED — browser defect:** Paused + fullscreen → первый Escape выходит из fullscreen **и снимает паузу**. Elapsed 0.3333 → 0.4833s, paused true → false. Второй отдельный Escape закрывает popup и завершает active host session. Root cause: unconditional Escape handling в Fly `keydown` (canonical block, строка 715) не учитывает Hub event ownership. Исправление не выполнялось; это приоритетный shared-lifecycle blocker перед integration.

**CONFIRMED — source defect/risk:** `ensureFlyAssets` при отказе обоих mirrors resolves image promise, decode error тоже проглатывается; `Promise.allSettled` выставляет readiness. Failure-open readiness, не подтверждённый broken live menu. Dual-mirror fault injection ещё не выполнен.

**CONFIRMED — source:** start и sponsor не имеют server operation-id dedup; client token — identity, не idempotency key. Успешный server start при смене host epoch может быть discarded клиентом. Сеть может потерять response после debit, но UI пишет «Попытка не списана». Такую гарантию исходник не обеспечивает.

**LIKELY:** double-click start до `running=true` способен отправить два start RPC; safe retry способен повторить неидемпотентный start. Не воспроизводили расход настоящих попыток.

**CONFIRMED — tested smoke:** Main → Rules → Settings → Sound → Main; preview Ranked; preview sponsor credit `+1`; Training → Pause → Settings → Resume → Restart confirm → natural death/Result → Main → Hub → reentry. Pause elapsed заморожен. Desktop/modeled mobile controls работают в этих flows. Нет blank Fly canvas на первом readiness-gated входе. Нет новых preload requests при warm reopen.

**NOT YET VERIFIED:** реальный ranked submit/reward, server leaderboard correctness, full bonus/event game coverage, длительная физическая mobile session. Visibility background-tab probe в headless Edge не вызвал visibilitychange (events=[]/state=visible), поэтому auto-pause НЕ помечен PASS. Source имеет visibility autopause/stop audio и blur release-hold; физический background/minimize обязателен позже.

## 5. Почему legacy Snake не брать за основу

**CONFIRMED:** public TEST exposes unstyled loading Main: missing art, placeholder rectangles, flat controls; после полной загрузки ready prompt выглядит оформленным. Public TEST не содержит unpublished cold-start fix `dc9124c`.

**CONFIRMED — prior local WIP evidence, НЕ текущий public TEST repro:** portal создавал discontinuous body path; segment selector выбрасывал `Snake path must contain distinct cardinal neighbours`; exception оставлял несбалансированный canvas clip и останавливал RAF. Restart рисовал только clip area. Integer body и independently interpolated head/tail/shadow использовали разные presentation clocks. Food slot/refill policy могла давать starvation/bursts. WIP сохранён checkpoint, не является approved release.

Архитектурные причины отказаться от reuse: controller смешивает simulation, world streaming, rendering, loading/UI/lifecycle; entity lifetime связан с несколькими системами; portal path допускает разрыв; visual exceptions могут ломать loop/context; assembler зависит от legacy anchors. Полный audit не доказывает отдельный decor-disappearance bug, но показывает опасные связи.

Не переносить исправления WIP, portal/decor/spawn/render/world architecture. Возможный tiny utility (например PRNG) сначала независимо специфицировать и test against known vectors; проще написать малую чистую реализацию, чем тянуть модуль.

## 6. Clean architecture нового Snake

**PROPOSAL / NOT YET VERIFIED:** десять explicit modules, dependency direction к DOM-free simulation, не наоборот:

| Owner | Ответственность / запрет |
| --- | --- |
| Simulation | authoritative grid/body/occupancy, ticks, collisions, growth, score, effects, spawn schedules; без DOM/canvas/audio/camera |
| Input | WASD/arrows/D-pad → sequenced turn commands, release on blur; не меняет позиции |
| World | seed + rules version → validated immutable arena topology; decor metadata отдельно от collision |
| Rendering | read-only snapshots/events → full frame; не spawns/removes gameplay entities |
| Camera | bounded presentation transform; не участвует в collision/spawn/difficulty |
| Audio | consumes semantic events, owns scoped sources, shares host mixer facade |
| UI | menus/settings/HUD; не пишет engine state напрямую |
| RankedSession | reserve/start/reconcile/finish/outbox; training не имеет server attempt |
| AssetLoading | per-game/per-group promises, verified load + decode, explicit errors |
| Lifecycle | state machine, epoch cancellation, visibility/orientation/host ownership, resource disposal |

Предлагается отдельный Worker для sim clock, RAF **только rendering**. Worker uses fixed 60Hz accumulator on its own scheduler, never RAF callbacks as simulation driver. Simulation pure `step(state, commands)` также исполняется headless для replay/tests. Worker messages: session/epoch/tick/input sequence; pooled transferable snapshots, no SharedArrayBuffer requirement. Main applies only monotonic snapshots of current session.

**CONFIRMED — feasibility probe:** Blob Worker стартует на public TEST; crossOriginIsolated=false, SharedArrayBuffer отсутствует. Это не throughput acceptance и не гарантия будущей CSP. Worker self-contained artifact из reproducible build; direct cross-origin CDN Worker URL не предполагать.

Если scheduled wake отстал, bounded catch-up, затем explicit pause/recovery, не бесконечная работа и не изменение difficulty по wall clock. Рендер может пропустить устаревший кадр; simulation sequence не теряется. Выбор Worker окончательно после latency/1200-body spike в Phase 2; main-thread scheduler допустим только с тем же separation и доказанным budget.

## 7. World A/B/C и выбор

| Вариант | Сильная сторона | Риск |
| --- | --- | --- |
| A. deterministic scrolling | путешествие, много пространства | generation/prewarm/eviction/seams/collider safety; большая complexity до fun-core |
| B. большая managed arena | classic Snake, bounded memory, topology replay, безопасный render | конечное пространство, нужен fair camera/route design |
| C. staged/seamless arenas | curated progression | перенос длинного тела, изменения геометрии, gate transitions могут ломать классический control |

**PROPOSAL / NOT YET VERIFIED — рекомендуем B**, с biome chapters в одной неизменной arena, без teleport/streaming. Начальный tuning candidate 96×64 cells (6144), не финальная продуктовая константа. Occupancy bitmap + independent body path, camera bounded and physics-independent. Seeded obstacle layout валидируется заранее: connected free space, no narrow traps, initial runway, broad routes для длинного тела. Obstacle collision footprints остаются неизменными всю ranked session.

Trade-off для review: это не endless travel; при полном заполнении свободного поля честная victory/result, не hidden growth cap. Chapters дают changing worlds без body transfer. Если обязательным станет физически бесконечное путешествие — вернуться к A отдельным решением, не постепенно прятать legacy streaming внутрь B.

## 8. Simulation / interpolation

**PROPOSAL / NOT YET VERIFIED:** integer cells, integer tick timers, quantized movement phase; seed/rules/input log дают одинаковые state hashes. UP/DOWN/LEFT/RIGHT, reversal rejected относительно последнего принятого turn; bounded two-command queue, максимум один turn при crossing cell boundary. Pointer repeat не создаёт дополнительные повороты. Eating/growth/occupancy updates atomic на simulation tick; entering current tail cell законно только если tail действительно освобождается в этом tick.

Snapshot pair `previous/current` + **один alpha**: continuous centerline из canonical path и travel phase. Все head/body/taper/tail/shadow вычисляются по distance along одной path, не отдельными lerp offsets. На turn не Cartesian diagonal lerp сквозь препятствие; interpolation проходит через corner path. Growth добавляет длину на tail end без отдельного head jump. Head drawn last, coherent taper width toward tip, shadow из того же silhouette. Pixel snapping только после общего world→camera transform, единое правило DPR.

Render: full visible canvas clear каждого кадра; ground → stable decor → obstacles → pickups → shadow → body/tail → head → authored FX. Scoped save/restore with finally; если render exception — restore baseline/reset next frame + visible recoverable error, а не продолжение с leaked clip. Resize обновляет backing once after stable measure, но не engine. Нет dirty rectangles в первой версии.

Food/spawn/effect existence — simulation only. Exactly one regular food, consumed/replaced atomic; candidate selection из deterministic reachable free cells, not per-frame random retries. Не ставить pickups на body/obstacles или в зоне немедленного неизбежного контакта; safety envelope учитывает current maximum movement speed + время решения. Если special spawn сейчас небезопасен — bounded deterministic retry schedule, не batch catch-up. Нет obstacle insertion во время run.

Такие ownership/contracts исключают известные причины ошибок; «bugs impossible» проверяется assertions/tests, не обещается одним redesign.

## 9. Три biome chapters

**PROPOSAL / NOT YET VERIFIED:** Forest → Crystal Caves → Mushroom Swamp → следующий chapter cycle. Trigger от active tick + food milestones, не camera position/FPS. Constants входят в rules version. Transition schedule explicit and replayable.

| Biome | Ground / decor / obstacles | Ambient / музыка / palette |
| --- | --- | --- |
| Forest | moss/soil variation; authored leaves/fern/tiny flower clusters; stumps/roots/rocks | редкие fireflies; тёплый plucked/chip melody + wood percussion; muted deep green, warm collectibles |
| Crystal Caves | irregular stone/mineral patches; crystal fragments; solid rock/crystal pillars | редкие mineral glints; crystalline FM motifs + low pulse; blue-violet dark floor, restrained emissive accents |
| Mushroom Swamp | wet earth/small puddle patches; reeds/fungal colonies; rooted bog stones | редкие low spores; distinct syncopated reed/bass percussion; low-contrast teal/olive, не конкурирующий toxic magenta |

Obstacles меняют biome art при сохранении collision footprint; silhouettes остаются solid. Decor non-colliding с low profile, без collectible/obstacle outline. Three original music compositions, не slowed remix.

Transitions: заранее подготовленные deterministic irregular sector masks/tonal patches и authored transitional compositions. Chapter wave меняет небольшую группу immutable surfaces по schedule; не alpha-fade тысяч объектов каждый frame. Frontier широкая/неровная, stable seed offsets across sectors. Decor identity стабильна внутри chapter, changes only by declared chapter schedule, никогда из-за camera visibility. Подготавливать next theme во время Main/раннего chapter, не на входе в viewport. Initial runway заранее decor-light; food выбирает спокойные свободные клетки. Не прятать decor динамически рядом с головой/телом: читаемость обеспечивают контраст/слои/композиция.

## 10. Новый bonus / debuff set

**PROPOSAL / NOT YET VERIFIED:** пять positive / три negative. Без portals и без effects, крадущих control. Первое появление special pickup после понятного обычного food loop.

| Effect | Решение / правило | Pickup, active cue, expiration, sound |
| --- | --- | --- |
| Золотой росток | следующий food reward ×2; растёт ровно обычная длина | gold leaf/bud; small leaf streak на head + charge HUD; resolve chime |
| Спокойная роса | плавное bounded снижение speed на 6s | cyan droplet; маленький dew highlight + countdown; two-note ending cue, gradual safe speed return |
| Длинное дыхание | combo grace window +50% на 8s | green hourglass-shaped seedpod; restrained pulse on combo badge; warning ticks/soft close |
| Карман семян | следующие 3 foods дают дополнительный fixed score | gold pouch silhouette; три HUD pips; pip sound each consume, ending cadence |
| Путеводный свет | 8s показывает ближайший безопасный маршрут к food, не autopilot | cyan lantern; несколько discrete pixel trail marks, не огромный ring; brief lantern fade/audio |
| Колючая пыль | следующая food даёт base score, без combo bonus; нет штрафа control | magenta thorn pod; crossed combo HUD/pollen pixel accent; clear resolution sound |
| Тяжёлая смола | 6s повышает threshold поддержания combo, не скорость/направление | red-black angular resin; small timer icon/body tint accent; countdown/clean release |
| Горькая спорынья | 8s блокирует новый positive slot, существующие effects продолжаются | asymmetric toxic seed; lock HUD + restrained toxic specks; unlock cue |

Effects нельзя различать только цветом: food — warm seed/fruit + inviting sparkle; positive — smooth leaf/drop/lantern; negative — thorn/angular warning; obstacles — stationary mass, no pickup pulse. Debuffs доступны для избегания, не unavoidable lane blocking.

Slots: max 2 positive + 1 negative. Same type deterministic refresh capped by spec, не multiplier explosion; at full capacity pickup явно показывает swap/refresh outcome, не тихо исчезает. Every effect имеет definition, activation event, authored pixel-art VFX, HUD label/timer, 2s expiration warning, ending event/SFX. Timers идут по active simulation ticks; pause frozen; result/restart/leave очищают effects/events/voices. Effects не создают дополнительный body state. Exact durations/scoring проходят balance review, это не обещание текущих mechanics.

## 11. Scoring / difficulty / feel

**PROPOSAL / NOT YET VERIFIED:** base food 100; combo integer tier 1…5 от timely pickups, bounded cap. No passive survival score: нельзя бесконечно farm safe circle. Milestone reward каждые 10 foods, server versioned formula; food always growth +1. Training/ranked имеют одинаковые rules, различаются seed/session/submission.

Start ~4 cells/s, первые 10s спокойные; до ~6 к 45s/10 foods, ~8 к 120s, initial late cap ~10. Trigger по active ticks + foods, monotonic and quantized. Не ускорять по viewport, quality или FPS. Slow-effect recovery gradual; combo window учитывает reachable path distance и speed, а не требует невозможного food pickup. До balance approval numbers — hypotheses.

Juice: короткий pickup anticipation sprite, tiny squash декоративного food (не occupancy), bounded pixel particles, layered combo chime, small score pop, restrained chapter arrival. Нет simulation hit-stop ради reward; death может freeze presentation после authoritative result. Camera reaction не смещает physics, optional/reduced motion; no heavy shake/blur/giant vector placeholders. Input response важнее эффектов. First-10-second usability test обязателен.

## 12. Ranked / attempts integration

**CONFIRMED:** Fly RPCs нельзя использовать для Snake без изменения contract: отсутствует game namespace, start не idempotent, finish metric validation/ledger Fly-specific. Reuse participant/auth/RPC transport/read-only concept/season model, не Fly stats/attempt table semantics как есть.

**PROPOSAL / NOT YET VERIFIED:** отдельно согласованный versioned Snake contract, без выдуманных «существующих» RPC names. Backend team review до ranked implementation. Требуются game/season/rules version, independent budget 3+2, stable operation id для start/sponsor, unique constraints, row locks, immutable attempt status, seed и server timestamps.

Lifecycle: IDLE → PREPARING → RESERVED (no debit) → RUNNING/COMMITTED → FINISH_PENDING → FINISHED. Assets decoded + arena validated + Worker ready + landscape/fullscreen stable **до reservation**. Reservation expires safely без debit. Commit не вызывается до first valid gameplay readiness; server acknowledgement/reconciliation определяет статус, UI не обещает «не списано» на ambiguous timeout. Client сохраняет operation id до отправки. Retry того же operation возвращает тот же attempt/seed. Leaving/cancel до committed status cancels reservation; epoch change не отбрасывает необходимость reconciliation.

Result delivery — persisted outbox keyed attempt id + payload hash; retries возможны, но server credit/result effect exactly once. После reconnect сначала status, затем retry/restore; неизвестный ответ не начинает новую попытку. No backend call для Training. Sponsor operation тоже idempotent; sponsor verification eligibility server-owned, не просто external-link click.

Невозможно честно гарантировать «любая UI error никогда не расходует попытку» только frontend gating: server уже мог commit. Нужны approved reservation/recovery/refund policy и replay evidence; blanket client-requested refunds дали бы cheat. До этого требования ranked BLOCKED by contract design, не подменять UI reassuring text. Crash after actual gameplay требует restore/reconcile policy, не автоматическую бесплатную попытку.

Server seed + input tick log + periodic state hashes + versioned replay позволяют проверять score/difficulty/spawns. Client hash не античит сам по себе. Простой plausibility как Fly — lower assurance; строгий leaderboard требует server replay/validation budget. Это отдельное решение review; DB ничего не менять в Phase 1.

## 13. Loading / lifecycle / host

**PROPOSAL / NOT YET VERIFIED:** INACTIVE → BOOT → CRITICAL_ASSETS → MAIN_READY → GAME_ASSETS → READY → PLAYING ↔ PAUSED → RESULT → MAIN_READY; LOADING_ERROR с retry; DISPOSING → INACTIVE. UI may remain interactive Main while game assets preload, но start waits READY.

Critical set определяется dependency manifest первого Main: background/frame surface/corners/logo/hero/buttons/icon atlas/font if needed. Load **и decode** fail-closed до reveal Main одним состоянием. До выбора Snake нет его production preload, кроме явно отдельной Hub card. Designed loading «Mushroom Snake — Загрузка леса…», без unstyled shell. Gameplay art/VFX/audio отдельно lazy; audio decode не должен скрыто происходить целиком в первом gameplay frame. Per-asset URL/hash promise cache, retries only failed items; activation epoch protects stale completion, not new duplicate requests.

Host owns game selection/popup/fullscreen Escape; game receives normalized intent only if unconsumed. First fullscreen Escape exits only, second separate Escape closes host popup per current contract; no resume on exit. Fullscreen/orientation waits are cancellable before attempts; portrait during play pauses simulation. Resize changes presentation only. Blur releases inputs; real visibility hidden pauses, stops scoped audio and RAF; foreground requires explicit resume. Pagehide/dispose terminates Worker, cancels RAF/timers, aborts owned listeners with AbortController, resets input/effects. One active game audio owner. Warm reopen keeps immutable decoded cache but not previous run state.

DEV/TEST object `__RYTNI_ARCADE_NEXT_DIAG__`: game/session state, sim tick/render frame, length/biome/effects/spawn counts, attempt phase, owned RAF/timers/listeners/audio, CSS/backing sizes/DPR, asset loaded/decoded/errors, queue latency, sim/render p50/p95/max. No PII/token/seed secrets or visible production HUD. Existing diagnostics count shared audio sources in both game snapshots: это не доказательство двух separate AudioContexts.

## 14. Audio

**PROPOSAL / NOT YET VERIFIED:** новый creative set, legacy Snake audio не reference. Forest — plucked melody/wood percussion; Caves — crystalline FM/low pulse; Swamp — reed/syncopated bass; three independently composed original themes with compatible transition bars. Crossfade/stem/bar switching заранее prepared buffers, no duplicated slowed song.

Master → Music/SFX, host shared AudioContext facade; не переписывать working Fly mixer в generic engine. Snake-owned sources tracked/disconnected on end/dispose. Unlock from click/touch gesture, pending unlock doesn't consume ranked attempt. Pause music/timers predictably; resume only explicit player action; leave stops every source. Voice cap/priorities for long-body effects. Required families: UI, optional turn accent (not every segment), food, combo, positive/negative, warning/ending, biome arrival, death/result. Separate volumes persisted without leaking game state. Original commissions/generation with provenance, no soundtrack imitation.

## 15. Art / assets / menu

**PROPOSAL / NOT YET VERIFIED:** отдельный `grib/mushroom-snake-next/`; original fantasy cream snake, clear head/eyes/snout, moss/leaves, small red mushrooms **на теле**, tapered pointed tail. New independent production head/body/turn/taper/tail/shadow assets; silhouettes/pivots/alpha bounds validated before integration. One pixel scale/palette/lighting/outline system across three biomes and authored FX.

Legacy/screenshots — visual comparison only: no cropping, segmenting, textures, repackaging. ImageGen только на production art stage при необходимости, не в этом audit. Own source/provenance sheets, low-res runtime exports, corner/alpha fixtures. Music independently composed.

Menu concept/items сохраняются: «Играть / Рейтинг», «Тренировка», «Как играть», «Звук», «Настройки», «Полный экран», «Другая игра», personal/season record. No duplicate game/page backbars. Existing modal `frame → bevel → textured surface → safe-area`, fixed nine-slice corners и 7px bevel — compatibility reference/UI LOCK, не повод redesign. Новый game получает independently created asset set; переиспользование host shell не означает extraction legacy images. Page identity не менять.

## 16. Предлагаемая source tree

**PROPOSAL / NOT YET VERIFIED:** `.js` ES modules + JSDoc initially, не гигантский inline blob.

```text
arcade/snake-next/
  entry.js                 # only public host adapter
  lifecycle.js             # transitions + resource scopes
  simulation/{state,step,body,collision,spawn,effects,score,rules,prng}.js
  simulation/worker-entry.js
  world/{arena,validate,biomes,compositions}.js
  render/{renderer,path,sprites,camera,surfaces,fx}.js
  input/{commands,keyboard,dpad}.js
  ui/{menu,hud,dialogs,settings}.js + snake-next.css
  audio/{adapter,events,music}.js
  ranked/{session,outbox,contract}.js
  assets/{manifest,loader}.js
  diagnostics.js
  tests/{determinism,collision,spawn,lifecycle,render,ranked-mock}/
tools/build_snake_next.cjs
grib/mushroom-snake-next/{character,world,ui,fx,audio}/
```

Public interface minimal: mount/activate/deactivate/best; external intents normalized, no global mutable engine. Worker code same pure sim used by unit/replay tests. Artifact generated, source remains modular. CSS namespace `msn-*`, no broad host overrides.

## 17. Dependencies

**PROPOSAL / NOT YET VERIFIED:** runtime **zero third-party dependencies** initially: Canvas2D, Worker, native Audio through existing mixer, DOM UI. Avoid React/game engine/Pixi/Phaser/WebGL unless measured Canvas2D bottleneck justifies them. No SAB/cross-origin isolation dependency.

**CONFIRMED:** current pipeline concatenates blocks, cannot compile TypeScript itself. Sibling QA has playwright-core `^1.62.0`; not a build dependency. TypeScript acceptable after small reproducible build spike with pinned compiler/bundler and lockfile. Prefer a pinned lightweight build-only bundler if necessary for self-contained main/worker artifacts; exact package/version/documentation approval at implementation stage, no installation now. QA browser versions/dependencies should become repo-owned/pinned later, not silent global tool assumptions.

## 18. Migration / integration

**PROPOSAL / NOT YET VERIFIED:** freeze legacy source/art, keep rollback. Build new standalone entry/gallery/Training first; never funnel legacy through new renderer. Hub adapter registers new Snake only behind TEST feature flag after standalone acceptance; Fly entry untouched. Hide legacy selection only at controlled switch, not delete it. One visible Snake runtime/one active game owner; old global remains inactive for rollback, not competing listeners.

Only proven shared repairs (Escape/focus/loading contract) as separate narrow host commits with both-game regression. Do not move working Fly internals into abstractions. Build selects one Snake artifact explicitly rather than textual replacing old controller. TEST feature flag/new game_id ensure old ranked score/budget cannot mix. Reviewed new backend namespace/migration with non-destructive rollout only after separate authorization. Candidate hash/manifests generated reproducibly; publication is later explicit task, never part of Phase 1.

## 19. Risk register

| Status | Risk | Gate / mitigation |
| --- | --- | --- |
| **CONFIRMED** | Fly Escape resumes paused run | narrow ownership repair + Main/Playing/Paused two-Escape QA |
| **CONFIRMED** | non-idempotent start/sponsor source contracts | reviewed new server contract before ranked |
| **CONFIRMED** | legacy loading flash | new fail-closed critical decode, cold-frame evidence |
| **CONFIRMED** | dual-source/deploy scope | repo canonical build + exact channel staging checks |
| **LIKELY** | Worker transfer cost/input delay at 1200 | pooled buffers/deltas, early spike, instrument round trip |
| **LIKELY** | arena fairness/fun late long-body | topology seeds/replay/property tests + human playtest; victory policy review |
| **LIKELY** | art/audio dominate startup/memory | critical groups, atlas/downsample budgets, scoped cache |
| **LIKELY** | CSS/focus/z-index interference | namespaced new styles, host contract fixtures, no blanket CSS cleanup |
| **NOT YET VERIFIED** | real browser compositor/visibility issue | physical device/headed stress, backing/compositor evidence |
| **NOT YET VERIFIED** | live auth/backend scoring/reconnect | dedicated authorized test account/server fixtures, never real attempts |
| **NOT YET VERIFIED** | long-soak memory drift | 60-minute target + repeated open/close; resource ownership assertions |

## 20. Performance / QA acceptance

**PROPOSAL / NOT YET VERIFIED — budgets to validate, not current measurements:** 60 FPS, ordinary desktop sim p95 ≤1ms, render p95 ≤6ms; CPU×4 main frame p95 ≤12ms for 1200/body/max effects, no intentional blocking asset/generation task >16.7ms. Record p50/p95/max separately for sim/render and long tasks, don't hide OS/GC spikes in averages. Fixed clock/replay identical across render FPS/viewport/DPR/throttle. Input enqueue ≤one tick, measured command→accepted-turn with cell-boundary wait separated from queue latency.

- 8/100/250/500/1200 + near-full arena; straight/90°/U/S/reversal/growth/self collision, every orientation/DPR/quality. Head/body/tail/shadow share path; no gap/double silhouette.
- Food reachable/non-overlap, special schedule never stalls permanently or catch-up bursts; deterministic seed hashes after pause/restart/replay; safe placement at fastest speed.
- Three chapters + full cycles, stable decor, no seam/pop/flicker/false colliders; next surfaces prepared before transition, bounded memory.
- Cold loading shows designed state only; first Main fully decoded; eager unchosen game production preload 0 (Hub thumbnail explicit exception); warm duplicate critical requests 0; retry failures explicit.
- Full QA sizes: desktop 1366×768,1920×1080,2560×1440; portrait 360×800,390×844,430×932; landscape 844×390,915×412. Native/pseudo fullscreen, orientation, resize, D-pad, safe areas, modal reopen, Result/restart/Hub.
- After settled leave: owned RAF/timers/listeners/Worker/audio sources 0; cache allowed bounded retention. Audio scope must not confuse shared context/source counts.
- Page JS exceptions/game asset failures/404 =0 in normal flows. Expected anonymous401/TikTok warnings reported separately; app accessibility warnings are not suppressed.
- 60-minute continuous Training soak, 100 switching cycles, background/foreground/lock-screen/device rotation; no memory trend after GC and bounded cache warmup. Physical Android Chrome/iOS Safari needed; mobile emulation is not proof of real fullscreen/audio policies.
- Ranked mocks: timeout after server commit, duplicated start/sponsor/finish, reconnect/crash/outbox, reservation cancel/expiry; exactly-once effect, no loading debit. Authorized live fixtures only later.

## 21. Exact implementation sequence / gates

**PROPOSAL / NOT YET VERIFIED. Stop after this report until review.**

1. **Phase 2a — foundation spike:** isolated entry/build/Worker feasibility, deterministic PRNG/rules, input queue, fixed tick, validated arena. Tests/replay before production art. Gate: same hash across FPS/CPU×4, no DOM dependency, ≤1200 budget.
2. **Phase 2b — classic playable Training:** collision/growth/single food/score/difficulty; minimal development art clearly DEV-only. Gate: safe spawns, reversal/long-body/near-fill rules, first-10-second feel review.
3. **Phase 2c — unified renderer:** continuous path/head/body/taper/tail/shadow, full-frame reset, camera/DPR/resize. Gate: geometry matrix and compositor screenshots; no split state.
4. **Phase 3a — art/audio:** independent character + Forest production vertical slice, Main/loading/UI LOCK-compatible shell. Gate: asset visual identity/alpha/pivot/readability, cold decode gate, no stale promises/audio leaks.
5. **Phase 3b — three biome chapters:** Caves/Swamp/compositions/transitions/new original tracks. Gate: no collider changes, full cycles with 1200 and CPU×4.
6. **Phase 3c — effects/juice:** five positive/three negative + coherent HUD/audio/VFX, stacking/pause/cleanup. Gate: rules-version determinism, no control removal/no unavoidable pickups.
7. **Parallel prerequisite, not runtime refactor:** separately authorized host Escape/focus repair, exact channel build protection; verify unchanged Fly flows. Must pass before Hub integration. No speculative Fly rewrite.
8. **Phase 4a — host Training integration:** feature-flag registration and single navigation/lifecycle owner, no legacy code reuse. Gate: switching/fullscreen/mobile/soak/diagnostic counters; Fly regression.
9. **Phase 4b — ranked:** only after reviewed/authorized server contract. Implement reserve/reconcile/outbox + mock fault matrix, then dedicated account live tests. Gate: independent game budgets/season/replay/idempotency; no real-user attempts.
10. **Phase 5 — candidate/release review:** reproducible exact artifact, isolated TEST manifest, local/full QA, explicit TEST publication authorization, public post-deploy QA, rollback rehearsal. Production remains a separate approval.

Не добавлять portals foundation. Если позднее полезны — отдельный explicit FSM idle→offered→entering→transition→active→exiting→recovery→idle с timeout and authoritative recovery; не implicit teleport внутри body path.

## 22. Files modified / proposed

**CONFIRMED — this pass:** этот report, durable legacy-freeze clarification в `AGENTS.md`, четыре browser-only QA fixture scripts в `tools/qa/`. Никаких application code/assets/manifests/DB edits. Screenshots local/untracked, не release inputs.

**PROPOSAL / NOT YET VERIFIED — later:** create tree из §16, build/test/gallery fixtures, independent art family. Narrow modify `tools/build_tilda_test.ps1` for explicit new artifact selection, Hub registry adapter and only proven shared ownership/focus sections in `05A…`/`08…` after review. Не менять working Fly gameplay/controller целиком. Не править immutable releases, Production manifest, old score tables, legacy Snake sources. SQL changes belong to separately reviewed backend workspace; filenames/contracts пока не утверждены.

## 23. Branch / checkpoint / commit

**CONFIRMED:** starting branch `mushroom-snake-visual-reset`, HEAD `dc9124c27f4c907a55e8edd05523b548b3912f8a`. Unfinished previous-task legacy work сохранён **до нового audit** commit `a337002` (`checkpoint: preserve unfinished legacy Snake stability work`, 6 files). Это WIP checkpoint, не release-approved fix.

Audit branch: **`mushroom-snake-rebuild`**, based on `a337002`. Phase-1 report/QA/doc changes commit separately; точный hash указан в handoff, не self-referential в документе. No push/build/deploy. Unrelated `.serena/`, `.playwright-cli/`, восемь старых candidate release directories и `web/rytni-email-lock-center-v1.webp` сохранены и не staged.

Tools: Serena targeted symbols/patterns (JS работает; HTML symbol overview unsupported active TypeScript LSP, narrow searches/ranges fallback); local git/PowerShell; Playwright CLI; Repomix **structure only** 50 files /969 tokens, exclude releases/assets; Context7 для Repomix CLI flags. No ImageGen/dependency installation/new runtime packages/subagents.

## 24. Screenshots / measurements / boundaries

**CONFIRMED — browser measurements:**

| Metric | Observed |
| --- | --- |
| Fly stage / canvas CSS / backing DPR1 | 802.234375×451.25 /798.234375×447.25 /798×447 |
| Snake stage / canvas CSS / backing DPR1 | 1118×628.875 /1070×580.875 /1070×581 |
| Stage Main/Rules/Settings, desktop resize | dimensions stable in inspected flows; Y changes from popup scrolling, not demonstrated layout shift |
| Stable Main 1s backing resize counters | Fly 9→9, Snake 7→7; no repeated backing reset observed |
| Mobile Snake844×390 /915×412 | fullscreen/play/D-pad; canvas CSS808×354 /879×376, DPR1.5 |
| Ready portrait prompt360/390/430 | panel client286×542 /316×504 /356×507; internal scrollOverflow0; hero loaded |
| Fly cold preload start→all ready | 662.7ms, 35 new image requests, 42 decoded (7 reused) |
| Fly first activation→visual-ready marker | 926.1ms; click→marker ≈964.9ms (click precedes activation) |
| Fly warm reopen | 45.8ms CLI-sampled; new preload requests0, diagnostic duplicate0 |
| Settled Hub lifecycle | both games RAF0/timers0/audioSources0 after cycles/stress/mobile |
| JS exceptions / failed game assets / game404 | 0 /0 /0 in completed audit/stress/mobile/supplement fixtures |

Cold script's `visible=5220.9ms` includes `qaReady()` geometry/bonus warmup and polling; **не** точный first-visible timestamp. Resource entries include versioned/unversioned same icon URLs; diagnostic duplicates0 относится только preload loop, не всей network дедупликации. No broad «all assets request once» claim.

**CONFIRMED — limited smoke samples, НЕ isolated sim/render benchmark:**

| Game / throttle | sampled whole-frame CPU p50 /p95 /max (ms) | Samples |
| --- | --- | --- |
| Fly desktop | 0.529 /0.633 /0.633 |25 rolling-stat samples|
| Fly CPU×4 | 0.481 /4.669 /4.669 |12 rolling-stat samples|
| Legacy Snake desktop | 0.300 /1.100 /1.300 |25 frame samples|
| Legacy Snake CPU×4 | 1.300 /4.500 /4.500 |12 frame samples|

Fly metrics rolling/warmup: нельзя сравнивать p50 CPU×4 как ускорение. Long-body1200 benchmark/input latency/heap soak отдельными доказательствами этого audit не обеспечены. Новый Snake ещё не существует.

**CONFIRMED — compositor inspection:** game canvas/stage ancestors transform:none, filter:none, opacity1, will-change:auto, contain:none; progression tab has identity matrix transform. No per-second backing change in stable Main. Five canvases on page, not established stale duplicate game canvas. 50 public stress screenshots (25 Fly+25 Snake), embedded→fullscreen→exit/1920resize, reviewed as contact sheet plus representative full-resolution frames. Corrupted/partially repainted rectangles **не воспроизвелись**. Некоторые Fly captures попали на natural death/restart; это не corrupted frame. **NOT YET VERIFIED:** original corruption cause on affected browser/device; previous local leaked-clip evidence (§5) объясняет конкретный portal repaint defect, не любой screenshot bug.

Local screenshot folder: `C:\GitHub\rytni-assets\.playwright-cli\foundation-audit\`:

- `fly-main-desktop.png`, `fly-main-1920.png`, `fly-main-2560.png`, `fly-rules.png`, `fly-settings.png`, `fly-playing.png`, `fly-result.png`.
- `snake-main-desktop.png`, `snake-playing-desktop.png`, `snake-result.png`, `snake-mobile-landscape.png`, `snake-landscape-844.png`, `snake-landscape-915.png`.
- **Loading failure evidence:** `snake-portrait-360.png`, `snake-portrait-390.png`, `snake-portrait-430.png` captured state loading. These are NOT ready prompt PASS screenshots.
- **Ready prompt:** `snake-portrait-ready-360.png`, `snake-portrait-ready-390.png`, `snake-portrait-ready-430.png`; visually checked all three sizes with ready enter gate and loaded hero. `fly-portrait-prompt.png`, `fly-mobile-landscape.png`.
- `fly-paused-fullscreen-before-escape.png` /`fly-paused-fullscreen-after-escape.png`; equivalent `snake-*`.
- `stress-01-fly.png`…`stress-25-fly.png`, `stress-26-snake.png`…`stress-50-snake.png`, `stress-sheet.png`.

Production screenshots: `C:\Users\rytni\AppData\Local\Temp\rytni-foundation-phase1-20261001\production-{1366,1920,2560,360,390,430}.png`; inspected public page responsive widths, horizontal overflow0. No authenticated room/game tests possible there because deployed release has no games.

Console exceptions0 не означает raw console clean: anonymous Supabase401/auth health, TikTok postMessage warnings, deliberately aborted `record_giveaway_funnel_event` ожидаемы в fixture и перечислены отдельно. Реальный app warning — retained-focus/aria-hidden (§3), не игнорируется. Test favicon/mirror race cancellation не game404.

### Reproduce safely

From repo root, installed Playwright CLI/Edge; output directory `.playwright-cli/foundation-audit` must exist. In fresh anonymous contexts, no auth state import:

```powershell
playwright-cli -s=foundationtest open https://rytni.live/testpodari --browser=msedge
playwright-cli -s=foundationtest run-code --filename=tools/qa/arcade-foundation-audit.js
playwright-cli -s=foundationtest run-code --filename=tools/qa/arcade-foundation-stress.js
playwright-cli -s=foundationtest run-code --filename=tools/qa/arcade-foundation-supplement.js
playwright-cli -s=foundationmobile open https://rytni.live/testpodari --browser=msedge --mobile
playwright-cli -s=foundationmobile run-code --filename=tools/qa/arcade-foundation-mobile.js
playwright-cli -s=foundationmobile run-code --filename=tools/qa/arcade-foundation-supplement.js
```

Fixtures block non-read RPCs and use built-in preview, not real ranked accounts. Supplemental tab-background probe is **inconclusive headless** when no visibility events occur; do not mark it PASS. A harness timeout clicking covered fullscreen toolbar while Pause modal was open was corrected by entering fullscreen before Pause; not treated as UI bug. Mobile harness originally waited wrong state `main` instead of actual `menu`; corrected in supplemental fixture, not application code.

Review decisions before implementation: B arena/finite victory vs endless travel; Worker/build spike; new ranked reservation/recovery/server validation contract; original art/audio production scope. **Phase 1 ends here.**

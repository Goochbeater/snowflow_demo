# Hogwarts · Legacy of Magic (mobile)

An open-world wizarding-school game in the browser (three.js r160, WebGL 2), rebuilt from the uploaded release as a
source tree, with touch controls for phones and the Quidditch career from `../quidditch` played inside the castle's
own matches. Tuned for a Galaxy Z Fold 4 (cover 882 × 344, inner 1104 × 882 CSS px) and a Pixel 9a (923 × 411),
held sideways.

## Play

`node build.mjs web out/` writes `out/index.html` plus `out/a/` (the textures, meshes and sounds, streamed as the
game boots). Serve the folder over HTTPS and open it in Chrome or Samsung Internet in landscape.

`node build.mjs` writes a single self-contained `dist/hogwarts.html` (~80 MB, everything embedded) for desktop use.

URL switches: `?touch=1` / `?touch=0` force the touch layer on or off; `?gfx=auto|high|medium|low` picks the graphics
tier (also in the pause menu); `?dpr=0.6` fixes the render scale.

## Source

| Path | What |
| --- | --- |
| `src/shell.html` | the page; `<!--@SCRIPTS-->` is where the scripts go |
| `src/vendor/three.r160.js` | three.js |
| `src/js/*.js` | the game, concatenated in file-name order |
| `src/data/*.json` | Quidditch rig, mesh and physics tables |
| `assets/` | binary assets by id (`manifest.json` holds their types) |
| `tools/extract.mjs` | splits a release HTML back into this tree |

The modules added for this version:

- `p00b_assets.js` — one asset store for both builds (embedded blocks, or packed files fetched with progress)
- `p91_boot.js` — the loading screen counts the download before the castle builds
- `p92_touch.js` — touch controls: floating stick, look-drag, context buttons for on foot / broom / Quidditch / menus,
  spell arc with cooldowns, aim assist, auto-run, on-screen hints rewritten for touch, map pinch, pause-menu settings
- `p93_mobile.js` — HUD and every screen laid out for short landscape screens
- `p94_perf.js` — AUTO / HIGH / MEDIUM / LOW graphics with a pixel budget, dynamic resolution and texture caps
- `p96a`–`p96j` — the Quidditch career: teams, clubs and nations; the career save, calendar and sim; story scenes
  staged in the real castle (Great Hall, common rooms, classrooms, Hogsmeade, the lake); the career screens; the
  bridge to the castle's match engine; the walkable pre-match huddle; the press conference
- `p97_polish.js`, `p98_round3.js`, `p99_round4.js` — fixes from the outside reviews (cameras, sets, HUD, World Cup,
  crests, results); on touch, the spell wheel (out of a fight the four spells, the set swap and Lumos fold into SPELLS)
- `p99b_touch_layout.js` — PAUSE → CONTROLS → CUSTOMISE: drag and size every button per mode, set the layer's opacity
- `p99c_touch_aim.js` — tap a foe to swing the view onto them; CAST with nobody under the reticle turns to the nearest
- `p99d_declutter.js` — the phone HUD pared to what you act on: stats when they change, contextual Wiggenweld, the
  errand as the journal's door, tabbed pause, slim duel bar, short match status line, trimmed pack and map
- `p99e_touch_tests.js` — with `?test&touch=1`, regression tests for the touch layer after the main run
- `p99f_career.js` — the career between events: its screens' own music and room tone (the scene loop never ran the
  sound, so the match's crowd and theme played on under the hub), FREE TIME (walk the castle or the stadium as your
  player, talk to team-mates, practise, fly the rings, find galleons for your purse), the hub's shot solved for each
  screen (you in the open gap between the panels, clear of the room's furniture, re-aimed when the Fold opens or
  closes), and what comes next under the event card

## Credits

A fan-made tribute. Not affiliated with or endorsed by Warner Bros. or J.K. Rowling.
Original game build: createwithmark. Models and animation: Quaternius (CC0). Textures: Poly Haven (CC0).
Castle layout follows the Hogwarts Legacy castle map (reference: game-maps.com).

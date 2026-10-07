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

## Credits

A fan-made tribute. Not affiliated with or endorsed by Warner Bros. or J.K. Rowling.
Original game build: createwithmark. Models and animation: Quaternius (CC0). Textures: Poly Haven (CC0).
Castle layout follows the Hogwarts Legacy castle map (reference: game-maps.com).

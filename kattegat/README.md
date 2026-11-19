# Kattegat — The Fleet Comes Home

A self-contained Three.js simulation of a Viking-age fjord settlement on the evening its raiding fleet returns.

Open `dist/kattegat.html` in a modern browser — no server, assets or network needed (three.js is inlined).
URL params: `?seed=1234&t=430&sun=0.66&era=3`.

Rebuild: `npm install && node build.mjs --min`

Source in `src/`: `sim.js` (agents, utility AI, rumor spread, ships, loot, pyre), `graph.js` (walk-graph + A*),
`layout.js` (procedural settlement), `terrain.js`, `env.js` (terrain/water/sky/light), `buildings.js`, `ships.js`,
`crowd.js` (instanced crowd LOD, poses, items, animals), `fx.js` (GPU smoke/embers/flames/birds/snow), `trees.js`, `ui.js`, `main.js`.

## Villagers, animals and first person

- Characters come from two CC0 modular character packs (men / women) and CC0 farm-animal and nature packs.
  The offline tools turn them into compact embedded assets:
  `node tools/build-people.mjs <men.fbx> <women.fbx>` -> `src/assets/people.bin` (rig, clips, parts)
  `node tools/build-animals.mjs <OBJ dir>` -> `src/assets/animals.json`, `node tools/build-props.mjs <OBJ dir>` -> `src/assets/props.json`
- `src/people.js`: rig decode, ~27 authored clips layered on the source animations, baked bone-matrix texture,
  procedural Norse garments, GPU-skinned instancing with 3 LODs. `src/villagers.js` maps every agent's
  role/action to an outfit, palette, clip and held item. `dist/people.html` (build with
  `node build.mjs --entry=src/peopletest.js --out=people.html`) is an inspection lineup of outfits and clips.
- `src/fauna.js`: livestock, dogs, cats, poultry, ducks, ravens. `src/flora.js`: village trees and undergrowth.
- `src/fp.js`: first-person walking (F, or the walking-figure button).

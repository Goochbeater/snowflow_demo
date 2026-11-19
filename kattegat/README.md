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

## Materials, ground and animation

- `src/texgen.js`: sixteen tileable materials (meadow, earth, mud, sand, granite, forest floor, snow, gravel,
  planks, wattle-and-daub, turf, shingle, flagstone, tar, crop, thatch) are generated on the GPU at load into
  albedo+roughness and normal+height texture arrays (`node build.mjs --entry=src/textest.js --out=tex.html`
  renders a swatch board; `?only=sand,rock&rep=1`).
- `src/terrainmat.js`: the terrain blends those layers per pixel from vertex weights and a painted control map
  (roads, yards, pens, field strips, stream bed), with height-aware transitions, tri-planar granite on cliffs,
  two-scale anti-tiling, landscape-scale meadow variation and a wet shore. Each material is calibrated to a
  target reflectance so everything sits right under the same light. Buildings and hulls use the same library.
- `src/grassfield.js`: two rings of GPU grass clumps anchored to the world around the camera; each clump finds
  its height on the exact terrain triangles, its density from the ground materials and its colour from the
  meadow beneath it. Blades bend in the wind and part around you in first person. `?grass=lo|0`.
- Villagers are smooth-shaded, interpolate between baked frames, match their stride to their ground speed,
  step when turning on the spot, bank into turns, and turn their heads toward whoever is speaking, the person
  they are with, or you as you walk past. Standing about, they cycle through a repertoire of stances that
  suits them (arms folded, hands on hips, hands behind the back, weight shifts, warming hands, chatting).

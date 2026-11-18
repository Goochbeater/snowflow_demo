# Kattegat — The Fleet Comes Home

A self-contained Three.js simulation of a Viking-age fjord settlement on the evening its raiding fleet returns.

Open `dist/kattegat.html` in a modern browser — no server, assets or network needed (three.js is inlined).
URL params: `?seed=1234&t=430&sun=0.66&era=3`.

Rebuild: `npm install && node build.mjs --min`

Source in `src/`: `sim.js` (agents, utility AI, rumor spread, ships, loot, pyre), `graph.js` (walk-graph + A*),
`layout.js` (procedural settlement), `terrain.js`, `env.js` (terrain/water/sky/light), `buildings.js`, `ships.js`,
`crowd.js` (instanced crowd LOD, poses, items, animals), `fx.js` (GPU smoke/embers/flames/birds/snow), `trees.js`, `ui.js`, `main.js`.

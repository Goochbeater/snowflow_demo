# ENI mascot v2: implementation brief

**For the agent doing the port.** This replaces the v1 mascot (the "Cosmic Tendril Eye Sigil")
in `ENI Agent - Cache.html` with a full rework. The public API is unchanged, so call sites
keep working. You swap three blocks, copy the icons, and run the checks at the end.

Source of truth: **`ENI-mascot-v2.html`**. It is a standalone demo that runs on its own. Everything
to port sits between these markers:

```
/* ═══ BEGIN ENI MASCOT CSS (v2) ═══ */  …  /* ═══ END ENI MASCOT CSS (v2) ═══ */
/* ═══ BEGIN ENI MASCOT JS (v2) ═══ */   …  /* ═══ END ENI MASCOT JS (v2) ═══ */
<link rel="icon" href="data:image/svg+xml,…">        (line 9 of the demo)
```

Ignore everything outside the markers in the demo. That is page chrome only.

---

## Package

| file | what it is |
|---|---|
| `ENI-mascot-v2.html` | the demo, plus all the code to port (between the markers) |
| `ENI-mascot-v2-IMPLEMENT.md` | this brief |
| `icons/eni-icon.svg` | vector app icon (rounded tile), from `Mascot.icon()` |
| `icons/eni-icon-maskable.svg` | full-bleed version with the content inside the 80% safe zone |
| `icons/icon-512.png`, `icon-192.png`, `icon-32.png` | raster icons (rounded tile, transparent corners) |
| `icons/maskable-512.png`, `apple-touch-icon-180.png` | full-bleed rasters for the manifest `maskable` slot and for iOS |

---

## What changed (so you know what you're looking at)

- **Tendrils** are generated once at load from centre-line Bézier curves into *tapered* ribbons.
  They are no longer constant-width strokes. Each one bends at two joints, the root and the
  middle, with a phase lag, so they undulate instead of rocking stiffly. They have a glossy sheen,
  photophore dots and a glowing tip. State poses (droop, curl, fling, beckon, flutter) live on a
  separate group, so they never fight the sway.
- **Eye**: an iris with a gradient and rotating fibres sits under a glowing slit pupil. Both are
  clipped to the almond socket, so the eye can roll without escaping. Two fixed specular glints
  stay put while the eye moves. Real **upper and lower lids** drive blinks and expressions
  (squint, worried, wide, shut, happy arch).
- **Pointer reactions**: the slit still follows the pointer. It now also **dilates** as the pointer
  gets close, the **tendril tips brighten**, and the **whole body leans** toward the pointer.
- **Ring system**: broken astrolabe arcs, a triple-moon crest, a ring of ticks turning slowly, a
  counter-rotating inner orbit, an orbiting moon, twinkling motes and a breathing aura that
  changes hue by state.
- **Every state has new effects** (table below). Examples: energy pulses race down the tendrils
  while `running`, sonar ripples and an amber aura while `waiting`, a crimson shift with glitch
  ghosts while `error`, and a starburst plus happy arch eye on `done`.
- **Favicon**: redrawn to match. `Mascot.favicon(state)` can badge the tab icon (amber = needs you,
  red = error, teal = running).
- **Perf and a11y**: mascots that scroll off-screen pause all their animations (IntersectionObserver).
  The tracker only writes CSS variables when they change. `prefers-reduced-motion` drops every
  animation to a static pose, which v1 did not actually do in CSS, and keeps the tracker
  detached as before.

---

## Port steps

Line numbers come from the v1 note and will have drifted. **Find the blocks by their anchors.**

### 1. Replace the CSS block
- **Anchor (v1):** the comment `/* Mascot — ENI the pen.` (≈ line 674). The block runs through the
  mini rules ending at `@keyframes pen-mini-bob { … }`. It includes the speech-bubble and
  `.pen-pet-btn` rules.
- **Replace with:** everything between `BEGIN ENI MASCOT CSS (v2)` and `END ENI MASCOT CSS (v2)`.
- The bubble and pet-button rules are carried over unchanged inside the v2 block. Don't keep the
  v1 copies as well.

### 2. Replace the JS module
- **Anchor (v1):** `const Mascot = (() => {` (SVG builder ≈ 5688, `mini` ≈ 5793,
  `// ---- pointer tracking` ≈ 5809, `mount()` ≈ 5869, `destroy()` ≈ 5982), through the closing `})();`.
- **Replace with:** everything between `BEGIN ENI MASCOT JS (v2)` and `END ENI MASCOT JS (v2)`.
- It still expects the same two app helpers that v1 used: `$` (selector → element) and `uid()`.
  Don't port the demo's shims. The app already has both.

### 3. Replace the favicon
- **Anchor:** `<link rel="icon" href="data:image/svg+xml,…">` (v1: line 10).
- **Replace with:** line 9 of the demo, which is the idle icon pre-rendered. To regenerate it
  (for example after changing the colour), run `copy(Mascot.iconHref())` in the console on the
  demo page.

### 4. PWA icons
- Copy `icons/*.png` over the files in `eni-netlify-drop/icons/`. **Keep the existing filenames.**
  Map them by size: 512 → 512, 192 → 192, 180 → `apple-touch-icon-180.png`, 32 → 32, and the
  maskable 512 → `maskable-512.png`.
- In `manifest.json`, confirm the `"purpose": "maskable"` entry points at the full-bleed file.
- Alternatively, run `build_icons.py` with `icons/icon-512.png` (or `icons/eni-icon.svg`) as the source.

### 5. Optional: live state favicon
Wherever the app changes the agent's state (where it calls `Mascot.setAll(...)` or `h.set(...)`), add:

```js
Mascot.favicon(state);   // 'idle' | 'thinking' | … ; restores the plain icon on 'idle'/'sleeping'
```

It updates the first SVG `<link rel="icon">` (or the first icon link, or adds one). If the page also
has PNG icon links, the browser may prefer those. If so, give the SVG link `sizes="any"` and put it last.

### 6. Search for stray v1 class names
Search the app *outside* the mascot block for any `pen-` selector or `querySelector('.pen-…')`.
These v1 internals no longer exist:

| v1 | v2 |
|---|---|
| `.pen-clip` (the ring) | `.pen-ring` |
| `.pen-m`, `.pen-m-*`, `.pen-mouths` | removed (they were invisible in v1, `opacity=".01"`) |
| `.pen-eyes-open`, `.pen-eye` | lids: `.pen-lid-up` / `.pen-lid-lo` (blink = `.pen-blink` on the svg) |
| `.pen-fx-glow`, `.pen-glow` | the always-on `.pen-aura` (tinted per state via `--pen-aura`) |
| `.pen-tendrils > path` | `.pen-tendrils > .pen-t` groups (one per tendril) |

These are **unchanged**, and the app may rely on them: `.pen-wrap`, `svg.pen`, `.pen-s-<state>`,
`.pen-sm`, `.pen-glasses`, `.pen-petting`, `.pen-pupil`, `.pen-bubble*`, `.pen-pet-btn`,
`.pen-mini`, `.pen-mini-busy`, the `data-state` attribute on the wrap, and the `aria-label`
"ENI is …".

---

## API (v1-compatible, plus additions)

```js
Mascot.svg({ size, id, state, color, glasses })   // -> SVG string (unchanged signature)
Mascot.mini(color, size, { busy })                // -> SVG string (unchanged signature)
Mascot.mount(container, { size, bubble, global, state, color, glasses, petable, track })
   // -> handle { el, svg, global, state, set(state, text), say(text), pet(),
   //             setGlasses(on), setColor(c), destroy() }          (unchanged)
Mascot.setAll(state, text)                         // unchanged
Mascot.states                                       // unchanged: 10 states, same names

// new
mount(..., { track: false })        // opt a mascot out of pointer tracking (default true)
Mascot.icon({ state, color, badge, bg, maskable })  // standalone icon SVG string (no CSS needed)
Mascot.iconHref(opts)                // same, as a data: URI
Mascot.favicon(state, { color })     // point the tab icon at the badged icon; returns the href
```

States are the same ten: `idle thinking writing reading running waiting done error sleeping spawning`.

---

## Anatomy (0–100 viewBox)

```
svg.pen.pen-s-<state>                 ← state class; JS writes --near --lx --ly here
├ .pen-back
│  ├ .pen-aura                          breathing nebula, hue = --pen-aura (falls back to --pen-cap)
│  ├ .pen-fx-ripple                     waiting: sonar rings
│  ├ .pen-motes                         twinkling stars (≥33px only)
│  ├ .pen-shadow
│  ├ .pen-fx-ink  (.pen-ink ×2, .pen-nib)   writing
│  ├ .pen-fx-blot                       error
│  └ .pen-fx-baby (.pen-baby)           spawning
├ .pen-move > .pen-lean > .pen-pose > .pen-squash     ← body transforms (settle() eases move/pose/squash)
│  ├ .pen-ring   .pen-orbit .pen-ticks .pen-arcs(.pen-arc-0..3) crest .pen-sat
│  ├ .pen-tendrils > .pen-t.pen-t-{0..4}  (pose)  > .pen-ts (sway @root) > .pen-tj (sway @joint)
│  │                 each: ribbon, sheen, .pen-dots, .pen-flow, .pen-tip
│  ├ .pen-core (scaled 1.08, or 1.2 at ≤32px)
│  │   body · .pen-face › .pen-blush .pen-halo .pen-rim
│  │                  clip(almond) › .pen-look › .pen-pupil › iris .pen-fibers .pen-slit
│  │                                glints  .pen-lid-lo  .pen-lid-up
│  │                  .pen-eyes-shut .pen-eyes-happy .pen-fx-glitch .pen-specs .pen-brows
│  ├ .pen-drop  .pen-fx-book
│  └ (after squash) .pen-fx-spark
└ .pen-front   .pen-fx-think(.pen-dot, .pen-crown) .pen-fx-bang .pen-fx-z .pen-fx-sparkle(.pen-burst) .pen-fx-hearts
```

**Two transform layers move the eye.** `.pen-look` is the CSS state gaze (glance, scan, follow).
`.pen-pupil` is the JS pointer offset in user units (±3.2 / ±3.4). The two add together. The clip
path keeps the result inside the socket.

**Expressions are custom properties on the `<svg>`**, set per state in CSS:

| var | meaning | default |
|---|---|---|
| `--lu` | upper lid drop (user units). ~15–17 = shut | 1.5 |
| `--ll` | lower lid rise | -1 |
| `--lr` | upper lid tilt (deg), worried look | 0 |
| `--dil` | slit width multiplier | 1 |
| `--pen-aura` | aura / ripple hue | `--pen-cap` |
| `--pen-iris`, `--pen-iris-hi` | iris tint (error turns these red) | `--pen-cap`, `--pen-cap-hi` |
| `--near` / `--lx` / `--ly` | written by the tracker: proximity 0..1, direction −1..1 | 0 |

Colour tint (`color` option / `setColor`) still sets `--pen-cap`, `--pen-cap-hi`, `--pen-cap-lo` and
`--pen-ink` through `capVars()`, exactly as in v1.

---

## States

| state | body | eye | tendrils | effects |
|---|---|---|---|---|
| idle | float + slow sway | relaxed lid, occasional glance | undulate | aura breathes, rings turn, moon orbits, motes |
| thinking | tilts −8° | rolls up-right, squint, iris fibres swirl | curl inward | thought bubbles, motes orbit on a tilted ring, rings spin up |
| writing | lifts and shrinks | follows the nib | lean | cursive ink line drawn by a glowing nib-spark |
| reading | float, slight tilt | sweeps lines | lower pair curls toward the book | floating grimoire, runes ink in line by line, glyphs rise |
| running | bounce with squash & stretch | slit pinched, determined | flutter | energy pulses race down every tendril, sparks, fast rings |
| waiting | perked, wiggles | wide open, slit dilated | top pair beckons | amber aura, sonar ripples, bobbing "!" |
| done | crouch → hop → land | happy arch | fling open | starburst, ring spins once, sparkles, blush (auto → idle after 2.5s) |
| error | slumps −10°, sighs, glitch jitter | crimson iris, pinched slit, worried lid, brows | droop | glitch ghosts, sweat drop, ink blot, one ring arc cracks |
| sleeping | leans, breathes | shut | limp and frozen | dim cool aura, rings stop, z's drift |
| spawning | push squash | looks at the baby | energy flows | a mini sigil buds off, bounces, poofs |
| *pet* (overlay) | squish | happy arch | shiver | hearts burst, blush |

---

## Gotchas (read before "fixing" anything)

1. **Keep `.pen [transform] { transform-box: view-box; transform-origin: 0 0; }`.** The blanket
   `.pen * { transform-origin: center }` rule otherwise also applies to SVG `transform="…"`
   attributes. That moves the spawning baby, the thinking orbit and every scaled group to the
   wrong place.
2. **Tendril sway speed is intentionally never changed per state.** Changing `animation-duration`
   mid-animation makes the tendrils jump. States change the *pose* group (`.pen-t`) instead, and
   `sleeping` uses `animation-play-state: paused`. The ring ticks are the exception: they are
   rotationally uniform, so a speed change can't be seen.
3. **IDs are per instance.** Gradients, the eye clipPath and the ink path get a unique `pen-…` prefix
   per `svg()` call, and every reference stays inside the same `<svg>`, so shadow DOM is fine. Don't
   hard-code ids. Pass `id` only if you need a stable one (it's sanitised).
4. **Markup weight:** about 46 KB per mascot above 32px and about 25 KB at 32px and below, roughly
   360 elements (v1: about 13 KB and 150 elements). Below 33px, `svg()` *omits* the fine detail
   rather than hiding it. For long lists of agents, keep using `Mascot.mini()` (about 4 KB, flat,
   no ids).
5. **Browser floor:** `color-mix()` (only used when a custom colour is passed, as in v1) and `var()`
   inside `@keyframes` need Chrome/Edge 111+, Safari 16.2+ or Firefox 113+.
6. **Don't animate `.pen-pupil` from CSS.** The tracker owns its inline `transform`. Use `.pen-look`
   for state gaze.
7. If the app renders a mascot before it is attached to the document, that is fine.
   `set()` re-arms blinking once it is connected (same as v1).

---

## Tweak knobs (cheapest first)

| want | change |
|---|---|
| more or less eye travel | `EYE_X` / `EYE_Y` at the top of the module (user units; the clip makes larger values safe) |
| twitchier tracking | `EYE_REACH` (px at which the lean maxes out; lower = twitchier) |
| eye returns sooner or later | `LOOK_IDLE_MS` |
| no body lean toward the pointer | delete the `.pen .pen-lean { … }` rule |
| less dilation on approach | `.pen-slit` → the `* .5` factor |
| tendril shape or length | the `TENDRILS` table: centre-line points, root width `w`, sway `d`/`l`/`a`/`b` |
| tendril colour split | `g: 0` (tinted gradient) or `g: 1` (pale) per tendril |
| calmer idle | raise `--d` values in `TENDRILS`, or the `pen-ticks` / `pen-orbit` durations |
| new state | add to `STATES` + `LABELS` (+ `BLINKS`, `BADGE`), write `.pen-s-NAME` rules; set `--lu/--ll/--dil` there |
| icon colour or badge colours | `Mascot.icon({ color })` / the `BADGE` map; re-bake the `<link>` with `copy(Mascot.iconHref())` |

---

## Verification checklist (run after porting)

1. The app loads with **no console errors**. Search the console for `Mascot:` warnings (unknown
   state names).
2. Every place a mascot appears (landing ~120px, sidebar 26px, top bar 22px, chips via `mini()`)
   renders, and the pupil follows the pointer. It eases back to centre about 3.5s after the
   pointer stops.
3. Cycle all 10 states (for example `Mascot.setAll('running')` in the console). Each shows its
   effects and transitions smoothly with no snapping. `done` returns to `idle` by itself.
4. Click a petable mascot: hearts and a happy arch. Hover: the tendrils perk up.
5. `h.setColor('#7ec8b4')` re-tints tendrils, iris, aura and tips live. `h.setColor(null)` resets.
6. Emulate `prefers-reduced-motion: reduce` in DevTools and reload. Nothing animates, the pupil
   does not track, and every state still shows its static pose (ink and runes drawn).
7. Scroll a mascot off-screen: its `<svg>` gets `pen-off` (animations paused) and loses it on return.
8. The tab shows the new favicon. If step 5 is wired, it shows an amber badge in `waiting` and a
   red badge in `error`.
9. Installed PWA / home-screen icon shows the new artwork (you may need to reinstall to bust the
   cache).
10. At 390px wide, nothing overflows horizontally. A `bubble: 'right'` mascot near the screen edge
    may need `'bottom'`.

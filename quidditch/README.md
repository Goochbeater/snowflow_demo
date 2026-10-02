# Quidditch Skybound

First-person Quidditch for phones, in a single `index.html` (WebGL 2 + three.js r170 from jsDelivr; everything else is generated in code). Tuned for Galaxy Z Fold 4 (both screens) and Pixel 9a.

## Play

Serve `index.html` over HTTPS and open it in Chrome or Samsung Internet in landscape. Fullscreen, screen wake lock and gyro aim only work on a secure origin, so opening the file straight from Downloads will play but without those.

## Edit

Source lives in `src/` (`style.css`, `body.html`, `js/*.js` concatenated in order). Rebuild with:

```
node build.mjs
```

All gameplay tunables are in the `CONFIG` object at the top of `src/js/00-core.js`.

## Credits

First-person hand models: WebXR Input Profiles generic hand (`@webxr-input-profiles/assets`), MIT licence. Everything else is generated in code.

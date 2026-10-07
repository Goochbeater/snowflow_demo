/* ==== p00b_assets.js ==== */
/* ASSETS — one way in to the binary assets, whichever build is running.
   · the single-file build embeds each as base64 in <script type="application/octet-stream" id="…">
   · the web build (build.mjs web) keeps them beside the page: the music as its own files (streamed), the sounds and
     textures in a handful of packs, the rig and mesh buffers whole; window.__HL_ASSETS lists where each one lives.
   ASSETS.get(id) → bytes (sync: embedded, or fetched by ASSETS.load before the boot), ASSETS.url(id) → something an
   <img> or <audio> can load, ASSETS.has / ids / mime. */
const ASSETS = { W: window.__HL_ASSETS || null, buf: {}, url_: {}, pack: {}, loaded: false };
ASSETS.web = !!ASSETS.W;
ASSETS.MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', mp3: 'audio/mpeg', bin: 'application/octet-stream' };
ASSETS.has = (id) => ASSETS.web ? !!ASSETS.W.items[id] : !!document.getElementById(id);
ASSETS.ids = (prefix) => (ASSETS.web ? Object.keys(ASSETS.W.items) : [...document.querySelectorAll('script[type="application/octet-stream"]')].map((e) => e.id)).filter((id) => !prefix || id.startsWith(prefix));
ASSETS.mime = function (id) {
  if (ASSETS.web) { const it = ASSETS.W.items[id]; if (!it) return ''; return it.m || ASSETS.MIME[it.x || (it.f || '').split('.').pop()] || ''; }
  const el = document.getElementById(id); return el ? el.getAttribute('data-m') || '' : '';
};
ASSETS.get = function (id) {
  if (ASSETS.buf[id]) return ASSETS.buf[id];
  let u = null;
  if (ASSETS.web) { const it = ASSETS.W.items[id]; if (!it) return null; if (it.p) { const pk = ASSETS.pack[it.p]; if (!pk) throw new Error('ASSETS: pack ' + it.p + ' not loaded for ' + id); u = new Uint8Array(pk, it.o, it.n); } else u = ASSETS.pack['f:' + id] ? new Uint8Array(ASSETS.pack['f:' + id]) : null; }
  else { const el = document.getElementById(id); if (!el) return null; const bin = atob(el.textContent.trim()); u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); el.textContent = ''; }   // (the base64 is dropped once decoded: it was holding the asset twice)
  if (u) ASSETS.buf[id] = u; return u;
};
/* a whole ArrayBuffer of an asset's own bytes (typed arrays over it start at 0) */
ASSETS.buffer = function (id) { const u = ASSETS.get(id); if (!u) return null; return u.byteOffset === 0 && u.byteLength === u.buffer.byteLength ? u.buffer : u.slice().buffer; };
ASSETS.url = function (id) {
  if (ASSETS.url_[id]) return ASSETS.url_[id];
  let url = null;
  if (ASSETS.web) { const it = ASSETS.W.items[id]; if (!it) return null; if (!it.p) url = ASSETS.W.base + it.f; }
  if (!url) { const u = ASSETS.get(id); if (!u) return null; url = URL.createObjectURL(new Blob([u], { type: ASSETS.mime(id) || 'application/octet-stream' })); if (!ASSETS.web) delete ASSETS.buf[id]; }   // (an embedded image or song lives on in its blob)
  return (ASSETS.url_[id] = url);
};
/* the web build: fetch every pack and the rig / mesh buffers (not the music: that streams) — with progress */
ASSETS.load = async function (progress) {
  if (!ASSETS.web || ASSETS.loaded) return; const W = ASSETS.W, jobs = [];
  for (const k in W.packs) jobs.push({ key: k, url: W.base + W.packs[k].f, n: W.packs[k].n });
  for (const id in W.items) { const it = W.items[id]; if (!it.p && !/^snd_mus_/.test(id)) jobs.push({ key: 'f:' + id, url: W.base + it.f, n: it.n }); }
  const total = jobs.reduce((s, j) => s + j.n, 0); let got = 0; const tick = () => progress && progress(got / total, got, total);
  const fetchOne = async (j, tries) => {
    let mine = 0; const add = (n) => { mine += n; got += n; tick(); };
    try {
      const r = await fetch(j.url); if (!r.ok) throw new Error(r.status + ' ' + j.url);
      if (r.body && r.body.getReader) { const rd = r.body.getReader(), out = new Uint8Array(j.n); let o = 0; for (;;) { const { done, value } = await rd.read(); if (done) break; if (o + value.length > out.length) throw new Error('size ' + j.url); out.set(value, o); o += value.length; add(value.length); } if (o !== j.n) throw new Error('short ' + j.url); ASSETS.pack[j.key] = out.buffer; }
      else { const b = await r.arrayBuffer(); add(b.byteLength); ASSETS.pack[j.key] = b; }
    } catch (e) { got -= mine; if (tries > 0) { await new Promise((res) => setTimeout(res, 800)); return fetchOne(j, tries - 1); } throw e; }
  };
  let i = 0; const lanes = Array.from({ length: 4 }, async () => { while (i < jobs.length) await fetchOne(jobs[i++], 2); });
  await Promise.all(lanes); ASSETS.loaded = true;
};

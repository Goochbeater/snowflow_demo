/* ==== p96a_qc_teams.js ==== */
/* QUIDDITCH CAREER (from Quidditch Skybound) — the teams. The four houses, the thirteen clubs of the British and Irish
   Quidditch League and sixteen nations, as one numbered table (CONFIG.teams: houses 0–3, clubs, nations) the career's
   simulation, tables, newspapers and press run on; each also registered with the castle's engine as a "house" key
   (HL.TEAMS) so that a match can be flown between any two of them: robes, tabards, names and colours on the HUD, the
   stadium's drapes, pennants and crowd re-dressed in the two sides' colours. */
const mulberry32 = mulberry;
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
const CONFIG = { teams: [
  { name: 'Gryffindor', short: 'GRY', c1: '#8a1414', c2: '#d9a82a', ui: '#e0413a', letter: 'G', kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'lion', home: 'Hogwarts', key: 'gryffindor' },
  { name: 'Slytherin', short: 'SLY', c1: '#1b5a33', c2: '#c4c8cc', ui: '#3fae6a', letter: 'S', kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'serpent', home: 'Hogwarts', key: 'slytherin' },
  { name: 'Ravenclaw', short: 'RAV', c1: '#1a2c6b', c2: '#a8763a', ui: '#5b86e6', letter: 'R', kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'eagle', home: 'Hogwarts', key: 'ravenclaw' },
  { name: 'Hufflepuff', short: 'HUF', c1: '#e3b02a', c2: '#2f2722', ui: '#f2c230', letter: 'H', kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'badger', home: 'Hogwarts', key: 'hufflepuff' },
] };
const HOUSE_IDS = [0, 1, 2, 3];
const CLUBS = [
  { name: 'Appleby Arrows', short: 'APP', c1: '#86b4e2', c2: '#dfe4ea', c3: '#f0f0f0', ui: '#8cc0ff', emblem: 'arrow', str: 76, home: 'Appleby', city: 'Appleby, Cumbria' },
  { name: 'Ballycastle Bats', short: 'BAL', c1: '#18181c', c2: '#c4161c', c3: '#202024', ui: '#ff4a50', emblem: 'bat', str: 79, home: 'Ballycastle', city: 'Ballycastle, Antrim' },
  { name: 'Caerphilly Catapults', short: 'CAE', c1: '#6fbf5e', c2: '#c4201e', c3: '#f0f0f0', ui: '#7fd86a', emblem: 'catapult', pattern: 1, str: 73, home: 'Caerphilly', city: 'Caerphilly, Wales' },
  { name: 'Chudley Cannons', short: 'CHU', c1: '#ee7414', c2: '#141414', c3: '#141414', ui: '#ff8a2a', emblem: 'cannon', str: 62, home: 'Chudley', city: 'Chudley' },
  { name: 'Falmouth Falcons', short: 'FAL', c1: '#4a4d53', c2: '#f0f0f0', c3: '#2a2c30', ui: '#c8ccd4', emblem: 'falcon', pattern: 3, str: 74, home: 'Falmouth', city: 'Falmouth, Cornwall' },
  { name: 'Holyhead Harpies', short: 'HOL', c1: '#1c4a2a', c2: '#d6a93a', c3: '#efe6cf', ui: '#4cc27a', emblem: 'talon', body: 'f', str: 84, home: 'Holyhead', city: 'Holyhead, Anglesey' },
  { name: 'Kenmare Kestrels', short: 'KEN', c1: '#0f9a52', c2: '#f2d33a', c3: '#f2f2f2', ui: '#2fd47a', emblem: 'kk', str: 75, home: 'Kenmare', city: 'Kenmare, Kerry' },
  { name: 'Montrose Magpies', short: 'MON', c1: '#121214', c2: '#f2f2f2', c3: '#f2f2f2', ui: '#e8e8e8', emblem: 'magpie', pattern: 3, str: 86, home: 'Montrose', city: 'Montrose, Angus' },
  { name: 'Pride of Portree', short: 'POR', c1: '#4a1e78', c2: '#e2b23c', c3: '#efe6cf', ui: '#a46ce8', emblem: 'star', str: 77, home: 'Portree', city: 'Portree, Isle of Skye' },
  { name: 'Puddlemere United', short: 'PUD', c1: '#18234e', c2: '#d8b34a', c3: '#efe6cf', ui: '#6f8ae8', emblem: 'bulrush', str: 85, home: 'Puddlemere', city: 'Puddlemere' },
  { name: 'Tutshill Tornados', short: 'TUT', c1: '#62aee6', c2: '#13306b', c3: '#f2f2f2', ui: '#7cc4ff', emblem: 'tt', str: 80, home: 'Tutshill', city: 'Tutshill, Gloucestershire' },
  { name: 'Wigtown Wanderers', short: 'WIG', c1: '#8c0e14', c2: '#cfd3d8', c3: '#1c1c20', ui: '#ff4a4a', emblem: 'cleaver', str: 72, home: 'Wigtown', city: 'Wigtown, Galloway' },
  { name: 'Wimbourne Wasps', short: 'WIM', c1: '#f2c219', c2: '#141414', c3: '#141414', ui: '#ffd23a', emblem: 'wasp', pattern: 2, str: 78, home: 'Wimbourne', city: 'Wimbourne, Dorset' },
];
const NATIONS = [
  { name: 'England', short: 'ENG', c1: '#f2f2f2', c2: '#c8102e', c3: '#1b2a5a', ui: '#ffffff', emblem: 'rose', str: 84 },
  { name: 'Ireland', short: 'IRL', c1: '#16935c', c2: '#f2f2f2', c3: '#f2f2f2', ui: '#2fd47a', emblem: 'shamrock', str: 86 },
  { name: 'Scotland', short: 'SCO', c1: '#0b2a6b', c2: '#f2f2f2', c3: '#0b2a6b', ui: '#5b86e6', emblem: 'saltire', str: 80 },
  { name: 'Wales', short: 'WAL', c1: '#c8102e', c2: '#2da04a', c3: '#f2f2f2', ui: '#ff5a5a', emblem: 'dragon', pattern: 4, str: 78 },
  { name: 'Bulgaria', short: 'BUL', c1: '#a8101a', c2: '#f2f2f2', c3: '#1a6b3a', ui: '#ff4a4a', emblem: 'star', str: 87 },
  { name: 'Norway', short: 'NOR', c1: '#ba0c2f', c2: '#00205b', c3: '#f2f2f2', ui: '#ff4a6a', emblem: 'cross', str: 79 },
  { name: 'Uganda', short: 'UGA', c1: '#1a1a1a', c2: '#fcdc04', c3: '#d90000', ui: '#ffd23a', emblem: 'crane', pattern: 2, str: 82 },
  { name: 'Brazil', short: 'BRA', c1: '#f6d21a', c2: '#14873e', c3: '#1a3a8a', ui: '#ffe23a', emblem: 'star', str: 81 },
  { name: 'Japan', short: 'JPN', c1: '#f2f2f2', c2: '#bc002d', c3: '#1a1a1a', ui: '#ff5a7a', emblem: 'sun', str: 80 },
  { name: 'USA', short: 'USA', c1: '#1b2a5a', c2: '#c8102e', c3: '#f2f2f2', ui: '#6f8ae8', emblem: 'star', pattern: 1, str: 77 },
  { name: 'Australia', short: 'AUS', c1: '#0f6a3a', c2: '#f6c21a', c3: '#f2f2f2', ui: '#ffd23a', emblem: 'star', str: 78 },
  { name: 'France', short: 'FRA', c1: '#1b2a7a', c2: '#f2f2f2', c3: '#c8102e', ui: '#6f8ae8', emblem: 'fleur', str: 83 },
  { name: 'Germany', short: 'GER', c1: '#1a1a1a', c2: '#d8a01a', c3: '#c8102e', ui: '#e8c040', emblem: 'eagle', str: 82 },
  { name: 'Peru', short: 'PER', c1: '#f2f2f2', c2: '#c8102e', c3: '#c8102e', ui: '#ff5a5a', emblem: 'sun', pattern: 4, str: 81 },
  { name: 'Egypt', short: 'EGY', c1: '#c8a24a', c2: '#1a1a1a', c3: '#f2f2f2', ui: '#f0c860', emblem: 'sun', str: 79 },
  { name: 'Transylvania', short: 'TRA', c1: '#3a0a1a', c2: '#bfc4ca', c3: '#1a1a1a', ui: '#c84a6a', emblem: 'bat', str: 76 },
];
const CLUB_IDS = [], NATION_IDS = [];
for (const c of CLUBS) { CLUB_IDS.push(CONFIG.teams.length); CONFIG.teams.push(Object.assign({ kind: 'club', letter: c.short[0], pattern: 0, key: 'club_' + c.short.toLowerCase() }, c)); }
for (const c of NATIONS) { NATION_IDS.push(CONFIG.teams.length); CONFIG.teams.push(Object.assign({ kind: 'nation', letter: c.short[0], pattern: 0, home: c.name, key: 'nat_' + c.short.toLowerCase() }, c)); }
const teamName = (i) => (CONFIG.teams[i] || CONFIG.teams[0]).name;

// ---- names for NPC players, reporters and classmates ----
const NAME_F = ['Aisling', 'Beatrix', 'Bronwen', 'Cassia', 'Delphine', 'Elowen', 'Fenella', 'Grainne', 'Hestia', 'Imogen', 'Isolde', 'Juniper', 'Kerensa', 'Lavinia', 'Maeve', 'Morwenna', 'Niamh', 'Ottilie', 'Persephone', 'Rhiannon', 'Rosalind', 'Saoirse', 'Tamsin', 'Una', 'Verity', 'Wren', 'Ysolde', 'Zinnia', 'Ada', 'Briony', 'Cerys', 'Dilys', 'Effie', 'Freya', 'Gwen', 'Hattie', 'Ione', 'Jessamy', 'Kit', 'Liesel', 'Mira', 'Nell', 'Orla', 'Priya', 'Ruth', 'Sian', 'Thea', 'Yara'];
const NAME_M = ['Alaric', 'Barnaby', 'Caspian', 'Cormac', 'Desmond', 'Evander', 'Fergus', 'Gideon', 'Hamish', 'Ignatius', 'Jasper', 'Kieran', 'Lachlan', 'Magnus', 'Niall', 'Osric', 'Peregrine', 'Quentin', 'Rafferty', 'Silas', 'Tobias', 'Ulric', 'Vaughn', 'Wilfred', 'Xander', 'Ambrose', 'Bram', 'Cillian', 'Dai', 'Emrys', 'Finnian', 'Gethin', 'Hugo', 'Ivo', 'Jago', 'Kofi', 'Lorcan', 'Marius', 'Nico', 'Oisin', 'Piran', 'Rhys', 'Soren', 'Tariq', 'Wystan'];
const NAME_L = ['Abernathy', 'Blackwood', 'Brightwater', 'Carrow', 'Catchpole', 'Darrowby', 'Ellsworth', 'Fairweather', 'Fenwick', 'Gallowglass', 'Grimstone', 'Hawthorne', 'Hollowell', 'Ironside', 'Jessop', 'Kettleburn', 'Lockhart', 'Lovegood', 'Marchbanks', 'Merriweather', 'Nightingale', 'Oakhart', 'Pennywhistle', 'Quill', 'Ravenscroft', 'Rookwood', 'Shacklebolt', 'Silverthorn', 'Thistlewood', 'Thornbury', 'Underhill', 'Vale', 'Wainwright', 'Whitlock', 'Wyndham', 'Yaxley', 'Ashcombe', 'Bagshaw', 'Coldwell', 'Dunmore', 'Everard', 'Farrow', 'Greenhalgh', 'Holloway', 'Inglewood', 'Kingsley', 'Lathbury', 'Moorcroft', 'Northcote', 'Pemberton', 'Redfern', 'Stoneleigh', 'Tremlett', 'Westbrook', 'Okafor', 'Achebe', 'Nakamura', 'Moreau', 'Kowalski', 'Haddad', 'Silva', 'Osei', 'Mbeki', 'Novak'];
function makeName(seed, body) {
  const r = mulberry32(seed * 2654435761 >>> 0);
  const f = body === 'f' ? NAME_F : NAME_M;
  return f[Math.floor(r() * f.length)] + ' ' + NAME_L[Math.floor(r() * NAME_L.length)];
}

// ---- crest emblems (vector, drawn on canvas) ----
function drawEmblem(g, kind, cx, cy, s, col, col2) {
  g.save(); g.translate(cx, cy); g.scale(s / 100, s / 100);
  g.fillStyle = col; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round';
  const P = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  const txt = (t, sz) => { g.font = `900 ${sz}px ${"'HLA', Georgia, serif"}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 4); };
  switch (kind) {
    case 'arrow': g.lineWidth = 7; g.beginPath(); g.moveTo(-38, 38); g.lineTo(30, -30); g.stroke(); P([[40, -40], [12, -32], [32, -12]]); P([[-38, 38], [-46, 20], [-30, 22]]); P([[-38, 38], [-20, 46], [-22, 30]]); break;
    case 'bat': P([[0, -14], [10, -24], [14, -10], [44, -26], [36, -4], [48, 6], [30, 6], [22, 20], [12, 8], [0, 26], [-12, 8], [-22, 20], [-30, 6], [-48, 6], [-36, -4], [-44, -26], [-14, -10], [-10, -24]]); break;
    case 'catapult': g.lineWidth = 7; g.beginPath(); g.moveTo(-40, 30); g.lineTo(40, 30); g.moveTo(-26, 30); g.lineTo(-8, 4); g.lineTo(10, 30); g.moveTo(-8, 4); g.lineTo(34, -30); g.stroke(); g.beginPath(); g.arc(36, -34, 9, 0, TAU); g.fill(); break;
    case 'cannon': g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill(); g.fillStyle = col2 || '#fff'; g.font = `900 30px ${"'HLA', Georgia, serif"}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CC', 0, 3); g.fillStyle = col; for (let i = 0; i < 3; i++) { g.fillRect(-48 + i * 2, -14 + i * 12, 12 - i * 3, 4); } break;
    case 'falcon': P([[-6, -36], [20, -28], [30, -12], [16, -10], [22, 2], [8, 6], [12, 34], [-10, 22], [-24, 30], [-20, 6], [-34, -4], [-22, -22]]); g.fillStyle = col2 || '#000'; g.beginPath(); g.arc(4, -22, 4, 0, TAU); g.fill(); break;
    case 'talon': for (let i = -1; i <= 1; i++) { g.save(); g.rotate(i * 0.42); P([[-7, -6], [7, -6], [5, 18], [0, 40], [-5, 18]]); g.restore(); } g.beginPath(); g.ellipse(0, -14, 22, 12, 0, 0, TAU); g.fill(); break;
    case 'kk': g.save(); g.translate(-15, 0); g.scale(-1, 1); txt('K', 58); g.restore(); g.save(); g.translate(15, 0); txt('K', 58); g.restore(); break;
    case 'magpie': P([[-36, 6], [-10, -10], [12, -18], [30, -14], [40, -4], [26, -2], [16, 10], [-4, 14], [-40, 30], [-22, 12]]); g.fillStyle = col2 || '#000'; g.beginPath(); g.ellipse(4, -2, 12, 6, -0.3, 0, TAU); g.fill(); break;
    case 'star': { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 42; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } P(pts); break; }
    case 'bulrush': g.lineWidth = 5; for (const sg of [-1, 1]) { g.save(); g.rotate(sg * 0.5); g.beginPath(); g.moveTo(0, 42); g.lineTo(0, -40); g.stroke(); g.beginPath(); g.ellipse(0, -20, 8, 18, 0, 0, TAU); g.fill(); g.restore(); } break;
    case 'tt': g.save(); g.translate(-14, 0); txt('T', 60); g.restore(); g.save(); g.translate(14, 0); txt('T', 60); g.restore(); break;
    case 'cleaver': P([[-34, -26], [26, -26], [30, 18], [-30, 18]]); g.fillStyle = col2 || '#000'; g.beginPath(); g.arc(18, -14, 4, 0, TAU); g.fill(); g.fillStyle = col; P([[-6, 18], [6, 18], [6, 44], [-6, 44]]); break;
    case 'wasp': g.beginPath(); g.ellipse(0, 10, 16, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -24, 11, 0, TAU); g.fill(); g.globalAlpha = 0.55; g.beginPath(); g.ellipse(-26, -6, 22, 10, -0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(26, -6, 22, 10, 0.5, 0, TAU); g.fill(); g.globalAlpha = 1; g.fillStyle = col2 || '#000'; for (let k = 0; k < 3; k++) g.fillRect(-16, 0 + k * 11, 32, 5); break;
    case 'lion': P([[-30, 30], [-28, -2], [-36, -20], [-20, -22], [-14, -38], [6, -30], [22, -36], [24, -16], [36, -6], [20, 6], [26, 30], [8, 22], [-6, 34]]); break;
    case 'serpent': g.lineWidth = 9; g.beginPath(); g.moveTo(-30, 34); g.bezierCurveTo(30, 30, 30, 6, 0, 0); g.bezierCurveTo(-30, -6, -26, -30, 18, -30); g.stroke(); P([[18, -40], [36, -30], [18, -20]]); break;
    case 'eagle': P([[0, -34], [10, -20], [44, -26], [26, -4], [14, 0], [8, 32], [0, 24], [-8, 32], [-14, 0], [-26, -4], [-44, -26], [-10, -20]]); break;
    case 'badger': g.beginPath(); g.ellipse(0, 6, 34, 26, 0, 0, TAU); g.fill(); g.fillStyle = col2 || '#000'; for (const sx of [-12, 12]) { g.beginPath(); g.ellipse(sx, 0, 6, 24, 0, 0, TAU); g.fill(); } break;
    case 'rose': g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.moveTo(0, 0); g.arc(Math.cos(a) * 18, Math.sin(a) * 18, 18, 0, TAU); } g.fill(); g.fillStyle = col2 || '#000'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); break;
    case 'shamrock': for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; g.beginPath(); g.arc(Math.cos(a) * 18, Math.sin(a) * 18 - 4, 17, 0, TAU); g.fill(); } g.lineWidth = 6; g.beginPath(); g.moveTo(0, 4); g.quadraticCurveTo(4, 30, 14, 42); g.stroke(); break;
    case 'saltire': g.lineWidth = 16; g.beginPath(); g.moveTo(-36, -36); g.lineTo(36, 36); g.moveTo(36, -36); g.lineTo(-36, 36); g.stroke(); break;
    case 'cross': g.fillRect(-10, -40, 20, 80); g.fillRect(-40, -10, 80, 20); break;
    case 'dragon': P([[-40, 20], [-20, 0], [-30, -20], [-6, -12], [6, -36], [14, -12], [40, -18], [24, 4], [34, 24], [10, 14], [0, 34], [-10, 14]]); break;
    case 'crane': g.lineWidth = 5; g.beginPath(); g.moveTo(0, 40); g.lineTo(0, 10); g.stroke(); P([[0, 12], [-30, -6], [-10, -10], [0, -30], [10, -10], [30, -6]]); g.beginPath(); g.arc(0, -36, 7, 0, TAU); g.fill(); break;
    case 'sun': g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); g.lineWidth = 5; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); g.lineTo(Math.cos(a) * 40, Math.sin(a) * 40); g.stroke(); } break;
    case 'fleur': P([[0, -42], [12, -14], [6, 10], [0, 4], [-6, 10], [-12, -14]]); for (const sg of [-1, 1]) P([[sg * 6, 0], [sg * 30, -20], [sg * 36, 4], [sg * 16, 14]]); g.fillRect(-26, 12, 52, 8); P([[-8, 20], [8, 20], [0, 40]]); break;
    default: txt('?', 60);
  }
  g.restore();
}

/* ------------------------------------------------------------------ the engine's side: every team as a "house" it can dress and name */
const QC = { active: false, injected: [] };
/* the career's icons: one stroke set, drawn in the text's colour (colour emoji differ by phone maker and ignore the gold) */
QC.ICON = {
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6', team: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z',
  prophet: 'M4 5h13v14H6a2 2 0 0 1-2-2z M17 8h3v9a2 2 0 0 1-2 2 M7 8h7 M7 11h7 M7 14h4', owl: 'M7 9a5 5 0 0 1 10 0v6a5 5 0 0 1-10 0z M9.5 10.5h.01 M14.5 10.5h.01 M12 12.5l-1 1.5h2z M7 9L5.5 6 M17 9l1.5-3',
  train: 'M13 2L5 14h6l-1 8 8-12h-6z', brooms: 'M3 21l11-11 M14 10l3-3 M14 10c2 3 5 5 7 5-.5-3-2.5-6-5-7z', quit: 'M14 4h5v16h-5 M10 8l-4 4 4 4 M6 12h10',
  scene: 'M4 9h16v10H4z M4 9l2-4h14l-2 4 M10 5L8 9 M15 5l-2 4', match: 'M6 21V4 M6 4h11l-2 4 2 4H6', drill: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01',
  cup: 'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 20h8 M10 17h4', quill: 'M19 4c-6 1-10 5-12 12l-2 4 4-2c7-2 11-6 12-12z M7 16l5-5',
  tea: 'M5 9h12v4a6 6 0 0 1-12 0z M17 10h2a2 2 0 0 1 0 4h-2 M8 4c0 1 1 1 1 2 M12 4c0 1 1 1 1 2', globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z', spark: 'M12 3v5 M12 16v5 M3 12h5 M16 12h5 M6.5 6.5l2.5 2.5 M15 15l2.5 2.5 M17.5 6.5L15 9 M9 15l-2.5 2.5',
  flame: 'M12 21c-4 0-6-3-6-6 0-4 4-6 3-11 3 2 4 4 4 7 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z', dots: 'M6 12h.01 M12 12h.01 M18 12h.01', pencil: 'M4 20l4-1 11-11-3-3L5 16z M14 7l3 3',
  next: 'M9 6l6 6-6 6', lock: 'M7 11V8a5 5 0 0 1 10 0v3 M5.5 11h13v9h-13z M12 14.5v2.5',
};
/* a look, as a face: its skin, its hair's colour and cut (the same tables the castle dresses its students from) */
QC.face = function (v, witch) {
  const hx = (n) => '#' + n.toString(16).padStart(6, '0'), tone = hx(HL.SKINS[v % HL.SKINS.length]), hc = hx(HL.HAIR[(v * 3 + (witch ? 1 : 0)) % HL.HAIR.length]),
    cut = (witch ? ['Hair_Long', 'Hair_Buns', 'Hair_Long'] : ['Hair_SimpleParted', 'Hair_Buzzed', 'Hair_SimpleParted'])[v % 3];
  const back = cut === 'Hair_Long' ? `<path d="M11.2 15c0-7 3.8-10.4 8.8-10.4S28.8 8 28.8 15v13.5c-2 1.6-4.4 2.2-6 2.2h-5.6c-1.6 0-4-.6-6-2.2z" fill="${hc}"/>` : '';
  const top = cut === 'Hair_Buns' ? `<circle cx="12.6" cy="8.4" r="3.6" fill="${hc}"/><circle cx="27.4" cy="8.4" r="3.6" fill="${hc}"/><path d="M12 15.5c-.4-6 3.2-9.2 8-9.2s8.4 3.2 8 9.2c-2.6-3.4-5-4.4-8-4.4s-5.4 1-8 4.4z" fill="${hc}"/>`
    : cut === 'Hair_Buzzed' ? `<path d="M12.6 14.6c0-5.6 3.2-8.2 7.4-8.2s7.4 2.6 7.4 8.2c-2.4-2.4-4.8-3.2-7.4-3.2s-5 .8-7.4 3.2z" fill="${hc}" opacity=".88"/>`
    : cut === 'Hair_SimpleParted' ? `<path d="M11.8 16c-.6-6.6 3.2-10 8.2-10s8.8 3.4 8.2 10c-1.2-2.6-2.6-4-4.4-4.8-2.8 1.6-6.4 2.4-10 1.6-.8.8-1.4 1.8-2 3.2z" fill="${hc}"/>`
    : `<path d="M11.6 16.4c-.6-6.8 3.4-10.4 8.4-10.4s9 3.6 8.4 10.4c-1.6-3.2-4.2-4.6-6.6-4.6-1.4 1.4-4.6 2.2-7 1.6-1.4.8-2.4 1.8-3.2 3z" fill="${hc}"/>`;
  return `<svg class="face" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19.5" fill="rgba(255,255,255,.05)"/>${back}
    <path d="M6 40c.6-6.6 5.6-10.4 14-10.4S33.4 33.4 34 40z" fill="#1e1a22"/><path d="M15.4 29.8 20 35l4.6-5.2" fill="none" stroke="#d8c48a" stroke-width="1.2"/>
    <rect x="17.4" y="23" width="5.2" height="7.6" rx="2" fill="${tone}"/><rect x="17.4" y="23" width="5.2" height="3" fill="rgba(0,0,0,.16)"/>
    <ellipse cx="20" cy="17.2" rx="7.3" ry="8.6" fill="${tone}"/><ellipse cx="20" cy="21.6" rx="5" ry="2.6" fill="rgba(0,0,0,.05)"/>
    <ellipse cx="17.1" cy="17.8" rx=".95" ry="1.15" fill="#241a14"/><ellipse cx="22.9" cy="17.8" rx=".95" ry="1.15" fill="#241a14"/>
    <path d="M18.2 22.2c1.2.7 2.4.7 3.6 0" fill="none" stroke="rgba(90,40,30,.55)" stroke-width=".8" stroke-linecap="round"/>${top}</svg>`;
};
/* the castle's people step out of a stage's frame (a professor stood at your shoulder in the creator) */
QC.clearAround = function (set, r, rGhost) { if (!set || !set.F || !HL.npcs) return set; const F = set.F, gh = new Set((HL.ghosts || []).map((g) => g.a)), out = HL.npcs.filter((a) => !a.sceneOut && Math.hypot(a.x - F.x, a.z - F.z) < (gh.has(a) ? Math.max(r, rGhost || 0) : r));   /* (a ghost read as a white blob behind the hub) */
  for (const a of out) a.sceneOut = true; HL._nearN = null;
  const l0 = set.onLeave; set.onLeave = () => { for (const a of out) a.sceneOut = false; HL._nearN = null; if (l0) l0(); }; return set; };
/* a broom, drawn: its handle's wood and its tail (the shop was text in boxes) */
QC.broomArt = function (id) { const W = { star: ['#b8894e', '#c9a46a', 0], clean7: ['#7a4a26', '#a77a44', 0], comet260: ['#d8c49a', '#c8b07a', 1], nimbus2000: ['#5a2414', '#8a5a2e', 1], nimbus2001: ['#18120e', '#5a4632', 2], firebolt: ['#9a6a3e', '#d0a050', 3] }[id] || ['#8a5a2e', '#a77a44', 0];
  const [h, t, k] = W, band = k ? `<rect x="104" y="13" width="5" height="8" rx="1" fill="${k > 2 ? '#e8c060' : '#c0c4cc'}"/>` : '', foot = k > 1 ? `<path d="M120 17h14" stroke="${k > 2 ? '#e8c060' : '#9aa0aa'}" stroke-width="1.6"/>` : '';
  return `<svg class="bart" viewBox="0 0 200 34" aria-hidden="true"><path d="M10 17c40-2 96-2 100-1" stroke="${h}" stroke-width="4.2" stroke-linecap="round" fill="none"/><path d="M10 15.4c40-2 96-2 100-1" stroke="rgba(255,255,255,.25)" stroke-width="1" fill="none"/>${band}${foot}
    <path d="M108 17c14-9 44-13 84-10-8 4-8 16 0 20-40 3-70-1-84-10z" fill="${t}"/><path d="M114 17c20-5 46-7 70-6 M114 17c20 5 46 7 70 6 M116 17h66" stroke="rgba(40,24,10,.45)" stroke-width="1" fill="none"/></svg>`; };
QC.ICON.check = 'M5 12.5l4.2 4.2L19 7';
QC.svg = (k) => `<svg class="qi" viewBox="0 0 24 24" aria-hidden="true"><path d="${QC.ICON[k] || QC.ICON.next}"/></svg>`;
const hexN = (css) => parseInt(String(css).replace('#', ''), 16);
const darkerN = (css, k) => { const c = new THREE.Color(css); c.multiplyScalar(k); return c.getHex(); };
HL.TEAMS = {};
for (const T of CONFIG.teams) {
  if (T.kind === 'house') { HL.TEAMS[T.key] = HL.HOUSES[T.key]; continue; }
  const c1 = hexN(T.c1), c2 = hexN(T.c2);
  HL.TEAMS[T.key] = { name: T.name, col: c1, col2: c2, cloth: [darkerN(T.c1, 0.82), darkerN(T.c2, 0.9)], trait: T.city || T.home || '', beast: T.emblem, css: T.ui || T.c1, css2: T.c2, kind: T.kind, team: T };
}
/* dress robes for the balls and galas: midnight velvet with a silver lining, no crest */
HL.TEAMS.ball = { name: 'Dress robes', col: 0x1c2448, col2: 0xd8dce8, cloth: [0x151a33, 0xc4c8d8], trait: '', beast: 0, css: '#1c2448', css2: '#d8dce8', kind: 'formal' };
/* and the first-years' plain black, before the Hat has given them a house */
HL.TEAMS.first = { name: 'First-years', col: 0x1d1d22, col2: 0x3c3c44, cloth: [0x121216, 0x36363e], trait: '', beast: 0, css: '#1d1d22', css2: '#3c3c44', kind: 'formal' };
QC.key = (i) => (CONFIG.teams[i] || CONFIG.teams[0]).key;
QC.idx = (key) => CONFIG.teams.findIndex((t) => t.key === key);
/* for the length of a match the two sides stand among the houses (the match code names and colours its sides through HL.HOUSES) */
QC.inject = function (keys) { for (const k of keys) if (!HL.HOUSES[k] && HL.TEAMS[k]) { HL.HOUSES[k] = HL.TEAMS[k]; QC.injected.push(k); } };
QC.eject = function () { for (const k of QC.injected) delete HL.HOUSES[k]; QC.injected = []; };
/* students in a club's or a nation's colours */
{ const s0 = HL.student; HL.student = function (house, witch, v, quid) {
  if (HL.HOUSES[house] || !HL.TEAMS[house]) return s0.apply(this, arguments);
  HL.HOUSES[house] = HL.TEAMS[house]; try { return s0.apply(this, arguments); } finally { if (!QC.injected.includes(house)) delete HL.HOUSES[house]; } }; }
{ const m0 = CLOTH.mat; CLOTH.mat = function (key) {
  if (/^hl_/.test(key) && !CLOTH.mats[key]) { const k = key.slice(3), T = HL.TEAMS[k]; if (T && T.kind && T.kind !== 'house') { const b = m0('cape'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = b.customProgramCacheKey; m.color.set(T.cloth[0]); m.sheenColor.set(T.cloth[1]); m.roughness = 0.8; m.sheen = 0.9; m.envMapIntensity = 0.5; CLOTH.mats[key] = m; return m; } }
  if (/^hlCape_/.test(key) && !CLOTH.mats[key]) { const k = key.slice(7), T = HL.TEAMS[k];
    if (T && T.kind === 'formal') { const b = m0('cape'), m = b.clone(); m.onBeforeCompile = b.onBeforeCompile; m.customProgramCacheKey = b.customProgramCacheKey; m.color.set(T.cloth[0]); m.sheenColor.set(T.cloth[1]); m.roughness = 0.72; m.sheen = 1; m.envMapIntensity = 0.6; CLOTH.mats[key] = m; return m; }
    // a club's or a country's cape is drawn from its colours, which the castle looks up among the houses
    if (T && !HL.HOUSES[k]) { HL.HOUSES[k] = T; try { return m0(key); } finally { if (!QC.injected.includes(k)) delete HL.HOUSES[k]; } } }
  return m0(key); }; }
/* ------------------------------------------------------------------ the stadium, dressed for whoever is playing */
{ const Q = HL.Q; QC.cloth = []; QC.banners = [];
  const ct0 = Q.clothTex; Q.clothTex = function (c1, c2, kind) { const t = ct0.call(Q, c1, c2, kind); QC.cloth.push({ t, c1, c2, kind }); return t; };
  const wb0 = WORLD.banner; WORLD.banner = function (L, x, y, z, yaw, w, h, col, col2) { const me = wb0.apply(this, arguments); const m = me.material, ob = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); m.userData.uC2 = sh.uniforms.uC2; }; QC.banners.push({ me, col, col2, x, z }); return me; };
  /* which house's colours each thing was made in → which side of the match it now shows */
  const side = (col, home, away) => { const hk = Object.keys(HL.HOUSES).filter((k) => !QC.injected.includes(k)); const i = hk.findIndex((k) => HL.HOUSES[k].col === col || HL.HOUSES[k].col2 === col); return i < 0 ? null : (i % 2 === 0 ? home : away); };
  const redraw = (e, c1, c2) => { const tex = e.t, cv = tex.image, x = cv.getContext('2d'), A = '#' + new THREE.Color(c1).getHexString(), B = '#' + new THREE.Color(c2).getHexString(), kind = e.kind;
    x.fillStyle = A; x.fillRect(0, 0, 256, 256); x.fillStyle = B; if (kind === 0) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if ((i + j) % 2) x.fillRect(i * 64, j * 64, 64, 64); } else if (kind === 1) for (let i = 0; i < 4; i++) x.fillRect(i * 64, 0, 32, 256); else { for (let j = 0; j < 4; j++) { x.beginPath(); x.moveTo(0, j * 64); x.lineTo(128, j * 64 + 32); x.lineTo(256, j * 64); x.lineTo(256, j * 64 + 26); x.lineTo(128, j * 64 + 58); x.lineTo(0, j * 64 + 26); x.fill(); } }
    const rs = mulberry(c1 * 7 + c2); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(0,0,0,${rs() * 0.07})`; x.fillRect(rs() * 256, rs() * 256, 2, 6); } tex.needsUpdate = true; };
  QC.dress = function (homeKey, awayKey) {
    const H = HL.TEAMS[homeKey], A = HL.TEAMS[awayKey]; if (!H || !A) return; QC.dressed = [homeKey, awayKey];
    for (const e of QC.cloth) { const s = side(e.c1, H, A) || H; redraw(e, s.col, s.col2); }
    for (const b of QC.banners) { if (Math.hypot(b.x - HL.PITCH.x, b.z - HL.PITCH.z) > 260) continue; const s = side(b.col, H, A); if (!s) continue; b.me.material.color.set(s.col); if (b.me.material.userData.uC2) b.me.material.userData.uC2.value.set(s.col2); }
    // the crowd: each spectator wears the colours of the side its stand now flies
    const im = Q.crowd, P = Q.people; if (!im || !P) return; const g = im.geometry, t1 = g.attributes.aTint, t2 = g.attributes.aTint2; if (!QC.crowd0) QC.crowd0 = [t1.array.slice(), t2.array.slice()];
    const col = new THREE.Color(); P.forEach((p, i) => { const s = side(p[4], H, A); if (!s) return;
      const isMain = Object.values(HL.HOUSES).some((h) => h.col === p[4]); col.set(isMain ? s.col : s.col2); t1.array[i * 3] = col.r * 0.95 + 0.02; t1.array[i * 3 + 1] = col.g * 0.95 + 0.02; t1.array[i * 3 + 2] = col.b * 0.95 + 0.02;
      col.set(isMain ? s.col2 : s.col); t2.array[i * 3] = col.r * 1.05 + 0.03; t2.array[i * 3 + 1] = col.g * 1.05 + 0.03; t2.array[i * 3 + 2] = col.b * 1.05 + 0.03; });
    t1.needsUpdate = true; t2.needsUpdate = true;
  };
  QC.undress = function () {
    if (!QC.dressed) return; QC.dressed = null;
    for (const e of QC.cloth) redraw(e, e.c1, e.c2);
    for (const b of QC.banners) { b.me.material.color.set(b.col || 0x7a1410); if (b.me.material.userData.uC2) b.me.material.userData.uC2.value.set(b.col2 || 0xc9a04a); }
    const im = Q.crowd; if (im && QC.crowd0) { const g = im.geometry; g.attributes.aTint.array.set(QC.crowd0[0]); g.attributes.aTint2.array.set(QC.crowd0[1]); g.attributes.aTint.needsUpdate = true; g.attributes.aTint2.needsUpdate = true; }
  };
}

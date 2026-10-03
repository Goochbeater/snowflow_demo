// ===================== TEAMS: houses, British & Irish Quidditch League clubs, nations =====================
// Kit colours follow "Quidditch Through the Ages". pattern: 0 solid, 1 vertical stripes, 2 hoops, 3 halves, 4 sash.
// str is a 50-95 team rating used by the match simulator and the AI difficulty in career fixtures.
const HOUSE_IDS = [0, 1, 2, 3];
Object.assign(CONFIG.teams[0], { kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'lion', home: 'Hogwarts' });
Object.assign(CONFIG.teams[1], { kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'serpent', home: 'Hogwarts' });
Object.assign(CONFIG.teams[2], { kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'eagle', home: 'Hogwarts' });
Object.assign(CONFIG.teams[3], { kind: 'house', c3: '#e6dfcf', str: 70, emblem: 'badger', home: 'Hogwarts' });
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
for (const c of CLUBS) { CLUB_IDS.push(CONFIG.teams.length); CONFIG.teams.push(Object.assign({ kind: 'club', letter: c.short[0], pattern: 0 }, c)); }
for (const c of NATIONS) { NATION_IDS.push(CONFIG.teams.length); CONFIG.teams.push(Object.assign({ kind: 'nation', letter: c.short[0], pattern: 0, home: c.name }, c)); }
const teamName = i => (CONFIG.teams[i] || CONFIG.teams[0]).name;

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
  const txt = (t, sz) => { g.font = `900 ${sz}px ${Tex.font || 'Georgia, serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 4); };
  switch (kind) {
    case 'arrow': g.lineWidth = 7; g.beginPath(); g.moveTo(-38, 38); g.lineTo(30, -30); g.stroke(); P([[40, -40], [12, -32], [32, -12]]); P([[-38, 38], [-46, 20], [-30, 22]]); P([[-38, 38], [-20, 46], [-22, 30]]); break;
    case 'bat': P([[0, -14], [10, -24], [14, -10], [44, -26], [36, -4], [48, 6], [30, 6], [22, 20], [12, 8], [0, 26], [-12, 8], [-22, 20], [-30, 6], [-48, 6], [-36, -4], [-44, -26], [-14, -10], [-10, -24]]); break;
    case 'catapult': g.lineWidth = 7; g.beginPath(); g.moveTo(-40, 30); g.lineTo(40, 30); g.moveTo(-26, 30); g.lineTo(-8, 4); g.lineTo(10, 30); g.moveTo(-8, 4); g.lineTo(34, -30); g.stroke(); g.beginPath(); g.arc(36, -34, 9, 0, TAU); g.fill(); break;
    case 'cannon': g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill(); g.fillStyle = col2 || '#fff'; g.font = `900 30px ${Tex.font || 'Georgia, serif'}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CC', 0, 3); g.fillStyle = col; for (let i = 0; i < 3; i++) { g.fillRect(-48 + i * 2, -14 + i * 12, 12 - i * 3, 4); } break;
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

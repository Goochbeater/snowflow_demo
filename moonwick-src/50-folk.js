// ===== 50-folk: the people of Moonwick — bodies, daily lives, paths, moods, and what magic does to them =====
{
  const G = AF.G, P = AF.PLAN, W = AF.W, V3 = THREE.Vector3;
  const NPCS = G.npcs = []; G.npc = {};
  // ---------------------------------------------------------------- who lives here
  const SK = [0xf2c9a0, 0xe0a878, 0xc68a5a, 0x8a5a3a, 0xf6d8bc];
  const D = (id, name, role, home, work, leisure, look, likes, bio, lines, extra) => Object.assign({ id, name, role, home, work, leisure, look, likes, bio, lines }, extra || {});
  const DEFS = [
    D('granny', 'Granny Marrow', 'Herbalist', 'apoth', ['work:apoth', 'cauldron'], ['bench', 'work:flowers', 'sit:inn'], { skin: 0, hair: 0xe8e8ee, shirt: 0x6a8a5a, pants: 0x4a3a5a, hat: 'bonnet', hatCol: 0xd8c8e8, skirt: 1, glasses: 1 }, 'flower',
      'Knows every root and remedy in the valley, and most of its secrets.', ['A pinch of moonmint settles any stomach. Two pinches settles any argument.', 'My knees say rain. My knees are never wrong, only early.', 'The Spire used to hum at night. Like a kettle thinking about boiling.', 'I was young once. It was a Thursday.']),
    D('bram', 'Bram Oatley', 'Baker', 'bakery', ['work:bakery', 'oven', 'knead'], ['bar', 'bench'], { skin: 1, hair: 0x6a4a2a, shirt: 0xf0ece0, pants: 0x6a5a4a, hat: 'chef', hatCol: 0xffffff, apron: 0xf8f4e8, beard: 0x6a4a2a, fat: 1 }, 'egg',
      'Up before the sun. Bakes the best honey loaf this side of the hills.', ['First loaves are out at seven. The smell does my advertising for me.', 'Somebody keeps pinching pies off my sill. Somebody small.', 'Dough is like people. Leave it somewhere warm and it comes up lovely.', 'Pippa wants to be a wizard. I said finish your crusts first.']),
    D('pippa', 'Pippa Oatley', 'Baker\'s daughter', 'bakery', ['play'], ['play2'], { skin: 1, hair: 0x8a5a2a, shirt: 0xe88ab0, pants: 0x5a6aa0, scale: 0.68, skirt: 1, braids: 1 }, 'flower',
      'Nine years old. Has seen a fairy "loads of times, actually".', ['I KNEW fairies were real! I told Gus! I TOLD him!', 'When I grow up I\'m going to live in the Spire and have nine cats.', 'Do you eat crumbs? I can get you crumbs.', 'Gus says the Humming Stones sing if you stand in the middle. Gus fibs, though.'], { kid: 1 }),
    D('hollis', 'Hollis Thorn', 'Blacksmith', 'smithy', ['work:smithy', 'forge'], ['bar', 'fish'], { skin: 3, hair: 0x1a1a1a, shirt: 0x7a3a2a, pants: 0x3a3a3a, apron: 0x4a3a2a, beard: 0x1a1a1a, fat: 1 }, 'fish',
      'Quiet, enormous, and secretly writes poetry.', ['Iron listens, if you\'re patient with it.', 'Made the hinges on the Spire door. Forty years and not a squeak.', 'I\'m working on a poem about a nail. Don\'t tell Odette.', 'Hot work, this. Could do with a breeze.']),
    D('odette', 'Odette Finch', 'Innkeeper', 'inn', ['work:inn'], ['work:inn', 'bar'], { skin: 2, hair: 0xb0402a, shirt: 0x3a7a6a, pants: 0x5a3a2a, apron: 0xe8e0d0, skirt: 1 }, 'bread',
      'Runs the Drowsy Dragon. Has never once been drowsy.', ['Welcome to the Dragon! Mind the step, mind the cat, mind your manners.', 'Cider\'s pressed from the ridge orchard. Sit by the fire, why don\'t you.', 'Rosalind plays most evenings. Folk come for the songs and stay for the stew.', 'If the wizard would only wake, I\'d finally get his tab settled.']),
    D('barnaby', 'Barnaby Quill', 'Postmaster & bookseller', 'books', ['route:post', 'work:books'], ['read', 'sit:inn'], { skin: 4, hair: 0x9a8a7a, shirt: 0x3a4a7a, pants: 0x4a4a4a, hat: 'cap', hatCol: 0x2a3a6a, glasses: 1 }, 'pie',
      'Delivers every letter by hand and reads the postcards. Everyone knows.', ['A letter is a small door somebody left open for you.', 'I have read every book in my shop. Twice, the good ones.', 'There\'s a book in the Spire library that reads YOU. Dreadful manners.', 'Post goes out at eight sharp. Sharp-ish.']),
    D('tansy', 'Tansy Wren', 'Hatter & tailor', 'tailor', ['work:tailor', 'loom'], ['bench', 'bar', 'shop'], { skin: 0, hair: 0xe8c040, shirt: 0xc85a9a, pants: 0x5a3a6a, hat: 'brim', hatCol: 0xa83a6a, skirt: 1 }, 'flower',
      'Believes a good hat can fix nearly anything.', ['A hat is a roof for your thoughts, dear.', 'Wind\'s been dreadfully cheeky lately. Three hats in the pond this week!', 'I am sewing the wizard a new nightcap. With stars. He\'ll adore it.', 'You\'d look darling in a thimble.']),
    D('fen', 'Old Fen', 'Fisherman', 'fisher', ['fish', 'pondside'], ['bar', 'fish'], { skin: 2, hair: 0xd0d0d0, shirt: 0x4a6a7a, pants: 0x5a5a3a, hat: 'straw', hatCol: 0xd8b860, beard: 0xd0d0d0 }, 'bread',
      'Has been trying to catch the same fish for thirty-one years.', ['Shh. You\'ll scare Old Whiskers. He\'s down there. Laughing at me.', 'Mirror Pond shows the stars better than the sky does, some nights.', 'Patience. That\'s all fishing is. Patience and sandwiches.', 'Saw a light fall in the pond the night the Spire went dark. Plop.']),
    D('mabel', 'Mabel Rook', 'Farmer', 'farmh', ['fieldwork', 'work:barn', 'work:coop'], ['bench', 'shop', 'sit:inn'], { skin: 1, hair: 0x5a3a1a, shirt: 0xb0503a, pants: 0x4a5a7a, hat: 'straw', hatCol: 0xe0c060, skirt: 1 }, 'flower',
      'Grows the valley\'s pumpkins and wins every fair, unsmilingly.', ['Pumpkins don\'t grow themselves. I\'ve asked them.', 'Hens are off their laying. Something\'s been spooking them at night.', 'Rain\'d be welcome. Not too much. I\'m not greedy.', 'Jory\'s a good lad. Head full of clouds, mind.']),
    D('jory', 'Jory Rook', 'Farmhand', 'farmh', ['work:barn', 'fieldwork'], ['pondside', 'bar', 'stonespot'], { skin: 1, hair: 0x7a4a1a, shirt: 0x5a8a4a, pants: 0x6a5a3a }, 'pie',
      'Daydreams of adventure while leaning on a pitchfork.', ['One day I\'ll climb past the far mountains. After the harvest. Probably.', 'Ma says I\'ve my head in the clouds. Good view from up here.', 'The scarecrow winked at me once. I\'m nearly sure.', 'D\'you reckon the wizard needs a squire? Asking for me.']),
    D('ilse', 'Sister Ilse', 'Keeper of the chapel', 'cotA', ['work:chapel', 'pew'], ['bench', 'gravespot'], { skin: 4, hair: 0x3a3a3a, shirt: 0x3a4a8a, pants: 0x2a2a5a, hat: 'hood', hatCol: 0xf0f0f0, skirt: 1 }, 'flower',
      'Rings the bell at dawn and dusk and hums in between.', ['The bell is called Marigold. She has opinions about the weather.', 'Every lantern in Moonwick is a small prayer against the dark.', 'I ring at six and at eight. Any OTHER ringing is mischief.', 'Even the stars need looking after. That was the wizard\'s work.']),
    D('corwin', 'Corwin Vale', 'Miller', 'cotB', ['work:mill'], ['bar', 'bench'], { skin: 0, hair: 0xc8b890, shirt: 0xd8d0b8, pants: 0x7a6a5a, hat: 'cap', hatCol: 0xb8a888, fat: 1 }, 'fish',
      'Dusted in flour from boots to eyebrows.', ['No wind, no flour. No flour, no bread. No bread, riots.', 'When the sails spin fast the whole mill sings.', 'I can tell the weather from the creak of the cap. Mostly.', 'A good gust right now would make my week.']),
    D('elsbeth', 'Elsbeth Vale', 'Weaver', 'cotB', ['loom', 'work:laundry'], ['shop', 'bench', 'sit:inn'], { skin: 0, hair: 0xa86a3a, shirt: 0x7a5aa0, pants: 0x4a3a6a, skirt: 1, hat: 'bonnet', hatCol: 0xe8d8a0 }, 'egg',
      'Weaves star-patterned cloth and gossip with equal skill.', ['I\'m weaving the night sky. I keep running out of blue.', 'Did you hear? The apprentice hasn\'t slept in a week, poor lamb.', 'Corwin snores like the millstones. I find it soothing.', 'Every thread wants to be part of something.']),
    D('tobias', 'Tobias Pell', 'Wizard\'s apprentice', 'spire', ['gatewatch'], ['hallspot'], { skin: 2, hair: 0x2a2a3a, shirt: 0x4a3a8a, pants: 0x2a2a4a, hat: 'wiz', hatCol: 0x4a3a8a, robe: 1, scale: 0.9 }, 'pie',
      'Seventeen, anxious, and in charge of a tower he doesn\'t understand.', ['Master Fenwick has been asleep for eleven days. ELEVEN.', 'I only dusted the orrery! Then something went ping, and the lantern went out.', 'I\'m not allowed on the top floor. I\'m not allowed in the lab. I\'m allowed to worry.', 'If you see any fallen stars... no, that\'s silly. Is it silly?']),
    D('nell', 'Nell Bright', 'Lamplighter', 'cotC', ['bench', 'sit:inn'], ['route:lamps'], { skin: 3, hair: 0x1a1a2a, shirt: 0xe0a83a, pants: 0x3a3a5a, hat: 'cap', hatCol: 0xe0a83a }, 'bread',
      'Walks the lanes at dusk so nobody has to walk them in the dark.', ['Forty-one lamps. I know each one by its sulk.', 'I light them at dusk. Somebody keeps lighting them at NOON.', 'The dark\'s not bad. It just wants company.', 'When the star-lantern shone, I hardly had to work at all.']),
    D('gus', 'Gus Tumble', 'Small adventurer', 'store', ['play'], ['play2'], { skin: 2, hair: 0x3a2a1a, shirt: 0x4a9a5a, pants: 0x6a4a3a, scale: 0.66 }, 'pie',
      'Ten. Captain of an imaginary ship. Collector of frogs.', ['I\'m not scared of the Spire. I\'m just busy.', 'I found a frog the size of a LOAF. It got away.', 'Wren says fairies grant wishes. I wish for a sword. And a pie.', 'Bet you can\'t fly through the bell tower. Bet you can\'t.'], { kid: 1 }),
    D('wren', 'Wren Tumble', 'Small scholar', 'store', ['play'], ['play2'], { skin: 2, hair: 0x3a2a1a, shirt: 0xe0c040, pants: 0x4a5a8a, scale: 0.6, skirt: 1, braids: 1 }, 'flower',
      'Seven. Asks four hundred questions a day. Remembers the answers.', ['Why do stars twinkle? Why is the pond wet? Why is Gus?', 'I counted the constellations. There are ten. I named an eleventh "Biscuit".', 'Are you a girl fairy or a boy fairy or just a fairy?', 'If you sprinkle dust on me will I fly? Can we try? Please?'], { kid: 1 }),
    D('dara', 'Dara Tumble', 'Shopkeeper', 'store', ['work:store'], ['shop', 'bench', 'bar'], { skin: 2, hair: 0x2a1a1a, shirt: 0x3a6aa0, pants: 0x4a3a2a, apron: 0xd8c8a0 }, 'egg',
      'Sells everything from buttons to buckets. Mother of two whirlwinds.', ['If I haven\'t got it, you don\'t need it.', 'Have you seen my two? No, don\'t tell me. I\'d only worry.', 'String, soap, seeds, sweets. The four pillars of civilisation.', 'Business is slow since the lantern went out. Folk stay in after dark.']),
    D('wizard', 'Master Aldous Fenwick', 'Wizard of the Gloaming Spire', 'spire', ['wizbed'], ['wizbed'], { skin: 4, hair: 0xf0f0f4, shirt: 0x5a3a9a, pants: 0x3a2a6a, hat: 'wiz', hatCol: 0x5a3a9a, robe: 1, beard: 0xf0f0f4, longBeard: 1 }, 'pie',
      'Keeper of the star-lantern. Currently, and stubbornly, asleep.', ['Zzzz... not the turnips... zzz...', 'Mmf. Five more centuries...', 'Zzz... who moved the moon... put it back...'], { wizard: 1 }),
    D('rosalind', 'Rosalind Hart', 'Bard', 'cotD', ['bench', 'pondside', 'stonespot'], ['stage'], { skin: 0, hair: 0x2a1a3a, shirt: 0xb03a4a, pants: 0x2a2a3a, hat: 'brim', hatCol: 0x3a5a3a, feather: 1 }, 'flower',
      'Came for one night three years ago. The stew is very good.', ['Every village has a song. Moonwick\'s is mostly humming.', 'I\'m writing a ballad about the sleeping wizard. It needs an ending.', 'Come to the Dragon tonight. I take requests and compliments.', 'A tune\'s just a spell that asks nicely.']),
    D('ned', 'Ned Sorrel', 'Carpenter', 'carp', ['work:carp'], ['bar', 'bench', 'fish'], { skin: 1, hair: 0xa85a2a, shirt: 0x8a6a3a, pants: 0x4a4a3a, beard: 0xa85a2a }, 'bread',
      'Measures twice, cuts once, apologises to the wood.', ['Measure twice, cut once, sand forever.', 'Built half the roofs in the village. Mended the other half.', 'If anything\'s broken, I\'ll fix it. Though magic\'d be quicker, I hear.', 'That oak in the square is older than the Spire. It told me so. In creaks.']),
    D('moss', 'Captain Moss', 'The whole village watch', 'cotF', ['route:patrol'], ['bar', 'bench'], { skin: 3, hair: 0x8a8a8a, shirt: 0x3a5a4a, pants: 0x3a3a3a, hat: 'cap', hatCol: 0x2a4a3a, beard: 0x8a8a8a }, 'pie',
      'Retired from adventures. Guards Moonwick from geese, mostly.', ['Nothing to report. As usual. Just how I like it.', 'In my day I fought a troll. Well. Argued with one.', 'I keep the peace. The peace keeps wandering off.', 'Mischief has a smell. Like pie and pond-water. I smell it now.']),
    D('ivy', 'Ivy Larkspur', 'Gardener & flower seller', 'cotE', ['work:flowers', 'gardenspot'], ['pondside', 'bench', 'sit:inn'], { skin: 0, hair: 0x5a8a3a, shirt: 0x8ac06a, pants: 0x4a6a3a, skirt: 1, hat: 'straw', hatCol: 0xf0e0a0 }, 'egg',
      'Talks to her flowers. Insists they talk back.', ['The foxgloves are gossiping again. I shan\'t repeat it.', 'A little magic and the whole lane would bloom. Just saying. To nobody.', 'Marigolds for luck, bluebells for wishes, nettles for Captain Moss.', 'Something green is always worth being kind to.']),
    D('percival', 'Percival Crumb', 'Travelling merchant', 'cotD', ['work:stall2'], ['bar', 'shop'], { skin: 1, hair: 0x1a1a1a, shirt: 0x8a3a7a, pants: 0x3a3a4a, hat: 'brim', hatCol: 0x8a3a7a, beard: 0x1a1a1a, fat: 1 }, 'fish',
      'Sells "genuine" curiosities. The price depends on your shoes.', ['Genuine dragon-scale buttons! Probably genuine! Definitely buttons!', 'I\'ve seen cities, friend. None of them had cider like this.', 'A fairy! I could sell TICKETS. No? No. Fair enough.', 'Everything is rare if you only have one of it.']),
    D('agnes', 'Agnes Dew', 'Washerwoman', 'cotG', ['work:laundry'], ['bench', 'sit:inn', 'shop'], { skin: 4, hair: 0x8a6a4a, shirt: 0x6a9ac0, pants: 0x4a5a7a, skirt: 1, apron: 0xf0f0f0 }, 'bread',
      'Knows who owns every sock in Moonwick.', ['Sheets don\'t dry themselves. Though a good breeze helps.', 'If it rains on my washing I shall have WORDS with the sky.', 'You learn a lot about people from their laundry.', 'That river\'s carried my soap-songs to the sea for twenty years.']),
  ];
  G.DEFS = DEFS;
  const GENERIC = { morning: ['Morning!', 'Lovely morning for it.', 'Up with the lark, eh?'], day: ['Good day to you!', 'Fine weather.', 'Keeping busy?'], evening: ['Evening!', 'Off to the Dragon later?', 'Lamps\'ll be lit soon.'], night: ['Bit late to be out...', '*yawn* Goodnight...', 'Mind the dark.'] };
  const REACT = {
    poly: ['...What was I just? I\'ve the strangest craving for flies.', 'I dreamt I was very small and very damp.', 'RIBBIT. I mean. Good day.'], lev: ['I do NOT care for heights!', 'Put me down gently next time!', 'Well. That\'s my heart started for the week.'],
    sleep: ['Mm? Did I nod off?', 'I was only resting my eyes.'], laugh: ['Hee! Oh, stop! My sides!', 'Whatever was so funny?'], size: ['Everything looked so... tall.', 'I felt positively enormous for a moment.'],
    wet: ['It\'s raining on me. Only on me!', 'Typical. Just washed this.'], hat: ['My hat! Come back here!', 'Blasted wind!'], dazed: ['What a peculiar daydream...', 'I feel as if someone borrowed me.', 'Did I walk here? I must have.'],
    fairy: ['Oh! A fairy! A real one!', 'Well I never... hello, little light.', 'Shoo— oh! Not a moth. Pardon me.', 'Is that... are you... goodness.'], kind: ['Bless you, little one.', 'How lovely!', 'Now that\'s a kindness.'], fire: ['FIRE! Fetch water!', 'Something\'s burning!'], bell: ['Who\'s ringing that at this hour?!', 'Marigold! Hush!'],
  };
  G.REACT = REACT;
  // ---------------------------------------------------------------- bodies (three.js boxes with vertex colours)
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true }); G.npcMat = mat;
  const col = new THREE.Color();
  const bx = (list, w, h, d, x, y, z, hex) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); col.set(hex); const n = g.attributes.position.count, ca = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ca[i * 3] = col.r; ca[i * 3 + 1] = col.g; ca[i * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); list.push(g); };
  const mesh = (list) => { const m = new THREE.Mesh(AF.addons.BGU.mergeGeometries(list), mat); m.castShadow = true; for (const g of list) g.dispose(); return m; };
  G.boxMesh = (fn, material) => { const l = []; fn((w, h, d, x, y, z, hex) => bx(l, w, h, d, x, y, z, hex)); const m = mesh(l); if (material) m.material = material; return m; };
  const dark = (hex, k = 0.8) => { col.set(hex); return ((col.r * k * 255) << 16) | ((col.g * k * 255) << 8) | (col.b * k * 255); };
  const buildBody = (L) => {
    const skin = SK[L.skin], fat = L.fat ? 0.08 : 0, g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    let l = [];
    bx(l, 0.56 + fat * 2, 0.62, 0.32 + fat, 0, 1.0, 0, L.shirt); if (L.apron) bx(l, 0.42, 0.7, 0.04, 0, 0.9, 0.18 + fat / 2, L.apron); if (L.robe) { bx(l, 0.62, 0.72, 0.4, 0, 0.36, 0, L.shirt); bx(l, 0.5, 0.06, 0.36, 0, 0.74, 0.01, 0xe0b03a); } else if (L.skirt) bx(l, 0.64, 0.5, 0.42, 0, 0.5, 0, L.pants);
    const torso = mesh(l); rig.add(torso);
    l = []; bx(l, 0.44, 0.44, 0.44, 0, 0.22, 0, skin); bx(l, 0.07, 0.09, 0.03, -0.1, 0.24, 0.225, 0x2a2018); bx(l, 0.07, 0.09, 0.03, 0.1, 0.24, 0.225, 0x2a2018); bx(l, 0.07, 0.05, 0.02, -0.15, 0.13, 0.222, 0xe89a8a); bx(l, 0.07, 0.05, 0.02, 0.15, 0.13, 0.222, 0xe89a8a);
    if (L.glasses) { bx(l, 0.14, 0.12, 0.02, -0.1, 0.24, 0.24, 0xd8e8f0); bx(l, 0.14, 0.12, 0.02, 0.1, 0.24, 0.24, 0xd8e8f0); }
    bx(l, 0.48, 0.16, 0.48, 0, 0.4, 0, L.hair); bx(l, 0.48, 0.34, 0.14, 0, 0.26, -0.18, L.hair); if (L.braids) { bx(l, 0.1, 0.4, 0.1, -0.27, 0.08, 0, L.hair); bx(l, 0.1, 0.4, 0.1, 0.27, 0.08, 0, L.hair); }
    if (L.beard) { bx(l, 0.4, 0.16, 0.08, 0, 0.06, 0.2, L.beard); if (L.longBeard) bx(l, 0.3, 0.42, 0.08, 0, -0.2, 0.2, L.beard); }
    const head = mesh(l); head.position.y = 1.31; rig.add(head);
    let hat = null;
    if (L.hat && L.hat !== 'none') { l = []; const hc = L.hatCol;
      if (L.hat === 'wiz') { bx(l, 0.8, 0.06, 0.8, 0, 0.03, 0, hc); for (let i = 0; i < 5; i++) bx(l, 0.46 - i * 0.085, 0.16, 0.46 - i * 0.085, i * 0.02, 0.14 + i * 0.16, -i * 0.015, hc); bx(l, 0.48, 0.07, 0.48, 0, 0.1, 0, 0xe0b03a); }
      else if (L.hat === 'brim') { bx(l, 0.8, 0.06, 0.8, 0, 0.03, 0, hc); bx(l, 0.46, 0.2, 0.46, 0, 0.16, 0, hc); bx(l, 0.48, 0.06, 0.48, 0, 0.09, 0, dark(hc, 0.6)); if (L.feather) bx(l, 0.05, 0.34, 0.12, 0.22, 0.3, -0.05, 0xf0e050); }
      else if (L.hat === 'straw') { bx(l, 0.9, 0.05, 0.9, 0, 0.03, 0, hc); bx(l, 0.44, 0.16, 0.44, 0, 0.13, 0, hc); }
      else if (L.hat === 'cap') { bx(l, 0.48, 0.14, 0.48, 0, 0.07, 0, hc); bx(l, 0.4, 0.05, 0.2, 0, 0.03, 0.3, dark(hc, 0.7)); }
      else if (L.hat === 'chef') { bx(l, 0.46, 0.16, 0.46, 0, 0.08, 0, hc); bx(l, 0.56, 0.22, 0.56, 0, 0.26, 0, hc); }
      else if (L.hat === 'bonnet') { bx(l, 0.52, 0.2, 0.5, 0, 0.06, -0.02, hc); bx(l, 0.56, 0.3, 0.1, 0, -0.06, -0.24, hc); }
      else if (L.hat === 'hood') { bx(l, 0.52, 0.16, 0.52, 0, 0.06, 0, hc); bx(l, 0.52, 0.5, 0.12, 0, -0.14, -0.24, hc); bx(l, 0.08, 0.4, 0.4, -0.25, -0.1, -0.04, hc); bx(l, 0.08, 0.4, 0.4, 0.25, -0.1, -0.04, hc); }
      hat = mesh(l); hat.position.y = 0.46; head.add(hat); }
    const limb = (x, y, w, h, d, hex, hand) => { const ll = []; bx(ll, w, h, d, 0, -h / 2, 0, hex); if (hand != null) bx(ll, w, 0.14, d, 0, -h - 0.02, 0, hand); const m = mesh(ll); m.position.set(x, y, 0); rig.add(m); return m; };
    const armL = limb(-0.37 - fat, 1.28, 0.17, 0.5, 0.2, L.shirt, skin), armR = limb(0.37 + fat, 1.28, 0.17, 0.5, 0.2, L.shirt, skin);
    const legL = limb(-0.14, 0.7, 0.22, 0.58, 0.24, L.pants, 0x3a2a20), legR = limb(0.14, 0.7, 0.22, 0.58, 0.24, L.pants, 0x3a2a20);
    if (L.robe) { legL.scale.set(0.8, 1, 0.8); legR.scale.set(0.8, 1, 0.8); }
    g.traverse((o) => { o.userData.noCull = false; });
    return { g, rig, torso, head, hat, armL, armR, legL, legR };
  };
  // little creatures for polymorph
  const critter = (kind) => G.boxMesh((b) => {
    if (kind === 'frog') { b(0.5, 0.3, 0.5, 0, 0.18, 0, 0x5ab04a); b(0.4, 0.2, 0.3, 0, 0.36, 0.14, 0x6ac05a); b(0.12, 0.12, 0.12, -0.14, 0.5, 0.2, 0xf0f0d0); b(0.12, 0.12, 0.12, 0.14, 0.5, 0.2, 0xf0f0d0); b(0.06, 0.07, 0.03, -0.14, 0.5, 0.265, 0x101010); b(0.06, 0.07, 0.03, 0.14, 0.5, 0.265, 0x101010); b(0.18, 0.1, 0.3, -0.3, 0.06, -0.05, 0x4a9a3a); b(0.18, 0.1, 0.3, 0.3, 0.06, -0.05, 0x4a9a3a); }
    else if (kind === 'chicken') { b(0.36, 0.34, 0.5, 0, 0.36, 0, 0xf4efe4); b(0.24, 0.26, 0.24, 0, 0.62, 0.2, 0xf4efe4); b(0.1, 0.08, 0.12, 0, 0.6, 0.37, 0xe8a030); b(0.08, 0.1, 0.16, 0, 0.78, 0.2, 0xd03a3a); b(0.3, 0.26, 0.14, 0, 0.5, -0.28, 0xe8e0d0); b(0.06, 0.2, 0.06, -0.08, 0.1, 0, 0xe8a030); b(0.06, 0.2, 0.06, 0.08, 0.1, 0, 0xe8a030); }
    else { b(0.5, 0.4, 0.7, 0, 0.36, 0, 0xf0a8b0); b(0.4, 0.36, 0.3, 0, 0.44, 0.42, 0xf0a8b0); b(0.2, 0.14, 0.08, 0, 0.4, 0.6, 0xe08a98); b(0.1, 0.12, 0.06, -0.14, 0.66, 0.4, 0xe08a98); b(0.1, 0.12, 0.06, 0.14, 0.66, 0.4, 0xe08a98); for (const [x, z] of [[-0.16, 0.24], [0.16, 0.24], [-0.16, -0.24], [0.16, -0.24]]) b(0.12, 0.18, 0.12, x, 0.09, z, 0xe08a98); }
  });
  // ---------------------------------------------------------------- roads as a graph
  const NODE = P.N, ADJ = {}; for (const e of P.E) { const a = NODE[e[0]], b = NODE[e[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); (ADJ[e[0]] = ADJ[e[0]] || []).push([e[1], d]); (ADJ[e[1]] = ADJ[e[1]] || []).push([e[0], d]); }
  const nearEdge = (x, z) => { let best = null, bd = 1e9; for (const e of P.E) { const a = NODE[e[0]], b = NODE[e[1]], d = P.segD(x, z, a[0], a[1], b[0], b[1]); if (d < bd) { bd = d; const t = P._t; best = { a: e[0], b: e[1], t, q: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], d }; } } return best; };
  const dijk = (src) => { const dist = {}, prev = {}, Q = new Set(Object.keys(NODE)); for (const k of Q) dist[k] = 1e9; for (const [k, d] of src) dist[k] = d; while (Q.size) { let u = null, ud = 1e9; for (const k of Q) if (dist[k] < ud) { ud = dist[k]; u = k; } if (!u) break; Q.delete(u); for (const [v, w] of ADJ[u] || []) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } } return { dist, prev }; };
  const route = (from, to) => {
    const A = nearEdge(from[0], from[1]), B = nearEdge(to[0], to[1]), out = [];
    if (Math.hypot(from[0] - to[0], from[1] - to[1]) < 7) return [to];
    if ((A.a === B.a && A.b === B.b)) return [A.q, B.q, to];
    const na = NODE[A.a], nb = NODE[A.b], la = Math.hypot(na[0] - nb[0], na[1] - nb[1]);
    const R = dijk([[A.a, A.t * la], [A.b, (1 - A.t) * la]]); const ma = NODE[B.a], mb = NODE[B.b], lb = Math.hypot(ma[0] - mb[0], ma[1] - mb[1]);
    let end = R.dist[B.a] + B.t * lb < R.dist[B.b] + (1 - B.t) * lb ? B.a : B.b; const chain = []; for (let k = end; k; k = R.prev[k]) chain.unshift(k);
    out.push(A.q); for (const k of chain) out.push([NODE[k][0], NODE[k][1]]); out.push(B.q, to); return out;
  };
  G.route = route;
  // ---------------------------------------------------------------- outdoor spots + routes
  const S = (name, x, z, o = {}) => G.addSpot(name, x, null, z, Object.assign({ kind: 'stand', out: 1 }, o));
  AF.onBuild('folk-spots', 430, () => {
    for (const [x, z] of [[-3, 8], [3, 14], [-6, 12], [7, 8], [1, 18], [-2, 3], [8, 10], [-8, 8]]) S('square', x, z, { yaw: Math.atan2(-x, 10 - z) });
    for (const [x, z] of [[-18, 30], [16, 44], [-30, 28], [28, 30], [34, 52], [-12, 34]]) S('play', x, z, { kind: 'play' });
    for (const [x, z] of [[21, 57], [-44, -30], [36, -18], [-58, -52], [70, 30], [-26, 70]]) S('play2', x, z, { kind: 'play' });
    for (const [x, z, y] of [[24, 70, 0.3], [70, 80, -1.2], [44, 62, 2.6], [16, 96, 1.2]]) S('pondside', x, z, { yaw: y });
    S('gatewatch', 2.5, -88.5, { yaw: 0 }); S('gatewatch', -2.5, -87, { yaw: 0 }); S('stonespot', -57, -55, { yaw: -2.4 }); S('gravespot', -26, 58, { yaw: 0 });
    for (const [x, z] of [[-94, 50], [-72, 55], [-90, 66], [-70, 66]]) S('fieldwork', x, z, { kind: 'work' });
    S('gardenspot', 12, -36, { kind: 'work', yaw: 1 }); S('gardenspot', -7, 27, { kind: 'work' });
    G.addSpot('hallspot', P.CRAG[0], G.spire.fy(0), P.CRAG[1] + 2.5, { place: 'spire', floor: 0, yaw: 0, kind: 'stand' });
    for (const k in G.spots) for (const s of G.spots[k]) if (s.y == null) s.y = W.groundY(s.x, s.z);
    G.routes = { post: ['bakery', 'apoth', 'inn', 'tailor', 'cotA', 'smithy', 'carp', 'store', 'cotC', 'cotE', 'cotG'].map((id) => G.places[id].door), patrol: ['sq', 'n1', 'n2', 'gate', 'n2', 'n1', 'sq', 'e1', 'e2', 'br0', 'e2', 'e2s', 'e2', 'e1', 'sq', 's1', 's2', 's3', 's2', 'chap', 's2', 's1', 'sq', 'w1', 'w2', 'w3', 'w2', 'w1'].map((k) => [NODE[k][0] + 1, NODE[k][1] + 1]),
      lamps: AF.lights.filter((l) => l.post).map((l) => [l.x + 0.8, l.z + 0.6]).filter((p) => Math.hypot(p[0], p[1] - 10) < 70) };
  });
  // ---------------------------------------------------------------- make them
  const mk = (def) => {
    const B = buildBody(def.look), sc = def.look.scale || 1;
    const n = Object.assign({ def, id: def.id, name: def.name, body: { x: 0, y: 1, z: 0, vy: 0, r: 0.26, h: 1.5 * sc, onGround: true }, yaw: 0, pose: 'stand', phase: Math.random() * 6, state: 'idle', path: [], pi: 0, spot: null, inPlace: null, upper: false, fx: {}, mood: 0, friend: 0, met: false, speed: def.kid ? 2.4 : 1.7, sc, scaleNow: sc, lev: 0, stuck: 0, lastD: 1e9, think: Math.random() * 2, talkT: 0, barkT: 5 + Math.random() * 20, lineI: 0, hatOn: true, wait: 0, routeI: 0, visible: true }, B);
    n.g.scale.setScalar(sc); AF.scene.add(n.g); NPCS.push(n); G.npc[def.id] = n; return n;
  };
  const freeSpot = (name, n) => { const L = G.spots[name]; if (!L || !L.length) return null; const k = (AF.hash2(AF.time.day * 31 + (AF.time.hours | 0), n.idx * 7 + name.length) * L.length) | 0; for (let i = 0; i < L.length; i++) { const s = L[(k + i) % L.length]; if (!s.user || s.user === n) return s; } return L[k]; };
  const homeSpot = (n, bed) => { const h = n.def.home; if (h === 'spire') return freeSpot(n.def.wizard ? 'wizbed' : 'hallspot', n); const L = G.spots['bed:' + h] || []; const mates = NPCS.filter((m) => m.def.home === h); const i = mates.indexOf(n); if (bed && L[i]) return L[i]; return (G.spots['home:' + h] || G.spots['sit:' + h] || L)[0] || { x: G.places[h].inside[0], y: G.places[h].y, z: G.places[h].inside[1], place: h, yaw: 0, kind: bed ? 'bed' : 'stand', name: 'floor' }; };
  // what should this person be doing at this hour?
  const plan = (n) => {
    const d = n.def, o = (AF.hash2(n.idx, 3) - 0.5) * 0.7, h = (AF.time.hours + 24) % 24, kid = d.kid;
    if (G.festival) return { spot: freeSpot('square', n), pose: 'dance' };
    if (d.wizard && !G.wizardAwake) return { spot: freeSpot('wizbed', n), pose: 'sleep' };
    { const q = G.quirkPlan && G.quirkPlan(n, h); if (q) return q; }
    if (d.wizard) { if (h < 6 || h >= 23) return { spot: freeSpot('wizbed', n), pose: 'sleep' }; if (h >= 19) return { spot: freeSpot('orrery', n) }; if (h > 10 && h < 16) return { spot: freeSpot('square', n) }; return { spot: freeSpot(h < 10 ? 'study' : 'library', n) }; }
    const wake = (kid ? 7.2 : 6.3) + o, bedT = (kid ? 19.8 : 21.6) + o;
    if (h < wake || h >= bedT) return { spot: homeSpot(n, true), pose: 'sleep' };
    if (h < wake + 0.8) return { spot: homeSpot(n, false) };
    const blk = h < 12 + o ? 0 : h < 13.2 + o ? 1 : h < 17.6 + o ? 2 : 3;
    if (blk === 1) return { spot: freeSpot(kid ? 'square' : ['square', 'bench', 'shop', 'sit:inn'][(n.idx + AF.time.day) % 4], n) };
    const list = blk === 3 ? d.leisure : d.work, name = list[(n.idx + AF.time.day * 3 + blk + ((h * 0.7) | 0)) % list.length];
    if (name.startsWith('route:')) return { route: name.slice(6) };
    return { spot: freeSpot(name, n) || freeSpot('square', n) };
  };
  const wp = (p, o) => Object.assign({ x: p[0], z: p[1] }, o || {});
  const goTo = (n, spot) => {
    if (n.spot && n.spot.user === n) n.spot.user = null;
    n.spot = spot; spot.user = n; n.path = []; n.pi = 0; n.state = 'walk'; n.stuck = 0; n.lastD = 1e9; n.pose = 'walk';
    let from = [n.body.x, n.body.z];
    if (n.inPlace && n.inPlace === spot.place && !n.upper && !spot.up && !(spot.floor > 0)) { n.path.push(wp([spot.x, spot.z], { arrive: 1 })); return; }
    if (n.inPlace) { const pl = G.places[n.inPlace]; if (n.upper) n.path.push(wp(pl.inside, { snap: 1, y: pl.y })); else n.path.push(wp(pl.inside)); n.path.push(wp(pl.door, { leave: 1 })); from = pl.door; }
    const to = spot.place ? G.places[spot.place].door : [spot.x, spot.z];
    for (const p of route(from, to)) n.path.push(wp(p));
    if (spot.place) { const pl = G.places[spot.place]; n.path.push(wp(pl.inside, { enter: spot.place })); if (spot.up || spot.floor > 0) n.path.push(wp([spot.x, spot.z], { snap: 1, y: spot.y, upper: 1, arrive: 1 })); else n.path.push(wp([spot.x, spot.z], { arrive: 1 })); }
    else n.path[n.path.length - 1].arrive = 1;
  };
  G.npcGoTo = goTo;
  const settle = (n) => {
    const s = n.spot; n.state = 'idle'; if (!s) { n.pose = 'stand'; return; }
    n.body.x = s.x; n.body.z = s.z; n.yaw = s.yaw || 0; const k = n.wantPose || (s.kind === 'sit' ? 'sit' : s.kind === 'bed' ? 'sleep' : (s.kind === 'work' || s.kind === 'counter') ? 'work' : s.kind === 'fish' ? 'fish' : s.kind === 'play' ? 'play' : 'stand');
    n.pose = k; n.body.y = k === 'sit' ? s.y - 0.58 * n.sc : k === 'sleep' ? s.y : AF.surfaceBelow(s.x, s.z, (s.y ?? n.body.y) + 1.2, 4);
  };
  const place = (n, spot, pose) => { if (n.spot && n.spot.user === n) n.spot.user = null; n.spot = spot; spot.user = n; n.inPlace = spot.place || null; n.upper = !!(spot.up || spot.floor > 0); n.wantPose = pose; n.body.y = spot.y; settle(n); };
  G.npcPlace = place;
  AF.onBuild('folk', 650, () => { DEFS.forEach((d, i) => { const n = mk(d); n.idx = i; }); for (const n of NPCS) { const p = plan(n); if (p.spot) place(n, p.spot, p.pose); else { const r = G.routes[p.route]; n.body.x = r[0][0]; n.body.z = r[0][1]; n.body.y = W.groundY(r[0][0], r[0][1]); n.route = p.route; } }
    G.critterMeshes = {}; });
  // ---------------------------------------------------------------- effects
  G.npcFx = (n, kind, secs, arg) => { if (n.possessed) return false; const f = n.fx; f[kind] = { t: secs, arg };
    if (kind === 'poly') { if (!n.crit) { n.crits = {}; } const k = arg || ['frog', 'chicken', 'pig'][(Math.random() * 3) | 0]; f.poly.arg = k; if (!n.crits[k]) { n.crits[k] = critter(k); n.g.add(n.crits[k]); } for (const q in n.crits) n.crits[q].visible = q === k; n.rig.visible = false; }
    n.talkT = 0; return true; };
  const endFx = (n, kind) => { delete n.fx[kind]; if (kind === 'poly') { n.rig.visible = true; for (const q in n.crits) n.crits[q].visible = false; if (AF.fx) AF.fx.smoke(n.body.x, n.body.y + 0.8, n.body.z, { n: 6, size: 1.1, dark: 0.1, rise: 1, life: 0.9, a: 0.5 }); }
    if (kind === 'lev') { n.body.vy = 0; }
    const L = REACT[kind === 'size' ? 'size' : kind]; if (L && G.ui) G.ui.bubble(n, L[(Math.random() * L.length) | 0], 3.5); n.think = 0.5; n.emote = kind === 'laugh' || kind === 'kind' ? '♥' : '!'; n.emoteT = 2; };
  G.react = (n, key, emote) => { const L = REACT[key]; if (L && G.ui) G.ui.bubble(n, L[(Math.random() * L.length) | 0], 3.2); if (emote) { n.emote = emote; n.emoteT = 2.5; } };
  G.hatOff = (n, vx, vz) => { if (!n.hat || !n.hatOn || n.possessed) return false; n.hatOn = false; const h = n.hat; h.getWorldPosition(h.position); AF.scene.add(h); h.scale.setScalar(n.sc); n.hatFly = { vx, vy: 5, vz, spin: 6, t: 0 }; G.react(n, 'hat', '!'); return true; };
  // ---------------------------------------------------------------- the daily tick
  const tmp = new V3();
  const stepTo = (n, w, dt, near) => {
    const b = n.body, dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz);
    if (w.snap) { b.x = w.x; b.z = w.z; b.y = w.y; n.upper = !!w.upper; return true; }
    if (d < 0.35) return true;
    const sp = n.speed * (n.fx.size ? n.fx.size.arg : 1) * dt * (near ? 1 : 2.6), k = Math.min(1, sp / d); n.yaw += AF.angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 9);
    if (near) { AF.moveBody(b, dx * k, dz * k, dt); } else { b.x += dx * k; b.z += dz * k; b.y = AF.surfaceBelow(b.x, b.z, b.y + 1.3, 8); }
    if (d < n.lastD - 0.02) { n.lastD = d; n.stuck = 0; } else { n.stuck += dt; if (n.stuck > (n.inPlace ? 0.9 : 2.2)) { G.stuckN = (G.stuckN || 0) + 1; (G.stuckLog = G.stuckLog || []).push(n.id + '@' + b.x.toFixed(0) + ',' + b.z.toFixed(0) + '>' + w.x.toFixed(0) + ',' + w.z.toFixed(0)); b.x = w.x; b.z = w.z; b.y = AF.surfaceBelow(w.x, w.z, b.y + 3, 12); n.stuck = 0; return true; } }
    return false;
  };
  AF.onTick('folk', 300, (dt) => {
    if (!AF.ready) return; const cam = AF.camera.position, t = AF.clock.t;
    for (const n of NPCS) {
      const b = n.body, f = n.fx, dc = Math.hypot(b.x - cam.x, b.z - cam.z, b.y - cam.y), near = dc < 70;
      for (const k in f) { f[k].t -= dt; if (f[k].t <= 0) endFx(n, k); }
      if (n.emoteT > 0) n.emoteT -= dt;
      // the hat, if the wind has it
      if (n.hatFly) { const h = n.hat, hf = n.hatFly; hf.t += dt; if (hf.vy !== null) { hf.vy -= 9 * dt; h.position.x += hf.vx * dt; h.position.y += hf.vy * dt; h.position.z += hf.vz * dt; h.rotation.y += hf.spin * dt; const gy = AF.surfaceBelow(h.position.x, h.position.z, h.position.y + 0.5, 30); if (h.position.y <= gy + 0.02 && hf.vy < 0) { h.position.y = gy + 0.02; hf.vy = null; } }
        else if (!n.possessed && !f.poly && !f.lev && !f.sleep) { const d = Math.hypot(h.position.x - b.x, h.position.z - b.z); if (d < 0.8 || hf.t > 25) { n.head.add(h); h.position.set(0, 0.46, 0); h.rotation.set(0, 0, 0); h.scale.setScalar(1); n.hatOn = true; n.hatFly = null; n.think = 0.2; } else { n.pose = 'walk'; n.state = 'fetch'; stepTo(n, { x: h.position.x, z: h.position.z }, dt * 1.5, near); } } }
      let pose = n.pose, yo = 0;
      if (n.possessed) { /* the player drives */ }
      else if (f.lev) { n.lev = Math.min(3.2, n.lev + dt * 2.2); pose = 'flail'; }
      else if (n.lev > 0) { n.lev = Math.max(0, n.lev - dt * 3); pose = 'flail'; }
      else if (f.sleep) pose = 'sleep'; else if (f.laugh) pose = 'laugh';
      else if (f.poly) { if (!f.poly.hop || f.poly.hop <= 0) { f.poly.hop = 0.7 + Math.random(); n.yaw += (Math.random() - 0.5) * 2.5; } f.poly.hop -= dt; const hp = Math.max(0, Math.sin(f.poly.hop * 5)); AF.moveBody(b, Math.sin(n.yaw) * hp * dt * 1.6, Math.cos(n.yaw) * hp * dt * 1.6, dt); yo = hp * 0.25; pose = 'stand'; }
      else if (n.talkT > 0) { n.talkT -= dt; pose = n.pose === 'sit' || n.pose === 'sleep' ? n.pose : 'stand'; if (G.player && n.pose !== 'sit' && n.pose !== 'sleep') n.yaw += AF.angDiff(n.yaw, Math.atan2(G.player.pos.x - b.x, G.player.pos.z - b.z)) * Math.min(1, dt * 6); }
      else if (n.state === 'fetch') { if (!n.hatFly) n.state = 'idle'; }
      else if (n.follow > 0 && G.player) { n.follow -= dt; const pp = G.player.host ? G.player.host.body : G.player.pos, dx = pp.x - b.x, dz = pp.z - b.z, d = Math.hypot(dx, dz); n.yaw += AF.angDiff(n.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 8); if (d > 1.7 && d < 40) { const k = n.speed * (n.followSp || 1.7) * dt / d; AF.moveBody(b, dx * k, dz * k, dt); pose = 'walk'; } else pose = 'play'; if (n.follow <= 0 || d >= 40) { n.follow = 0; if (n.spot && n.spot.user === n) n.spot.user = null; n.spot = null; n.inPlace = null; n.think = 0.3; n.state = 'idle'; n.pose = 'stand'; } }
      else {
        n.think -= dt;
        if (n.think <= 0) { n.think = 3 + Math.random() * 3; const p = plan(n);
          if (p.route) { if (n.route !== p.route || n.state !== 'walk') { n.route = p.route; const r = G.routes[p.route]; n.routeI = (n.routeI || 0) % r.length; if (n.spot && n.spot.user === n) n.spot.user = null; const fake = { x: r[n.routeI][0], z: r[n.routeI][1], y: null, kind: 'stand', yaw: n.yaw, name: 'route' }; fake.y = W.groundY(fake.x, fake.z); goTo(n, fake); n.spot.user = null; } }
          else if (p.spot && (p.spot !== n.spot)) { n.route = null; n.wantPose = p.pose; goTo(n, p.spot); }
          else if (p.spot && n.state === 'idle') { n.wantPose = p.pose; if (p.pose && n.pose !== p.pose) settle(n); if (p.spot.kind === 'play' && Math.random() < 0.4) { const L = G.spots[p.spot.name]; goTo(n, L[(Math.random() * L.length) | 0]); } } }
        if (n.state === 'walk') { const w = n.path[n.pi];
          if (!w) { n.state = 'idle'; settle(n); }
          else if (n.wait > 0) { n.wait -= dt; pose = 'stand'; }
          else if (stepTo(n, w, dt, near)) { n.lastD = 1e9; if (w.enter) n.inPlace = w.enter; if (w.leave) { n.inPlace = null; n.upper = false; } n.pi++; if (w.arrive || n.pi >= n.path.length) { if (n.route) { n.routeI = (n.routeI + 1) % G.routes[n.route].length; n.state = 'idle'; n.pose = 'work'; n.think = 1.6; if (n.route === 'lamps' && AF.fx) AF.fx.sparks && AF.fx.sparks(b.x, b.y + 2.6, b.z, { n: 4 }); } else settle(n); } pose = n.pose; }
          else pose = 'walk'; }
        // notice the fairy
        n.barkT -= dt; if (n.barkT <= 0 && G.player && G.ui) { n.barkT = 14 + Math.random() * 30; const pl = G.player; if (near && !pl.host && n.pose !== 'sleep' && Math.hypot(pl.pos.x - b.x, pl.pos.z - b.z, pl.pos.y - b.y - 1) < 5 && !n.met) { G.react(n, 'fairy', '!'); } else if (near && dc < 26 && n.pose !== 'sleep' && Math.random() < 0.35) { const o = NPCS.find((m) => m !== n && m.pose !== 'sleep' && Math.hypot(m.body.x - b.x, m.body.z - b.z) < 3.5); if (o) G.ui.bubble(n, n.def.lines[(Math.random() * n.def.lines.length) | 0], 4); } }
      }
      // draw
      const vis = dc < 190; if (n.g.visible !== vis) n.g.visible = vis; if (!vis) continue;
      const tgt = (f.size ? f.size.arg : 1) * n.sc; n.scaleNow += (tgt - n.scaleNow) * Math.min(1, dt * 4); n.g.scale.setScalar(n.scaleNow);
      const moving = pose === 'walk'; n.phase += dt * (moving ? 9 * n.speed / 1.7 : 2);
      const s = Math.sin(n.phase), R = n.rig; let ax = 0, lx = 0, ry = 0, rx = 0, rz = 0, py = 0, pz = 0, hx = 0, al = 0, ar = 0;
      if (moving) { lx = s * 0.75; ax = -s * 0.6; py = Math.abs(Math.cos(n.phase)) * 0.04; if (n.sleepwalk) { ax = 0; al = ar = -1.5; hx = 0.25; lx *= 0.5; } }
      else if (pose === 'sit') { n.legL.rotation.x = n.legR.rotation.x = -1.5; }
      else if (pose === 'sleep') { rx = -Math.PI / 2; py = 0.18; pz = 0.85; }
      else if (pose === 'work') { al = -0.9 + Math.sin(t * 5 + n.idx) * 0.5; ar = -0.9 + Math.cos(t * 5 + n.idx) * 0.5; hx = 0.15; }
      else if (pose === 'fish') { al = -1.1; ar = -1.1 + Math.sin(t * 0.7) * 0.1; }
      else if (pose === 'dance') { py = Math.abs(Math.sin(t * 6 + n.idx)) * 0.22; al = -2.6 + Math.sin(t * 6) * 0.4; ar = -2.6 - Math.sin(t * 6) * 0.4; ry = Math.sin(t * 2 + n.idx) * 0.8; lx = Math.sin(t * 6 + n.idx) * 0.3; }
      else if (pose === 'flail') { al = -2.4 + Math.sin(t * 14) * 0.7; ar = -2.4 + Math.cos(t * 13) * 0.7; lx = Math.sin(t * 11) * 0.6; rz = Math.sin(t * 3) * 0.25; }
      else if (pose === 'laugh') { py = Math.abs(Math.sin(t * 16)) * 0.06; hx = -0.3; al = -0.5; ar = -0.5; rz = Math.sin(t * 16) * 0.05; }
      else if (pose === 'play') { py = Math.abs(Math.sin(t * 4 + n.idx)) * 0.12; al = -1.6 + Math.sin(t * 4) * 0.8; ar = -0.3; }
      else if (pose === 'wave') { ar = -2.7 + Math.sin(t * 9) * 0.35; }
      else if (pose === 'sneak') { hx = 0.3; al = -0.7 + Math.sin(t * 6) * 0.3; ar = -0.9; py = -0.12; }
      else if (pose === 'sigh') { hx = -0.35; al = -0.2; ar = -2.0 + Math.sin(t * 1.5) * 0.15; }
      else { py = Math.sin(t * 1.6 + n.idx) * 0.008; al = ar = Math.sin(t * 1.3 + n.idx) * 0.04; }
      if (pose !== 'sit') { n.legL.rotation.x = lx; n.legR.rotation.x = -lx; }
      n.armL.rotation.x = ax + al; n.armR.rotation.x = -ax + ar; n.head.rotation.x = hx; R.rotation.set(rx, ry, rz); R.position.set(0, py, pz);
      n.g.position.set(b.x, b.y + n.lev + yo + (n.lev > 0 ? Math.sin(t * 2.3) * 0.15 : 0), b.z); n.g.rotation.y = n.yaw;
      n.poseNow = pose;
    }
  });
  // lines for a chat
  G.npcLines = (n, as) => { const h = AF.time.hours, d = n.def; if (n.fx.poly) return [n.fx.poly.arg === 'frog' ? 'Ribbit?' : n.fx.poly.arg === 'chicken' ? 'Bu-GAWK!' : 'Oink.']; if (n.poseNow === 'sleep') return d.wizard ? [d.lines[(Math.random() * d.lines.length) | 0]] : ['Zzz... mmf... zzz...'];
    const g = GENERIC[h < 11 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night']; const first = !n.met; n.met = true; const L = [];
    if (as) L.push(g[(n.idx + as.idx) % g.length].replace(/[!.]$/, '') + ', ' + as.name.split(' ')[0] + '!'); else if (first) L.push(REACT.fairy[n.idx % REACT.fairy.length] + ' I\'m ' + d.name + '.'); else L.push(g[n.idx % g.length]);
    L.push(d.lines[n.lineI++ % d.lines.length]); return L; };
}

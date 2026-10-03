# Career Mode — "Skybound: A Life in Quidditch"

Design plan for the career mode: from the first broom lesson at Hogwarts to League Cups and the Quidditch World Cup. It draws on these references:

- **Harry Potter: Quidditch World Cup (2003).** You start in the House Cup at Hogwarts, and winning it unlocks the World Cup.
- **Harry Potter: Quidditch Champions (2024).** Career "cups" escalate in size, there are per-position skill trees, and you earn brooms.
- **NBA 2K MyCAREER.**
  - Press conferences and locker-room scrums.
  - Three reporters (softball, middle, needler).
  - Four answer tones (professional, team-first, arrogant, indifferent) that move Team Chemistry, local Fans and league-wide Fame.
  - Teammate chemistry makes teammates answer your call for the ball.
  - A walk-around pre-game area and a tunnel walk-out.
- **Harry Potter press canon.**
  - *The Daily Prophet* (sports pages and moving photographs).
  - Rita Skeeter's acid-green Quick-Quotes Quill, which writes what it wants rather than what you said.
  - *The Quibbler*'s conspiracy columns and *Witch Weekly*'s Most-Charming-Smile polls.
  - The Wizarding Wireless Network.
  - The thirteen clubs of the British and Irish Quidditch League.

---

## 1. Shape of a career

| Act | Span | What you do |
|---|---|---|
| **Prologue: Hogwarts** | Years 1–7 | Arrival, Sorting, flying lessons, house trials, three House Cup matches a year, school-year cutscenes, scouts |
| **Graduation & trials** | Summer after Year 7 | Scout letters turn into trial offers. You pick a club, sign a contract and get a kit reveal |
| **Professional** | Seasons 1–12 | 12 league matchdays a season (13-club round robin, one bye), training, press, transfers, awards |
| **Quidditch World Cup** | Summer after Season 2, then every 4 years | National call-up, group stage, knockout rounds, the final under the lights |
| **Legacy** | Retirement | Your own Chocolate Frog card, career totals, Hall of Fame |

Every match can be **played** or **simmed**. A simmed match uses team ratings plus your attributes and still produces stats, news and an interview, so the prologue can be as long or short as the player wants.

## 2. Creating your player

- **Name** (typed), **pronouns** (he/she/they, used by every reporter and headline), and **body** (two rigged CC0 bodies).
- **Skin tone** (5), **hair** (6 sculpted styles, 8 colours), **eye colour**.
- **House:** pick one, or let the Sorting Hat choose and weigh a "not Slytherin" plea, as in the books.
- **Position: Chaser or Seeker.** This sets your starting attribute spread. You can still swap to Seeker in a match.

## 3. Attributes and progression (0–99, 2K-style overall)

| Attribute | In-match effect |
|---|---|
| Speed | cruise and boost top speed |
| Handling | yaw and pitch rate, air-brake turn |
| Shooting | shot power, width of the perfect-release window, Keeper save chance against you |
| Passing | pass homing strength, call-for-pass acceptance |
| Defence | steal lunge range and success |
| Stamina | boost drain and regen, flair (energy) gain |
| Seeking | Snitch-ring focus gain, catch window |

- **XP** comes from match rating (0–10), goals, assists, steals, finishers, catches, training drills and story choices.
- **Each level** gives skill points to spend on attributes. Attributes are capped by a potential that grows with age and Fame.
- **Brooms** are owned items with their own stats: Shooting Star → Cleansweep Seven → Comet 260 → Nimbus 2000 → Nimbus 2001 → Firebolt. Buy them with Galleons at the Broomstick Emporium, or win them through sponsor deals.

## 4. Reputation (what interviews and choices move)

- **Fame** (league-wide) affects sponsors, contract value, Witch Weekly polls and how loud the crowd chants for you.
- **Fans** (your club's or house's own supporters) grow the home flair bonus.
- **Team Chemistry** is a relationship score with each named teammate. The team average sets how often teammates answer CALL and how fast.
- **Coach/Captain Trust** affects captaincy, game-plan options, contract renewals and selection for big matches.
- **Persona** is the running tally of your answer tones. It gives you a media label and a small perk:
  - *Gracious*: "The Golden Boy/Girl/Star". Sponsor offers come sooner and Coach Trust holds steady.
  - *Team-first*: "The Captain". Teammates answer CALL faster.
  - *Showboat*: "The Showman". +15% flair from finishers.
  - *Fiery*: "The Firebrand". Extra energy when trailing, but rival Beaters target you.
  - *Deflect*: "The Enigma". Fame swings less, and the Quill twists your quotes less often.

## 5. Prologue: the school years

Each year is a chapter of calendar beats. Cutscenes are rendered in-engine: real 3D sets with rigged characters, letterboxed, with skippable dialogue and choices.

| Year | Beats |
|---|---|
| 1 | Boats across the Black Lake to the lit castle, Sorting in the Great Hall, first flying lesson (a playable ring tutorial on the pitch), the house captain spots you |
| 2 | Start-of-term feast, **house trials** (drill: 3 goals in 60 s, or catch the practice Snitch), Halloween feast, Match 1, Potions dungeon, Christmas in the Great Hall, Match 2, Match 3, House Cup leaving feast |
| 3 | First **Hogsmeade** weekend (Three Broomsticks, butterbeer, snow), a Charms class duel of wits with your rival |
| 4 | **The Yule Ball**: silver-frosted Great Hall, a dance with your choice of partner, the rival's jealousy |
| 5 | O.W.L. study night in the common room, the captain graduates and you're offered the armband (if Coach Trust ≥ 60) |
| 6 | Slug-Club-style Christmas party, the first **scout letters** in the Owl Post |
| 7 | N.E.W.T. pressure, the final House Cup run, graduation, trial offers |

**Story choices** in these scenes change relationships, attributes and Persona. Examples:

- Sneak out to practise at night: +Handling, a risk of points docked.
- Help your friend revise: +Chemistry.
- Rise to the rival's taunt: Fiery.

**The recurring cast** is original characters set in canon places:

- **Rowan Pike**: your best friend and fellow Chaser.
- **Imogen Thorne**: the house captain, who later turns up as a pro.
- **Cassius Vane**: your rival Seeker, from another house.
- **Madam Elsworth**: the flying instructor.
- **Professor Aldous Crane**: Head of House.
- **Jory Bagshot**: the student commentator.

## 6. The matchday loop (school and pro)

1. **Hub (calendar).** Shows the next fixture, plus Training, Media, Owl Post, Team, Player and Broomstick Emporium.
2. **Pre-game scrum (optional, 1 question).** A reporter catches you in the tunnel.
3. **The Locker Room: a first-person walkable 3D hub.**
   - **Teammates**, idling, chatting or sitting. **TALK** to one to get a chemistry-dependent line and pick a response: Encourage, Joke, Challenge or Plan. Teammates also hand out **Teammate Goals** ("Feed me three passes", "Score from range", "Get through without a Bludger hit") that pay Chemistry and XP.
   - **Tactics board** (enchanted chalk diagrams that redraw themselves). Pick the game plan, which changes the AI:
     - *Hawkshead Attacking Formation*: chasers push high.
     - *Porskoff Ploy*: decoy passes.
     - *Parkin's Pincer*: aggressive steals.
     - *Seeker Shield*: Beaters escort your Seeker.
   - **Broom rack**: choose a broom you own.
   - **Mirror**: change goggles and glove colours.
   - **The tunnel door**: take the pitch.
4. **Tunnel walk-out cinematic.** Light blooms at the tunnel mouth, the crowd roars, you mount and kick off.
5. **The match.** Club kits, crests, home-stadium dressing and fixture weather (golden, drizzle, night).
6. **Post-game press conference.** Three reporters raise their hands and you pick who to answer. Two questions, four tone answers each, with icons showing which stats move. A 12-second timer counts down; letting it run out means "No comment".
7. **Next morning's Prophet.**
   - Your headline, with a **moving photograph** captured from your best moment in the match.
   - The match report, quoting you (possibly Quill-twisted).
   - Around the League results, the table, and any rumours.

## 7. The press room (interview system)

- **Reporters (softball → needler).**
  - Penny Plume (WWN, warm).
  - Gideon Marsh (*Daily Prophet* Quidditch desk, analytical).
  - Cressida Fang (*Witch Weekly* gossip, with an acid-green Quick-Quotes Quill that scribbles on its own).
  - At school, Jory Bagshot asks the questions, and the *Prophet* youth desk turns up for Cup deciders.
- **Questions** are generated from what actually happened:
  - the result, margin, your goals, finisher and catch;
  - a teammate's bad game;
  - the rival, the table position, a streak;
  - an upcoming derby, a transfer rumour, a sponsor.
- **Four tones per question**: Gracious, Team-first, Showboat, Fiery/Deflect. Each has a pre-written line with variables filled in.
- **Effects** follow 2K: team-first answers raise Chemistry but trade away Fans, while arrogant answers win Fans and Fame but drain Chemistry. Needler questions double the swings.
- **The Quick-Quotes Quill.** Answers given to Cressida Fang have a twist chance, highest for Showboat and Fiery. A twisted quote prints as a sensational headline: Fame up, Chemistry with the named teammate down. That teammate may then confront you in the next locker room.

## 8. Media hub ("The Wizarding Press")

- **The Daily Prophet**: sports front page with a moving sepia photograph, the match report, Around the League, and a transfer-rumour column.
- **The Quibbler**: absurd rumours ("Nargles found in the Chudley Cannons' broom shed").
- **Witch Weekly**: Most Charming Smile poll and the Fame top-10.
- **League Table**: P / W / L / Quidditch points for and against / table points (win 3, plus 1 for a Snitch catch).
- **Fixtures & Results** for every club, and **stat leaders**: Golden Quaffle (goals), Seeker catches, Keeper saves.
- **Owl Post** inbox: letters from family, coach, captain, scouts, sponsors (broom deals), fans and rivals. Some carry choices or rewards.

## 9. The league

These are the 13 BIQL clubs, with kit colours from *Quidditch Through the Ages*.

| Club | Robes | Emblem |
|---|---|---|
| Appleby Arrows | pale blue | silver arrow |
| Ballycastle Bats | black | scarlet bat |
| Caerphilly Catapults | light green / scarlet stripes | catapult |
| Chudley Cannons | bright orange | black cannonball, double C |
| Falmouth Falcons | dark grey / white | falcon head |
| Holyhead Harpies | dark green | gold talon |
| Kenmare Kestrels | emerald | two yellow Ks |
| Montrose Magpies | black / white | magpie |
| Pride of Portree | deep purple | gold star |
| Puddlemere United | navy | crossed golden bulrushes |
| Tutshill Tornados | sky blue | double dark-blue T |
| Wigtown Wanderers | blood red | silver meat cleaver |
| Wimbourne Wasps | yellow / black hoops | wasp |

- **Contracts and money.** Contract length and weekly Galleons scale with OVR and Fame. Renewal or transfer offers arrive at the end of each season.
- **Season awards**: Golden Quaffle, Seeker of the Season, Witch Weekly Fan Favourite and the League Cup.
- **World Cup sides**: England, Ireland, Scotland, Wales, Bulgaria, Norway, Uganda, Brazil, Japan, USA, Australia, France, Germany, Peru, Egypt, Transylvania.

## 10. Presentation and graphics targets

- **Characters.**
  - Rigged CC0 humans (Quaternius Universal Base Characters) with sculpted hair and PBR skin.
  - Clothing is done in a shader (robes, shirts, ties, trousers, boots in kit colours).
  - Riders get an IK broom grip.
  - Animations come from the Universal Animation Library: idle, talk, sit, walk, jog, dance, spell-cast, interact.
  - Riders keep the verlet cloth capes.
- **Sets.**
  - Great Hall: four long tables, hundreds of floating candles, enchanted night-sky ceiling, banners, high table, stained glass.
  - Potions dungeon: cauldrons with coloured vapour, torch light.
  - Common room: fireplace, armchairs, house tapestries.
  - Hogsmeade: snowy high street, warm windows, lanterns, falling snow.
  - Yule Ball: frost, ice sculptures, silver light, dancing couples.
  - Changing rooms and club locker rooms; the press room (sponsor wall, camera flashes).
- **Camera work.** Dolly, crane and orbit shots with depth of field, letterbox, subtitles and speaker cards.
- **Moving photographs.** Small frame captures from the live match, looped in sepia like wizarding photos.

## 11. Save data

Career saves to `localStorage` (`qsb_career`). Every read and write is wrapped, and the game still runs without storage. The save holds:

- profile and appearance;
- attributes, XP and level, potential;
- Galleons and owned brooms;
- per-teammate chemistry, Fame, Fans and Coach Trust;
- persona counts;
- calendar pointer and story flags;
- league tables, fixtures and results;
- the last 40 articles, the inbox and career history.

It autosaves after every event.

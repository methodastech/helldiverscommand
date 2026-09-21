# Helldive Command

A HELLDIVERS 2 fan site framed as the **Helldiver Longevity Program**: classified continuation
training for divers who intend to be reinforced less. Live galactic war telemetry, the full stratagem
codex, weapon and enemy databases, current meta loadouts, the real in-mission terminal puzzles phase
for phase, and an arcade that drills stratagem inputs into muscle memory.
The Democracy Officer briefs first-time visitors; a training record tracks 13 certifications.

Static site. No build step, no framework, no bundler. Open `index.html` on any static host.

## Pages

| File | What it is |
|---|---|
| `index.html` | Hero film, the deck menu, "Featured now" (a code to drill, the Major Order, an enemy weak point with its zone map), Super Helldive facts, doctrine list with film, faction briefs, codex tiles, loadouts, enlist and corrections desk, arcade teaser |
| `stratagems.html` | All 93 stratagems: input code, cooldown, uses, call-in. Filter, search, click any card to drill it |
| `arsenal.html` | 109 weapons with damage, penetration, capacity, fire rate, source warbond, tier and per-faction rating |
| `enemies.html` | 57 enemies with threat rating, weak point, fastest kill, plus faction doctrine |
| `meta.html` | Tier lists (overall and per faction), nine loadouts, and a loadout builder that grades coverage |
| `intel.html` | Difficulty table, every booster, all warbonds with buying advice, glossary, sources and disclaimer |
| `arcade.html` | Throw Range (3D, three.js on demand: grenade fuses and stratagem call-in against a moving Charger). Stratagem Hero rebuilt as the Super Citizen cabinet, rule for rule (10 s rounds, +1 s per code, 5 pts per arrow, round / time / perfect bonus, 6 codes in round 1 growing to 16, Get Ready and Game Over screens, initials on the high-score table, the 1-in-8192 Illumination Flare). Code Rush, Enemy Intel Drill, Hellpod Reflex. Field Drill is a mission HUD simulation: objectives, mission clock, minimap, stratagem slots with real cooldowns on a ×6 clock and Eagle uses, threat meter, deaths and reinforcements, throw and delivery effects, command radio |
| `armory.html` | 41 armour sets with real body renders, armour rating, speed, stamina, passive, plus all 30 passives explained with class availability |
| `warbonds.html` | All 24 warbonds: real cover, kind, price, release date, contents page by page with item images and medal costs (the two Legendary crossovers list contents from Arrowhead's announcements), a rating driven by the weapon tier list, and a buy order |
| `manual.html` | Field manual: currencies and caps, samples per difficulty, ship modules with an upgrade order, level unlocks, default PC and PS5 controls, operation modifiers, mission rules |
| `terminals.html` | Field Ops: eleven in-mission terminal objectives rebuilt from the real step lists with phase counters (2 / 3) and the game's W A S D prompt: Extraction, ICBM fuel pipe routing, E-710 flow, SAM site sub-system switches, the Cyborg assembly security grid, relay dials, fuses, valves, launch codes, Hellbomb. Travel legs, patrol interrupts between stations, Super Destroyer radio |
| `blueberries.html` | The personnel file on new Helldivers: field identification, testimonials, hug etiquette and approval matrix, the five stages of watching a Helldiver die, what Command says, and a testimonial box stored on the device |
| `hellpod.html` | Annotated SVG cross-sections of the personnel and equipment Hellpods, the drop sequence, every variant, ship module effects, and field-observed facts kept apart from Ministry claims |
| `armory.html` | 41 armour sets with real body renders, armour rating, speed, stamina, passive, plus all 30 passives explained with class availability |
| `warbonds.html` | All 24 warbonds: real cover, kind, price, release date, contents page by page with item images and medal costs (the two Legendary crossovers list contents from Arrowhead's announcements), a rating driven by the weapon tier list, and a buy order |
| `manual.html` | Field manual: currencies and caps, samples per difficulty, ship modules with an upgrade order, level unlocks, default PC and PS5 controls, operation modifiers, mission rules |
| `terminals.html` | Field Ops: seven in-mission terminal objectives rebuilt from the real step lists (login codes, diagnostics, fuse resets, signal tuning, radar dish heading, valves, launch-code dials, Hellbomb arming and escape, SEAF shell loading) |

## Structure

```
assets/
  core.css      design tokens, reset, chrome, nav, footer, primitives
  pages.css     page-level components (hero, war board, grids, games, builder)
  core.js       boot sequence, nav/footer injection, mobile tab bar and More sheet,
                global quick search (/ or Cmd+K), install hooks, reveals, decode type,
                counters, crosshair cursor, live war API client
  galaxy.js     Three.js galactic war map (ES module, three via import map)
  home.js       home page wiring
  stratagems.js codex page + drill modal
  arsenal.js    weapon database
  enemies.js    bestiary
  meta.js       tier lists, loadouts, loadout builder
  arcade.js     five drills, hold-to-input mode, keyboard router
  console3d.js  Field Ops 3D console: WebGL chassis and scene plus CSS3D screen (ES module, on demand)
  range.js      Throw Range: three.js scene, grenade and stratagem physics, scoring (ES module, loaded on demand)
  terminals.js  Field Ops step engine, puzzle factories (pipes, switches, security grid, relay dial) and eleven missions
  blueberries.js the Blueberries copy and the on-device testimonial box
  stars.js      subpage header starfield with hellpod streaks
  icons/        community SVG icons, used only for the 7 stratagems the wiki has no icon for
  img/strat/    86 real in-game stratagem icons (WebP, from the wiki)
  img/armor/    41 armour body renders
  img/wbitems/  513 warbond item previews and covers
  img/          255 WebP images: weapons, enemies, warbond covers, boosters,
                difficulty badges, faction marks, cinematic art (wiki uploads, resized)
  sfx/          dir_*.mp3 and gameover_*.mp3 are the real in-game input beeps
                and Stratagem Hero jingles; ready / deny / menu_* / throw are cut
                from the community raw SFX dump and assigned by analysis
data/
  stratagems.js 93 stratagems: name, code, category, cooldown, uses, call-in, icon
  weapons.js    109 weapons: stats from game data + curated tier and faction ratings
  enemies.js    57 enemies: faction, size, threat, weak point, counter
  boosters.js   17 boosters
  meta.js       factions, doctrine, loadouts, rules, difficulty, warbonds, glossary
  images.js     image manifest (name to file) for the img/ folders, incl. strat icons
  armory.js     41 armour sets + 30 passives
  warbonds.js   24 warbonds with pages, items, costs, covers
  manual.js     level unlock ladder, ship module tiers
  comms.js      Super Earth Command voice layer: order templates, radio callouts,
                verbatim Training Manual tips, Democracy Officer lines, cabinet strings, ranks
  quotes.js     138 Democracy Officer, 94 Ship Master and 67 Service Technician subtitles (wiki),
                Training Manual tips, and original one-liners in the community's spirit
_head.part      shared <head> fragment used when the pages were generated
manifest.webmanifest, sw.js, assets/img/app/   installable app shell: pages network-first,
                versioned assets cache-first, cross-origin requests untouched
tools/          recovered data pipeline, wiki caches, replica references (see tools/README.md)
HANDOVER.md     the first file a new session reads
```

## The Longevity Program

The fiction: basic training in the game takes four minutes, so the Ministry of Defense runs a
classified continuation course. `core.js` provides the pieces: the Democracy Officer's first-visit
briefing (`HD.intro()`, flag `hd_intro`), the training record (`HD.record()`) with 13 certifications
read from the scores the drills already save (`hd_cab_hs`, `hd_cr_best`, `hd_qz_best`, `hd_rx_best`,
`hd_fd_best`, `hd_drill_best`, `hd_ops_*`, plus counters `hd_flash_n`, `hd_enemy_n`, `hd_blue`, `hd_pod`),
Longevity grades from "Reinforcement liability" to "Legally immortal", and a toast helper.
Everything is per browser; nothing leaves the device.

## Terminals, phase for phase

Each terminal screen shows the in-game title with its phase counter and the W A S D keycap prompt, under
a live enemy proximity meter (fill it and a patrol closes with a ten-second window; overrun it and you are
reinforced with a death on the record) and a HUD mission clock running at ×6. On desktop the screen sits on a WebGL terminal (`assets/console3d.js`: three.js chassis and scene, the live
screen DOM mapped through CSS3DRenderer) seen from the diver's angle; phones keep the flat console skin. The
pipe and security-grid puzzles use the game's column-shift controls: A D choose a column, W S move it, locked
columns stay.
Step lists come from the wiki; the puzzle mechanics for the pipe grid, the sub-system switches and the
security grid are reconstructions from screenshots, since the wiki does not document the puzzle UIs:
pipes rotate with W S and select with A D, switches select with A D and set with W S, the security
pattern slides with W A S D onto its outline. Patrols never interrupt mid-terminal.

## Type

Chakra Petch for display, Barlow for reading copy, and Barlow Semi Condensed (`--f-ui`, aliased as
`--f-mono`) in uppercase for every HUD label: tags, pills, nav, counts, keycaps. The Stratagem Hero cabinet
keeps JetBrains Mono for its arcade feel.

## Capture flags

`index.html?nointro=1` skips the Democracy Officer, `terminals.html?go=<id>&step=<n>&noscroll=1` opens a
mission at a step in place, `?nav=codex` renders a dropdown open. Headless Chrome at 1440 wide is fine for
desktop captures; it does not emulate phone widths, so check those in a real mobile viewport.

## Audit

`AUDIT.md` holds the measured audit of 2026-09-10: what was wrong, what was right, a solution per problem,
and an action checklist with three checks per item (in-app DOM at 375 px, headless capture at 1440 px,
code or data). Re-run the same checks after any large change: page height at 375 px, sub-10 px text count,
small tap targets, overflow, heading order, title and description lengths, eager image count.

## Compact lists

Every card grid (`.sgrid`, `.wgrid`, `.agrid`) gets a Cards / List toggle in its filter bar. List is the
default under 760 px and is remembered per page in `hd_view_<page>`. In list mode a card shows only its
header row and expands on tap; stratagem cards keep their code visible.

## Deep links

| URL | Effect |
|---|---|
| `arcade.html?go=rush` (or `intel`, `reflex`, `field`, `hero`) | Scrolls to that drill and presses start |
| `stratagems.html?q=NAME&drill=1` | Opens the input drill on the first match |
| `stratagems.html?random=1` | Opens the drill on a random code |
| `enemies.html?q=NAME`, `enemies.html?f=TERMINID` | Prefilters the bestiary |
| `enemies.html?random=1` | Lands on one random enemy card |
| `arsenal.html?q=NAME` | Prefilters the arsenal |

## Mobile

Under 760 px the top link strip gives way to a fixed bottom tab bar (Command, Codex, Arsenal,
Enemies, Arcade, More). More opens a sheet with every page and the search. Search is a global
overlay over stratagems, weapons and enemies, opened with the magnifier, `/`, or Cmd+K.
The site is installable: `manifest.webmanifest` plus `sw.js`. On iOS use Share, Add to Home Screen.

## Live data

The war board and star chart read the community war API:

- Primary: `https://api.helldivers2.dev/api/v1/*` (requires `X-Super-Client` and
  `X-Super-Contact` headers; CORS allows them)
- Fallback: `https://helldiverstrainingmanual.com/api/v1/*` (no headers needed)

The client tries the primary, falls back to the mirror when it is rate-limited (429) or
blocked, and caches responses in localStorage for their TTL so reloads do not hammer either.
If both are unreachable the star chart falls back to a deterministic offline layout and the
board says so. Nothing on the site depends on the API to render.

## Realistic input

Hold mode mirrors the game: arrows only register while the stratagem key is held, releasing
mid-code cancels, and a wrong direction clears the whole entry. The default hold key is Ctrl, as
in the game. Browsers on Windows and Linux reserve Ctrl+W (closes the tab, cannot be intercepted),
so the arcade tells those users to use the arrow keys with Ctrl, or to pick Shift for WASD.

Controllers work through the Gamepad API with the PlayStation scheme: L1 (or LB) holds the
stratagem menu, the D-pad or left stick inputs the code, R2 (or R1) throws, X (or A) confirms.
The Field Drill applies real Operation Modifiers per drop (Complex Stratagem Plotting +50%
call-in, Orbital Fluctuations +25% cooldown, Gunship Patrols, Roving Shriekers, Poor Intel,
Atmospheric Spores).

## Data provenance

Stratagem codes, weapon statistics, enemy rosters and booster effects were compiled from the
community Helldivers wiki, which mirrors the game's own data files. Tier ratings, faction
scores, loadouts and doctrine copy are editorial, written for Difficulty 8 to 10 play as of
September 2026 (Patch 7.x), and will drift as patches land.

## Local dev

```bash
python3 -m http.server 8931
```

Registered in the workspace `.claude/launch.json` as `helldive`.

Assets carry a `?v=` cache-busting stamp. Bump it after editing CSS or JS:

```bash
V=$(date +%s); for f in *.html; do sed -i '' -E "s/(assets\/[a-z0-9-]+\.(css|js))\?v=[0-9]+/\1?v=$V/g; s/(data\/[a-z0-9-]+\.js)\?v=[0-9]+/\1?v=$V/g" "$f"; done; sed -i '' -E "s/const VERSION='hdc-[0-9]+'/const VERSION='hdc-$V'/" sw.js
```

## Not affiliated

Unofficial fan project. HELLDIVERS is a trademark of Sony Interactive Entertainment;
the game is developed by Arrowhead Game Studios. Not endorsed by or connected to either.
The stratagem trainer follows in the footsteps of Stratagem Hero Online.

## Publishing

Static files only. Upload everything in this folder to the web root of any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, plain Apache or nginx). No build step.

- Keep the folder structure: `assets/`, `data/`, the `.html` pages, `manifest.webmanifest`, `sw.js` at the root.
- The service worker (`sw.js`) caches the site for offline use; its `VERSION` and every `?v=` stamp are bumped on each release, so a new upload replaces the old cache on the next visit.
- Two forms need an endpoint before they send anything: set `window.HD_ENLIST_ENDPOINT` (enlist list) and `window.HD_FEEDBACK_ENDPOINT` (corrections desk) in a small inline script before `assets/core.js` on `index.html`, pointing at a Formspree, Buttondown or your own POST URL. Until then both save on the visitor's device and say so.
- The live war data (Major Order, dispatches, players online) is fetched in the browser from the community Helldivers 2 API; nothing runs server side.
- `competitors.html`, `logo.html` and `taste.html` are the super admin workspace pages linked from the admin bar; remove them and the bar (`nav()` in `assets/core.js`, the `.bmws` block) for a public release without the workspace.
- `tools/` (data pipeline and caches) is not needed on the host and is not in the publish zip.

## Armour glyphs

`assets/img/av/` holds the armour value (`av-1` to `av11`) and armour penetration (`ap-1` to `ap11`) shield glyphs as rendered on helldivers.wiki.gg (Damage page). `assets/statsui.js` exposes `avBadge`, `apBadge`, `avName`, `apName`, `hitMark` and `hitLegend` on `window.HD_STATS`; use those rather than printing the bare number. Tiers: 0 unarmoured, 1 to 2 light, 3 medium, 4 heavy, 5 and up tank. The simulator model follows the wiki: AP above AV full damage, equal 65 percent, below ricochet.

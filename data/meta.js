/* Curated strategy layer. Meta read = community consensus + patch notes, Sept 2026 (Patch 7.x). */
window.HD_FACTIONS = [
 {k:'bug',  name:'Terminids',  colour:'#FF7A18', tag:'THE SWARM',
  line:'Volume, speed, and things that leap at your face.',
  brief:'Terminids kill you by attrition. Nothing individually outguns you, but they arrive faster than you can reload and they surround before you notice. Every fight is a question of whether you can clear chaff faster than a breach can spawn it.',
  win:['Kill the callers. A Scavenger that screeches or a Warrior that survives a second too long turns into a breach.','Never fight in the open with your back to a nest. Pick terrain with one approach.','Fire is king. Incendiary primaries, Napalm, Flamethrower. Burn damage kills while you reload.','Chargers die to a dodge and a rear-sac shot. Do not stand and trade.','Bile Titans want two rockets to the head or one Railcannon. Nothing else is worth the ammo.'],
  bring:['Incendiary or explosive primary','A chaff-clearing support weapon','One reliable anti-tank answer','Eagle Napalm or Orbital Gas for breach denial'],
  avoid:['Slow single-target snipers','Pure anti-tank loadouts with no horde answer','Standing still, ever']},

 {k:'bot',  name:'Automatons', colour:'#FF3B30', tag:'THE MACHINE',
  line:'Ranged, armoured, and it shoots back accurately.',
  brief:'Automatons kill you by fire superiority. They out-range you, they suppress, and rocket volleys delete you through cover you thought was solid. This is the faction where positioning, cover, and armour penetration matter more than raw damage.',
  win:['Cover is not optional. Move between hard cover, never across open ground.','Medium armour penetration is the price of entry. Light-pen primaries bounce off Devastators.','Kill Commissars and Gunship Fabricators first. Both create infinite problems.','Hulks die to one eye shot. Anti-Materiel Rifle, Senator, Railgun, Autocannon.','Tanks and Factory Striders die from behind and underneath. Never from the front.'],
  bring:['Medium or heavy pen primary','A precision anti-armour support weapon','Smoke or stun for disengaging','500kg or Orbital Railcannon for the big ones'],
  avoid:['Shotguns with no range','Fire weapons: bots do not burn well','Standing in the open to "just finish this one"']},

 {k:'squid',name:'Illuminate',  colour:'#A97BFF', tag:'THE VOID',
  line:'A patient horde with heavy escorts and psychic pressure.',
  brief:'The Illuminate combine an endless civilian horde with a small number of very expensive escorts. The Voteless drown you while Overseers and Harvesters do the actual killing. Crowd control plus one clean anti-heavy answer wins every engagement.',
  win:['Watchers die first. Always. A flare means a wave lands on you in seconds.','Voteless are a chaff problem, not a threat: incendiary shotguns, arc weapons, Stalwart.','Break one Harvester horn and its shield is gone permanently. Then take the eye.','Stun grenades trivialise Overseers and open a window on Gatekeepers.','Warp Ships keep spawning until you kill them. Prioritise over the fight in front of you.'],
  bring:['A wide-clear primary (Blitzer, Breaker Incendiary, Halt)','Arc or fire for the horde','Anti-tank or Laser Cannon for Harvesters','Stun grenades'],
  avoid:['Slow reloads in the open','Ignoring the sky','Fighting next to an active Warp Ship']}
];

window.HD_LOADOUTS = [
 {f:'bug', name:'Hive Cleaner', role:'Generalist · Difficulty 8-10',
  primary:'SG-225IE Breaker Incendiary', secondary:'GP-31 Grenade Pistol', grenade:'G-123 Thermite',
  booster:'Hellpod Space Optimization',
  strat:['Flamethrower','Eagle Napalm Airstrike','Orbital Gas Strike','Gatling Sentry'],
  why:'Fire does the chaff work while you reload, thermite handles Chargers, and gas denies a breach without killing your squad. The most forgiving bug build in the game.'},
 {f:'bug', name:'Titan Broker', role:'Anti-heavy anchor',
  primary:'R-36 Eruptor', secondary:'GP-20 Ultimatum', grenade:'G-16 Impact',
  booster:'Vitality Enhancement',
  strat:['Recoilless Rifle','Orbital Railcannon Strike','Eagle 500kg Bomb','Orbital Precision Strike'],
  why:'Eruptor closes holes and shreds packs, Recoilless answers every Charger and Titan on demand, and the Ultimatum is a free extra anti-tank shot in your sidearm slot.'},
 {f:'bug', name:'Gloom Runner', role:'Solo / stealth clear',
  primary:'CB-9 Exploding Crossbow', secondary:'P-4 Senator', grenade:'G-13 Incendiary Impact',
  booster:'Stamina Enhancement',
  strat:['Expendable Anti-Tank','Eagle Airstrike','Jump Pack','Orbital Gatling Barrage'],
  why:'Silent crossbow closes objectives without pulling patrols, Jump Pack gets you out of a swarm, EATs cover heavies on a seventy-second cooldown.'},

 {f:'bot', name:'Line Breaker', role:'Generalist · Difficulty 8-10',
  primary:'PLAS-101 Purifier', secondary:'GP-31 Grenade Pistol', grenade:'G-123 Thermite',
  booster:'Hellpod Space Optimization',
  strat:['AC-8 Autocannon','Eagle Airstrike','Orbital Laser','Orbital Precision Strike'],
  why:'Autocannon answers Devastators, Gunships, Striders and fabricators from one weapon. Purifier handles anything the Autocannon is reloading through.'},
 {f:'bot', name:'Hulk Surgeon', role:'Precision anti-armour',
  primary:'BR-14 Adjudicator', secondary:'P-4 Senator', grenade:'G-16 Impact',
  booster:'Vitality Enhancement',
  strat:['APW-1 Anti-Materiel Rifle','Orbital Railcannon Strike','Eagle 500kg Bomb','EMS Mortar Sentry'],
  why:'One AMR round through a Hulk eye ends it. EMS holds the line still so you can take the shot. This is the build that makes a stalled bot drop collapse.'},
 {f:'bot', name:'Jammer Cracker', role:'Objective specialist',
  primary:'R-63CS Diligence Counter Sniper', secondary:'GP-20 Ultimatum', grenade:'G-123 Thermite',
  booster:'UAV Recon Booster',
  strat:['MLS-4X Commando','Eagle Smoke Strike','Jump Pack','Orbital EMS Strike'],
  why:'Commando rockets snipe fabricator vents and Gunship Fabricators from outside the alarm radius. Smoke breaks line of sight when the drop lands anyway.'},

 {f:'squid', name:'Void Warden', role:'Generalist · Difficulty 8-10',
  primary:'ARC-12 Blitzer', secondary:'LAS-58 Talon', grenade:'G-23 Stun',
  booster:'Hellpod Space Optimization',
  strat:['LAS-98 Laser Cannon','Orbital Gas Strike','Eagle Airstrike','Gatling Sentry'],
  why:'Infinite ammo top to bottom. Blitzer wipes Voteless without a single reload, Laser Cannon cuts Harvester horns and drops Stingrays.'},
 {f:'squid', name:'Harvester Hunter', role:'Anti-heavy',
  primary:'SG-20 Halt', secondary:'GP-20 Ultimatum', grenade:'G-23 Stun',
  booster:'Experimental Infusion',
  strat:['GR-8 Recoilless Rifle','Orbital Railcannon Strike','Eagle 500kg Bomb','EMS Mortar Sentry'],
  why:'Halt stun-slugs freeze Overseers mid-air. Recoilless removes Harvesters and Gatekeepers before their shields matter.'},
 {f:'squid', name:'City Sweeper', role:'Urban horde control',
  primary:'PLAS-101 Purifier', secondary:'GP-31 Grenade Pistol', grenade:'G-13 Incendiary Impact',
  booster:'Armed Resupply Pods',
  strat:['M-105 Stalwart','Eagle Napalm Airstrike','Orbital Gatling Barrage','Machine Gun Sentry'],
  why:'City fights are corridor fights. Stalwart reloads on the move, napalm seals a street, and the Purifier opens packed doorways.'}
];

window.HD_RULES = [
 {n:'1',t:'Stratagems are your real weapon',d:'Your primary is a stopgap between cooldowns. The players who clear Difficulty 10 are the ones whose Eagle and Orbital slots are never idle. Throw them early, throw them often, and stop hoarding the 500kg for a moment that never comes.'},
 {n:'2',t:'Learn seven codes, not ninety-three',d:'Reinforce, Resupply, your support weapon, your backpack, and three offensive picks. Those seven need to be muscle memory at full sprint under fire. Everything else you can read off the wheel.'},
 {n:'3',t:'Armour penetration beats damage',d:'A 400-damage round that cannot penetrate does nothing. Match your pen level to the faction: light for Terminid chaff, medium as the floor against Automatons, heavy or anti-tank for anything with a name.'},
 {n:'4',t:'Kill the caller, not the crowd',d:'Scavengers that screech, Commissars, Watchers, Warp Ships and Bug Breaches all manufacture more enemies. Every second you spend on the horde instead of the source is a second the horde grows.'},
 {n:'5',t:'Objectives first, kills never',d:'You are not scored on kills. Split the squad, run the main objective, and leave outposts for the walk to extraction. A team that fights everything runs out of reinforcements at 70 percent.'},
 {n:'6',t:'Reinforce is a weapon',d:'Throw the beacon away from the fight, not on top of it. A Hellpod is also a kill: land it on a Charger, a Hulk or a fabricator and you get a free heavy removal every death.'},
 {n:'7',t:'Five tickets each, twenty in the squad',d:'Reinforcements are five per Helldiver per mission, twenty in a full squad, twenty-four with the Increased Reinforcement Budget booster. Once they are spent one more trickles in on a timer. A full wipe with no ticket left and the main objective unfinished fails the mission and the whole operation with it.',src:'Reinforce'},
 {n:'8',t:'Main objective first, then everything else',d:'If the whole squad dies after the main objective is complete the mission still counts as a success. Let the mission timer run out and Reinforce switches off with every other stratagem you chose. Objective, then samples, then outposts, then the ride home.',src:'Reinforce'},
 {n:'9',t:'Somebody stays inside fifty metres',d:'During the two minute shuttle deployment, three under Complex Stratagem Plotting, at least one Helldiver must be within 50 m of the extraction beacon. Leave it empty for 20 seconds and Pelican-1 aborts. Expert Extraction Pilot cuts the wait by 30 percent, and the first diver aboard disables Reinforce.',src:'Extraction'},
 {n:'10',t:'Close the menu and the code is gone',d:'A wrong direction or a released stratagem key wipes the entry and you start again. Hold the key until the last arrow lands, then throw. Orbitals call in slowly and hit wide, best on a breach or an unaware patrol. Eagles are quick, carry several uses, and are the on demand answer.',src:'Stratagems'},
 {n:'11',t:'Samples are a walk, not a fight',d:'The Destroyer holds 500 common, 250 rare and 100 super, and every ship module in the game costs 3,830 common, 2,920 rare and 305 super in total. Pick them up on the way to the objective and sprint-cancel the pickup animation to clear a cluster fast. Rare samples appear from Difficulty 4, super from 6.',src:'Sample'},
 {n:'12',t:'The dial adds more than enemies',d:'Every level spawns patrols more often. Difficulty 5 adds an operation modifier and 8 adds a second. Requisition and XP multipliers climb from 25 percent at 3 to 300 percent at 10, so a clean 7 pays better than a failed 9. Giant outposts only exist at 10.',src:'Difficulty'}
];

window.HD_DIFFICULTY = [
 /* what each level introduces, from the wiki Difficulty table (helldivers.wiki.gg/wiki/Difficulty), read 13 Sep 2026 */
 {n:1,name:'Trivial',   missions:1,medals:'1',  note:'One main objective, no outposts, a 250 m map. Learn the wheel.'},
 {n:2,name:'Easy',      missions:1,medals:'2',  note:'First optional objective and the first light outposts. Devastators, Berserkers and Hive Guards arrive.'},
 {n:3,name:'Medium',    missions:2,medals:'2-4',note:'Two missions per operation, medium outposts. Charger Behemoths, Hulks, Annihilator Tanks and Harvesters enter the pool.'},
 {n:4,name:'Challenging',missions:2,medals:'3-5',note:'Bile Titans, Factory Striders, Stalkers and Gatekeepers. Rare samples and the first heavy outpost. Anti-tank becomes mandatory.'},
 {n:5,name:'Hard',      missions:3,medals:'4-8',note:'Three missions per operation and the first operation modifier. Gunships and Impalers.'},
 {n:6,name:'Extreme',   missions:3,medals:'5-9',note:'Super samples appear. War Striders and Rupture bugs. Squad roles start to matter.'},
 {n:7,name:'Suicide Mission',missions:3,medals:'6-10',note:'Hive Lords, Barrager Tanks and Vox Engines. Places of interest turn enemy themed. You cannot fight everything.'},
 {n:8,name:'Impossible',missions:3,medals:'7-12',note:'A second operation modifier. Alpha Commanders, Reinforced Scout Striders, Leviathans. Stratagem uptime is the whole game.'},
 {n:9,name:'Helldive',  missions:3,medals:'8-14',note:'Nothing new is introduced. Three to four main objectives, up to four heavy outposts, everything denser. Split the squad or fail.'},
 {n:10,name:'Super Helldive',missions:3,medals:'9-15',note:'Giant outposts and a 300 percent requisition and XP multiplier. Efficiency, uptime and discipline, not raw power.'}
];

window.HD_WARBONDS = [
 {n:'Helldivers Mobilize',t:'Standard',p:'Free',pick:'Grenade Pistol, Impact grenade, Hellpod Space Optimization. Finish this first.'},
 {n:'Steeled Veterans',t:'Premium',p:'1000 SC',pick:'P-4 Senator and the Breaker Incendiary. Both still meta.'},
 {n:'Cutting Edge',t:'Premium',p:'1000 SC',pick:'LAS-16 Sickle, ARC-12 Blitzer, Stun grenade. Enormous value.'},
 {n:'Democratic Detonation',t:'Premium',p:'1000 SC',pick:'R-36 Eruptor, CB-9 Exploding Crossbow, BR-14 Adjudicator. Best single warbond in the game.'},
 {n:'Polar Patriots',t:'Premium',p:'1000 SC',pick:'PLAS-101 Purifier. That one item justifies the price.'},
 {n:'Viper Commandos',t:'Premium',p:'1000 SC',pick:'Experimental Infusion booster and melee options.'},
 {n:"Freedom's Flame",t:'Premium',p:'1000 SC',pick:'SG-451 Cookout and FLAM-66 Torcher. The bug-burning warbond.'},
 {n:'Chemical Agents',t:'Premium',p:'1000 SC',pick:'TX-41 Sterilizer and Gas grenades. Strong against Illuminate crowds.'},
 {n:'Truth Enforcers',t:'Premium',p:'1000 SC',pick:'SMG-32 Reprimand and Dead Sprint.'},
 {n:'Urban Legends',t:'Premium',p:'1000 SC',pick:'SH-51 Directional Shield, Armed Resupply Pods.'},
 {n:'Servants of Freedom',t:'Premium',p:'1000 SC',pick:'GP-20 Ultimatum and the Portable Hellbomb. Absurd power.'},
 {n:'Borderline Justice',t:'Premium',p:'1000 SC',pick:'R-6 Deadeye and the Sample Extractor booster.'},
 {n:'Masters of Ceremony',t:'Premium',p:'1000 SC',pick:'CQC-1 One True Flag and Sample Scanner.'},
 {n:'Force of Law',t:'Premium',p:'1000 SC',pick:'P-35 Re-Educator and Stun Pods.'},
 {n:'Control Group',t:'Premium',p:'1000 SC',pick:'VG-70 Variable and PLAS-45 Epoch.'},
 {n:'Dust Devils',t:'Premium',p:'1000 SC',pick:'MS-11 Solo Silo and EAT-700 Expendable Napalm.'},
 {n:'Python Commandos',t:'Premium',p:'1000 SC',pick:'M-1000 Maxigun.'},
 {n:'Redacted Regiment',t:'Premium',p:'1000 SC',pick:'B/MD C4 Pack.'},
 {n:'Siege Breakers',t:'Premium',p:'1000 SC',pick:'CQC-20 Breaching Hammer.'},
 {n:'Entrenched Division',t:'Premium',p:'1000 SC',pick:'B/FLAM-80 Cremator.'},
 {n:'Exo Experts',t:'Premium',p:'1000 SC',pick:'EXO-51 Lumberer exosuit.'},
 {n:'Righteous Revenants',t:'Premium',p:'1000 SC',pick:'Late-cycle premium track.'},
 {n:'Obedient Democracy Support Troopers',t:'Premium',p:'1000 SC',pick:'Support-oriented track.'},
 {n:'Ironclad Democracy',t:'Premium',p:'1000 SC',pick:'Live 22 Sep. G-60 Anti-Tank Seeker homing grenade, P-34 Breacher missile pistol, Surplus EAT Allocation booster. Judge it once the stats land.'},
 {n:"Castellan's Creed",t:'Legendary',p:'1500 SC',pick:'Warhammer 40,000 crossover: 40-K Meltagun, Bolt Pistol, Hot-Shot rifle.'}
];

window.HD_GLOSSARY = [
 ['Breach / Drop','A Terminid Bug Breach or an Automaton Dropship. Both spawn a fresh wave. Prevent, do not fight.'],
 ['Chaff','Low-value swarm units. Scavengers, Troopers, Voteless. They exist to eat your ammunition.'],
 ['Pen level','Armour penetration, 1 to 7. If your pen is below the target armour, you deal almost nothing.'],
 ['Stratagem Jammer','A tower that blocks all stratagems in its radius. Destroy it before you commit to anything nearby.'],
 ['Operation','A set of 1 to 3 missions on one planet. Completing one raises your difficulty unlock.'],
 ['Major Order','A galaxy-wide objective set by High Command. Completing it pays medals to everyone.'],
 ['Liberation','The percentage a planet has been pushed toward Super Earth control. Enemies regenerate it every second.'],
 ['Samples','Common, Rare and Super Rare. Currency for Ship Module upgrades. Bring them home or they are gone.'],
 ['Team reload','A second Helldiver loading your Autocannon or Recoilless from your backpack. Roughly triples fire rate.'],
 ['Ragdoll','Being knocked off your feet by explosions. The primary cause of Automaton deaths.']
];

/* Super Earth Command voice layer.
   TIPS and DO_LINES are verbatim in-game text (Training Manual tips, Democracy Officer).
   CABINET lines are the Stratagem Hero "get ready" flavour strings.
   Everything else is written in the register of Helldiver Command HUD messaging. */
window.HD_COMMS = {
 threats:[
  'Bug breach detected on the objective','Automaton dropship inbound, bearing north','Charger closing, thirty metres',
  'Hulk advancing from the ridge line','Harvester shield active, horns intact','Enemy patrol converging on your position',
  'Bile Titan on the extraction zone','Gunship fabricator operational','Voteless horde at the perimeter',
  'Devastator squad in cover, rockets armed','Stalker signatures within fifty metres','Shriekers overhead',
  'Factory Strider approaching the terminal','Illuminate warp ship touching down','Heavy outpost alerted, reinforcements called',
  'Squad ammunition critical','Watcher flare fired, wave inbound','Berserkers breaching the compound'
 ],
 order:{
  offensive:['SUPER DESTROYER: {threat}. Fire mission authorised. Call in {name}.','HIGH COMMAND: {threat}. Ordnance cleared for release. Request {name}.'],
  eagle:['EAGLE-1: On station and waiting for coordinates. {threat}. Request {name}.','SUPER DESTROYER: Eagle-1 armed. {threat}. Mark the target with {name}.'],
  supply:['SUPER DESTROYER: {threat}. {name} is loaded in the Hellpod bay. Call it down.','HIGH COMMAND: {threat}. Supply drop authorised: {name}.'],
  defensive:['SUPER DESTROYER: Hold this ground. {threat}. Deploy {name}.','HIGH COMMAND: {threat}. Fortify the position with {name}.'],
  reinforce:['SUPER DESTROYER: Helldiver down. Reinforcement budget available. Call in REINFORCE.','HIGH COMMAND: A Helldiver has given their life for Liberty. Reinforce immediately.'],
  resupply:['SUPER DESTROYER: Squad ammunition critical. Request RESUPPLY.','HIGH COMMAND: Supplies depleted. Call in RESUPPLY before the next wave.'],
  sos:['SUPER DESTROYER: Squad strength critical. Activate the SOS BEACON.']
 },
 bark:{
  throw:['Throwing stratagem!','Stratagem out!','Calling it in!','Here comes the Freedom!','Get clear!'],
  ready:['STRATAGEM READY'],
  cancel:['Input cancelled'],
  reject:['INPUT REJECTED']
 },
 radio:{
  eagle_inbound:['EAGLE-1: Ordnance away.','EAGLE-1: Airstrike inbound, get clear.','EAGLE-1: Coming in hot.'],
  eagle_hit:['EAGLE-1: Target neutralised.','EAGLE-1: Direct hit.','EAGLE-1: Returning to the Destroyer.'],
  eagle_rearm:['EAGLE-1: Out of ordnance. Returning to rearm.'],
  orbital_inbound:['SUPER DESTROYER: Orbital strike inbound.','SUPER DESTROYER: Firing.','SUPER DESTROYER: Rounds in the air.'],
  orbital_hit:['SUPER DESTROYER: Rounds on target.','SUPER DESTROYER: Impact confirmed.'],
  pod_inbound:['SUPER DESTROYER: Hellpod launched.','SUPER DESTROYER: Package inbound.'],
  pod_hit:['HELLPOD LANDED','SUPER DESTROYER: Delivery confirmed.'],
  reinforce_inbound:['SUPER DESTROYER: Reinforcements inbound.','PELICAN-1: Reinforcement on the way.'],
  reinforce_hit:['Helldiver, welcome back to the fight.','A fresh Helldiver has entered the field.'],
  resupply_inbound:['SUPER DESTROYER: Resupply pod launched.'],
  resupply_hit:['Resupply on the ground. Restock and move.'],
  sos_hit:['SOS beacon active. Nearby Super Destroyers notified.'],
  wrong:['SUPER DESTROYER: That is not the requested asset, Helldiver.','HIGH COMMAND: Negative. Wrong stratagem deployed.'],
  death:['HELLDIVER DOWN','KIA. Your sacrifice will be remembered.','Helldiver lost. Reinforcement budget reduced.'],
  extract:['PELICAN-1: Extraction inbound. Hold the LZ.'],
  complete:['MISSION COMPLETE','Super Earth thanks you for your service.','Objectives secured. Liberty spreads.'],
  fail:['MISSION FAILED','Reinforcement budget depleted. The Super Destroyer is leaving orbit.']
 },
 cabinet:['Placeholder. Description required here.','INSUFFICIENT SUPER CREDITS','Welcome aboard, Helldiver.','Back-packing a punch','Rain down from above','Spaghettification Visualisation','Find and collect samples! These resources are shared by the entire squad and are used to upgrade your Destroyer.','Backend version mismatch - You must update the game to the latest version.','The TCS has been fully activated on half of the Barrier Planets.','Election underway. Reminder: failure to vote is treason.','The sphere from which all liberty shines.','Raise the Super Earth flag as an unassailable beacon of Liberty.','The people of Super Earth look to us for hope.',"Criticism of Super Earth's ideals are a telltale sign of Illuminate mind control.",'Your life for Super Earth!','Super Earth has your best interests at heart.','Your aid is needed, Helldiver.','Time for the Helldivers to do what they do best: spread Freedom.','Helldivers are heroes. Helldivers are Liberty.','Something un-Democratic is afoot.','No pain, no Freedom.','Super Earth has many holidays, but the most important is October 26th—Liberty Day!','Super Earth recommends spending at least 2.4 seconds per mission enjoying the scenery.','A happy Helldiver is a deadly Helldiver.','Helldivers never quit.','Your account has been suspended for breaching the terms of service.','Did you know tips are shown during these transition sequences?'],
 tips:["Don't die!","Pay attention to these tips. They've been carefully calibrated to ensure your success.","Nine out of ten doctors agree that a wound to the chest will make you bleed out if unattended.","Don't Panic.","The Automatons are equipped with hyper reactive protocols, making them susceptible to suppressive fire. The more you shoot at them, the less accurate they'll be.","As a last resort, you can use melee attacks to fend off enemies. Remember: death is better than cowardice!","Remember: Freedom!","Friendly Fire isn't.","If an enemy ever attempts to engage in diplomacy, SHOOT THEM. We mustn't believe their lies.","Most enemies have both weak spots and armored spots. The S.E.A.F. training manual recommends aiming for the weak spots.","When you're up against the bots, remember the 3 Cs: Cover, Courage, and more Cover.","You are Super Earth's Elite. Remember that.","If you notice a squad mate sympathizing with an enemy, report them to your democracy officer. Thoughtcrimes kill!","Diving to the ground can be a lifesaver, but it also makes you an easy target for melee units.","The longer you stay in a mission, the heavier the enemy presence becomes.","If the enemies just keep coming, find out where they're coming from and unleash hell. Bug hive? Destroy! Bot factory? Destroy!","All Stratagems have their strengths and weaknesses. Choose your Stratagem loadout to best fit the mission and your squad companions.","Every citizen is equally important to the war effort, but Helldivers are the most important.","Grenades detonation time starts when you pull back for a throw -- time your throw for an air-burst detonation.","Place markers on the map to help your squad navigate."],
 officer:['Helldiver. Take command of the Galaxy\'s liberation.','The hour of our next victory rapidly approaches. Let us cleanse the Galaxy of alien scum.','Tyranny is a cancer, and Managed Democracy is the cure. And you, Helldiver, shall administer the antidote.','There is but one assured path to peace... And that path is war.','The enemy may anticipate but one outcome: total annihilation.','Here at war, you may cast your vote many times. Once on Election Day, and another with every bullet buried in an enemy combatant.','The people of Super Earth look to us for hope. And we will deliver it, one enemy corpse at a time.','Innocents perish with every wasted second. We must act.','Every star is a distress beacon, crying out for Liberation.','Managed Democracy offers true Freedom: Freedom from the burden of choice.','I realized long ago that death in the defence of Freedom was not a tragedy to be lamented, but a sacrifice to be revered.','Ready for another mission, Helldiver?'],
 ranks:['Cadet','Space Cadet','Sergeant','Master Sergeant','Chief','Space Chief Prime','Death Captain','Marshal','Star Marshal','Admiral','Skull Admiral','Fleet Admiral','Admirable Admiral','Commander','Galactic Commander','Hell Commander','General','5-Star General','10-Star General']
};

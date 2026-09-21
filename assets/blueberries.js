/* ============ BLUEBERRIES ============ */
(function(){
'use strict';
const {$,$$}=window.HD;
const Q=window.HD_QUOTES||{}, C=window.HD_COMMS||{};
try{ localStorage.setItem('hd_blue','1'); }catch(e){}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const SIGNS=[
 ['Sign 1','Sprints toward the objective','Not away from the Bile Titan. Toward the objective. The objective is behind the Bile Titan.'],
 ['Sign 2','Reloads at 28 of 30','A full magazine is a feeling. Fourteen wasted rounds are also a feeling, mostly for the Resupply.'],
 ['Sign 3','Calls the 380mm on the pad','The extraction pad is a target. Everyone on it is, briefly, a Helldiver.'],
 ['Sign 4','Picks up your support weapon','They are not stealing it. They found it. It was on the ground next to your body.'],
 ['Sign 5','Says thank you in chat','After the reinforce. Every time. Veterans have forgotten this is possible.'],
 ['Sign 6','Waves at the Pelican','The Pelican has a 30mm autocannon and no interest in waving back.'],
 ['Sign 7','Salutes the flag at the objective','Which is correct. Do it under cover next time.'],
 ['Sign 8','Dives on a slope','And keeps going. And going. Sweet liberty, their leg.']
];
$('#signs').innerHTML=SIGNS.map(s=>`<article class="rule-c"><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join('');

const TESTI=[
 ['Cadet R. Vasquez','SES Hammer of Family Values','Level 4','A level 140 hugged me at extraction. I have never felt so seen. Then he threw a 380 on the pad and we all died together, as a family.'],
 ['Space Cadet L. Marsh','SES Fist of Mercy','Level 7','I did not know you could hold the stratagem key. I had been tapping it. For eleven missions. The Democracy Officer said it built character.'],
 ['Cadet P. Adeyemi','SES Elected Representative of Wrath','Level 3','Someone reinforced me directly onto a Charger. It died. I died. We were both reinforced. It was the best thing that has ever happened to me.'],
 ['Sergeant T. Halvorsen','SES Song of Supremacy','Level 22','The veteran did not say a word all mission. At the pad he crouched, hugged me, and left me a Quasar Cannon. I think about him every day.'],
 ['Cadet M. Okafor','SES Courier of Judgement','Level 6','I brought back the Super Samples. All of them. Then I dived into a bug hole with them. The squad reinforced me next to the hole so I could watch it.'],
 ['Space Cadet H. Ito','SES Lady of Twilight','Level 9','Tip 14 in the Training Manual says do not die. I have read it several times. I do not think the Ministry has met a Hunter.'],
 ['Cadet J. Brannigan','SES Wings of Iron','Level 2','My first extraction, the shuttle landed on me. Pelican-1 does not brake for cadets. The pilot cheered. I respect that.'],
 ['Chief D. Nwosu','SES Guardian of the Constitution','Level 41','You want to know when you stop being a blueberry? When you reinforce someone before they finish dying. Not after. Before.'],
 ['Cadet S. Petrov','SES Precursor of Family Values','Level 5','I took the Exosuit. I know now. The kick vote said 3 to 1. The 1 was me.'],
 ['Space Cadet A. Lindqvist','SES Herald of Dawn','Level 11','He hugged me, then pinged the Stalker lair behind me, then hugged me again after I came back. Twice in one mission. That is a bond.'],
 ['Cadet K. Mbeki','SES Distributor of Liberty','Level 8','They told me the map was Tab. Nobody told me the map was upside down when facing south. I walked into the ocean with the SSSD.'],
 ['Master Sergeant E. Costa','SES Sword of the Regime','Level 63','I do not remember my first dive. I remember the first person who stayed at the pad for me. Stay at the pad for someone.']
];
$('#testi').innerHTML=TESTI.map(t=>`<blockquote class="testi"><p>${t[3]}</p><footer><b>${t[0]}</b><span>${t[1]} &middot; ${t[2]}</span></footer></blockquote>`).join('');

const HUGS=[
 ['Rule 1','Hug at the pad, not at the objective','Objectives have patrols. Patrols do not respect the emote animation.'],
 ['Rule 2','Never hug a Helldiver holding a live Hellbomb','The animation locks your movement for two seconds. The timer does not.'],
 ['Rule 3','A hug after a team-kill is an apology, not an amnesty','Democracy remembers. So does the kill feed.'],
 ['Rule 4','Return the hug','Refusing a hug from a veteran is not illegal. It is simply noted in your file.']
];
$('#hugRules').innerHTML=HUGS.map(s=>`<article class="rule-c"><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join('');
const MATRIX=[['Extraction pad, shuttle inbound','Approved'],['Mid-firefight','Denied. Also brave.'],['After a successful Hellbomb sprint','Mandatory'],['While a teammate carries the SSSD','Approved, briefly'],['Standing in an Orbital Barrage','Denied on medical grounds'],['After they reinforce you','Encouraged. Add a salute.'],['Toward a Voteless','That is not a Helldiver.'],['During the 380mm call-in','You have 4 seconds. Choose wisely.']];
$('#hugTable').innerHTML=MATRIX.map(r=>`<tr><td>${r[0]}</td><td style="color:${/Denied|not/i.test(r[1])?'var(--red)':'var(--green)'}">${r[1]}</td></tr>`).join('');

const STAGES=[
 ['Stage 1','Denial','They were right there. The Hulk was over there. Physics disagrees.'],
 ['Stage 2','The ping','You mark the body. Everyone marks the body. The body is well marked.'],
 ['Stage 3','The code','Up, down, right, left, up. Your hands know it before you do. That is what this site is for.'],
 ['Stage 4','The throw','You throw the reinforcement ball at the enemy that killed them. This is both tactics and revenge.'],
 ['Stage 5','The landing','They land on it. It dies. They pick up their weapon from the ground next to your body. Wait.']
];
$('#stages').innerHTML=STAGES.map(s=>`<article class="stage"><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join('');

const death=(C.radio&&C.radio.death)||[]; const reinf=(C.radio&&C.radio.reinforce_inbound)||[];
const officer=(Q.officer_lines||[]).filter(l=>/sacrific|fallen|die|death|reinforc|surviv|grave|widow|memor/i.test(l)).slice(0,6);
$('#deathLines').innerHTML=[...death.map(l=>['Super Destroyer',l]),...reinf.map(l=>['Super Destroyer',l]),...officer.map(l=>['Democracy Officer',l])].map(x=>`<div class="ql"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('');

/* your own marks, on this device */
const KEY='hd_marks';
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return [];}};
function paintMarks(){ const m=get(); $('#marks').innerHTML=m.length?m.map(x=>`<blockquote class="testi mine"><p>${esc(x.t)}</p><footer><b>${esc(x.n)}</b><span>Filed ${x.d} &middot; this device</span></footer></blockquote>`).join(''):'<p class="empty">No testimonials filed on this device yet.</p>'; }
$('#markForm').addEventListener('submit',e=>{ e.preventDefault(); const n=$('#markName').value.trim()||'Anonymous Helldiver', t=$('#markText').value.trim(); if(!t)return;
  const m=get(); m.unshift({n,t,d:new Date().toLocaleDateString('en-GB')}); try{localStorage.setItem(KEY,JSON.stringify(m.slice(0,20)));}catch(err){} $('#markText').value=''; paintMarks(); if(window.HDSFX&&window.HDSFX.ok) window.HDSFX.ok(); });
paintMarks();
})();

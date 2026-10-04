// PHONY · the real radio: stations on the dial, static in between, and what they play goes on the radio for the blank tape

/* The stations, by where they sit on the FM dial. These are the stations' own public streams, for
   personal listening (SomaFM asks exactly that). A stream that has died is just static. */
const STATIONS = [
  {f:87.9, name:'WFMU', where:'Jersey City', url:'https://stream0.wfmu.org/freeform-128k'},
  {f:89.3, name:'KEXP', where:'Seattle', url:'https://kexp-mp3-128.streamguys1.com/kexp128.mp3'},
  {f:90.7, name:'Radio Paradise', where:'Paradise, California', url:'https://stream.radioparadise.com/mp3-128'},
  {f:92.3, name:'Underground 80s', where:'SomaFM', url:'https://ice5.somafm.com/u80s-128-mp3'},
  {f:93.7, name:'Left Coast 70s', where:'SomaFM', url:'https://ice5.somafm.com/seventies-128-mp3'},
  {f:95.1, name:'Indie Pop Rocks', where:'SomaFM', url:'https://ice5.somafm.com/indiepop-128-mp3'},
  {f:96.5, name:'Groove Salad', where:'SomaFM', url:'https://ice5.somafm.com/groovesalad-128-mp3'},
  {f:98.1, name:'Secret Agent', where:'SomaFM', url:'https://ice5.somafm.com/secretagent-128-mp3'},
  {f:99.7, name:'Boot Liquor', where:'SomaFM', url:'https://ice5.somafm.com/bootliquor-128-mp3'},
  {f:101.3, name:'Lush', where:'SomaFM', url:'https://ice5.somafm.com/lush-128-mp3'},
  {f:102.9, name:'Covers', where:'SomaFM', url:'https://ice5.somafm.com/covers-128-mp3'},
  {f:104.3, name:'Eclectic 24', where:'KCRW, Santa Monica', url:'https://kcrw.streamguys1.com/kcrw_192k_mp3_e24'},
  {f:105.9, name:'Seven Inch Soul', where:'SomaFM', url:'https://ice5.somafm.com/7soul-128-mp3'},
  {f:107.5, name:'Radio Paradise Rock', where:'Paradise, California', url:'https://stream.radioparadise.com/rock-128'},
];
const FM = [87, 92, 96, 102, 108];   // the numbers printed on the dial, evenly spaced, as on a real one
const LOCK = .4, SNAP = 1.1;          // MHz: within LOCK of a station it plays; let go within SNAP and the needle settles on it
S.radio = null; S.radioPlaying = false; S.onAir = null; S.airLog = [];   // airLog: what the station has played since you tuned in
let dialX = store.get('dial', .3), dialDrag = null, tuneT = 0, onAirT = 0, radioOnAt = 0;

// where a frequency sits across a dial (0..1), by the printed numbers; and back
function fmPos(dial, f){
  const r = dial.getBoundingClientRect(), bs = [...dial.querySelectorAll('.fm b')].slice(1);
  const xs = bs.map(b => { const q = b.getBoundingClientRect(); return (q.left + q.width / 2 - r.left) / r.width; });
  if (xs.length < 5) return 0;
  if (f <= FM[0]) return xs[0]; if (f >= FM[4]) return xs[4];
  for (let i = 0; i < 4; i++) if (f <= FM[i + 1]) return xs[i] + (xs[i + 1] - xs[i]) * (f - FM[i]) / (FM[i + 1] - FM[i]);
  return xs[4];
}
function fmAt(dial, x){
  const r = dial.getBoundingClientRect(), bs = [...dial.querySelectorAll('.fm b')].slice(1);
  const xs = bs.map(b => { const q = b.getBoundingClientRect(); return (q.left + q.width / 2 - r.left) / r.width; });
  if (xs.length < 5) return FM[0];
  if (x <= xs[0]) return FM[0]; if (x >= xs[4]) return FM[4];
  for (let i = 0; i < 4; i++) if (x <= xs[i + 1]) return FM[i] + (FM[i + 1] - FM[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
  return FM[4];
}
const nearest = f => STATIONS.reduce((b, s) => Math.abs(s.f - f) < Math.abs(b.f - f) ? s : b, STATIONS[0]);

// every dial on the page shows the same needle (a shell may have one closed and one open)
function syncDial(){
  $$('.dial').forEach(d => {
    const n = d.querySelector('.needle'); if (n) n.style.left = (dialX * 100).toFixed(2) + '%';
    const k = d.querySelector('.knob'); if (k) k.style.transform = `rotate(${(dialX * 720).toFixed(0)}deg)`;
    d.classList.toggle('on', !!S.radio && S.radioPlaying);
  });
}

/* ---------- static: the noise between stations ---------- */
let staticGain = null, staticT = 0;
function setStatic(level){
  clearTimeout(staticT);
  if (!ac) return;
  if (!staticGain){
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .5;
    const src = ac.createBufferSource(); src.buffer = noise; src.loop = true; src.start();
    staticGain = ac.createGain(); staticGain.gain.value = 0; src.connect(bp).connect(staticGain).connect(sfxBus);
  }
  staticGain.gain.setTargetAtTime(level, ac.currentTime, .06);
  // between stations the hiss dies away on its own; nothing is playing
  if (level > 0) staticT = setTimeout(() => { if (staticGain) staticGain.gain.setTargetAtTime(0, ac.currentTime, .4); }, 1500);
}

/* ---------- tuning ---------- */
function tune(st){
  if (S.radio && S.radio.url === st.url) return;
  const first = !S.radio;
  S.radio = st; S.onAir = null; S.radioPlaying = false; S.airLog = []; S.taping = null; S.t = 0;   // a new station: a fresh log; a half-taped song is lost
  radioOnAt = performance.now();
  if (first && S.playing){ pause(); syncKeys(); }   // the tape waits
  if (N) N.tuneRadio(st.url, st.f.toFixed(1) + ' · ' + st.name);
  else demoAir(st);
  trackChanged(); renderAirList(); syncDial();
}
// static, or the radio off: nothing on the air
function offAir(){
  if (S.radio && N){
    N.radioOff();
    if (isRemote()) N.useRemote(true);
    else if (isLocal()){ try { N.loadSource(S.src.type, String(S.src.id)); } catch (e) {} N.skipTo(S.idx); N.seekTo(Math.round(S.t * 1000)); }
  }
  S.radio = null; S.onAir = null; S.radioPlaying = false; S.airLog = []; S.taping = null; S.t = 0;
  if (S.mix) showMixTracks(Math.max(0, S.mix.songs.length - 1)); else { trackChanged(); renderJList(); }   // the tape's own list again
  if (S.recOn && typeof resumeRec === 'function') resumeRec();   // REC still down: back to the songs waiting
}
// back to the tape: whatever was in the player picks up where it was
function radioOff(){
  if (!S.radio) return;
  offAir(); setStatic(0); syncDial();
}
// the needle moved: lock onto a station within reach, or hiss
function needleAt(x, settle){
  dialX = Math.max(0, Math.min(1, x));
  const dial = $$('.dial').find(d => d.offsetParent) || $$('.dial')[0]; if (!dial) return;
  const f = fmAt(dial, dialX), st = nearest(f), off = Math.abs(st.f - f);
  if (settle){
    if (off < SNAP){ dialX = fmPos(dial, st.f); tune(st); setStatic(0); sfx('tick'); }
    else { if (S.radio) offAir(); setStatic(.05); }
    store.set('dial', dialX); syncDial(); return;
  }
  if (off < LOCK){ setStatic(0); clearTimeout(tuneT); tuneT = setTimeout(() => tune(st), 220); }
  else { clearTimeout(tuneT); setStatic(Math.min(.14, .03 + off * .05)); if (S.radio) offAir(); }
  syncDial();
}
function stepStation(dir){
  const dial = $$('.dial').find(d => d.offsetParent) || $$('.dial')[0]; if (!dial) return;
  const f = fmAt(dial, dialX);
  const i = S.radio ? STATIONS.indexOf(S.radio) : (dir > 0 ? STATIONS.findIndex(s => s.f > f) - 1 : STATIONS.findIndex(s => s.f >= f));
  const st = STATIONS[Math.max(0, Math.min(STATIONS.length - 1, i + dir))];
  dialX = fmPos(dial, st.f); store.set('dial', dialX); tune(st); sfx('tick'); syncDial();
}

// drag the needle along any dial
document.addEventListener('pointerdown', e => {
  const dial = e.target.closest('.dial'); if (!dial || e.button > 0 || dialDrag) return;
  if (e.target.closest('.secret')) return;
  e.preventDefault(); ensureAudio();
  const r = dial.getBoundingClientRect();
  dialDrag = {id:e.pointerId, dial, r, x0:e.clientX, moved:false};
});
addEventListener('pointermove', e => {
  const d = dialDrag; if (!d || e.pointerId !== d.id) return;
  if (!d.moved && Math.abs(e.clientX - d.x0) < 4) return; d.moved = true;
  needleAt((e.clientX - d.r.left) / d.r.width, false);
});
const dialUp = e => {
  const d = dialDrag; if (!d || e.pointerId !== d.id) return; dialDrag = null;
  needleAt(d.moved ? (e.clientX - d.r.left) / d.r.width : dialX, true);
};
addEventListener('pointerup', dialUp); addEventListener('pointercancel', dialUp);

/* ---------- following the station ---------- */
function pollRadio(now){
  if (!S.radio || !N || now - onAirT < 1000) return; onAirT = now;
  let st = null, oa = null;
  try { st = JSON.parse(N.getState()); oa = JSON.parse(N.onAir() || 'null'); } catch (e) { return; }
  const playing = !!(st && st.playing);
  const song = oa && oa.title ? {title:oa.title, artist:oa.artist || '', at:oa.at || Date.now()} : null;
  const was = S.onAir, newSong = (song ? song.title : '') !== (was ? was.title : ''), changed = newSong || playing !== S.radioPlaying;
  S.radioPlaying = playing; S.onAir = song;
  if (oa && oa.log) mergeAirLog(oa.log);
  if (newSong) airChanged(was);
  if (changed){ trackChanged(); renderAirList(); syncDial(); }
}
// the station's log from the phone, keeping what's already marked as taped
function mergeAirLog(log){
  const taped = {}; S.airLog.forEach(e => { if (e.taped) taped[e.title + '|' + e.at] = 1; });
  S.airLog = log.map(e => ({title:e.title, artist:e.artist || '', at:e.at || 0, taped:!!taped[e.title + '|' + e.at]}));
}
// a song ended on the air (the next one started): if REC was down for it, it goes on the tape
function airChanged(was){
  const song = S.onAir;
  if (S.taping && was && S.taping.title === was.title && song) tapeFromAir(S.taping);
  S.taping = S.recOn && song && S.mix === BLANK && !BLANK.full ? {title:song.title, artist:song.artist, at:song.at} : null; S.t = 0;
}
// the J-card on the radio: the station's log, newest at the bottom; a ● is on the tape
function renderAirList(){
  if (!S.radio) return;
  const ol = $('#jlist'); ol.innerHTML = '';
  const log = S.airLog;
  log.forEach((e, i) => {
    const li = document.createElement('li'), last = i === log.length - 1;
    if (last) li.className = 'cur'; if (e.taped) li.classList.add('rec');
    const b = document.createElement('button');
    b.innerHTML = `<span class="n">${e.taped ? '●' : last && S.taping ? '●' : ''}</span><span class="t"></span><span class="d">${clock(e.at)}</span>`;
    b.querySelector('.t').textContent = e.title;
    if (e.artist){ const sm = document.createElement('small'); sm.textContent = '  ' + e.artist; b.querySelector('.t').append(sm); }
    // tap a song that's gone by and it's "on the radio", waiting for the blank
    if (!last && !e.taped) b.addEventListener('click', () => { ensureAudio(); sfx('tick'); phonyHeard(e.title, e.artist); });
    li.append(b); ol.append(li);
  });
  if (S.open){ const cur = ol.lastElementChild; if (cur) cur.scrollIntoView({block:'nearest'}); }
}
const clock = t => t ? new Date(t).toLocaleTimeString('en', {hour:'numeric', minute:'2-digit'}).replace(/\s?[AP]M/i, '') : '';

// the browser version: a station plays a few songs through, one every so often
let demoAirT = 0;
function demoAir(st){
  clearTimeout(demoAirT);
  const songs = [['Nights in White Satin', 'The Moody Blues'], ['Wichita Lineman', 'Glen Campbell'], ['Heart of Glass', 'Blondie'], ['Pale Blue Eyes', 'The Velvet Underground']];
  let i = (STATIONS.indexOf(st) + 1) % songs.length;
  const next = () => {
    if (S.radio !== st) return;
    const was = S.onAir; S.radioPlaying = true; S.onAir = {title:songs[i][0], artist:songs[i][1], at:Date.now()}; S.airLog.push({...S.onAir, taped:false});
    i = (i + 1) % songs.length; airChanged(was); trackChanged(); renderAirList(); syncDial();
    demoAirT = setTimeout(next, 9000);
  };
  demoAir.next = next; demoAirT = setTimeout(next, 400);
}
// test hook: the station moves on to its next song
window.phonyAir = () => { if (!N && S.radio && demoAir.next){ clearTimeout(demoAirT); demoAir.next(); } };

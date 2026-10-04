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
S.radio = null; S.radioPlaying = false; S.onAir = null;
let dialX = store.get('dial', .3), dialDrag = null, tuneT = 0, onAirT = 0;

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
let staticGain = null;
function setStatic(level){
  if (!ac) return;
  if (!staticGain){
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = .5;
    const src = ac.createBufferSource(); src.buffer = noise; src.loop = true; src.start();
    staticGain = ac.createGain(); staticGain.gain.value = 0; src.connect(bp).connect(staticGain).connect(sfxBus);
  }
  staticGain.gain.setTargetAtTime(level, ac.currentTime, .06);
}

/* ---------- tuning ---------- */
function tune(st){
  if (S.radio && S.radio.url === st.url) return;
  const first = !S.radio;
  S.radio = st; S.onAir = null; S.radioPlaying = false;
  if (first && S.playing){ pause(); syncKeys(); }   // the tape waits
  if (N) N.tuneRadio(st.url, st.f.toFixed(1) + ' · ' + st.name);
  else { S.radioPlaying = true; S.onAir = {title:'Nights in White Satin', artist:'The Moody Blues'}; }
  trackChanged(); syncDial();
}
// back to the tape: whatever was in the player picks up where it was
function radioOff(){
  if (!S.radio) return;
  S.radio = null; S.onAir = null; S.radioPlaying = false; setStatic(0);
  if (N){
    N.radioOff();
    if (isRemote()) N.useRemote(true);
    else if (isLocal()){ try { N.loadSource(S.src.type, String(S.src.id)); } catch (e) {} N.skipTo(S.idx); N.seekTo(Math.round(S.t * 1000)); }
  }
  trackChanged(); syncDial();
}
// the needle moved: lock onto a station within reach, or hiss
function needleAt(x, settle){
  dialX = Math.max(0, Math.min(1, x));
  const dial = $$('.dial').find(d => d.offsetParent) || $$('.dial')[0]; if (!dial) return;
  const f = fmAt(dial, dialX), st = nearest(f), off = Math.abs(st.f - f);
  if (settle){
    if (off < SNAP){ dialX = fmPos(dial, st.f); tune(st); setStatic(0); sfx('tick'); }
    else { if (S.radio && N) N.radioOff(); S.radio = null; S.radioPlaying = false; setStatic(.05); trackChanged(); }
    store.set('dial', dialX); syncDial(); return;
  }
  if (off < LOCK){ setStatic(0); clearTimeout(tuneT); tuneT = setTimeout(() => tune(st), 220); }
  else { clearTimeout(tuneT); setStatic(Math.min(.14, .03 + off * .05)); if (S.radio){ if (N) N.radioOff(); S.radio = null; S.radioPlaying = false; trackChanged(); } }
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
  const song = oa && oa.title ? {title:oa.title, artist:oa.artist || ''} : null;
  const changed = playing !== S.radioPlaying || (song ? song.title : '') !== (S.onAir ? S.onAir.title : '');
  S.radioPlaying = playing; S.onAir = song;
  if (changed){ trackChanged(); syncDial(); }
}

// PHONY · the player: state, transport, keys, the window and bay, the J-card list, the phone bridge, the main loop
/* ---------- saved settings ---------- */
const store = {
  get(k, d){ try { const v = localStorage.getItem('phony.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('phony.' + k, JSON.stringify(v)); } catch (e) {} },
};

/* ---------- state ---------- */
// src.kind: demo (silent sample) · files (picked in a browser) · local (phone library) · remote (another app, e.g. Spotify)
const S = {tape:store.get('tape', 0), userTape:store.get('tape', 0), tracks:DEMO.slice(), idx:0, t:0, playing:false, cue:0, fx:store.get('fx', true), vol:store.get('vol', .7),
  motor:0, dispP:0, a1:0, a2:0, cOff:0, ejected:false, ej:0, src:{kind:'demo', title:'For the boat'}, startAt:0, open:false, mode:'cover', cmdAt:0, albumMode:false,
  r:{key:'', cur:null, hist:[], done:0, artKey:'', queue:[]}};
S.tape = PL_TAPE; S.ctxHold = 0; S.expect = null;
// Whatever isn't an album plays on a written tape. A drawer playlist brings its own; anything
// else (Liked Songs, a radio station, songs on the phone) gets one named after it, kept for next time.
function pseudoPl(uri, name){ name = name || 'Off the radio'; return {id:'x:' + (uri || name.trim().toLowerCase()), uri:uri || '', name, pseudo:true}; }
function plainPl(){ return pseudoPl('', S.src.kind === 'remote' ? 'Off the radio' : (S.src.title || 'For the boat')); }
S.playlist = plainPl();
function toPlain(){ S.playlist = plainPl(); swapTo(PL_TAPE, true, true); }
// the tape a slot number stands for; the playlist slot takes the look of whichever playlist is in
function tapeAt(i){ return i === PL_TAPE ? DESIGNS[plLook(S.playlist || plainPl()).d] : TAPES[i]; }
const audio = new Audio(); audio.preload = 'auto'; audio.preservesPitch = false; audio.webkitPreservesPitch = false;
const isRemote = () => S.src.kind === 'remote', isLocal = () => S.src.kind === 'local';
const dur = i => (S.tracks[i] && S.tracks[i].dur) || 210;
/* ---------- sides: an album plays like a real cassette. Side A is the first half of the
   songs (the J-card splits them the same way); at the end of it the tape stops and you flip it.
   The silver digital player has auto reverse and carries on by itself. ---------- */
S.side = 'A'; S.sideEnd = false; S.flipped = false;
const sidesOn = () => S.albumMode && S.tape === ALBUM_TAPE && S.tracks.length >= 2 && !S.tracks[0].placeholder;
const half = () => Math.ceil(S.tracks.length / 2);
const sideOf = i => i < half() ? 'A' : 'B';
const autoReverse = () => typeof SKINS !== 'undefined' && SKINS[skinI].id === 'digital';
function sideRange(){ return S.side === 'B' ? [half(), S.tracks.length] : [0, half()]; }
function sideLen(){
  if (sidesOn()){ const [a, b] = sideRange(); let t = 0; for (let i = a; i < b; i++) t += dur(i); return t + 12; }
  return isRemote() ? REMOTE_SIDE : S.tracks.reduce((s, _, i) => s + dur(i), 0) + 24;
}
function posSec(){
  if (sidesOn()){ const [a] = sideRange(); let t = 0; for (let i = a; i < S.idx; i++) t += dur(i); return t + S.t; }
  if (isRemote()) return (S.r.done + S.t) % REMOTE_SIDE;
  let s = 0; for (let i = 0; i < S.idx; i++) s += dur(i); return s + S.t;
}
// the tape runs out at the end of Side A
function endSideA(){
  if (autoReverse()){
    // auto reverse: a clunk, the reels change direction, and Side B plays
    sfx('latch'); S.side = 'B'; S.flipped = false; refreshShells(); tapeChanged(); toSideB(); return;
  }
  pause(); S.cue = 0; S.sideEnd = true; S.t = dur(S.idx); sfx('pop'); syncKeys(); trackChanged();
}
// ■ at the end of Side A: out it comes, over, and back in
function flipTape(){
  S.sideEnd = false; S.flipped = true; S.ejected = true; sfx('eject'); syncKeys();
  setTimeout(() => { S.side = 'B'; S.dispP = 0; refreshShells(); tapeChanged(); S.ejected = false; sfx('insert'); }, 520);
}
function toSideB(){
  S.flipped = false; const b = half();
  if (isRemote()){ N.remoteCmd('next', ''); S.playing = true; S.cmdAt = performance.now(); setTimeout(() => N.remoteCmd('play', ''), 350); }
  else { S.idx = b; S.t = 0; if (S.src.kind !== 'demo') loadTrack(b, true); else trackChanged(); if (!S.playing) play(); }
  syncKeys();
}
// winding back from the end of Side A: the tape is playable again
function unEnd(){ if (S.flipped){ S.side = 'A'; S.dispP = 1; refreshShells(); } S.sideEnd = false; S.flipped = false; trackChanged(); }
function newTape(){ S.side = 'A'; S.sideEnd = false; S.flipped = false; }
function infoFor(i){
  if (S.flipped) i = half(); // flipped and waiting: the label shows what's first on Side B
  const pl = S.tape === PL_TAPE && (S.playlist || plainPl()), lk = pl && plLook(pl);
  return {strokes: pl && pl.mix ? pl.mix.strokes : null, title: pl ? pl.name : S.src.title, side:S.side || 'A', idx:i, sidePos: sidesOn() && S.side === 'B' ? i - half() : i, cur:S.tracks[i] || {title:'—', artist:''}, pen: lk ? PENS[lk.p] : null, tilt: lk ? lk.t : 0};
}

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
$$('.sideslot').forEach(el => el.replaceWith(document.getElementById('sidetpl').content.cloneNode(true)));
$$('.fxrow').forEach(el => el.append(document.getElementById('fxtpl').content.cloneNode(true)));

let ac, master, sfxBus, hissGain, windGain, windBP, lp, noise;
function ensureAudio(){
  if (ac){ if (ac.state === 'suspended') ac.resume(); return; }
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = S.vol; master.connect(ac.destination);
  sfxBus = ac.createGain(); sfxBus.gain.value = .9; sfxBus.connect(ac.destination);
  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const loop = () => { const s = ac.createBufferSource(); s.buffer = noise; s.loop = true; s.start(); return s; };
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800;
  hissGain = ac.createGain(); hissGain.gain.value = 0; loop().connect(hp).connect(hissGain).connect(master);
  windBP = ac.createBiquadFilter(); windBP.type = 'bandpass'; windBP.Q.value = 3; windBP.frequency.value = 900;
  windGain = ac.createGain(); windGain.gain.value = 0; loop().connect(windBP).connect(windGain).connect(sfxBus);
  lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = S.fx ? 11000 : 20000;
  try { ac.createMediaElementSource(audio).connect(lp).connect(master); audio._wired = true; } catch (e) {}
}
function sfx(type){
  if (!ac) return; const t = ac.currentTime + .005;
  const burst = (w, len, f, q, g) => { const s = ac.createBufferSource(); s.buffer = noise; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const gg = ac.createGain(); gg.gain.setValueAtTime(g, w); gg.gain.exponentialRampToValueAtTime(.001, w + len); s.connect(bp).connect(gg).connect(sfxBus); s.start(w, Math.random()); s.stop(w + len + .03); };
  const thunk = (w, f, len, g) => { const o = ac.createOscillator(); o.frequency.setValueAtTime(f, w); o.frequency.exponentialRampToValueAtTime(f * .5, w + len); const gg = ac.createGain(); gg.gain.setValueAtTime(g, w); gg.gain.exponentialRampToValueAtTime(.001, w + len); o.connect(gg).connect(sfxBus); o.start(w); o.stop(w + len + .02); };
  const P = {
    key: () => { burst(t, .03, 2600, 1.2, .55); thunk(t, 150, .07, .35); burst(t + .045, .02, 3800, 2, .25); },
    latch: () => { burst(t, .03, 2200, 1, .6); thunk(t, 115, .09, .5); burst(t + .075, .025, 3200, 1.5, .5); thunk(t + .075, 90, .08, .3); },
    pop: () => { burst(t, .03, 1800, 1, .5); thunk(t, 175, .06, .3); burst(t + .03, .02, 4200, 2, .2); },
    eject: () => { burst(t, .04, 1500, .8, .6); thunk(t, 90, .12, .5); burst(t + .09, .06, 900, .7, .35); burst(t + .13, .02, 4000, 2, .22); },
    insert: () => { burst(t, .03, 1400, .8, .5); burst(t + .12, .025, 2800, 1.4, .45); thunk(t + .12, 105, .1, .45); },
    tick: () => burst(t, .02, 3000, 1.5, .3),
    fx: () => { burst(t, .02, 5000, 2, .3); thunk(t, 240, .04, .2); },
  };
  (P[type] || P.key)();
  try { if (N) N.haptic(type === 'latch' || type === 'eject' || type === 'insert' ? 2 : 1); else navigator.vibrate && navigator.vibrate(type === 'latch' || type === 'eject' ? 18 : 9); } catch (e) {}
}



let toastTimer = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }

/* ---------- transport ---------- */
function loadTrack(i, keepPlaying){
  S.idx = Math.max(0, Math.min(S.tracks.length - 1, i)); S.t = 0;
  if (isLocal()){ N.skipTo(S.idx); }
  else if (S.src.kind === 'files'){ audio.src = S.tracks[S.idx].url; audio.currentTime = 0; if (keepPlaying && S.playing) audio.play().catch(() => {}); }
  trackChanged();
}
function play(){
  if (S.ejected) return; S.playing = true; S.startAt = performance.now(); S.cmdAt = performance.now();
  if (isLocal()) N.play();
  else if (isRemote()) N.remoteCmd('play', '');
  else if (S.src.kind === 'files'){ if (!audio.src) loadTrack(S.idx); audio.play().catch(() => {}); }
}
function pause(){
  S.playing = false; S.cmdAt = performance.now();
  if (isLocal()) N.pause();
  else if (isRemote()) N.remoteCmd('pause', '');
  else if (S.src.kind === 'files') audio.pause();
}
function next(){
  if (S.rec){ skipRec(); return; } // skipping a song on the radio: gone for good
  if (S.sideEnd || S.flipped) return; // the tape is at the end of the side
  if (isRemote()){ N.remoteCmd('next', ''); return; }
  if (S.idx < S.tracks.length - 1) loadTrack(S.idx + 1, true); else endOfSide();
}
function prev(){
  S.mixEnd = false;
  if (S.sideEnd || S.flipped) unEnd();
  if (isRemote()){ N.remoteCmd('prev', ''); return; }
  if (S.t > 3){ S.t = 0; if (isLocal()) N.seekTo(0); else if (S.src.kind === 'files') audio.currentTime = 0; }
  else loadTrack(S.idx - 1, true);
}
function endOfSide(){ pause(); S.cue = 0; S.idx = S.tracks.length - 1; S.t = dur(S.idx); sfx('pop'); syncKeys(); }
audio.addEventListener('ended', () => next());

function eject(){
  // a full blank comes out to be named
  if (S.mix && S.mix === BLANK && S.mix.full && !S.rec){ pause(); S.ejected = true; sfx('eject'); syncKeys(); const m = S.mix; setTimeout(() => openNamer(m), 450); return; }
  pause(); S.ejected = true; sfx('eject'); syncKeys();
  setTimeout(() => { if (S.ejected) showBox(); }, 330);
}
let swapTimer = 0;
function insert(i){
  clearTimeout(swapTimer); S.tape = i; hideBox();
  refreshShells(); tapeChanged();
  S.ejected = false; setTimeout(() => sfx('insert'), 170);
}
// swap tapes with an eject/insert; keepPlaying resumes afterwards (used by album mode)
function swapTo(i, keepPlaying, force){
  ensureAudio();
  if (i < ALBUM_TAPE){ S.userTape = i; store.set('tape', i); }
  if (S.ejected){ insert(i); return; }
  if (i === S.tape && !force) return;
  const was = S.playing && keepPlaying;
  if (!keepPlaying) pause();
  S.ejected = true; sfx('eject'); syncKeys();
  clearTimeout(swapTimer); swapTimer = setTimeout(() => { insert(i); if (was) syncKeys(); }, 450);
}

/* ---------- keys ---------- */
function syncKeys(){ $$('.key[data-k=play]').forEach(k => k.classList.toggle('latched', S.playing)); }
let holdTimer = null, holding = false;
function keyDown(k, el){
  ensureAudio(); el.classList.add('down');
  if (k === 'play'){
    if (S.ejected || S.sideEnd) { sfx('tick'); return; }
    if (S.flipped){ sfx('latch'); toSideB(); return; }
    // a blank with nothing on it: play records whatever's on the radio
    // the blank, stopped at the end of what's on it: play records whatever's waiting on the radio
    if (S.mix && !S.rec && !S.playing && (S.mixEnd || (S.tracks[0] && S.tracks[0].placeholder))){
      readRadio(); const w = ready()[0];
      if (w && S.mix === BLANK && !S.mix.full){ startRecording(w); return; }
      if (S.tracks[0] && S.tracks[0].placeholder){ sfx('tick'); return; }
    }
    if (S.playing){ pause(); sfx('pop'); } else { play(); sfx('latch'); } syncKeys(); return;
  }
  if (k === 'stop'){ sfx('key'); if (S.ejected) insert(S.tape); else if (S.sideEnd) flipTape(); else if (S.playing || S.cue) { pause(); S.cue = 0; syncKeys(); } else eject(); return; }
  if (S.ejected){ sfx('tick'); return; }
  sfx('key'); holding = false; clearTimeout(holdTimer);
  holdTimer = setTimeout(() => { holding = true; if (S.sideEnd || S.flipped){ if (k === 'ff') return; unEnd(); } S.cue = k === 'ff' ? 1 : -1; S.cueBase = null; }, 320);
}
function keyUp(k, el){
  el.classList.remove('down');
  if (k !== 'ff' && k !== 'rew') return;
  clearTimeout(holdTimer); if (S.ejected) return;
  if (holding){ S.cue = 0; holding = false; sfx('tick'); if (isRemote()) N.remoteCmd('seek', String(Math.round(S.t * 1000))); }
  else if (holdTimer){ k === 'ff' ? next() : prev(); }
  holdTimer = null;
}
$$('.key').forEach(el => {
  const k = el.dataset.k;
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); keyDown(k, el); });
  el.addEventListener('pointerup', () => keyUp(k, el));
  el.addEventListener('pointercancel', () => keyUp(k, el));
  el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat){ e.preventDefault(); keyDown(k, el); } });
  el.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); keyUp(k, el); } });
});
function applyFx(){
  $$('.fxled').forEach(l => l.classList.toggle('on', S.fx)); $$('.fxkey').forEach(b => b.setAttribute('aria-pressed', S.fx));
  if (lp) lp.frequency.setTargetAtTime(S.fx ? 11000 : 20000, ac.currentTime, .05);
  if (N && !S.fx) N.setSpeed(1);
}
function toggleFx(){ ensureAudio(); S.fx = !S.fx; store.set('fx', S.fx); sfx('fx'); applyFx(); }
$$('.fxkey').forEach(fk => {
  fk.addEventListener('pointerdown', e => { e.preventDefault(); fk.classList.add('down'); toggleFx(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => fk.addEventListener(ev, () => fk.classList.remove('down')));
  fk.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fk.classList.add('down'); toggleFx(); setTimeout(() => fk.classList.remove('down'), 90); } });
});
document.addEventListener('keydown', e => {
  if (e.target.closest('button,input,[role=slider]')) return;
  const map = {' ':'play', ArrowRight:'ff', ArrowLeft:'rew', e:'stop'}; const k = map[e.key]; if (!k || e.repeat) return;
  e.preventDefault(); const el = [...document.querySelectorAll(`.key[data-k="${k}"]`)].find(x => x.offsetParent); if (!el) return;
  keyDown(k, el); setTimeout(() => keyUp(k, el), 110);
});

/* ---------- volume wheel ---------- */
// click = the user moved the wheel; otherwise the phone's own volume changed and the wheel follows
function setVol(v, click){
  const nv = Math.max(0, Math.min(1, v)); const step = Math.round(nv * 10) !== Math.round(S.vol * 10);
  S.vol = nv;
  $$('.track').forEach(t => { t.firstElementChild.style.top = ((1 - nv) * 100) + '%'; t.setAttribute('aria-valuenow', Math.round(nv * 10)); });
  // on the phone, hiss and clicks already ride the media volume
  if (master) master.gain.setTargetAtTime(N ? 1 : nv, ac.currentTime, .03);
  if (N && click) N.setVolume(nv);
  if (click && step){ sfx('tick'); store.set('vol', nv); }
}
let volDrag = false, volPollAt = 0;
function followPhoneVolume(now){
  if (!N || volDrag || now - volPollAt < 250) return; volPollAt = now;
  const v = N.getVolume(); if (v >= 0 && Math.abs(v - S.vol) > .004) setVol(v, false);
}
$$('.track').forEach(vt => {
  const from = e => { const r = vt.getBoundingClientRect(); setVol(1 - (e.clientY - r.top) / r.height, true); };
  vt.addEventListener('pointerdown', e => { ensureAudio(); volDrag = true; vt.setPointerCapture(e.pointerId); from(e); vt.onpointermove = from; });
  const end = () => { vt.onpointermove = null; volDrag = false; };
  vt.addEventListener('pointerup', end); vt.addEventListener('pointercancel', end);
  vt.addEventListener('keydown', e => { if (e.key === 'ArrowUp'){ e.preventDefault(); ensureAudio(); setVol(S.vol + .1, true); } if (e.key === 'ArrowDown'){ e.preventDefault(); ensureAudio(); setVol(S.vol - .1, true); } });
});

/* ---------- light follows tilt (or pointer in a browser) ---------- */
const root = document.documentElement;
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  root.style.setProperty('--lx', (e.clientX / innerWidth * 100) + '%'); root.style.setProperty('--ly', (e.clientY / innerHeight * 100) + '%');
});
window.addEventListener('deviceorientation', e => {
  if (e.gamma == null) return;
  root.style.setProperty('--lx', (50 + e.gamma * 1.6) + '%'); root.style.setProperty('--ly', (20 + (e.beta - 40) * 1.2) + '%');
});

/* ---------- canvases: closed window + open bay ---------- */
const wins = $$('canvas[data-mode]').map(canvas => ({canvas, ctx:canvas.getContext('2d'), mode:canvas.dataset.mode, scale:1, cache:document.createElement('canvas')}));
function sizeWin(o){
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const w = Math.round(o.canvas.clientWidth * dpr), h = Math.round(o.canvas.clientHeight * dpr);
  if (!w || !h) return;
  o.canvas.width = w; o.canvas.height = h;
  o.scale = o.mode === 'window' ? h / W * 1.12 : Math.min(w * .965 / H, h * .965 / W);
  cacheShell(o);
}
function cacheShell(o){
  o.cache.width = Math.ceil(W * o.scale); o.cache.height = Math.ceil(H * o.scale);
  const c = o.cache.getContext('2d'); c.setTransform(o.scale, 0, 0, o.scale, 0, 0);
  drawShell(c, tapeAt(S.tape), infoFor(S.idx));
}
function refreshShells(){ wins.forEach(cacheShell); }
// (the canvases are watched for size from boot.js, once every script is in)
function drawWin(o){
  if (!o.canvas.offsetParent || !o.canvas.width) return;
  const c = o.ctx, cw = o.canvas.width, ch = o.canvas.height;
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (o.mode === 'window'){
    c.clearRect(0, 0, cw, ch);
    c.translate(cw / 2, ch / 2 - S.ej * ch * 1.15); c.rotate(-Math.PI / 2); c.scale(o.scale, o.scale); c.translate(-W / 2, -285);
    drawInternals(c, S.a1, S.a2, S.dispP); c.drawImage(o.cache, 0, 0, W, H);
    return;
  }
  drawChassis(c, cw, ch);
  const cx = cw * .5, cy = ch * .5;
  const base = () => { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(cx, cy); c.rotate(-Math.PI / 2); c.scale(o.scale, o.scale); c.translate(-W / 2, -H / 2); };
  base(); drawSpindles(c, S.a1, S.a2); drawMechanism(c, S.a2);
  c.setTransform(1, 0, 0, 1, 0, 0); c.translate(0, -S.ej * ch * .9); c.translate(cx, cy); c.rotate(-Math.PI / 2); c.scale(o.scale, o.scale); c.translate(-W / 2, -H / 2);
  c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 30 * o.scale; c.shadowOffsetY = 10 * o.scale; c.fillStyle = '#000'; c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 34); c.fill(); c.restore();
  drawInternals(c, S.a1, S.a2, S.dispP); c.drawImage(o.cache, 0, 0, W, H);
}

/* ---------- J-card ---------- */
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function renderJList(){
  const ol = $('#jlist'); ol.innerHTML = '';
  S.tracks.forEach((tr, i) => {
    const li = document.createElement('li'); if (i === S.idx) li.className = 'cur';
    if (tr.past) li.classList.add('past');
    const b = document.createElement('button');
    const numbered = !isRemote() || S.albumMode || !!S.mix;
    if (tr.rec) li.classList.add('rec');
    b.innerHTML = `<span class="n">${tr.rec ? '●' : tr.placeholder ? '' : numbered ? i + 1 + '.' : (tr.past ? '✓' : (i - S.idx > 0 ? '→' : ''))}</span><span class="t"></span><span class="d">${tr.dur ? fmt(tr.dur) : ''}</span>`;
    b.querySelector('.t').textContent = tr.title;
    if (tr.artist){ const sm = document.createElement('small'); sm.textContent = '  ' + tr.artist; b.querySelector('.t').append(sm); }
    b.addEventListener('click', () => {
      ensureAudio(); if (S.ejected) insert(S.tape);
      if (S.mix){ if (tr.mixPos != null) pickMixSong(tr.mixPos); return; }
      if (isRemote()){
        if (tr.queueId != null){ N.remoteCmd('queue', String(tr.queueId)); sfx('key'); }
        else if (S.albumMode && tr.albumPos != null && N.playAlbumAt){ const u = albumUriFor(S.r.cur && S.r.cur.album); if (u){ N.playAlbumAt(u, tr.albumPos); sfx('key'); } }
        return;
      }
      loadTrack(i, true);
    });
    li.append(b); ol.append(li);
  });
}
function markJList(){
  $$('#jlist li').forEach((li, i) => li.classList.toggle('cur', i === S.idx));
  const cur = $('#jlist li.cur'); if (cur && S.open) cur.scrollIntoView({block:'nearest', behavior:'smooth'});
}
function trackChanged(){
  if (sidesOn()){ if (!S.sideEnd && !S.flipped){ const sd = sideOf(S.idx); if (sd !== S.side){ S.side = sd; S.dispP = sd === 'B' && autoReverse() ? 1 : 0; $('#jtype') && tapeChanged(); } } }
  else if (S.side !== 'A'){ newTape(); }
  refreshShells(); markJList();
  const tr = S.tracks[S.idx] || {title:'', artist:''};
  $('#nowtitle').textContent = tr.title; $('#nowartist').textContent = tr.artist || '';
  $('#nowlabel').textContent = isRemote() ? `NOW PLAYING · ${S.src.app || 'ANOTHER APP'}`.toUpperCase() : (sidesOn() ? `NOW PLAYING · ${S.side}${S.idx - (S.side === 'B' ? half() : 0) + 1}` : `NOW PLAYING · ${tapeAt(S.tape).printed ? 'A' : 'TRACK '}${S.idx + 1}`);
  if (S.mix){
    const m = S.mix;
    $('#nowlabel').textContent = S.rec ? '● RECORDING OFF THE RADIO' : m === BLANK && m.full ? 'TAPE FULL · PRESS ■ TO NAME IT' : (S.tracks[0] && S.tracks[0].placeholder) ? 'BLANK TAPE' : `MIXTAPE Nº ${m.n} · TRACK ${S.idx + 1}`;
    if (foldOpen) buildMixFoldSoon();
  }
  if (S.sideEnd) $('#nowlabel').textContent = 'END OF SIDE A · PRESS ■ TO FLIP';
  else if (S.flipped) $('#nowlabel').textContent = 'SIDE B · PRESS ▶';
  if (foldOpen) foldTrackChanged();
}
function tapeChanged(){
  const tp = tapeAt(S.tape), jc = $('#jcard');
  jc.classList.toggle('printed', !!tp.printed);
  $$('.bias span').forEach(s => s.classList.toggle('on', s.dataset.b === tp.bias));
  if (tp.printed){
    const c = $('#albumart').getContext('2d'); c.setTransform(1, 0, 0, 1, -60, -50); c.clearRect(60, 50, 880, 420);
    tp.label(c, {title:'', side:'A', idx:0, cur:{title:''}, noTrack:true});
    $('#mixtitle').textContent = ALBUM.title;
  } else {
    const st = $('#stripes'); st.innerHTML = '';
    tp.jc.stripes.forEach((col, i) => { const e = document.createElement('i'); e.style.background = col; e.style.height = ['3.6cqw', '1.6cqw', '.8cqw'][i]; e.style.marginTop = i ? '.5cqw' : '1.4cqw'; st.append(e); });
    $('#jtype').textContent = tp.jc.type + ' · SIDE ' + (S.side || 'A');
    const pl = S.tape === PL_TAPE && (S.playlist || plainPl()), pen = pl && PENS[plLook(pl).p], mt = $('#mixtitle');
    mt.textContent = pl ? pl.name : S.src.title;
    if (pl && pl.mix){ mt.textContent = ''; if (pl.mix.strokes && pl.mix.strokes.length){ const c = strokesCanvas(pl.mix.strokes, 640, 80, '#1d3c8f', 3); c.style.height = '1em'; c.style.width = 'auto'; mt.append(c); } else mt.textContent = 'Radio tape'; }
    // the J-card spine is written with the same pen as the tape (unless it's a pen for black shells)
    mt.style.fontFamily = pen && !pen.dark ? pen.font : ''; mt.style.color = pen && !pen.dark ? pen.color : ''; mt.style.fontSize = pen && !pen.dark ? (8.4 * pen.k * .8).toFixed(2) + 'cqw' : '';
  }
  trackChanged();
}
const drums = $$('.drum > div');
drums.forEach(d => { d.innerHTML = Array.from({length:11}, (_, i) => `<span>${i % 10}</span>`).join(''); });
let lastCount = -1;
function updateCounter(){
  let v = (S.a2 - S.cOff) / TAU * .55; v = ((v % 1000) + 1000) % 1000;
  if (Math.abs(v - lastCount) < .004) return; lastCount = v;
  const ones = v % 10, tens = Math.floor(v / 10) % 10, hund = Math.floor(v / 100) % 10;
  const roll = x => Math.max(0, x - 9);
  const vals = [hund + (tens === 9 ? roll(ones) : 0), tens + roll(ones), ones];
  vals.forEach((val, i) => { drums[i].style.transform = `translateY(${-val * 7}cqw)`; });
}
$('#reset').addEventListener('click', () => { ensureAudio(); S.cOff = S.a2; sfx('tick'); });

/* ---------- album mode: a whole album gets the worn album tape ---------- */
function setAlbum(title, artist, dataUrl, key){
  // on a skip, the next song's cover arrives a moment after its title; keep this album's cover until then
  if (!dataUrl && ALBUM.img && sameName(title, ALBUM.title)) return;
  ALBUM.title = title || 'Untitled'; ALBUM.artist = artist || '';
  const done = () => { refreshShells(); if (S.tape === ALBUM_TAPE) tapeChanged(); };
  if (key === ALBUM.key){ done(); return; }
  ALBUM.key = key;
  if (dataUrl){ const img = new Image(); img.onload = () => { ALBUM.img = img; done(); }; img.onerror = () => { ALBUM.img = null; done(); }; img.src = dataUrl; }
  else { ALBUM.img = null; done(); }
}
// switching between an album and a playlist starts the song list fresh
function setAlbumMode(on){
  if (on === S.albumMode) return; S.albumMode = on; S.r.hist = []; newTape();
  if (on){ S.mix = null; S.rec = null; }
  if (on){ S.playlist = null; swapTo(ALBUM_TAPE, true); }
  else { if (!S.playlist) S.playlist = plainPl(); swapTo(PL_TAPE, true, true); }
  if (isRemote() && S.r.cur) buildRemoteTracks(S.r.queue);
}
// a playlist's tape goes in (null: the plain written tape for what's playing)
function setPlaylist(pl){
  pl = pl || plainPl();
  if (!S.albumMode && S.playlist && S.playlist.id === pl.id){
    // same tape; Spotify sometimes names the playlist a moment late
    if (pl.name && pl.name !== S.playlist.name){ S.playlist.name = pl.name; refreshShells(); tapeChanged(); }
    return;
  }
  S.playlist = pl; S.albumMode = false; S.boxAlbum = null; S.r.hist = [];
  if (!pl.mix){ S.mix = null; S.rec = null; }
  swapTo(PL_TAPE, true, true);
  if (isRemote() && S.r.cur) buildRemoteTracks(S.r.queue);
  if (boxVisible()) renderBoxes();
}

/* ---------- phone bridge: local library and other apps ---------- */
let pollAt = 0, remoteMissing = 0, ctxAt = 0;
const sameName = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
function pollNative(now){
  if (!N || now - pollAt < 33) return; pollAt = now;
  if (isLocal()){
    let st; try { st = JSON.parse(N.getState()); } catch (e) { return; }
    if (st.index >= 0 && st.index < S.tracks.length && st.index !== S.idx){ S.idx = st.index; trackChanged(); }
    if (!S.cue) S.t = st.pos / 1000;
    const tr = S.tracks[S.idx]; if (tr && st.dur > 0 && Math.abs((tr.dur || 0) - st.dur / 1000) > 1){ tr.dur = st.dur / 1000; }
    if (now - S.cmdAt > 800 && st.playing !== S.playing){
      if (!st.playing && st.ended){ S.playing = false; sfx('pop'); } else S.playing = st.playing;
      syncKeys();
    }
  } else if (isRemote()){
    const raw = N.getRemote();
    if (!raw){ if (++remoteMissing === 90) toast('Nothing is playing in another app. Start Spotify, then come back.'); return; }
    remoteMissing = 0;
    let st; try { st = JSON.parse(raw); } catch (e) { return; }
    const R = S.r, key = st.title + '|' + st.artist;
    // just after a tape from the box or drawer goes in, Spotify still shows the song it was
    // playing before; that song isn't part of the new tape, so wait for Spotify to switch
    if (S.expect != null){ if (key === S.expect && now < S.ctxHold) return; S.expect = null; }
    const qsig = (st.queue || []).map(q => q.title).join('\n');
    if (key !== R.key){
      if (R.cur){ const played = R.cur.dur || S.t; R.hist.push({...R.cur, past:true}); R.done += played; if (R.hist.length > 40) R.hist.shift(); }
      R.key = key; R.cur = {title:st.title, artist:st.artist, album:st.album, albumArtist:st.albumArtist || '', dur:st.dur / 1000};
      S.src.app = st.app;
      const prevAlbum = R.hist.length ? R.hist[R.hist.length - 1].album : '';
      if (S.mix && !mixLeft()) mixFollow(st);
      else { judgeTape(st, prevAlbum, true); R.qsig = qsig; buildRemoteTracks(st.queue || []); }
    } else if (!S.mix && qsig !== R.qsig){
      // Spotify updates its up-next list a little after it switches; follow it
      R.qsig = qsig; buildRemoteTracks(st.queue || []);
    }
    // cover art often arrives a moment after the track changes
    if (st.artKey !== R.artKey){ R.artKey = st.artKey; setAlbum(st.album, st.albumArtist || st.artist, st.hasArt ? N.getRemoteArt() : '', st.artKey); }
    // Spotify itself says whether it's playing an album; checked every second
    if (now - ctxAt > 1000){ ctxAt = now; if (!S.mix || mixLeft()) judgeTape(st, '', false); }
    if (!S.cue) S.t = st.pos / 1000;
    if (st.dur > 0) R.cur.dur = st.dur / 1000;
    if (now - S.cmdAt > 800 && st.playing !== S.playing){ S.playing = st.playing; syncKeys(); }
  }
}
function spotifyCtx(){
  if (!N || !N.spotifyContext) return null;
  try { const raw = N.spotifyContext(); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function spotifySaysAlbum(album){ const cx = spotifyCtx(); return !!cx && cx.type === 'album' && sameName(cx.album, album); }
/**
 * Which tape belongs in the player for what Spotify is playing.
 * Spotify's own answer (checked every few seconds) wins: a playlist in the drawer gets its tape,
 * an album gets the worn album tape. Without that answer, the old clues: the queue is named
 * after the album, or two songs in a row share one. onTrack: a new song just started.
 */
// you started something else in Spotify: the mixtape comes out
function mixLeft(){
  if (!S.mix || performance.now() < S.ctxHold) return false;
  const cx = spotifyCtx();
  if (!cx || !cx.type || (cx.type === 'playlist' && cx.uri === mixPl(S.mix).uri)) return false;
  S.mix = null; S.rec = null; return true;
}
function judgeTape(st, prevAlbum, onTrack){
  // just after PHONY started something, Spotify's answer may still describe the last thing
  const hold = performance.now() < S.ctxHold;
  const cx = hold ? null : spotifyCtx();
  // one of your mixtapes, started from Spotify (or still playing when PHONY opens)
  const mx = cx && cx.type === 'playlist' && mixByUri(cx.uri);
  if (mx){ setMix(mx); swapTo(PL_TAPE, true, true); const i = mx.songs.findIndex(s => plainSong(s.title) === plainSong(st.title)); showMixTracks(Math.max(0, i)); return; }
  if (cx && cx.type === 'album' && sameName(cx.album, st.album)){ setAlbumMode(true); return; }
  if (cx && cx.type && cx.type !== 'album'){ setPlaylist(ctxPlaylist(cx, st)); return; }
  if (hold) return;
  const albumish = !!st.album && (sameName(st.queueTitle, st.album) || (onTrack && sameName(prevAlbum, st.album)) || (!!S.boxAlbum && sameName(S.boxAlbum.title, st.album)));
  if (albumish){ setAlbumMode(true); return; }
  if (!onTrack || cx) return;
  // no word from Spotify: go by the name it gives the queue
  if (st.queueTitle){ setPlaylist(PLAYLISTS.find(p => sameName(p.name, st.queueTitle)) || pseudoPl('', st.queueTitle)); return; }
  if (S.albumMode) setAlbumMode(false);
}
// the tape for a playlist, Liked Songs, an artist or a radio station
function ctxPlaylist(cx, st){
  if (cx.type === 'playlist'){ const pl = PLAYLISTS.find(p => p.uri === cx.uri); if (pl) return pl; }
  if (cx.type === 'collection') return pseudoPl(cx.uri || 'collection', 'Liked Songs');
  const name = st.queueTitle && !sameName(st.queueTitle, st.album) ? st.queueTitle : (cx.type === 'artist' ? st.artist : '');
  return pseudoPl(cx.uri, name || (cx.type === 'playlist' ? 'Playlist' : 'Off the radio'));
}
const songKey = t => plainSong(t.title) + '|' + (t.artist || '').trim().toLowerCase();
function buildRemoteTracks(queue){
  const R = S.r; R.queue = queue || [];
  if (!R.cur || S.mix) return;
  // Spotify's queue starts with the song that's playing (sometimes after the ones already played); list only what comes next
  const at = R.queue.findIndex(q => sameName(q.title, R.cur.title));
  const upNext = at >= 0 ? R.queue.slice(at + 1) : R.queue;
  if (S.albumMode){
    // an album: its own songs, in order, each once, the one playing marked
    const list = albumTracks(R.cur.album, R.cur.albumArtist || R.cur.artist);
    if (list === null || (list.length && list.findIndex(t => plainSong(t.t) === plainSong(R.cur.title)) < 0)){
      S.tracks = [R.cur]; S.idx = 0; renderJList(); trackChanged(); return;
    }
    if (list.length){
      const ci = list.findIndex(t => plainSong(t.t) === plainSong(R.cur.title));
      S.tracks = list.map((t, i) => i === ci ? R.cur : {title:t.t, artist:R.cur.artist, dur:t.d, past:i < ci, albumPos:i,
        queueId:(R.queue.find(q => plainSong(q.title) === plainSong(t.t)) || {}).id});
      R.cur.albumPos = ci;
      S.idx = ci; renderJList(); trackChanged(); return;
    }
  }
  // a playlist: the last few played, the one playing, what's next; each song once
  const seen = new Set([songKey(R.cur)]), hist = [], next = [];
  if (!S.albumMode) for (let i = R.hist.length - 1; i >= 0 && hist.length < 8; i--){ const h = R.hist[i], k = songKey(h); if (!seen.has(k)){ seen.add(k); hist.unshift(h); } }
  for (const q of upNext){ if (next.length >= 20) break; const t = {title:q.title, artist:q.artist || '', queueId:q.id}, k = songKey(t); if (!seen.has(k)){ seen.add(k); next.push(t); } }
  S.tracks = [...hist, R.cur, ...next];
  S.idx = hist.length; renderJList(); trackChanged();
}
// an album's song list: from the tape box, or from its J-card (fetched, then saved); null while fetching
const albumAsked = {};
function albumTracks(album, artist){
  if (!album) return [];
  const cs = (S.boxAlbum && CASES.find(c => c.id === S.boxAlbum.id && sameTitle(c.title, album))) || CASES.find(c => sameTitle(c.title, album));
  if (cs && cs.tracks && cs.tracks.length) return cs.tracks;
  const key = albumKey({title:album, artist}), n = notesCache[key];
  if (n) return n.tracks || [];
  if (!N) return [];
  if (!albumAsked[key]){ albumAsked[key] = 1; const id = 'n' + (++foldReq); pending[id] = key; N.fetchNotes(id, album, artist || '', ctxAlbumUri(album)); }
  return null;
}
function albumUriFor(album){
  const cs = (S.boxAlbum && CASES.find(c => c.id === S.boxAlbum.id)) || CASES.find(c => sameTitle(c.title, album));
  return (cs && cs.uri) || ctxAlbumUri(album);
}

function chooseSource(src, restoring, keepTape){
  if (!restoring){ pause(); syncKeys(); } S.cue = 0; newTape();
  S.r = {key:'', cur:null, hist:[], done:0, artKey:'', queue:[]};
  S.albumMode = false; S.playlist = null; S.mix = null; S.rec = null;
  if (src.kind === 'remote'){
    S.src = {kind:'remote', title:'Off the radio', app:''}; S.tracks = [{title:'Waiting for another app…', artist:''}]; S.idx = 0; S.t = 0;
    N.useRemote(true);
    if (!keepTape) toPlain();
  } else if (src.kind === 'local'){
    N.useRemote(false);
    let tracks = []; try { tracks = JSON.parse(N.loadSource(src.type, String(src.id))); } catch (e) {}
    if (!tracks.length){ toast('No songs found there.'); return; }
    S.src = {kind:'local', type:src.type, id:src.id, title:src.title};
    S.tracks = tracks.map(t => ({title:t.title, artist:t.artist, dur:t.dur / 1000, album:t.album})); S.idx = 0; S.t = 0; S.dispP = 0;
    if (src.type === 'album'){
      setAlbum(src.title, src.artist, N.getAlbumArt(String(src.id)), 'local|' + src.id);
      S.albumMode = true; S.playlist = null; swapTo(ALBUM_TAPE, true);
    } else toPlain();
  } else if (src.kind === 'demo'){
    if (N) N.useRemote(false);
    S.src = {kind:'demo', title:'For the boat'}; S.tracks = DEMO.slice(); S.idx = 0; S.t = 0;
    toPlain();
  }
  store.set('src', src);
  renderJList(); tapeChanged();
}

/* ---------- music chooser sheet ---------- */
const sheet = $('#sheet'), sheetBody = $('#sheetbody');
function row(title, sub, onClick, cls){
  const b = document.createElement('button'); b.className = 'srow' + (cls ? ' ' + cls : '');
  b.innerHTML = '<b></b><small></small>'; b.querySelector('b').textContent = title; b.querySelector('small').textContent = sub || '';
  b.addEventListener('click', onClick); return b;
}
function heading(t){ const h = document.createElement('h4'); h.textContent = t; return h; }
function openSheet(){
  ensureAudio(); sheetBody.innerHTML = '';
  if (N){
    sheetBody.append(heading('FROM ANOTHER APP'));
    if (N.hasListenerAccess()) sheetBody.append(row('Whatever is playing now', 'Spotify, YouTube Music, podcasts. PHONY becomes the remote.', () => { closeSheet(); chooseSource({kind:'remote'}); }));
    else sheetBody.append(row('Let PHONY see what is playing', 'Opens Android settings. Turn on PHONY under notification access, then come back.', () => N.openListenerSettings(), 'ask'));
    sheetBody.append(heading('ON THIS PHONE'));
    if (!N.hasAudioPermission()){
      sheetBody.append(row('Allow access to your music', 'PHONY plays songs saved on the phone.', () => N.requestAudioPermission(), 'ask'));
    } else {
      let lib = {albums:[], count:0}; try { lib = JSON.parse(N.getLibrary()); } catch (e) {}
      sheetBody.append(row('All songs', `${lib.count} songs, shuffled into one long mix`, () => { closeSheet(); chooseSource({kind:'local', type:'all', id:'', title:'Everything'}); }));
      if (!lib.albums.length) sheetBody.append(row('No albums found', 'Copy music into the Music folder on the phone.', () => {}, 'muted'));
      lib.albums.forEach(a => sheetBody.append(row(a.title, `${a.artist} · ${a.count} songs`, () => { closeSheet(); chooseSource({kind:'local', type:'album', id:a.id, title:a.title, artist:a.artist}); })));
    }
  } else {
    sheetBody.append(heading('IN THIS BROWSER'));
    sheetBody.append(row('Sample mix', 'Silent. Shows how the player works.', () => { closeSheet(); chooseSource({kind:'demo'}); }));
    sheetBody.append(row('Load audio files…', 'Pick songs from this computer.', () => { closeSheet(); $('#files').click(); }));
  }
  sheet.hidden = false;
}
function closeSheet(){ sheet.hidden = true; }
$('#spine').addEventListener('click', () => { if (S.mode === 'pocket' && !S.open) return; openSheet(); });
$('#sheetclose').addEventListener('click', closeSheet);
// called by the app after a permission prompt or a trip to settings
window.phonyRefresh = () => { if (!sheet.hidden) openSheet(); };

/* ---------- browser test path: local files ---------- */
$('#files').addEventListener('change', () => {
  const files = $('#files');
  const list = [...files.files].filter(f => f.type.startsWith('audio') || /\.(mp3|m4a|aac|flac|wav|ogg|opus)$/i.test(f.name));
  if (!list.length) return;
  ensureAudio(); pause(); syncKeys();
  try { if (!audio._wired){ ac.createMediaElementSource(audio).connect(lp).connect(master); audio._wired = true; } } catch (e) {}
  S.tracks = list.map(f => { const base = f.name.replace(/\.[^.]+$/, ''); const parts = base.split(' - ');
    return {title: parts.length > 1 ? parts.slice(1).join(' - ') : base, artist: parts.length > 1 ? parts[0] : '', dur:0, url:URL.createObjectURL(f)}; });
  S.tracks.forEach(tr => { const a = new Audio(); a.preload = 'metadata'; a.src = tr.url; a.onloadedmetadata = () => { tr.dur = a.duration; renderJList(); markJList(); }; });
  S.src = {kind:'files', title:'My mix'}; S.dispP = 0; S.albumMode = false;
  S.playlist = plainPl(); S.tape = PL_TAPE;
  if (S.ejected) insert(S.tape);
  renderJList(); loadTrack(0); tapeChanged();
});

/* ---------- closed / open / pocket follows the screen ----------
   The Fold's cover screen is the closed player; its inner screen is the open one. A tall, narrow
   phone (an S26 Ultra) gets the pocket: the closed player at its true proportions across the top,
   and the J-card tucked in a pocket beneath it, pulled up by hand. The player is never stretched. */
const WALK_H = 1 / .661;   // the closed player's height as a share of its width (the Fold's cover screen)
function screenMode(){ const r = innerWidth / innerHeight; return r > .95 ? 'open' : r < .58 ? 'pocket' : 'cover'; }
const inner = $('#inner');
function layout(){
  const mode = screenMode();
  if (mode === S.mode && layout.done){ fitCover(); return; } layout.done = true;
  S.mode = mode; document.body.dataset.mode = mode;
  const open = mode === 'open';
  S.open = open;   // in the pocket, S.open means the card is pulled up
  $('#cover').hidden = open; inner.hidden = false;
  document.body.dataset.slab = open ? '' : '1';   // the two one-screen layouts share the card's machinery
  inner.classList.remove('up', 'down', 'away', 'sliding', 'endstop'); inner.style.transform = '';
  $('#cover').classList.remove('lift'); $('#cover .walkman').style.transform = '';
  fitCover();
  hideBox(); if (!open){ closeSheet(); if (typeof closeFold === 'function') closeFold(); }
  if (!open) cardTo(false, true);
  if (S.ejected) showBox();
  if (typeof applySkin === 'function') applySkin();   // the black shell's name tag
  requestAnimationFrame(() => { wins.forEach(sizeWin); markJList(); });
}
// (boot.js hooks layout to the window's resize, once every script is in)
// The closed player fills a screen of the Fold's shape (within 6%); a squatter or taller screen
// that still isn't a pocket gets black bars instead of a stretched player.
function fitCover(){
  const c = $('#cover'), r = innerWidth / innerHeight, k = r * WALK_H;
  if (S.mode !== 'cover' || Math.abs(k - 1) < .06){ c.style.cssText = ''; inner.style.cssText = ''; return; }
  const w = k > 1 ? innerHeight / WALK_H : innerWidth, h = k > 1 ? innerHeight : innerWidth * WALK_H;
  // the card beneath the player gets the same box
  c.style.cssText = inner.style.cssText = `width:${w}px;height:${h}px;left:${(innerWidth - w) / 2}px;top:${(innerHeight - h) / 2}px;right:auto;bottom:auto`;
}
// (whose player this is lives in setup.js: asked once, written on the black shell)

/* ---------- the card beneath the player ----------
   On a tall phone (the pocket) the card always shows beneath the player. On the Fold's cover screen
   the player covers it: swipe up on the window and the player lifts a fifth, and there it is. Either
   way, tap or drag the card and it slides up over the player; drag it down by its spine or the
   banner and it slips back (and on the cover screen the player settles down over it again). */
const slab = () => S.mode !== 'open';
const pocketPx = () => S.mode === 'pocket' ? innerWidth * WALK_H : inner.clientHeight * .8;   // where the card rests
let cardDrag = null, cardMovedAt = 0;
// a tap or drag has just moved the card: swallow the click that follows it
const cardSettling = () => slab() && performance.now() - cardMovedAt < 450;
function cardTo(up, instant){
  if (!slab()) return;
  const cover = $('#cover'), wasUp = S.open;
  S.open = up; inner.classList.toggle('up', up); inner.classList.remove('sliding');
  if (instant){ inner.style.transition = 'none'; void inner.offsetWidth; }
  inner.style.transform = ''; inner.style.transition = '';
  if (S.mode === 'cover'){
    // up: the player settles back down, unseen, behind the card. Down: the card slides off the
    // bottom over the player, then rests behind it again
    if (up){ cover.classList.remove('lift'); inner.classList.remove('down'); }
    else if (wasUp && !instant){ inner.classList.add('sliding'); setTimeout(() => { if (!S.open){ inner.classList.remove('sliding'); inner.classList.add('down'); } }, 470); }
    else inner.classList.add('down');
  } else inner.classList.toggle('down', !up);
  if (!up){ closeSheet(); if (typeof closeFold === 'function') closeFold(); }
  markJList();
}
$('#inner .lid').addEventListener('pointerdown', e => {
  if (!slab() || S.ejected || e.button > 0 || cardDrag) return;
  if (typeof foldOpen !== 'undefined' && foldOpen) return;
  // down, the card comes up from anywhere on it; up, it goes back by its spine or the banner only,
  // so the song list still scrolls
  if (S.open && !e.target.closest('.spine, .now')) return;
  cardDrag = {id:e.pointerId, y0:e.clientY, ly:e.clientY, lt:performance.now(), v:0, from:S.open ? 0 : pocketPx(), moved:false};
});
addEventListener('pointermove', e => {
  const d = cardDrag; if (!d || e.pointerId !== d.id) return;
  const dy = e.clientY - d.y0;
  if (!d.moved){ if (Math.abs(dy) < 8) return; d.moved = true; inner.style.transition = 'none'; if (S.mode === 'cover' && S.open) inner.classList.add('sliding'); ensureAudio(); }
  const now = performance.now(); d.v = (e.clientY - d.ly) / Math.max(1, now - d.lt); d.ly = e.clientY; d.lt = now;
  inner.style.transform = `translateY(${Math.max(0, Math.min(pocketPx(), d.from + dy))}px)`;
});
const cardUp = e => {
  const d = cardDrag; if (!d || e.pointerId !== d.id) return; cardDrag = null;
  cardMovedAt = performance.now();
  if (!d.moved){ if (!S.open){ ensureAudio(); sfx('tick'); cardTo(true); } else cardMovedAt = 0; return; }
  const y = Math.max(0, Math.min(pocketPx(), d.from + e.clientY - d.y0));
  // a flick decides; otherwise the card settles on whichever side it's nearer
  const up = Math.abs(d.v) > .35 ? d.v < 0 : y < pocketPx() / 2;
  sfx('tick'); cardTo(up);
};
addEventListener('pointerup', cardUp); addEventListener('pointercancel', cardUp);
inner.addEventListener('click', e => { if (cardSettling()){ e.stopPropagation(); e.preventDefault(); } }, true);

/* ---------- lifting the player (cover screen): swipe up on the window ---------- */
let liftDrag = null;
const liftPx = () => $('#cover').clientHeight * .2;
function liftTo(on){
  const cover = $('#cover'), wm = $('#cover .walkman');
  wm.style.transition = ''; wm.style.transform = ''; cover.classList.toggle('lift', on);
}
$$('#cover .window, #cover .lcd').forEach(el => el.addEventListener('pointerdown', e => {
  if (S.mode !== 'cover' || S.ejected || S.open || e.button > 0 || liftDrag) return;
  const lifted = $('#cover').classList.contains('lift');
  liftDrag = {id:e.pointerId, y0:e.clientY, ly:e.clientY, lt:performance.now(), v:0, from:lifted ? -liftPx() : 0, moved:false};
}));
addEventListener('pointermove', e => {
  const d = liftDrag; if (!d || e.pointerId !== d.id) return;
  const dy = e.clientY - d.y0, wm = $('#cover .walkman');
  if (!d.moved){ if (Math.abs(dy) < 8) return; d.moved = true; wm.style.transition = 'none'; ensureAudio(); }
  const now = performance.now(); d.v = (e.clientY - d.ly) / Math.max(1, now - d.lt); d.ly = e.clientY; d.lt = now;
  wm.style.transform = `translateY(${Math.max(-liftPx(), Math.min(0, d.from + dy))}px)`;
});
const liftUp = e => {
  const d = liftDrag; if (!d || e.pointerId !== d.id) return; liftDrag = null;
  if (!d.moved) return;
  const y = Math.max(-liftPx(), Math.min(0, d.from + e.clientY - d.y0));
  const on = Math.abs(d.v) > .35 ? d.v < 0 : y < -liftPx() / 2;
  sfx('tick'); liftTo(on);
};
addEventListener('pointerup', liftUp); addEventListener('pointercancel', liftUp);

/* ---------- main loop ---------- */
let last = performance.now(), rateTick = 0, timeTick = 0, cueSeekAt = 0;
const runLeds = $$('.runled');
function loop(now){
  // never zero: the first frame's time can equal the clock read while the scripts loaded, and 0/0 would poison the reels
  const dt = Math.max(.001, Math.min(.05, (now - last) / 1000)); last = now;
  S.ej += ((S.ejected ? 1 : 0) - S.ej) * Math.min(1, dt * 9);
  const moving = (S.playing || S.cue) && !S.ejected;
  S.motor += ((moving ? 1 : 0) - S.motor) * Math.min(1, dt * (moving ? 14 : 20));
  pollNative(now);
  followPhoneVolume(now);
  if (S.cue && !S.ejected){
    const ck = S.cueK || 9;
    S.t += S.cue * ck * dt;
    if (S.src.kind === 'files'){ const nt = audio.currentTime + S.cue * ck * dt; if (nt >= 0 && nt < (audio.duration || 1e9)) audio.currentTime = nt; S.t = audio.currentTime; }
    else if (isLocal() && now - cueSeekAt > 120){ cueSeekAt = now; N.seekTo(Math.max(0, Math.round(S.t * 1000))); }
    if (isRemote()) S.t = Math.max(0, Math.min(S.t, dur(S.idx) - 1));
  } else if (S.playing && !S.ejected){
    if (S.src.kind === 'demo') S.t += dt * S.motor; else if (S.src.kind === 'files') S.t = audio.currentTime || 0;
  }
  if (S.rec){
    if (S.cue > 0) S.rec.spoiled = true;
    const d = dur(S.idx);
    if (S.playing && !S.ejected && S.rec.seen && d > 20 && S.t >= d - 1.2) finishRec();
  }
  const atEnd = S.sideEnd || S.flipped || !!S.rec;
  if (!atEnd && sidesOn() && S.side === 'A' && S.idx === half() - 1 && S.playing && !S.cue && !S.ejected && (isRemote() || isLocal()) && S.t >= dur(S.idx) - .7 && dur(S.idx) > 5) endSideA();
  if (!atEnd && (S.src.kind === 'demo' || S.src.kind === 'files' || (isLocal() && S.cue))){
    // the tape runs out at the end of Side A, even while winding
    if (S.t >= dur(S.idx) && sidesOn() && S.side === 'A' && S.idx === half() - 1){ S.cue = 0; endSideA(); }
    else if (S.t >= dur(S.idx)){ if (S.idx < S.tracks.length - 1){ S.idx++; S.t = 0; if (S.src.kind !== 'demo') loadTrack(S.idx, true); else trackChanged(); } else endOfSide(); }
    else if (S.t < 0){ if (S.idx > 0){ S.idx--; S.t = dur(S.idx) - .1; if (S.src.kind !== 'demo'){ loadTrack(S.idx, true); if (isLocal()) N.seekTo(Math.round(S.t * 1000)); else audio.currentTime = S.t; } else trackChanged(); } else { S.t = 0; S.cue = 0; } }
  }
  const L = sideLen(), pp = Math.max(0, Math.min(1, posSec() / L)), p = sidesOn() && S.side === 'B' && autoReverse() ? 1 - pp : (S.sideEnd ? 1 : pp);
  // winding is quick but visible: never longer than about 2.5 s for a whole side
  const maxStep = Math.max(16 / L, .4) * dt, move = Math.max(-maxStep, Math.min(maxStep, p - S.dispP));
  S.dispP += move;
  const lenPerSec = (move / dt) * L * LINEAR;
  S.a1 += lenPerSec / packR(1 - S.dispP) * dt; S.a2 += lenPerSec / packR(S.dispP) * dt;
  const mult = Math.abs(move / dt * L);
  if (ac){
    const t = ac.currentTime;
    windGain.gain.setTargetAtTime(Math.max(0, Math.min(1, (mult - 1.6) / 9)) * .07, t, .04);
    windBP.frequency.setTargetAtTime(500 + mult * 110, t, .05);
    hissGain.gain.setTargetAtTime(S.fx && S.playing && !S.ejected ? .016 : 0, t, .05);
  }
  if (now - rateTick > (isLocal() ? 400 : 150) && S.fx && S.playing && !S.cue){
    rateTick = now;
    const ramp = Math.min(1, .92 + (now - S.startAt) / 3000);
    const rate = ramp * (1 + .0025 * Math.sin(now / 1000 * TAU * .55));
    if (isLocal()) N.setSpeed(rate);
    else if (S.src.kind === 'files') audio.playbackRate = rate;
  }
  if (S.src.kind === 'files') audio.volume = S.cue ? .35 : 1;
  runLeds.forEach(l => l.classList.toggle('on', S.motor > .5));
  face.classList.toggle('spinning', S.motor > .5); updateLcd(now);
  if (S.open || slab()){
    updateCounter();
    if (now - timeTick > 250){ timeTick = now; $('#nowtime').textContent = `${fmt(Math.max(0, S.t))} / ${fmt(dur(S.idx))}`; }
    if (foldOpen) syncWords();
  }
  notePort(now);
  wins.forEach(drawWin);
  requestAnimationFrame(loop);
}




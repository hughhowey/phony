// PHONY · the radio and the blank tape: recording, naming, the box of finished tapes, a mixtape's J-card
/* ================= the radio and the blank tape =================
   Songs you Shazam out in the world wait "on the radio" (three at most). The REC switch records
   them onto the blank tape: it puts the blank in by itself, then plays the oldest song waiting
   through from Spotify. Only a full listen puts a song on the tape (pausing and winding back are
   fine; skipping or winding forward and it's gone for good). With the real radio on, REC tapes
   the air instead: each song the station plays goes on the tape as it ends, until you press ■.
   A tape holds 90 minutes; when it's full you press ⏏, write its name on the spine with the
   pencil, and it goes into the tape box, spine out. */
const MIX_LEN = 90 * 60, MIX_SIDE = 45 * 60;
let BLANK = store.get('blank', null), MIXES = store.get('mixtapes', []), RADIO = [];
const DEMO_RADIO = [
  {key:'d1', title:'Pon de Floor', artist:'Major Lazer', dur:212, uri:'demo', at:Date.now() - 3 * 864e5, place:'Gouyave, Grenada'},
  {key:'d2', title:'Nights Like This', artist:'Kehlani', dur:201, uri:'demo', at:Date.now() - 864e5, place:"St. George's, Grenada"},
];
function saveMix(){ store.set('blank', BLANK); store.set('mixtapes', MIXES); }
function ensureBlank(){
  if (BLANK) return BLANK;
  // a fresh blank: a different shell from the last one
  const lastD = MIXES.length ? MIXES[MIXES.length - 1].d : -1, plain = DESIGNS.map((_, i) => i).filter(i => !DESIGNS[i].dub);
  let d; do { d = plain[Math.floor(Math.random() * plain.length)]; } while (d === lastD && plain.length > 1);
  BLANK = {id:'m' + Date.now().toString(36), d, songs:[], playlistId:'', started:0, n:MIXES.length + 1};
  saveMix(); return BLANK;
}
const mixSecs = m => m.songs.reduce((a, s) => a + (s.dur || 0), 0);
function mixPl(m){
  const id = 'mix:' + m.id;
  if (!LOOKS[id] || LOOKS[id].d !== m.d){ const r = rng(m.id.length * 97 + m.d); LOOKS[id] = {d:m.d, did:DESIGNS[m.d].id, p:'pencil', t:-.02, r:(r() - .5) * 8, x:0, y:0}; store.set('plLooks', LOOKS); }
  return {id, uri:m.playlistId ? 'spotify:playlist:' + m.playlistId : '', name:'', mix:m};
}
function readRadio(){ if (!N){ RADIO = DEMO_RADIO; return; } try { RADIO = JSON.parse(N.radioWaiting() || '[]'); } catch (e) { RADIO = []; } }
let radioNoticeId = -1;
window.phonyRadio = () => {
  readRadio();
  try { const n = JSON.parse(N.radioNotice()); if (radioNoticeId >= 0 && n.id !== radioNoticeId && n.text) toast(n.text); radioNoticeId = n.id; } catch (e) {}
  if (boxVisible()) renderBoxes();
  if (S.recOn && !S.radio) resumeRec();   // REC is down and a song just came in: it records
};
// test hook for the browser version (and for trying it out): put a song on the radio
window.phonyHeard = (title, artist) => {
  if (N){ N.radioHeard(title, artist || ''); return; }
  DEMO_RADIO.push({key:'d' + Date.now(), title, artist:artist || '', dur:150 + Math.round(Math.random() * 120), uri:'demo', at:Date.now(), place:'Prickly Bay, Grenada'});
  while (DEMO_RADIO.length > 3) DEMO_RADIO.shift();
  toast('On the radio: ' + title); if (boxVisible()) renderBoxes();
  if (S.recOn && !S.radio) resumeRec();
};
const ready = () => RADIO.filter(w => w.uri);

/* ---------- the tape's song list ---------- */
function mixTracks(m){
  const t = m.songs.map((s, i) => ({title:s.title, artist:s.artist, dur:s.dur, album:s.album || '', mixPos:i}));
  if (S.rec && m === BLANK) t.push({title:S.rec.w.title, artist:S.rec.w.artist, dur:S.rec.w.dur || 210, album:S.rec.w.album || '', rec:true});
  return t;
}
function showMixTracks(idx){
  const m = S.mix; if (!m) return;
  S.tracks = mixTracks(m);
  if (!S.tracks.length) S.tracks = [{title:'Blank tape', artist:RADIO.length ? 'Finding it on Spotify… (needs a signal)' : 'Shazam a song you love and it waits here', placeholder:true}];
  S.idx = Math.max(0, Math.min(S.tracks.length - 1, idx == null ? S.idx : idx)); renderJList(); trackChanged();
}

/* ---------- putting a tape in ---------- */
function setMix(m){
  S.mixEnd = m === BLANK;
  S.mix = m; S.boxAlbum = null; newTape(); S.albumMode = false; S.playlist = mixPl(m);
}
function loadBlank(){ loadMix(ensureBlank()); }
const mixById = id => MIXES.find(m => m.id === id) || (BLANK && BLANK.id === id ? BLANK : null) || (typeof DUBS !== 'undefined' ? DUBS.find(m => m.id === id) : null) || null;
// Spotify is on this mixtape: the song it's playing is one of the tape's
function remoteOnMix(){ const m = S.mix, c = S.r.cur; return !!m && !!c && m.songs.some(s => plainSong(s.title) === plainSong(c.title)); }
// quiet: the tape just goes in (REC does that; the radio keeps playing)
function loadMix(m, quiet){
  readRadio();
  S.ctxHold = performance.now() + 9000; S.expect = S.r.key || null; S.rec = null;
  if (!quiet && S.radio) radioOff();   // one thing plays at a time
  if (N && !S.radio){ if (N.hasListenerAccess()) chooseSource({kind:'remote'}, true, true); else toast('Turn on notification access for PHONY so it can follow Spotify.'); }
  if (S.playing && !S.radio){ pause(); syncKeys(); }
  setMix(m);
  S.ejected = true; insert(PL_TAPE); renderBoxes();
  if (quiet){ S.mixEnd = true; showMixTracks(Math.max(0, m.songs.length - 1)); if (S.radio) renderAirList(); return; }
  if (m.songs.length){
    showMixTracks(0);
    if (N && m.playlistId){ N.playPlaylist('spotify:playlist:' + m.playlistId, ''); S.playing = true; S.startAt = S.cmdAt = performance.now(); setTimeout(() => sfx('latch'), 250); syncKeys(); }
    else if (!N){ S.src = {kind:'demo', title:''}; S.tracks = mixTracks(m); S.idx = 0; S.t = 0; renderJList(); trackChanged(); setTimeout(() => { play(); sfx('latch'); syncKeys(); }, 600); }
    return;
  }
  pause(); syncKeys(); showMixTracks(0);
}

/* ---------- the REC switch ---------- */
// REC down: the blank goes in (whatever was in comes out; the radio keeps playing), and it records
function recOn(){
  if (S.recOn) return;
  const m = ensureBlank();
  if (S.ejected && boxVisible()) hideBox();
  if (S.mix !== m) loadMix(m, true); else if (S.playing && !S.rec){ pause(); syncKeys(); }
  S.recOn = true; syncRec(); sfx('latch');
  resumeRec();
}
// REC up: the recording stops where it is (a song half taped stays on the radio)
function recOff(quiet){
  if (!S.recOn) return;
  S.recOn = false; S.taping = null; syncRec(); if (!quiet) sfx('key');
  if (S.rec){ S.rec = null; if (S.playing){ pause(); syncKeys(); } S.mixEnd = true; showMixTracks(Math.max(0, S.mix.songs.length - 1)); }
  else { trackChanged(); if (S.radio) renderAirList(); }
}
// what's on the radio goes onto the tape: the air, or the songs waiting
function resumeRec(){
  const m = S.mix; if (!S.recOn || !m || m !== BLANK) return;
  if (m.full){ trackChanged(); return; }   // TAPE FULL · ⏏ TO NAME IT
  if (S.radio){ if (S.onAir && !S.taping){ S.taping = {title:S.onAir.title, artist:S.onAir.artist, at:S.onAir.at || Date.now()}; S.t = 0; } trackChanged(); renderAirList(); return; }
  if (S.rec) return;
  readRadio(); const w = ready()[0];
  if (w){ startRecording(w); return; }
  if (RADIO.length) toast('The song on the radio isn\'t found on Spotify yet. It needs a signal.');
  S.mixEnd = true; showMixTracks(Math.max(0, m.songs.length - 1));
}
// a song ended on the air with REC down: find it on Spotify, and it's on the tape
const airPending = {}; let airReq = 0;
function tapeFromAir(t){
  const id = 'air' + (++airReq); airPending[id] = {...t, on:S.radio ? S.radio.name + ' · ' + S.radio.where : ''};
  if (N) N.findSong(id, t.title, t.artist);
  else setTimeout(() => phonyFound(id, JSON.stringify({uri:'demo', dur:195, album:'', title:t.title, artist:t.artist, place:'Prickly Bay, Grenada'})), 300);
}
window.phonyFound = (id, json) => {
  const t = airPending[id]; delete airPending[id]; if (!t) return;
  let hit = null; try { hit = json ? JSON.parse(json) : null; } catch (e) {}
  const m = BLANK; if (!m) return;
  const mark = () => { const e = S.airLog.find(x => x.title === t.title && x.at === t.at); if (e) e.taped = true; if (S.radio) renderAirList(); };
  if (!hit || !hit.uri){ toast('Not on Spotify: ' + t.title); return; }
  if (mixSecs(m) + (hit.dur || 210) > MIX_LEN){ m.full = true; saveMix(); recOff(true); trackChanged(); return; }
  m.songs.push({title:hit.title || t.title, artist:hit.artist || t.artist, album:hit.album || '', uri:hit.uri, dur:Math.round(hit.dur || 0),
    heard:{at:t.at || Date.now(), place:hit.place || '', lat:hit.lat, lon:hit.lon, on:t.on}, rec:Date.now()});
  if (!m.started) m.started = Date.now();
  if (mixSecs(m) >= MIX_LEN - 60) m.full = true;
  saveMix(); toSpotify(m, hit.uri); sfx('pop'); toast('On the tape: ' + (hit.title || t.title)); mark();
  if (m.full){ recOff(true); trackChanged(); }
};
function startRecording(w){
  const m = S.mix; if (!m || m !== BLANK) return;
  // won't fit: the tape is full and the song waits for the next blank
  if (mixSecs(m) + (w.dur || 210) > MIX_LEN){ m.full = true; saveMix(); pause(); recOff(true); showMixTracks(m.songs.length - 1); return; }
  S.rec = {w, spoiled:false, seen:!N}; S.mixEnd = false;
  showMixTracks(m.songs.length);
  sfx('latch');
  if (N){ N.playTrack(w.uri, w.title); S.playing = true; S.startAt = S.cmdAt = performance.now(); S.ctxHold = performance.now() + 9000; }
  else { S.src = {kind:'demo', title:''}; S.t = 0; play(); }
  syncKeys();
}
// the whole song played: it's on the tape
function finishRec(){
  const m = S.mix, r = S.rec; if (!m || !r) return;
  S.rec = null; pause(); syncKeys(); S.mixEnd = true;
  dropFromRadio(r.w);
  if (r.spoiled){ sfx('pop'); toast('Wound past part of it. Not recorded.'); showMixTracks(m.songs.length - 1); return nextOnRadio(); }
  const w = r.w, cur = S.tracks[S.idx] || {};
  m.songs.push({title:w.title, artist:w.artist, album:w.album || cur.album || '', uri:w.uri, dur:Math.round(cur.dur || w.dur || 0),
    heard:{at:w.at || Date.now(), place:w.place || '', lat:w.lat, lon:w.lon}, rec:Date.now()});
  if (!m.started) m.started = Date.now();
  if (mixSecs(m) >= MIX_LEN - 60) m.full = true;
  saveMix(); toSpotify(m, w.uri);
  sfx('pop'); toast('On the tape: ' + w.title);
  showMixTracks(m.songs.length - 1);
  nextOnRadio();
}
// skipped, or wound past: gone for good
function skipRec(){
  const r = S.rec; if (!r) return;
  S.rec = null; pause(); syncKeys(); S.mixEnd = true; dropFromRadio(r.w); sfx('key'); toast('Off the radio: ' + r.w.title);
  showMixTracks(S.mix.songs.length - 1); nextOnRadio();
}
function dropFromRadio(w){ if (N) N.radioDrop(w.key); else { const i = DEMO_RADIO.indexOf(w); if (i >= 0) DEMO_RADIO.splice(i, 1); } readRadio(); }
function nextOnRadio(){
  const m = S.mix, w = ready()[0];
  if (m && m === BLANK && !m.full && w && S.recOn) setTimeout(() => { if (S.mix === m && !S.rec && S.recOn) startRecording(w); }, 2200);
  else if (m && m.full){ recOff(true); trackChanged(); }
  else trackChanged();
}
// the Spotify playlist behind the tape, made on the first song
let mixMaking = null;
function toSpotify(m, uri){
  if (!N){ m.playlistId = m.playlistId || 'demo'; return; }
  if (m.playlistId){ N.mixAdd(m.playlistId, uri); return; }
  (m.pending = m.pending || []).push(uri); saveMix();
  if (mixMaking) return;
  mixMaking = m; N.mixCreate('PHONY radio tape Nº ' + m.n);
}
window.phonyMixMade = id => {
  const m = mixMaking; mixMaking = null; if (!m) return;
  if (!id){ toast('Couldn\'t make the tape\'s playlist in Spotify. Sign in again from the drawer.'); return; }
  m.playlistId = id; (m.pending || []).forEach(u => N.mixAdd(id, u)); m.pending = []; saveMix();
  if (S.playlist && S.playlist.mix === m) S.playlist = mixPl(m);
};

/* ---------- following Spotify while a mixtape is in ---------- */
function mixFollow(st){
  const m = S.mix;
  if (S.rec){
    const w = S.rec.w;
    if (sameName(st.title, w.title) || (w.uri && plainSong(st.title) === plainSong(w.title))){
      S.rec.seen = true; const e = S.tracks[S.tracks.length - 1]; if (e && e.rec && st.dur > 0) e.dur = st.dur / 1000;
      showMixTracks(S.tracks.length - 1); return;
    }
    // Spotify moved off the song before it finished: skipped
    if (S.rec.seen && performance.now() > S.ctxHold) skipRec();
    return;
  }
  const i = m.songs.findIndex(s => plainSong(s.title) === plainSong(st.title));
  if (i >= 0) showMixTracks(i);
}
function mixByUri(uri){ const id = (uri || '').replace('spotify:playlist:', ''); return id ? MIXES.find(m => m.playlistId === id) || (BLANK && BLANK.playlistId === id ? BLANK : null) || (typeof DUBS !== 'undefined' ? DUBS.find(m => m.playlistId === id) : null) || null : null; }

/* ---------- the drawer's blank, and the box of finished tapes ---------- */
let heldAt = 0;
function blankEl(){
  const m = ensureBlank(), pl = mixPl(m), b = document.createElement('button');
  b.className = 'rectape'; b.style.setProperty('--r', '-1.2deg');
  if (N && boxStatus.signedIn && !boxStatus.canMix){
    b.append(plThumb(pl)); const nm = document.createElement('b'); nm.textContent = 'Blank tape'; b.append(nm);
    const sm = document.createElement('small'); sm.textContent = 'TAP TO LET PHONY MAKE MIXTAPES IN SPOTIFY'; b.append(sm);
    b.addEventListener('click', () => { ensureAudio(); sfx('tick'); N.spotifyLogin(); }); return b;
  }
  if (S.mix === m){ const g = document.createElement('span'); g.className = 'gone'; g.innerHTML = '<i>in the player</i>'; b.append(g); b.disabled = true; }
  else { b.append(plThumb(pl)); b.insertAdjacentHTML('beforeend', '<span class="recdot">REC</span>'); }
  const secs = mixSecs(m), nm = document.createElement('b');
  nm.textContent = m.full ? 'Blank tape · full' : 'Blank tape'; b.append(nm);
  const sm = document.createElement('small');
  sm.textContent = `${m.songs.length} ${m.songs.length === 1 ? 'SONG' : 'SONGS'} · ${Math.round(secs / 60)} OF 90 MIN` + (RADIO.length && !m.full ? ` · ${RADIO.length} ON THE RADIO` : '');
  b.append(sm);
  if (RADIO.length && !m.full) b.classList.add('waiting');
  b.addEventListener('click', () => { if (performance.now() - heldAt < 500) return; ensureAudio(); sfx('tick'); loadBlank(); });
  // press and hold a blank with something on it: it's finished early; write its name and it goes in the box
  if (m.songs.length && !b.disabled){
    let hold = 0; const start = e => { if (e.button > 0) return; clearTimeout(hold); hold = setTimeout(() => { heldAt = performance.now(); ensureAudio(); sfx('latch'); try { N && N.haptic(2); } catch (err) {} openNamer(m); }, 600); };
    b.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach(ev => b.addEventListener(ev, e => { if (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(hold); }));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  return b;
}
function strokesCanvas(strokes, w, h, color, lw){
  const c = document.createElement('canvas'); c.width = w; c.height = h; drawStrokes(c.getContext('2d'), strokes, 0, 0, w, h, color, lw); return c;
}
// the name as you wrote it: strokes are kept 0..1 across an 8:1 strip
function drawStrokes(c, strokes, x, y, w, h, color, lw){
  if (!strokes || !strokes.length) return;
  const sh = Math.min(h, w / 8), sw = sh * 8, ox = x, oy = y + (h - sh) / 2;
  c.save(); c.strokeStyle = color || '#2b2b30'; c.lineCap = c.lineJoin = 'round'; c.lineWidth = lw || Math.max(1.5, sh * .045); c.globalAlpha = .9;
  strokes.forEach(s => { c.beginPath(); for (let i = 0; i < s.length; i += 2){ const px = ox + s[i] * sw, py = oy + s[i + 1] * sh; i ? c.lineTo(px, py) : c.moveTo(px, py); } if (s.length === 2) c.lineTo(ox + s[0] * sw + .5, oy + s[1] * sh); c.stroke(); });
  c.restore();
}
const mixRange = m => { const a = m.songs.length ? m.songs[0].rec : m.started, b = m.ended || (m.songs.length ? m.songs[m.songs.length - 1].rec : a); return monthYear(a) === monthYear(b) ? monthYear(a) : monthYear(a) + ' – ' + monthYear(b); };
function mixCaseEl(m, i){
  const b = document.createElement('button'); b.className = 'case mixcase'; b.dataset.id = m.id;
  const rr = rng(i * 17 + 5); b.style.setProperty('--jx', ((rr() - .5) * 1.4).toFixed(2) + 'cqw'); b.style.setProperty('--jr', ((rr() - .5) * .6).toFixed(2) + 'deg');
  const col = DESIGNS[m.d].jc.stripes;
  b.style.setProperty('--bg', '#f1e8d2'); b.style.setProperty('--fg', '#2b2b30');
  const sp = document.createElement('span'); sp.className = 'sp';
  const band = document.createElement('i'); band.className = 'mixband'; band.style.background = `linear-gradient(180deg,${col[0]} 0 45%,${col[1]} 45% 75%,${col[2]} 75%)`; sp.append(band);
  const cv = strokesCanvas(m.strokes, 800, 100, '#2b2b30', 5); cv.className = 'mixname'; sp.append(cv);
  const yr = document.createElement('span'); yr.className = 'yr'; yr.textContent = mixRange(m).toUpperCase(); sp.append(yr);
  b.append(sp); b.setAttribute('aria-label', 'Mixtape ' + m.n);
  b.addEventListener('click', () => { if (performance.now() - heldAt < 500) return; ensureAudio(); sfx('tick'); b.classList.add('pull'); setTimeout(() => b.classList.remove('pull'), 400); showMixCase(m, b.closest('.boxbay')); });
  // press and hold the case: dub a copy for someone
  let hold = 0; const start = e => { if (e.button > 0) return; clearTimeout(hold); hold = setTimeout(() => { heldAt = performance.now(); ensureAudio(); sfx('latch'); try { N && N.haptic(2); } catch (err) {} openDub(m); }, 600); };
  b.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach(ev => b.addEventListener(ev, e => { if (ev !== 'pointermove' || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(hold); }));
  b.addEventListener('contextmenu', e => e.preventDefault());
  return b;
}
function mixBoxEl(fresh){
  if (!MIXES.length) return null;
  const box = document.createElement('div'); box.className = 'box';
  const dy = document.createElement('span'); dy.className = 'dymo'; dy.textContent = 'MY TAPES'; box.append(dy);
  const sl = document.createElement('div'); sl.className = 'slots';
  const n = Math.max(PER_BOX, Math.ceil(MIXES.length / PER_BOX) * PER_BOX);
  for (let j = 0; j < n; j++){
    const m = MIXES[j];
    if (!m){ const e = document.createElement('div'); e.className = 'slot0'; sl.append(e); continue; }
    if (S.mix === m){ const g = document.createElement('div'); g.className = 'gap'; g.innerHTML = '<i>in the player</i>'; sl.append(g); continue; }
    const el = mixCaseEl(m, j); if (fresh === m.id) el.classList.add('fresh'); sl.append(el);
  }
  box.append(sl); return box;
}
function showMixCase(m, bay){
  const host = bay.parentElement, v = document.createElement('div'); v.className = 'caseview';
  const bc = document.createElement('button'); bc.className = 'bigcase';
  const tray = document.createElement('span'); tray.className = 'tray'; const tape = document.createElement('canvas');
  const lid = document.createElement('span'); lid.className = 'lidf';
  const front = document.createElement('canvas'); front.width = 440; front.height = 690; mixFront(front.getContext('2d'), m, 440, 690, null);
  lid.append(front); bc.append(tray, lid);
  const info = document.createElement('div'); info.className = 'caseinfo'; info.innerHTML = '<b></b><small></small>';
  info.querySelector('b').textContent = `Mixtape Nº ${m.n}`; info.querySelector('small').textContent = `${m.songs.length} songs · ${mixRange(m)}`;
  v.append(bc, info); host.append(v);
  requestAnimationFrame(() => v.classList.add('show'));
  const close = () => { v.classList.remove('show'); setTimeout(() => v.remove(), 250); };
  v.addEventListener('click', e => { if (e.target === v) close(); });
  bc.addEventListener('click', () => {
    if (bc.classList.contains('opening')) return;
    renderThumb(tape, DESIGNS[m.d], {title:'', side:'A', idx:0, cur:{title:''}, noTrack:true, strokes:m.strokes}); tray.append(tape);
    sfx('eject'); bc.classList.add('opening');
    setTimeout(() => { bc.classList.add('gone'); info.style.opacity = 0; }, 700);
    setTimeout(() => { close(); loadMix(m); }, 1050);
  });
}
// a mixtape's J-card front: the tape's colours, your writing, the dates (photos go on top when there are some)
function mixFront(x, m, w, h, photos){
  const col = DESIGNS[m.d].jc.stripes;
  x.fillStyle = '#f3ead4'; x.fillRect(0, 0, w, h);
  [[col[0], .06], [col[1], .025], [col[2], .012]].reduce((y, [c, k]) => { x.fillStyle = c; x.fillRect(0, y, w, h * k); return y + h * k + h * .006; }, h * .03);
  if (photos && photos.length){
    const r = rng(m.n * 31 + photos.length);
    photos.slice(0, 5).forEach((p, i) => {
      if (!p.img) return;
      const s = w * (.42 + r() * .08), px = w * (.08 + (i % 2) * .44) + (r() - .5) * w * .06, py = h * (.16 + Math.floor(i / 2) * .19) + (r() - .5) * h * .03;
      x.save(); x.translate(px + s / 2, py + s / 2); x.rotate((r() - .5) * .22);
      x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = w * .02; x.shadowOffsetY = w * .008;
      x.fillStyle = '#fbf8f0'; x.fillRect(-s / 2, -s / 2, s, s * 1.14); x.shadowColor = 'transparent';
      const iw = p.img.naturalWidth || p.img.width, ih = p.img.naturalHeight || p.img.height, k = Math.max((s * .9) / iw, (s * .9) / ih);
      x.save(); x.beginPath(); x.rect(-s * .45, -s * .45, s * .9, s * .9); x.clip(); x.drawImage(p.img, -iw * k / 2, -ih * k / 2, iw * k, ih * k); x.restore();
      x.restore();
    });
  }
  // a strip of masking tape with the name on it
  const ty = h * (photos && photos.length ? .78 : .42);
  x.save(); x.translate(w / 2, ty); x.rotate(-.03);
  x.fillStyle = 'rgba(232,218,184,.96)'; x.shadowColor = 'rgba(0,0,0,.2)'; x.shadowBlur = w * .015; x.fillRect(-w * .46, -h * .055, w * .92, h * .11); x.shadowColor = 'transparent';
  drawStrokes(x, m.strokes, -w * .42, -h * .05, w * .84, h * .1, '#2b2b30');
  if (!m.strokes || !m.strokes.length){ x.fillStyle = '#6f6250'; x.font = `${w * .08}px ${HAND}`; x.textAlign = 'center'; x.fillText('radio tape', 0, h * .02); }
  x.restore();
  x.fillStyle = '#6f6250'; x.textAlign = 'center'; x.font = `600 ${w * .038}px ${PRINT}`;
  x.fillText(`Nº ${m.n}  ·  ${m.songs.length} SONGS  ·  ${mixRange(m).toUpperCase()}  ·  C90`, w / 2, h * .95);
}

/* ---------- naming a full tape: write on the spine with the pencil ---------- */
function openNamer(m){
  const host = S.open ? $('#inner') : $('#cover');
  const v = document.createElement('div'); v.className = 'namer';
  v.innerHTML = `<div class="nhead">${m.full ? 'THE TAPE IS FULL' : 'THE TAPE IS DONE'}<small>Write its name on the spine</small></div>
    <div class="nspine"><canvas></canvas><div class="npencil"><div class="pwob"></div></div></div>
    <div class="nkeys"><button class="nerase">RUB OUT</button><button class="ndone" disabled>DONE</button></div>`;
  host.append(v);
  const cv = v.querySelector('canvas'), strip = v.querySelector('.nspine'), np = v.querySelector('.npencil'), nw = np.querySelector('.pwob');
  const ncv = document.createElement('canvas'); nw.append(ncv);
  requestAnimationFrame(() => { const w = v.clientWidth, P = [PENCILS[0], PENCILS[1], PENCILS[5]][Math.floor(Math.random() * 3)], len = w * .7 / P.len;
    const g = penCanvas(ncv, P, len, w * .026); v.style.setProperty('--plen', (g.L - w * .04) + 'px');
    const c = ncv.getContext('2d'); c.setTransform(g.d, 0, 0, g.d, 0, 0); drawPencil(c, P, g.L, g.T, .35, null); });
  const strokes = []; let cur = null;
  const fitCanvas = () => { const r = strip.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; draw(); };
  const draw = () => { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); drawStrokes(c, strokes, 0, 0, cv.width, cv.height, '#3a3a40', cv.height * .032); };
  requestAnimationFrame(fitCanvas);
  const pt = e => { const r = strip.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, e.clientX - r.left, e.clientY - r.top]; };
  // the pencil sits in your hand at the same angle as the winding pencil: coming from the top right
  const aim = (x, y, lift) => { np.style.left = x + 'px'; np.style.top = y + 'px'; nw.style.transform = `rotate(-0.72rad) translateX(${lift ? 3 : 0}cqw)`; };
  strip.addEventListener('pointerdown', e => {
    e.preventDefault(); strip.setPointerCapture(e.pointerId); ensureAudio();
    const [x, y, px, py] = pt(e); cur = [x, y]; strokes.push(cur); np.classList.add('on'); aim(px, py); draw();
    v.querySelector('.ndone').disabled = false;
  });
  strip.addEventListener('pointermove', e => {
    const [x, y, px, py] = pt(e); if (cur){ cur.push(+x.toFixed(4), +y.toFixed(4)); draw(); } aim(px, py, !cur);
    if (cur && Math.random() < .08) sfx('tick');
  });
  const lift = () => { cur = null; };
  strip.addEventListener('pointerup', lift); strip.addEventListener('pointercancel', lift);
  strip.addEventListener('pointerleave', () => { if (!cur) np.classList.remove('on'); });
  // rub out: the pencil turns over and the eraser takes it all off
  v.querySelector('.nerase').addEventListener('click', () => {
    sfx('key'); np.classList.add('on', 'flip'); const r = strip.getBoundingClientRect(); aim(r.width * .5, r.height * .5);
    setTimeout(() => { strokes.length = 0; draw(); v.querySelector('.ndone').disabled = true; }, 350);
    setTimeout(() => np.classList.remove('flip', 'on'), 800);
  });
  v.querySelector('.ndone').addEventListener('click', () => {
    if (!strokes.length) return;
    sfx('insert'); v.classList.add('gone'); setTimeout(() => v.remove(), 350);
    shelveMix(m, strokes.map(s => s.map(n => +(+n).toFixed(4))));
  });
  requestAnimationFrame(() => v.classList.add('show'));
}
function shelveMix(m, strokes){
  m.strokes = strokes; m.ended = Date.now(); m.full = true;
  MIXES.push(m); if (BLANK === m) BLANK = null; ensureBlank(); saveMix();
  if (N && m.playlistId) N.mixRename(m.playlistId, `PHONY Mixtape Nº ${m.n} · ${mixRange(m)}`);
  if (S.mix === m){ S.mix = null; S.rec = null; S.recOn = false; S.taping = null; syncRec(); toPlain(); }
  showBox(); renderBoxes(m.id);
  setTimeout(() => { const c = document.querySelector((S.open ? '.boxbay.o' : '.boxbay.c') + ` .mixcase[data-id="${m.id}"]`); if (c) c.scrollIntoView({block:'center', behavior:'smooth'}); }, 350);
}

/* ---------- a mixtape's J-card ---------- */
const mixPics = {}, artistAbout = {};
function mixPhotos(m){
  const have = mixPics[m.id]; if (have && have.n === m.songs.length) return have;
  const P = mixPics[m.id] = {n:m.songs.length, near:[], across:[]};
  if (m.dub) return P;   // someone else's days: their photos aren't on this phone
  if (!N){ // the browser version: stand-in snapshots
    const fake = (i, sat) => { const c = document.createElement('canvas'); c.width = c.height = 300; const x = c.getContext('2d'), r = rng(i * 7 + 3);
      const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, `hsl(${190 + r() * 30},${sat}%,${62 + r() * 12}%)`); g.addColorStop(.55, `hsl(${30 + r() * 20},70%,75%)`); g.addColorStop(.56, `hsl(${195 + r() * 15},55%,${38 + r() * 10}%)`); g.addColorStop(1, `hsl(200,60%,22%)`);
      x.fillStyle = g; x.fillRect(0, 0, 300, 300); x.fillStyle = 'rgba(255,240,200,.85)'; x.beginPath(); x.arc(60 + r() * 180, 90 + r() * 60, 18 + r() * 14, 0, TAU); x.fill();
      x.fillStyle = 'rgba(20,20,20,.55)'; x.beginPath(); x.moveTo(40 + r() * 100, 200); x.lineTo(150 + r() * 60, 200); x.lineTo(120 + r() * 40, 110); x.fill(); return {img:c}; };
    P.near = m.songs.map((s, i) => fake(i + 1, 55)); P.across = [0, 1, 2, 3, 4].map(i => fake(i + 20, 45)); return P;
  }
  if (!N.hasPhotos()) return P;
  const id = 'ph' + (++foldReq); pending[id] = m.id;
  N.fetchPhotos(id, JSON.stringify({near:m.songs.map(s => (s.heard && s.heard.at) || s.rec), from:m.started || Date.now(), to:m.ended || Date.now(), n:5}));
  return P;
}
window.phonyPhotos = id => {
  const mid = pending[id]; delete pending[id];
  let j = null; try { j = JSON.parse(N.takePhotos(id) || 'null'); } catch (e) {}
  const P = mixPics[mid]; if (!j || !P) return;
  const load = p => { if (!p || !p.url) return null; const o = {taken:p.taken, img:new Image()}; o.img.onload = () => { if (foldOpen && S.mix && S.mix.id === mid) buildMixFoldSoon(); }; o.img.src = p.url; return o; };
  P.near = (j.near || []).map(p => p ? load(typeof p === 'string' ? (p ? JSON.parse(p) : null) : p) : null);
  P.across = (j.across || []).map(load).filter(Boolean);
};
let mixFoldT = 0;
function buildMixFoldSoon(){ clearTimeout(mixFoldT); mixFoldT = setTimeout(() => { if (foldOpen && S.mix) buildMixFold(S.mix); }, 150); }
function about(name){
  const k = (name || '').toLowerCase(); if (!k) return null;
  if (k in artistAbout) return artistAbout[k];
  artistAbout[k] = null;
  if (!N){ artistAbout[k] = `On the phone, a few lines about ${name} go here, from Wikipedia: where they're from, when they started, what they're known for.`; return artistAbout[k]; }
  const id = 'a' + (++foldReq); pending[id] = k; N.artistNotes(id, name);
  return null;
}
function pickMixSong(i){
  if (performance.now() - swipedAt < 350) return;
  const m = S.mix; if (!m || !m.songs[i]) return;
  ensureAudio(); sfx('key'); S.rec = null; S.mixEnd = false;
  if (N){ if (m.playlistId && N.playAlbumAt){ S.ctxHold = performance.now() + 6000; N.playAlbumAt('spotify:playlist:' + m.playlistId, i); S.playing = true; syncKeys(); showMixTracks(i); } return; }
  S.src = {kind:'demo', title:''}; showMixTracks(i); S.t = 0; if (!S.playing) play(); syncKeys();
}
const shortDate = t => new Date(t).toLocaleString('en', {day:'numeric', month:'short'});
function buildMixFold(m){
  const keep = foldScroll.scrollLeft; foldAl = {mix:m};
  foldStrip.innerHTML = '';
  let idx = 0; const panel = (cls) => { const p = el('section', 'fp ' + cls); p.style.setProperty('--i', idx++); foldStrip.append(p); return p; };
  fold.style.setProperty('--acc', inkAccent(DESIGNS[m.d].jc.stripes.find(c => lum(c) < .7) || '#b3362c'));
  const P = mixPhotos(m), tr = S.tracks[S.idx] || {};

  // front: snapshots from the weeks it was made, and the name on a strip of masking tape
  const front = panel('front mixfront'), cv = el('canvas', 'mixart'); cv.width = 900; cv.height = 1406; front.append(cv);
  mixFront(cv.getContext('2d'), m, 900, 1406, P.across);

  // spine: your writing
  const spine = panel('fspine mixspine'), sc = document.createElement('canvas'); sc.width = 1400; sc.height = 175;
  drawStrokes(sc.getContext('2d'), m.strokes, 40, 10, 1320, 155, '#2b2b30', 6);
  if (!m.strokes || !m.strokes.length){ const x = sc.getContext('2d'); x.fillStyle = '#6f6250'; x.font = `110px ${HAND}`; x.fillText('radio tape', 60, 125); }
  const sw = el('div', 'mixspinein'); sw.append(sc); spine.append(sw);

  // the songs, on two sides of 45 minutes, each with where you heard it
  const songs = panel('songs mixsongs'), sb = el('div', 'fbody'); songs.append(sb);
  const list = mixTracks(m);
  if (!list.length) sb.append(el('div', 'fk', 'SIDE A'), el('div', 'fwait', 'Nothing on it yet. Shazam a song you love, then put this tape in.'));
  let run = 0, side = '', cur = plainSong(tr.title);
  list.forEach((t, i) => {
    const sd = run + (t.dur || 0) / 2 > MIX_SIDE ? 'B' : 'A'; run += t.dur || 0;
    if (sd !== side){ side = sd; sb.append(el('div', 'fside', 'SIDE ' + sd)); }
    const s = m.songs[i], r = el('div', 'ftr mixrow' + (t.rec ? ' recrow' : '')); r.dataset.t = plainSong(t.title); if (r.dataset.t === cur) r.classList.add('on');
    const tt = el('span', 't'); tt.append(el('b', '', t.title), el('small', '', t.artist || ''));
    const h = s && s.heard ? [s.heard.on || s.heard.place, shortDate(s.heard.at)].filter(Boolean).join(' · ') : (t.rec ? 'recording…' : '');
    if (h) tt.append(el('i', '', 'heard ' + (s && s.heard && s.heard.on ? 'on ' : s && s.heard && s.heard.place ? 'at ' : '') + h));
    r.append(el('span', 'n', t.rec ? '●' : String(i + 1)), tt, el('span', 'd', t.dur ? fmt(t.dur) : ''));
    if (!t.rec) r.addEventListener('click', () => pickMixSong(i));
    sb.append(r);
  });
  const cr = el('div', 'fcred'); cr.append(el('div', '', `C90 · ${Math.round(mixSecs(m) / 60)} of 90 minutes recorded`));
  if (m.songs.length) cr.append(el('div', '', 'Recorded off the radio, ' + mixRange(m)));
  sb.append(cr);

  // sleeve notes: each song with the photo you took nearest the moment you heard it
  const sl = panel('sleeve'), slb = el('div', 'fbody'); sl.append(slb);
  slb.append(el('div', 'fk', 'SLEEVE NOTES'), el('div', 'fh', m.dub ? 'Dubbed for you by ' + (m.from || 'someone') : 'Where these came from'));
  if (N && !N.hasPhotos() && !m.dub){
    const ask = el('div', 'fwait', 'Tap here to put your photos from those days on the card. They stay on the phone.'); ask.style.cursor = 'pointer';
    ask.addEventListener('click', () => N.requestPhotos()); slb.append(ask);
  }
  m.songs.forEach((s, i) => {
    const it = el('div', 'sleeveitem' + (i % 2 ? ' odd' : ''));
    const ph = P.near[i];
    if (ph && ph.img){ const fig = el('figure', 'fphoto');
      if (ph.img.tagName === 'IMG') fig.append(Object.assign(new Image(), {src:ph.img.src, alt:''}));
      else { const c2 = document.createElement('canvas'); c2.width = ph.img.width; c2.height = ph.img.height; c2.getContext('2d').drawImage(ph.img, 0, 0); fig.append(c2); }
      fig.append(el('figcaption', '', s.heard && s.heard.place ? s.heard.place.split(',')[0] : shortDate(s.rec))); it.append(fig); }
    const tx = el('div', 'sleevetext');
    tx.append(el('div', 'st', s.title), el('div', 'sa', s.artist));
    if (s.heard && (s.heard.place || s.heard.on || s.heard.at)) tx.append(el('div', 'sh', (m.dub ? (m.from || 'Someone') + ' heard this ' : 'Heard ') + [s.heard.on ? 'on ' + s.heard.on : s.heard.place ? 'at ' + s.heard.place : '', s.heard.at ? new Date(s.heard.at).toLocaleString('en', m.dub ? {day:'numeric', month:'long'} : {weekday:'long', day:'numeric', month:'long', hour:'numeric', minute:'2-digit'}) : ''].filter(Boolean).join(', ')));
    const ab = about(s.artist); if (ab) tx.append(el('p', '', ab));
    it.append(tx); slb.append(it);
  });
  if (m.songs.length) slb.append(el('div', 'fsrc', 'ARTIST NOTES FROM WIKIPEDIA · CC BY-SA'));

  // the words to whatever's playing
  const words = panel('words'), wb = el('div', 'fbody'); words.append(wb);
  wb.append(el('div', 'fk', 'THE WORDS'), el('div', 'fh', tr.title || ''), el('div', 'fwords'));
  wb.querySelector('.fh').id = 'fwordsh'; wb.querySelector('.fwords').id = 'fwords';
  ['touchstart', 'wheel', 'pointerdown'].forEach(ev => wb.addEventListener(ev, () => { foldTouchAt = performance.now(); }, {passive:true}));
  const src = el('div', 'fsrc', 'WORDS FROM LRCLIB.NET'); src.id = 'fwordsrc'; src.hidden = true; wb.append(src);

  portsPanel(panel, front, 'mix:' + m.id);
  endStop(panel);
  foldScroll.scrollLeft = keep;
  renderWords();
}

/* ---------- changed your mind: tap the player and the same tape goes back in ---------- */
function putBack(e){
  if (!S.ejected || !boxVisible() || $('.caseview') || $('.namer')) return;
  if (e){ e.preventDefault(); e.stopPropagation(); }
  ensureAudio(); sfx('key'); insert(S.tape);
}
// closed: the strip of player still showing above the box (capture, so its keys and wheel don't also act)
['pointerdown', 'click'].forEach(ev => $('#cover .walkman').addEventListener(ev, e => { if ($('#cover').classList.contains('boxopen') && S.ejected){ if (ev === 'click'){ if (performance.now() - heldAt > 500) putBack(e); } else { e.preventDefault(); e.stopPropagation(); holdTape(e); } } }, true));
// open: the empty cassette bay
$('#inner .deck').addEventListener('click', e => { if (S.ejected && performance.now() - heldAt > 500) putBack(e); });
$('#inner .deck').addEventListener('pointerdown', e => { if (S.ejected) holdTape(e); });
// a blank with something on it, popped out: hold it and write its name (it's finished early)
let tapeHold = 0;
function holdTape(e){
  if (e.button > 0 || !S.ejected || S.mix !== BLANK || !BLANK.songs.length || $('.namer')) return;
  clearTimeout(tapeHold);
  tapeHold = setTimeout(() => { heldAt = performance.now(); ensureAudio(); sfx('latch'); try { N && N.haptic(2); } catch (err) {} openNamer(BLANK); }, 600);
  const off = () => { clearTimeout(tapeHold); removeEventListener('pointerup', off); removeEventListener('pointercancel', off); removeEventListener('pointermove', mv); };
  const mv = ev => { if (Math.abs(ev.movementX) + Math.abs(ev.movementY) > 6) off(); };
  addEventListener('pointerup', off); addEventListener('pointercancel', off); addEventListener('pointermove', mv);
}


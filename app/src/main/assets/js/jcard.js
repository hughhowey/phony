// PHONY · the fold-out J-card: cover, songs, words, liner notes, the band, ports of call
/* ---------- the fold-out J-card: tap the song banner ---------- */
// front · spine · songs & credits · the words · liner notes · the band
let foldOpen = false, foldKey = '', foldAl = null, foldNotes = null, foldLyrics = null, foldLyrKey = '', foldReq = 0, foldTouchAt = 0, foldSync = null, foldLine = -1;
const fold = $('#fold'), foldStrip = $('#foldstrip'), foldScroll = $('#foldscroll');
const notesCache = {}, pending = {};
const plainSong = t => (t || '').replace(/\s*[(\[][^)\]]*[)\]]/g, '').replace(/\s+-\s+.*$/, '').trim().toLowerCase();
function ctxAlbumUri(album){ const cx = spotifyCtx(); return cx && cx.albumUri && album && sameName(cx.album, album) ? cx.albumUri : ''; }
// the album the current song comes from, and whatever PHONY already knows about it
function nowAlbum(){
  if (S.mix) return {mix:S.mix, title:'Mixtape ' + S.mix.id, artist:''};
  const tr = S.tracks[S.idx] || {};
  if (S.tape === ALBUM_TAPE && ALBUM.title){
    const cs = S.boxAlbum && CASES.find(c => c.id === S.boxAlbum.id);
    const own = cs && cs.tracks && cs.tracks.length ? cs.tracks.map(t => ({t:t.t, d:t.d}))
      : (S.src.kind !== 'remote' ? S.tracks.map(t => ({t:t.title, d:Math.round(t.dur || 0)})) : null);
    return {title:ALBUM.title, artist:ALBUM.artist || tr.artist || '', img:ALBUM.img, uri:cs ? cs.uri : ctxAlbumUri(ALBUM.title), tracks:own, year:cs ? cs.year : ''};
  }
  const album = tr.album || '';
  return {title:album, artist:tr.artist || '', img:album && sameName(album, ALBUM.title) ? ALBUM.img : null, uri:ctxAlbumUri(album), tracks:null, year:''};
}
const albumKey = al => ((al.title || '?') + '|' + (al.artist || '')).toLowerCase();
// on a one-screen layout the card has one more stop past its last page: the player, dimmed, still playing
function endStop(panel){ if (slab()) panel('fend'); }
function atEndStop(){
  const last = $$('#foldstrip .fp.fend')[0]; if (!last) return false;
  return foldScroll.scrollLeft >= last.offsetLeft - (parseFloat(getComputedStyle(foldStrip).paddingLeft) || 0) - 4;
}
function watchEnd(){ inner.classList.toggle('endstop', foldOpen && atEndStop()); }
function openFold(){
  if (!S.open || foldOpen || (typeof cardSettling === 'function' && cardSettling())) return;
  ensureAudio();
  foldOpen = true; fold.hidden = false;
  const al = nowAlbum(); foldKey = albumKey(al); foldNotes = notesCache[foldKey] || null;
  foldLyrKey = ''; foldLyrics = null;
  buildFold(al); foldScroll.scrollLeft = 0;
  requestAnimationFrame(() => requestAnimationFrame(() => fold.classList.add('show')));
  if (!foldNotes && !al.mix) askNotes(al);
  askLyrics();
}
function closeFold(){
  if (!foldOpen) return; foldOpen = false;
  const wasEnd = inner.classList.contains('endstop'); inner.classList.remove('endstop');
  fold.classList.remove('show'); setTimeout(() => { if (!foldOpen){ fold.hidden = true; foldStrip.innerHTML = ''; } }, 750);
  // folded up from the end stop: the card goes back too, and you're at the player
  if (wasEnd && slab() && S.open) cardTo(false, true);
}
function askNotes(al){
  const key = albumKey(al);
  if (!N){ setTimeout(() => { notesCache[key] = demoNotes(al); if (foldOpen && key === foldKey){ foldNotes = notesCache[key]; buildFold(foldAl); } }, 700); return; }
  if (!al.title && !al.artist){ notesCache[key] = {}; foldNotes = {}; buildFold(al); return; }
  const id = 'n' + (++foldReq); pending[id] = key; N.fetchNotes(id, al.title || '', al.artist || '', al.uri || '');
}
function askLyrics(){
  const tr = S.tracks[S.idx] || {}, key = (tr.title || '') + '|' + (tr.artist || '');
  if (key === foldLyrKey) return; foldLyrKey = key; foldLyrics = null; renderWords();
  if (!tr.title) return;
  if (!N){ setTimeout(() => { if (foldLyrKey === key){ foldLyrics = demoWords(); renderWords(); } }, 500); return; }
  const id = 'l' + (++foldReq); pending[id] = key;
  N.fetchLyrics(id, tr.title, tr.artist || '', tr.album || (foldAl && foldAl.title) || '', Math.round(tr.dur || 0));
}
window.phonyNotes = id => {
  let j = null; try { j = JSON.parse(N.takeNotes(id) || 'null'); } catch (e) {}
  const key = pending[id]; delete pending[id]; if (!j) return;
  if (id[0] === 'a'){ artistAbout[key] = j.about || ''; if (foldOpen && S.mix) buildMixFoldSoon(); return; }
  if (id[0] === 'n'){
    notesCache[key] = j; if (foldOpen && key === foldKey){ foldNotes = j; buildFold(foldAl); }
    const c = S.r.cur; if (isRemote() && c && albumKey({title:c.album, artist:c.albumArtist || c.artist}) === key){
      if (S.albumMode) buildRemoteTracks(S.r.queue);
      else if (!S.mix && S.r.last && queueIsAlbum(S.r.last)){ S.albumFor = c.album; setAlbumMode(true); }   // the songs just arrived, and they're what's queued: an album
    }
  }
  else if (foldOpen && key === foldLyrKey){ foldLyrics = j; renderWords(); }
};
function foldTrackChanged(){
  const al = nowAlbum(), key = albumKey(al);
  if (key !== foldKey){ foldKey = key; foldNotes = notesCache[key] || null; buildFold(al); if (!foldNotes && !al.mix) askNotes(al); }
  else { const cur = plainSong((S.tracks[S.idx] || {}).title); $$('#foldstrip .ftr').forEach(r => r.classList.toggle('on', r.dataset.t === cur)); }
  askLyrics();
}

function inkAccent(hex){
  // dark enough to print on cream
  let v = parseInt(hex.slice(1), 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255;
  while (((r * .299 + g * .587 + b * .114) / 255) > .45){ r *= .82; g *= .82; b *= .82; }
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}
function drawFront(cv, img, title, artist, acc){
  const x = cv.getContext('2d'), w = cv.width, h = cv.height;
  if (img){ const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(w / iw, h / ih); x.drawImage(img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k); }
  else {
    x.fillStyle = acc; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(251,244,228,.14)'; for (let i = 0; i < 9; i++){ x.beginPath(); x.arc(w * .7, h * .38, w * (.08 + i * .06), 0, TAU); x.lineWidth = w * .012; x.strokeStyle = 'rgba(251,244,228,.16)'; x.stroke(); }
    x.fillStyle = '#fbf4e4'; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    fit(x, (title || '').toUpperCase(), w * .08, h * .82, w * .84, w * .13, PRINT, '800');
    x.globalAlpha = .8; fit(x, (artist || '').toUpperCase(), w * .08, h * .9, w * .84, w * .06, PRINT, '600'); x.globalAlpha = 1;
  }
  // it's been in a case for thirty years
  x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(236,216,178,.2)'; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'source-over';
  const r = rng(title.length * 31 + 5);
  for (let i = 0; i < 40; i++){ const px = r() * w, py = r() * h, len = w * (.02 + r() * .12), a = (r() - .5) * .8;
    x.strokeStyle = `rgba(255,248,232,${.05 + r() * .12})`; x.lineWidth = 1 + r() * 1.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke(); }
}
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function paras(parent, text){ (text || '').split(/\n+/).map(t => t.trim()).filter(Boolean).forEach(t => parent.append(el('p', '', t))); }
function niceDate(d){
  if (!d) return ''; const [y, m, dd] = d.split('-'); if (!m) return y;
  const mon = ['January','February','March','April','May','June','July','August','September','October','November','December'][+m - 1];
  return dd ? `${+dd} ${mon} ${y}` : `${mon} ${y}`;
}
function buildFold(al){
  if (al && al.mix) return buildMixFold(al.mix);
  foldAl = al;
  const n = foldNotes || {}, loading = !foldNotes, keep = foldScroll.scrollLeft;
  const tr = S.tracks[S.idx] || {};
  const title = n.title || al.title || tr.title || 'Untitled', artist = n.artist || al.artist || tr.artist || '';
  const year = (n.date || '').slice(0, 4) || al.year || '';
  foldStrip.innerHTML = '';
  let idx = 0; const panel = (cls) => { const p = el('section', 'fp ' + cls); p.style.setProperty('--i', idx++); foldStrip.append(p); return p; };

  // the cover: what the player already has, or what Spotify sent
  let img = al.img || null;
  const setAcc = im => { const acc = im ? inkAccent(paletteFrom(im)[1]) : '#b3362c'; fold.style.setProperty('--acc', acc); return acc; };
  let acc = setAcc(img);

  const front = panel('front'), cv = el('canvas', 'fart'); cv.width = cv.height = 900;
  const band = el('div', 'fband'); band.append(el('div', 'fa', artist), el('div', 'ft', title), el('div', 'fy', [year, 'STEREO', 'HIGH FIDELITY'].filter(Boolean).join('  ·  ')));
  front.append(cv, band); drawFront(cv, img, title, artist, acc);
  if (!img && n.cover){ const im = new Image(); im.onload = () => { acc = setAcc(im); drawFront(cv, im, title, artist, acc); }; im.src = n.cover; }

  const spine = panel('fspine'), sp = el('div', 'sp2'), sps = el('span', '', artist); sps.append(el('small', '', title)); sp.append(sps); spine.append(sp);

  // songs, split into two sides the way a cassette would be
  const songs = panel('songs'), sb = el('div', 'fbody'); songs.append(sb);
  const list = (n.tracks && n.tracks.length ? n.tracks : al.tracks) || [];
  if (list.length){
    const half = Math.ceil(list.length / 2), cur = plainSong(tr.title);
    [['SIDE A', list.slice(0, half), 0], ['SIDE B', list.slice(half), half]].forEach(([nm, part, off]) => {
      if (!part.length) return;
      const tot = part.reduce((a, t) => a + (t.d || 0), 0);
      const h = el('div', 'fside', nm); if (tot) h.append(el('small', '', fmt(tot))); sb.append(h);
      part.forEach((t, i) => { const r = el('div', 'ftr'); r.dataset.t = plainSong(t.t); if (r.dataset.t === cur) r.classList.add('on');
        r.setAttribute('role', 'button'); r.addEventListener('click', () => pickFromCard(off + i, t, n, al));
        r.append(el('span', 'n', String(off + i + 1)), el('span', 't', t.t), el('span', 'd', t.d ? fmt(t.d) : '')); sb.append(r); });
    });
  } else sb.append(el('div', 'fk', 'SONGS'), el('div', 'fwait', loading ? 'Pulling the card out of the case…' : 'No track list for this one.'));
  const cred = el('div', 'fcred');
  (n.copyrights || []).forEach(c => cred.append(el('div', '', /^[℗©]/.test(c) ? c : (/\(P\)/.test(c) ? c.replace('(P)', '℗') : '© ' + c))));
  if (n.date) cred.append(el('div', '', 'Released ' + niceDate(n.date)));
  if (cred.childNodes.length) sb.append(cred);

  // the words to whatever's playing
  const words = panel('words'), wb = el('div', 'fbody'); words.append(wb);
  wb.append(el('div', 'fk', 'THE WORDS'), el('div', 'fh', tr.title || ''), el('div', 'fwords'));
  wb.querySelector('.fh').id = 'fwordsh'; wb.querySelector('.fwords').id = 'fwords';
  ['touchstart', 'wheel', 'pointerdown'].forEach(ev => wb.addEventListener(ev, () => { foldTouchAt = performance.now(); }, {passive:true}));
  const src = el('div', 'fsrc', 'WORDS FROM LRCLIB.NET'); src.id = 'fwordsrc'; src.hidden = true; wb.append(src);

  // liner notes
  if (n.about || loading){
    const ln = panel('liner'), lb = el('div', 'fbody'); ln.append(lb);
    lb.append(el('div', 'fk', 'LINER NOTES'), el('div', 'fh', title));
    if (n.about){ paras(lb, n.about); lb.append(el('div', 'fsrc', 'FROM WIKIPEDIA · CC BY-SA')); }
    else lb.append(el('div', 'fwait', 'Pulling the notes out of the case…'));
  }
  // the band
  if (n.photo || n.band){
    const bp = panel('fbandp'), bb = el('div', 'fbody'); bp.append(bb);
    bb.append(el('div', 'fk', 'THE BAND'));
    if (n.photo){ const fig = el('figure', 'fphoto'), im = new Image(); im.src = n.photo; im.alt = artist; fig.append(im, el('figcaption', '', artist)); bb.append(fig); }
    else bb.append(el('div', 'fh', artist));
    if (n.genres && n.genres.length){ const g = el('div', 'fgen'); n.genres.forEach(x => g.append(el('span', '', x))); bb.append(g); }
    if (n.band){ paras(bb, n.band); bb.append(el('div', 'fsrc', 'FROM WIKIPEDIA · CC BY-SA')); }
  }
  portsPanel(panel, front, foldKey);
  endStop(panel);
  foldScroll.scrollLeft = keep;
  renderWords();
}
function renderWords(){
  const box = $('#fwords'); if (!box) return;
  const tr = S.tracks[S.idx] || {}; $('#fwordsh').textContent = tr.title || '';
  box.innerHTML = ''; foldSync = null; foldLine = -1; $('#fwordsrc').hidden = true;
  const L = foldLyrics;
  if (!L){ box.append(el('div', 'fwait', tr.title ? 'Looking for the words…' : '')); return; }
  const synced = (L.synced || '').split('\n').map(l => l.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s?(.*)$/)).filter(Boolean);
  if (synced.length){
    foldSync = [];
    synced.forEach(m => { const t = +m[1] * 60 + +m[2], p = el('div', 'l' + (m[3].trim() ? '' : ' gap'), m[3]); foldSync.push({t, p}); box.append(p);
      if (m[3].trim()){ p.dataset.t = t; p.addEventListener('click', () => seekTo(t)); } });
  } else if (L.plain){
    L.plain.split('\n').forEach(t => box.append(el('div', 'l' + (t.trim() ? '' : ' gap'), t)));
  } else { box.append(el('div', 'fwait', L.instrumental ? 'No words. It\'s an instrumental.' : 'No words on file for this one.')); return; }
  box.classList.toggle('plain', !synced.length);
  $('#fwordsrc').hidden = !N;
}
// follow the song: light up the line being sung and keep it in view
function syncWords(){
  if (!foldOpen || !foldSync || !foldSync.length) return;
  const t = S.t + .25; let i = -1; for (let k = 0; k < foldSync.length; k++){ if (foldSync[k].t <= t) i = k; else break; }
  if (i === foldLine) return;
  if (foldLine >= 0 && foldSync[foldLine]) foldSync[foldLine].p.classList.remove('on');
  foldLine = i; if (i < 0) return;
  const p = foldSync[i].p; p.classList.add('on');
  if (performance.now() - foldTouchAt > 4000){ const body = p.closest('.fbody'); body.scrollTo({top:Math.max(0, p.offsetTop - body.clientHeight * .36), behavior:'smooth'}); }
}
// a song tapped on the J-card: play it (from this album)
function pickFromCard(pos, t, n, al){
  if (performance.now() - swipedAt < 350) return;
  ensureAudio(); sfx('key');
  const want = plainSong(t.t), i = S.tracks.findIndex(x => plainSong(x.title) === want);
  if (isRemote()){
    const q = i >= 0 ? S.tracks[i].queueId : null;
    const uri = (n && n.uri) || (al && al.uri) || albumUriFor(al && al.title);
    if (uri && N.playAlbumAt){ S.ctxHold = performance.now() + 6000; N.playAlbumAt(uri, pos); }
    else if (q != null) N.remoteCmd('queue', String(q));
    else toast('Spotify didn\'t say which album this is.');
    return;
  }
  if (i >= 0){ if (S.ejected) insert(S.tape); loadTrack(i, true); if (!S.playing){ play(); syncKeys(); } }
}
// a lyric line tapped: jump to that moment in the song
function seekTo(sec){
  if (performance.now() - swipedAt < 350) return;
  ensureAudio(); sfx('tick'); foldTouchAt = 0;
  S.t = Math.max(0, sec - .2); S.cmdAt = performance.now();
  if (isRemote()) N.remoteCmd('seek', String(Math.round(S.t * 1000)));
  else if (isLocal()) N.seekTo(Math.round(S.t * 1000));
  else if (S.src.kind === 'files') audio.currentTime = S.t;
}
let swipedAt = 0;
// swipe sideways anywhere on the card; it settles on the nearest panel (a flick goes one further)
let sw = null, wheelT = 0;
function foldStops(){
  const pad = parseFloat(getComputedStyle(foldStrip).paddingLeft) || 0, max = foldScroll.scrollWidth - foldScroll.clientWidth;
  return [...new Set($$('#foldstrip .fp').map(p => Math.max(0, Math.min(max, p.offsetLeft - pad))).concat([max]))].sort((a, b) => a - b);
}
function settleFold(v){
  const stops = foldStops(), x = foldScroll.scrollLeft;
  let target = stops.reduce((b, s) => Math.abs(s - x) < Math.abs(b - x) ? s : b, stops[0]);
  if (Math.abs(v) > .35){ const ahead = v < 0 ? stops.find(s => s > x + 4) : [...stops].reverse().find(s => s < x - 4); if (ahead != null) target = ahead; }
  foldScroll.scrollTo({left:target, behavior:'smooth'});
}
fold.addEventListener('touchstart', e => {
  if (e.touches.length !== 1) { sw = null; return; }
  const t = e.touches[0]; sw = {x:t.clientX, y:t.clientY, left:foldScroll.scrollLeft, lock:0, lx:t.clientX, lt:performance.now(), v:0};
}, {passive:true});
fold.addEventListener('touchmove', e => {
  if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
  if (!sw.lock){ if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) sw.lock = 1; else if (Math.abs(dy) > 8) sw.lock = 2; }
  if (sw.lock !== 1) return;
  e.preventDefault();
  foldScroll.scrollTo({left:sw.left - dx, behavior:'instant'});
  const now = performance.now(); sw.v = (t.clientX - sw.lx) / Math.max(1, now - sw.lt); sw.lx = t.clientX; sw.lt = now;
}, {passive:false});
const swEnd = () => { if (sw && sw.lock === 1){ settleFold(sw.v); swipedAt = performance.now(); } sw = null; };
fold.addEventListener('touchend', swEnd); fold.addEventListener('touchcancel', swEnd);
// trackpads and mice, for the desktop version
fold.addEventListener('wheel', e => {
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0); if (!d) return;
  e.preventDefault(); foldScroll.scrollLeft += d; clearTimeout(wheelT); wheelT = setTimeout(() => settleFold(0), 140);
}, {passive:false});
// tally marks, the way you'd count on the back of a J-card: four strokes and a slash
function tally(k, color){
  if (k <= 0) return '<span></span>';
  let x = 0, d = '', r = rng(k * 7 + 3);
  for (let g = 0; g < Math.ceil(k / 5); g++){
    const n = Math.min(5, k - g * 5);
    for (let i = 0; i < Math.min(4, n); i++){ const j = (r() - .5) * 1.4; d += `M${x + i * 5 + j} ${2 + r()}L${x + i * 5 - j} ${20 - r()}`; }
    if (n === 5) d += `M${x - 3} ${16 + r() * 2}L${x + 19} ${5 + r() * 2}`;
    x += Math.min(4, n) * 5 + 8;
  }
  return `<svg viewBox="-4 0 ${x + 2} 22"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/></svg>`;
}
/* ---------- ports of call: where each album has played ---------- */
// the last page of a J-card. One line per place; each play there after the first is a tally mark.
function portsPanel(panel, front, key){
  const plog = portsFor(key);
  const pp = panel('ports'), pb = el('div', 'fbody'); pp.append(pb);
  pb.append(el('div', 'fk', 'PORTS OF CALL'), el('div', 'fh', 'Where it has played'));
  if (N && !N.hasLocation()){
    const ask = el('div', 'fwait', 'Tap here and PHONY will note where this tape plays.'); ask.style.cursor = 'pointer';
    ask.addEventListener('click', () => N.requestLocation()); pb.append(ask);
  } else if (!plog.length){
    pb.append(el('div', 'fwait', 'Nowhere yet. Let a song play through and the first port goes here.'));
  } else {
    const ul = el('ul', 'plog'), pens = [['"Reenie Beanie"', '#1d3c8f', 1], ['"Nothing You Could Do"', '#2a2a30', .7], ['Caveat', '#9c2a2a', .92], ['"Gochi Hand"', '#1d5a3a', .78], ['"Reenie Beanie"', '#3f3f44', 1]];
    plog.forEach((e, i) => {
      // each line keeps the pen it was first written in
      const r = rng(Math.round(e.first / 1000)), pen = pens[Math.floor(r() * pens.length)];
      const wh = el('span', 'where', e.place || coords(e.lat, e.lon)); wh.style.fontFamily = pen[0]; wh.style.color = pen[1]; wh.style.fontSize = (6.2 * pen[2]).toFixed(2) + 'cqw'; wh.style.transform = `rotate(${((r() - .5) * 3).toFixed(2)}deg)`;
      const li = el('li', i === 0 ? 'first' : ''); li.append(el('span', 'when', monthYear(e.first)), wh); li.insertAdjacentHTML('beforeend', tally(e.plays - 1, pen[1]));
      ul.append(li);
    });
    pb.append(ul);
    // the front gets a stamp: where it was first played
    const f0 = plog[0], st = el('div', 'pstamp'); st.append(el('b', '', (f0.place || coords(f0.lat, f0.lon)).split(',')[0].toUpperCase()), el('small', '', 'FIRST PLAYED · ' + monthYear(f0.first).toUpperCase()));
    front.append(st);
  }
}
// {albumKey: [{place, lat, lon, first, last, plays}]}, oldest first
let PORTS = store.get('ports', {});
const monthYear = t => { const d = new Date(t); return d.toLocaleString('en', {month:'short'}) + " '" + String(d.getFullYear()).slice(2); };
const coords = (la, lo) => `${Math.abs(la).toFixed(1)}°${la >= 0 ? 'N' : 'S'} ${Math.abs(lo).toFixed(1)}°${lo >= 0 ? 'E' : 'W'}`;
function portsFor(key){
  if (!N) return (PORTS[key] || []).length ? PORTS[key] : (key.startsWith('mix:') ? demoPorts().slice(8, 12) : demoPorts());
  const list = PORTS[key] || [];
  // name spots logged at sea, now that there may be a signal
  let changed = false;
  list.forEach(e => { if (!e.place){ const nm = N.placeName(e.lat, e.lon); if (nm){ e.place = nm; changed = true; } } });
  if (changed){ mergePorts(list); store.set('ports', PORTS); }
  return list;
}
function mergePorts(list){
  for (let i = list.length - 1; i > 0; i--) for (let j = 0; j < i; j++) if (list[j].place && list[j].place === list[i].place){
    list[j].plays += list[i].plays; list[j].last = Math.max(list[j].last, list[i].last); list.splice(i, 1); break; }
}
// an album counts as played somewhere once a song has played 30 seconds; again there after six hours
// a place earns its line (or a tally mark) only once you've really played the tape there:
// three of its songs heard through, without winding forward past them
const PORT_SONGS = 3;
let portAlbum = '', portDone = false, portT = 0, portHeard = new Set(), portSong = '', portSkipped = false;
function notePort(now){
  if (S.cue > 0) portSkipped = true;
  if (now - portT < 1000) return; portT = now;
  if (!S.playing || (!S.mix && (!S.albumMode || !ALBUM.title))) return;
  const key = S.mix ? 'mix:' + S.mix.id : albumKey({title:ALBUM.title, artist:ALBUM.artist || (S.tracks[S.idx] || {}).artist || ''});
  if (key !== portAlbum){ portAlbum = key; portDone = false; portHeard = new Set(); portSong = ''; }
  const tr = S.tracks[S.idx] || {}, song = plainSong(tr.title);
  if (song !== portSong){ portSong = song; portSkipped = false; }
  const d = dur(S.idx);
  if (song && !portSkipped && d > 20 && S.t >= Math.min(d * .9, d - 8)) portHeard.add(song);
  const need = Math.min(PORT_SONGS, Math.max(1, S.mix ? S.mix.songs.length : S.tracks.length));
  if (portDone || portHeard.size < need || !N || !N.hasLocation()) return;
  let here = null; try { here = JSON.parse(N.whereAmI() || 'null'); } catch (e) {}
  if (!here) return;
  portDone = true;
  const list = PORTS[key] || (PORTS[key] = []), t = Date.now();
  const near = e => e.place && here.place ? e.place === here.place : Math.hypot(e.lat - here.lat, e.lon - here.lon) < .03;
  const e = list.find(near);
  if (e){ if (t - e.last > 6 * 3600e3){ e.plays++; } e.last = t; if (!e.place && here.place) e.place = here.place; }
  else list.push({place:here.place || '', lat:+here.lat.toFixed(3), lon:+here.lon.toFixed(3), first:t, last:t, plays:1});
  store.set('ports', PORTS);
}
function demoPorts(){
  const at = (y, m) => new Date(y, m, 5 + (m * 7) % 20).getTime();
  return [
    ['English Harbour, Antigua', 2026, 2, 3], ['Deshaies, Guadeloupe', 2026, 2, 1], ['Portsmouth, Dominica', 2026, 3, 2], ['Rodney Bay, St Lucia', 2026, 3, 6],
    ['Admiralty Bay, Bequia', 2026, 4, 9], ['Salt Whistle Bay, Mayreau', 2026, 4, 1], ['Tobago Cays', 2026, 4, 4], ['Tyrrel Bay, Carriacou', 2026, 5, 3],
    ['Prickly Bay, Grenada', 2026, 5, 17], ["St. George's, Grenada", 2026, 6, 5], ['Chaguaramas, Trinidad', 2026, 7, 2], ['Mount Hartman Bay, Grenada', 2026, 7, 7],
    ['Gouyave, Grenada', 2026, 8, 1], ['Woburn Bay, Grenada', 2026, 8, 2],
  ].map(([place, y, m, plays]) => ({place, first:at(y, m), last:at(y, m), plays}));
}
// in a desktop browser there's no Spotify or network: stand-ins that say what goes where
function demoNotes(al){
  return {title:al.title || S.src.title, artist:al.artist || 'Various artists', date:'1988-06-14',
    copyrights:['℗ 1988 Driftwood Records', '© 1988 Driftwood Records'],
    tracks:S.tracks.map(t => ({t:t.title, d:Math.round(t.dur || 200)})), genres:['new wave', 'jangle pop'],
    about:'On the phone, this panel holds the story of the album that\'s playing, from Wikipedia: when and where it was made, who produced it, how it was received.\nIt changes with the record. Put on a different album and the card changes with it.',
    band:'And this panel is the band: a photo from Spotify, printed like the snapshot tucked into an old J-card, and a few paragraphs about who they are.'};
}
function demoWords(){
  const lines = ['On the phone, the words to the song', 'that\'s playing show up here,', '', 'one line lit at a time,', 'keeping pace with the tape.', '', 'Scroll back to read ahead;', 'it catches up in a moment.'];
  return {synced:lines.map((l, i) => `[00:${String(i * 4).padStart(2, '0')}.00] ${l}`).join('\n')};
}
$('#nowtext').addEventListener('click', openFold);
$('#nowtext').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openFold(); } });
$('#foldclose').addEventListener('click', closeFold);
foldScroll.addEventListener('click', e => { if (performance.now() - swipedAt < 350) return; if (e.target === foldScroll || e.target === foldStrip || e.target.classList.contains('fend')) closeFold(); });
foldScroll.addEventListener('scroll', watchEnd, {passive:true});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && foldOpen) closeFold(); });



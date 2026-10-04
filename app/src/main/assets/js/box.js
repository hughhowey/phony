// PHONY · the tape box of album cases and the drawer of playlist tapes
/* ---------- the tape box: every album you play gets a case; ten to a box ---------- */
const PER_BOX = 10;
// In the app these come from Spotify (title, artist, year, cover). In this mockup they're invented.
const DEMO_CASES = [
  {id:'a1', title:'Breakwater', artist:'The Undertows', year:1986, art:'sun', pal:['#1f2c4f','#e8704a','#f6c572','#f3e6cf']},
  {id:'a2', title:'Paper Suns', artist:'Mara Vell', year:1991, art:'circle', pal:['#efe4cc','#d8412f','#1d1d1d','#1d1d1d']},
  {id:'a3', title:'Night Ferry', artist:'Cobalt Nine', year:1984, art:'bokeh', pal:['#0b1230','#3b6fd8','#ff5a8a','#dfe8ff']},
  {id:'a4', title:'Low Tide Radio', artist:'The Marlinspikes', year:1988, art:'sun', pal:['#2a1f5c','#8d3b6e','#ffc36b','#fff3df']},
  {id:'a5', title:'Velvet Arcade', artist:'Juniper Kane', year:1989, art:'grid', pal:['#171717','#ff5fa2','#19b5a5','#ffcf33']},
  {id:'a6', title:'Glass Weather', artist:'Oslo Radio Club', year:1993, art:'waves', pal:['#d7e3e6','#2d5d73','#8fb3bf','#12303d']},
  {id:'a7', title:'Dry County', artist:'Wes Harlan', year:1988, art:'split', pal:['#c9772e','#f1dca8','#3a2415','#3a2415']},
  {id:'a8', title:'Kingfisher', artist:'Ada & the Seconds', year:1995, art:'stripes', pal:['#0e6f7a','#f2b134','#e2553a','#f7efe0']},
  {id:'a9', title:'Neon Psalms', artist:'The Vespers', year:1987, art:'bokeh', pal:['#1a0826','#c13cff','#2fe0d0','#f5d9ff']},
  {id:'a10', title:'Second Summer', artist:'Tamsin Rook', year:1990, art:'circle', pal:['#f4c9b8','#2f4a8a','#fff7ee','#2f2a45']},
  {id:'a11', title:'Blue Hour Drive', artist:'Delancey', year:1985, art:'stripes', pal:['#10213f','#f07b3f','#ffd166','#e9f0ff']},
  {id:'a12', title:'Tin Roof Rain', artist:'Eliza Mae Coombs', year:1996, art:'waves', pal:['#e9dfc9','#6b4f3a','#a88d6d','#3b2a1e']},
  {id:'a13', title:'Wolves at the Marina', artist:'Sundial', year:1992, art:'grid', pal:['#eae6dd','#1b3b6f','#d1453b','#111']},
];
const MORE = [
  {id:'n1', title:'Harbour of Small Hours', artist:'Pilot Whale', year:1994, art:'split', pal:['#22343c','#e7c873','#f4eee0','#f4eee0']},
  {id:'n2', title:'Gold Leaf Motel', artist:'The Carousel Kings', year:1983, art:'sun', pal:['#3a1030','#f0506e','#ffd86b','#fff0d6']},
  {id:'n3', title:'Starboard', artist:'Minna Ashe', year:1997, art:'circle', pal:['#0f2d4a','#f3efe4','#e2553a','#f3efe4']},
];
const TRACKS = ['Opening Night', 'Salt in the Wires', 'Southbound', 'All the Lights at Once', 'Half a Heart', 'Undertow', 'Late Ferry', 'Nobody Waves Back', 'The Long Way Home', 'Paper Crowns', 'Radio Silence', 'Last Song on the Tape'];
let inPlayer = null;
const yearOf = c => { const y = parseInt(c.year, 10); return isNaN(y) ? 99999 : y; };
const byArtist = a => (a || '').trim().replace(/^the\s+/i, '');
function sortCases(list){
  return list.sort((a, b) => yearOf(a) - yearOf(b) || byArtist(a.artist).localeCompare(byArtist(b.artist), undefined, {sensitivity:'base'}) || (a.title || '').localeCompare(b.title || '', undefined, {sensitivity:'base'}));
}
let CASES = N ? [] : sortCases(DEMO_CASES.slice());
/* ---------- the drawer: the twenty playlists played most recently ---------- */
const DRAWER = 20;
// In the app these come from Spotify. In this mockup they're invented.
const DEMO_PLAYLISTS = ['anchor watch', 'Deck Scrub Sunday', 'night passage', 'BANGERS (do not share)', 'rainy harbour', 'writing — no words', 'kitchen dancing', '90s alt forever', 'Carnival warm-up', 'slow boat', 'songs my dad played', 'car karaoke!!', 'Tuesday', 'Rap', 'soca 2026', 'sunday morning coffee', 'long watch (3am)', 'road trip', 'Motown', 'for Shay', 'gym, ugh', 'Outkast only']
  .map((name, i) => ({id:'p' + i, uri:'spotify:playlist:p' + i, name, count:[34, 18, 52, 71, 26, 40, 22, 95, 30, 17, 44, 61, 12, 88, 23, 31, 47, 66, 29, 14, 38, 20][i]}));
let PLAYLISTS = N ? [] : DEMO_PLAYLISTS.slice(0, DRAWER);
let LOOKS = store.get('plLooks', {});
// looks saved by an earlier build named shells by position, with the five old tapes first
const OLD_IDS = ['mix','chrome','clear','memphis','metal','geo','racetrack','kraft','redband','clearred','sunset','side90','blacksf','neon','pastel'];
Object.keys(LOOKS).forEach(k => {
  const l = LOOKS[k]; if (!l.did) l.did = OLD_IDS[l.d];
  const d = DESIGNS.findIndex(x => x.id === l.did);
  if (d < 0 || !PENS[l.p] || !!PENS[l.p].dark !== !!DESIGNS[d].write.dark) delete LOOKS[k]; else l.d = d;
});
store.set('plLooks', LOOKS);
// each playlist gets a shell, a pen and a toss angle the first time it's seen, and keeps them
function assignLook(id, used){
  const plain = DESIGNS.map((_, i) => i).filter(i => !DESIGNS[i].dub);   // the dub shells are only for dubbed tapes
  let pool = plain.filter(i => !used.has(i)); if (!pool.length) pool = plain;
  const d = pool[Math.floor(Math.random() * pool.length)]; used.add(d);
  const pens = Object.keys(PENS).filter(k => !!PENS[k].dark === !!DESIGNS[d].write.dark);
  const rnd = (a) => +((Math.random() - .5) * a).toFixed(2);
  LOOKS[id] = {d, did:DESIGNS[d].id, p:pens[Math.floor(Math.random() * pens.length)], t:rnd(.06), r:rnd(10), x:rnd(3), y:rnd(3)};
  store.set('plLooks', LOOKS);
}
function assignLooks(){
  // the drawer's twenty on as many different shells as there are
  const used = new Set(PLAYLISTS.map(p => LOOKS[p.id] && LOOKS[p.id].d).filter(v => v != null));
  PLAYLISTS.forEach(p => { if (!LOOKS[p.id]) assignLook(p.id, used); });
}
function plLook(pl){ if (!LOOKS[pl.id]) assignLook(pl.id, new Set()); return LOOKS[pl.id]; }
assignLooks();
const thumbCache = {};
function plThumb(pl){
  const lk = plLook(pl), key = pl.id + '|' + lk.d + '|' + lk.p + '|' + pl.name;
  if (!thumbCache[key]){ const cv = document.createElement('canvas');
    renderThumb(cv, DESIGNS[lk.d], {title:pl.name, side:'A', idx:0, cur:{title:'', artist:''}, noTrack:true, pen:PENS[lk.p], tilt:lk.t}); thumbCache[key] = cv; }
  const src = thumbCache[key], c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c;
}
function drawerEl(){
  const dr = document.createElement('div'); dr.className = 'drawer';
  const dy = document.createElement('span'); dy.className = 'dymo'; dy.textContent = 'MIXES'; dr.append(dy);
  const grid = document.createElement('div'); grid.className = 'blanks'; dr.append(grid);
  if (!N || (boxStatus.signedIn && boxStatus.hasClientId)) grid.append(blankEl());
  const note = (text, onClick) => { const b = document.createElement('button'); b.className = 'case note'; b.innerHTML = '<span class="sp"><span class="hw"></span></span>'; b.querySelector('.hw').textContent = text; if (onClick) b.addEventListener('click', () => { ensureAudio(); sfx('tick'); onClick(); }); else b.disabled = true; return b; };
  if (N && boxStatus.signedIn && !boxStatus.canPlaylists){ grid.append(note('Tap here to let PHONY see your playlists.', () => N.spotifyLogin())); return dr; }
  if (N && (!boxStatus.signedIn || !boxStatus.hasClientId)) return null;
  if (typeof DUBS !== 'undefined') DUBS.forEach(m => grid.append(dubEl(m)));   // tapes other people dubbed for you
  if (!PLAYLISTS.length){ grid.append(note(boxStatus.state === 'loading' ? 'Fetching your playlists…' : 'Play a playlist in Spotify and its tape lands here.')); return dr; }
  arranged().forEach(pl => {
    const lk = plLook(pl), b = document.createElement('button'); b.dataset.id = pl.id;
    b.style.setProperty('--r', lk.r + 'deg'); b.style.setProperty('--x', lk.x + 'cqw'); b.style.setProperty('--y', lk.y + 'cqw');
    b.setAttribute('aria-label', 'Play the playlist ' + pl.name);
    if (S.tape === PL_TAPE && S.playlist && S.playlist.uri === pl.uri){
      const g = document.createElement('span'); g.className = 'gone'; g.innerHTML = '<i>in the player</i>'; b.append(g); b.disabled = true;
    } else b.append(plThumb(pl));
    const nm = document.createElement('b'); nm.textContent = pl.name; b.append(nm);
    if (pl.count){ const sm = document.createElement('small'); sm.textContent = pl.count + (pl.count === 1 ? ' SONG' : ' SONGS'); b.append(sm); }
    b.addEventListener('click', e => { if (performance.now() - droppedAt < 400){ e.preventDefault(); return; } ensureAudio(); sfx('tick'); loadPlaylist(pl); });
    armDrag(b, grid);
    grid.append(b);
  });
  return dr;
}
// the drawer keeps the order you put the tapes in; a playlist that's new to the drawer lands on top
function arranged(){
  const mine = store.get('drawerOrder', []), list = PLAYLISTS.slice(0, DRAWER);
  if (!mine.length) return list;
  const at = new Map(mine.map((id, i) => [id, i]));
  return [...list.filter(p => !at.has(p.id)), ...list.filter(p => at.has(p.id)).sort((a, b) => at.get(a.id) - at.get(b.id))];
}
// press and hold a tape to pick it up, drag it, let go to drop it
let droppedAt = 0;
function armDrag(b, grid){
  let hold = 0, drag = null;
  const bay = () => b.closest('.boxbay');
  const down = e => {
    if (e.button > 0) return;
    const x0 = e.clientX, y0 = e.clientY;
    hold = setTimeout(() => {
      const r = b.getBoundingClientRect();
      drag = {dx:x0 - r.left, dy:y0 - r.top, x:x0, y:y0, ph:b.cloneNode(true)};
      drag.ph.classList.add('ghost'); b.after(drag.ph);
      b.classList.add('lifted'); b.style.width = r.width + 'px'; place(x0, y0);
      sfx('tick'); try { N && N.haptic(2); } catch (err) {}
      drag.raf = requestAnimationFrame(edge);
    }, 380);
    b._start = {x:x0, y:y0};
  };
  const place = (x, y) => { drag.x = x; drag.y = y; b.style.left = (x - drag.dx) + 'px'; b.style.top = (y - drag.dy) + 'px'; };
  // near the top or bottom of the box, the box scrolls
  const edge = () => { if (!drag) return; const bb = bay().getBoundingClientRect(), z = bb.height * .12;
    if (drag.y < bb.top + z) bay().scrollTop -= 9; else if (drag.y > bb.bottom - z) bay().scrollTop += 9;
    reslot(); drag.raf = requestAnimationFrame(edge); };
  const reslot = () => {
    const over = [...grid.children].filter(c => c !== b && c !== drag.ph && c.dataset.id);
    let best = null, bd = 1e9;
    over.forEach(c => { const r = c.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - drag.x, r.top + r.height / 2 - drag.y); if (d < bd){ bd = d; best = c; } });
    if (!best) return;
    const r = best.getBoundingClientRect(), before = drag.y < r.top + r.height / 2 - r.height * .15 || (Math.abs(drag.y - (r.top + r.height / 2)) < r.height * .35 && drag.x < r.left + r.width / 2);
    const ref = before ? best : best.nextSibling;
    if (ref !== drag.ph && ref !== drag.ph.nextSibling) grid.insertBefore(drag.ph, ref);
  };
  const move = e => {
    if (!drag){ if (b._start && Math.hypot(e.clientX - b._start.x, e.clientY - b._start.y) > 10) clearTimeout(hold); return; }
    place(e.clientX, e.clientY); reslot();
  };
  const up = () => {
    clearTimeout(hold); b._start = null;
    if (!drag) return;
    cancelAnimationFrame(drag.raf); drag.ph.replaceWith(b); b.classList.remove('lifted'); b.style.left = b.style.top = b.style.width = '';
    drag = null; droppedAt = performance.now(); sfx('key');
    store.set('drawerOrder', [...grid.children].map(c => c.dataset.id).filter(Boolean));
    // the other view's drawer follows
    $$('.boxbay').forEach(bb => { if (!bb.contains(grid)) renderBox(bb); });
  };
  b.addEventListener('pointerdown', e => { down(e); addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end); });
  const end = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); up(); };
  // once a tape is up, the finger drags it instead of scrolling the box
  b.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, {passive:false});
  b.addEventListener('contextmenu', e => e.preventDefault());
}
function loadPlaylist(pl){
  if (S.radio) radioOff();   // one thing plays at a time
  S.boxAlbum = null; S.ctxHold = performance.now() + 9000; S.expect = S.r.key || null;
  if (N){
    N.playPlaylist(pl.uri, pl.name);
    if (N.hasListenerAccess()) chooseSource({kind:'remote'}, true, true);
    else toast('Turn on notification access for PHONY so it can follow Spotify.');
    S.playlist = pl; S.albumMode = false; S.ejected = true; insert(PL_TAPE); renderBoxes();
    S.tracks = [{title:pl.name, artist:'Starting…'}]; S.idx = 0; renderJList(); trackChanged();
    S.playing = true; S.startAt = S.cmdAt = performance.now(); setTimeout(() => sfx('latch'), 250); syncKeys();
    return;
  }
  const r = rng(pl.name.length * 17 + pl.count);
  S.src = {kind:'demo', title:pl.name}; S.tracks = DEMO.slice().sort(() => r() - .5); S.idx = 0; S.t = 0; S.dispP = 0;
  S.playlist = pl; S.albumMode = false; renderJList();
  // most recently played goes to the front
  if (!store.get('drawerOrder', []).length) PLAYLISTS = [pl, ...PLAYLISTS.filter(p => p !== pl)];
  insert(PL_TAPE); renderBoxes();
  setTimeout(() => { if (!S.playing){ play(); sfx('latch'); syncKeys(); } }, 600);
}
let boxStatus = N ? {signedIn:false, state:'idle', message:''} : {signedIn:true, state:'ready', message:''};
const NEUTRAL = ['#2b2724', '#8a7a66', '#c8b89a', '#efe6d6'];
const sameTitle = (a, b) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
// the case for whatever album tape is in the player (picked from the box, or noticed playing in Spotify)
function currentCaseId(){
  if (S.tape !== ALBUM_TAPE) return null;
  if (S.boxAlbum && CASES.find(c => c.id === S.boxAlbum.id)) return S.boxAlbum.id;
  const c = CASES.find(c => sameTitle(c.title, ALBUM.title)); return c ? c.id : null;
}
// a spine takes its colour from the cover
function paletteFrom(img){
  const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 16, 16);
  const d = x.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0, best = null, bs = -1;
  for (let i = 0; i < d.length; i += 4){ r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), sat = mx ? (mx - mn) / mx : 0;
    if (sat * mx > bs){ bs = sat * mx; best = [d[i], d[i + 1], d[i + 2]]; } }
  const hex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const avg = [r / n, g / n, b / n];
  return [hex(avg), hex(best || avg), hex(best || avg), '#f3ecde'];
}
function loadCovers(){
  if (!N) return;
  CASES.forEach(al => {
    if (al.img || al.imgTried === 2) return;
    const src = N.getCover(al.id); if (!src){ al.imgTried = 1; return; }
    al.imgTried = 2;
    const im = new Image(); im.onload = () => { al.img = im; al.pal = paletteFrom(im); Object.keys(artCache).forEach(k => { if (k.startsWith(al.id)) delete artCache[k]; }); rerenderSoon(); }; im.src = src;
  });
}
let rerenderT = 0;
function rerenderSoon(){ clearTimeout(rerenderT); rerenderT = setTimeout(() => { if (boxVisible()) renderBoxes(); }, 120); }
const boxVisible = () => $('.lid').classList.contains('boxopen') || $('#cover').classList.contains('boxopen');
let lastNotice = -1;
function readBox(){
  if (!N) return;
  try { boxStatus = JSON.parse(N.spotifyStatus()); } catch (e) {}
  if (lastNotice < 0) lastNotice = boxStatus.noticeId || 0;
  else if (boxStatus.noticeId && boxStatus.noticeId !== lastNotice){ lastNotice = boxStatus.noticeId; if (boxStatus.notice) toast(boxStatus.notice); }
  let list = []; try { list = JSON.parse(N.getBox()); } catch (e) {}
  const old = {}; CASES.forEach(c => { old[c.id] = c; });
  CASES = sortCases(list.map(a => { const o = old[a.id]; return Object.assign(o || {pal:NEUTRAL}, {id:a.id, uri:a.uri, title:a.title, artist:a.artist, year:a.year, tracks:a.tracks || []}); }));
  loadCovers();
  let pls = []; try { pls = JSON.parse(N.getDrawer ? N.getDrawer() : '[]'); } catch (e) {}
  PLAYLISTS = pls.slice(0, DRAWER); assignLooks();
}
window.phonyBoxChanged = () => { readBox(); rerenderSoon(); };
window.phonyPlayed = (ok, msg) => { if (!ok && msg) toast(msg); };

function coverArt(al, w, h, bare){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (al.img){
    const iw = al.img.naturalWidth, ih = al.img.naturalHeight, k = Math.max(w / iw, h / ih);
    x.drawImage(al.img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k); return c;
  }
  if (N){ // on the phone, before the cover arrives: a plain printed card
    x.fillStyle = al.pal[0]; x.fillRect(0, 0, w, h); x.fillStyle = al.pal[3]; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    const mm = Math.min(w, h); fit(x, (al.artist || '').toUpperCase(), mm * .08, h * .5, w - mm * .16, mm * .09, PRINT, '800'); fit(x, al.title || '', mm * .08, h * .5 + mm * .12, w - mm * .16, mm * .075, PRINT, '600');
    return c;
  }
  const [bg, a, b, fg] = al.pal, r = rng(al.id.split('').reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7));
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  if (al.art === 'sun'){
    const g = x.createLinearGradient(0, 0, 0, h * .62); g.addColorStop(0, bg); g.addColorStop(.6, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h * .62);
    x.fillStyle = b; x.beginPath(); x.arc(w * .62, h * .62, m * .22, Math.PI, 0); x.fill();
    x.fillStyle = bg; x.fillRect(0, h * .62, w, h);
    x.fillStyle = b; for (let i = 0; i < 7; i++){ const ww = m * (.4 - i * .05); x.globalAlpha = .7 - i * .08; x.fillRect(w * .62 - ww / 2, h * .65 + i * h * .035, ww, h * .012); } x.globalAlpha = 1;
  } else if (al.art === 'circle'){
    x.fillStyle = a; x.beginPath(); x.arc(w * (.35 + r() * .3), h * .46, m * .3, 0, TAU); x.fill();
    x.strokeStyle = b; x.lineWidth = m * .012; x.beginPath(); x.arc(w * .5, h * .46, m * .36, 0, TAU); x.stroke();
  } else if (al.art === 'bokeh'){
    for (let i = 0; i < 40; i++){ const rr = m * (.02 + r() * .08), px = r() * w, py = r() * h * .8, col = r() < .5 ? a : b;
      const g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = .35 + r() * .5; x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    x.globalAlpha = 1;
  } else if (al.art === 'grid'){
    const n = 4, s = m * .15, ox = (w - n * s * 1.25) / 2 + s * .12, oy = h * .18;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){ const t = r(); x.fillStyle = t < .33 ? a : t < .66 ? b : fg; x.save(); x.translate(ox + i * s * 1.25 + s / 2, oy + j * s * 1.25 + s / 2); x.rotate((r() - .5) * .4);
      if (t < .5) x.fillRect(-s / 2, -s / 2, s, s); else { x.beginPath(); x.arc(0, 0, s / 2, 0, TAU); x.fill(); } x.restore(); }
  } else if (al.art === 'waves'){
    x.lineWidth = m * .014;
    for (let k = 0; k < 16; k++){ x.strokeStyle = k % 3 ? b : a; x.beginPath(); for (let i = 0; i <= 40; i++){ const px = i / 40 * w, py = h * .2 + k * h * .04 + Math.sin(i / 40 * TAU * 1.5 + k * .5) * m * .03; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
  } else if (al.art === 'split'){
    x.fillStyle = a; x.fillRect(0, h * .5, w, h * .5);
    x.fillStyle = b; x.fillRect(w * .12, h * .5 - m * .006, w * .76, m * .012);
    x.beginPath(); x.arc(w * .5, h * .5, m * .12, Math.PI, 0); x.fill();
  } else if (al.art === 'stripes'){
    [a, b, fg, a].forEach((col, i) => { x.fillStyle = col; x.save(); x.translate(w * .5, h * .5); x.rotate(-.5); x.fillRect(-w, -m * .3 + i * m * .12, w * 2, m * .07); x.restore(); });
  }
  // the title, small, the way covers set it
  if (!bare){ x.fillStyle = fg; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  fit(x, al.artist.toUpperCase(), m * .07, h - m * .15, w - m * .14, m * .065, PRINT, '800');
  fit(x, al.title, m * .07, h - m * .07, w - m * .14, m * .055, PRINT, '600'); }
  // a little age
  x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(230,210,170,.18)'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
  return c;
}
const artCache = {};
const art = (al, w, h, bare) => { if (!al.pal) al.pal = NEUTRAL; const k = al.id + w + 'x' + h + (bare ? 'b' : ''); return artCache[k] || (artCache[k] = coverArt(al, w, h, bare)); };
function lum(hex){ const v = parseInt(hex.slice(1), 16); return ((v >> 16) * .299 + ((v >> 8) & 255) * .587 + (v & 255) * .114) / 255; }

function caseEl(al, i){
  const b = document.createElement('button'); b.className = 'case'; b.dataset.id = al.id;
  const bg = al.pal[0], fg = lum(bg) > .55 ? '#1b1a18' : '#f6efe2';
  b.style.setProperty('--bg', bg); b.style.setProperty('--fg', fg);
  const rr = rng(i * 13 + al.id.length * 7); b.style.setProperty('--jx', ((rr() - .5) * 1.4).toFixed(2) + 'cqw'); b.style.setProperty('--jr', ((rr() - .5) * .5).toFixed(2) + 'deg');
  b.setAttribute('aria-label', `${al.title} by ${al.artist}`);
  const sp = document.createElement('span'); sp.className = 'sp';
  const cv = art(al, 120, 120), c2 = document.createElement('canvas'); c2.width = 120; c2.height = 120; c2.getContext('2d').drawImage(cv, 0, 0);
  sp.append(c2);
  sp.insertAdjacentHTML('beforeend', '<span class="who"></span><span class="what"></span><span class="yr"></span>');
  sp.querySelector('.who').textContent = al.artist; sp.querySelector('.what').textContent = al.title; sp.querySelector('.yr').textContent = al.year;
  b.append(sp);
  b.addEventListener('click', () => { ensureAudio(); sfx('tick'); b.classList.add('pull'); setTimeout(() => b.classList.remove('pull'), 400); showCase(al, b.closest('.boxbay')); });
  return b;
}
function statusCard(){
  const note = (text, onClick) => { const b = document.createElement('button'); b.className = 'case note'; b.innerHTML = '<span class="sp"><span class="hw"></span></span>'; b.querySelector('.hw').textContent = text; if (onClick) b.addEventListener('click', () => { ensureAudio(); sfx('tick'); onClick(); }); else b.disabled = true; return b; };
  if (!boxStatus.spotify && N) return note('Install Spotify to fill the box.');
  if (N && !boxStatus.hasClientId) return note('Tap here to set up your Spotify app.', openSpotifySetup);
  if (!boxStatus.signedIn) return note('Sign in to Spotify to fill the box.', () => N.spotifyLogin());
  if (N && !boxStatus.canPlay) return note('Tap here to let PHONY change what Spotify plays.', () => N.spotifyLogin());
  if (boxStatus.state === 'error' && !CASES.length){
    // refused for the account: the way out is a Spotify app of your own
    if (/client ID/.test(boxStatus.message || '')) return note(boxStatus.message, openSpotifySetup);
    return note((boxStatus.message || 'Couldn\'t reach Spotify.') + ' Tap to try again.', () => { N.boxSync(true); });
  }
  if (!CASES.length && boxStatus.state === 'loading') return note('Fetching your albums…');
  if (!CASES.length) return note('Save an album in Spotify and it shows up here.', () => N.boxSync(true));
  return null;
}
function renderBox(bay, fresh){
  const keep = bay.scrollTop;
  inPlayer = currentCaseId();
  const wrap = document.createElement('div'); wrap.className = 'boxes';
  const sc = statusCard();
  const items = sc && boxStatus.signedIn && CASES.length ? [sc, ...CASES] : (sc ? [sc] : CASES);
  const n = Math.max(1, Math.ceil(items.length / PER_BOX)) + (items.length % PER_BOX === 0 ? 1 : 0);
  for (let k = 0; k < n; k++){
    const box = document.createElement('div'); box.className = 'box';
    const dy = document.createElement('span'); dy.className = 'dymo'; dy.textContent = String(k + 1); box.append(dy);
    const sl = document.createElement('div'); sl.className = 'slots';
    for (let j = 0; j < PER_BOX; j++){
      const al = items[k * PER_BOX + j];
      if (al instanceof HTMLElement){ sl.append(al); continue; }
      if (!al){ const e = document.createElement('div'); e.className = 'slot0'; sl.append(e); continue; }
      if (inPlayer === al.id){ const g = document.createElement('div'); g.className = 'gap'; g.innerHTML = '<i>in the player</i>'; sl.append(g); continue; }
      const el = caseEl(al, k * PER_BOX + j); if (fresh === al.id) el.classList.add('fresh'); sl.append(el);
    }
    box.append(sl); wrap.append(box);
  }
  // the finished mixtapes, spine out, then the drawer of playlist tapes
  const mb = mixBoxEl(fresh); if (mb) wrap.append(mb);
  const dr = drawerEl(); if (dr) wrap.append(dr);
  bay.innerHTML = ''; bay.append(wrap); bay.scrollTop = keep;
}
function renderBoxes(fresh){ $$('.boxbay').forEach(bay => renderBox(bay, fresh)); }

function showCase(al, bay){
  const host = bay.parentElement, v = document.createElement('div'); v.className = 'caseview';
  const bc = document.createElement('button'); bc.className = 'bigcase'; bc.setAttribute('aria-label', 'Open the case and play ' + al.title);
  const tray = document.createElement('span'); tray.className = 'tray';
  const tape = document.createElement('canvas');
  const lid = document.createElement('span'); lid.className = 'lidf';
  const front = document.createElement('canvas'); front.width = 440; front.height = 690; const fx = front.getContext('2d');
  // a J-card front: the cover on top, a printed band below
  fx.fillStyle = al.pal[0]; fx.fillRect(0, 0, 440, 690);
  fx.drawImage(art(al, 440, 440, true), 0, 0);
  const ink = lum(al.pal[0]) > .55 ? '#1b1a18' : '#f6efe2';
  fx.fillStyle = al.pal[1]; fx.fillRect(0, 440, 440, 10);
  fx.fillStyle = ink; fx.textAlign = 'left'; fx.textBaseline = 'alphabetic';
  fit(fx, al.artist.toUpperCase(), 30, 520, 380, 44, PRINT, '800');
  fit(fx, al.title, 30, 572, 380, 40, PRINT, '600');
  fx.globalAlpha = .6; fit(fx, `${al.year}  ·  STEREO  ·  HIGH FIDELITY`, 30, 650, 380, 20, PRINT, '600'); fx.globalAlpha = 1;
  lid.append(front); bc.append(tray, lid);
  const info = document.createElement('div'); info.className = 'caseinfo'; info.innerHTML = '<b></b><small></small>';
  info.querySelector('b').textContent = al.title; info.querySelector('small').textContent = `${al.artist} · ${al.year}`;
  v.append(bc, info); host.append(v);
  requestAnimationFrame(() => v.classList.add('show'));
  const close = () => { v.classList.remove('show'); setTimeout(() => v.remove(), 250); };
  v.addEventListener('click', e => { if (e.target === v) close(); });
  bc.addEventListener('click', () => {
    if (bc.classList.contains('opening')) return;
    // this album's worn tape, lying in the case
    ALBUM.title = al.title; ALBUM.artist = al.artist; ALBUM.img = art(al, 880, 880); ALBUM.key = 'box|' + al.id;
    renderThumb(tape, TAPES[ALBUM_TAPE]); tray.append(tape);
    sfx('eject'); bc.classList.add('opening');
    setTimeout(() => { bc.classList.add('gone'); info.style.opacity = 0; }, 700);
    setTimeout(() => { close(); loadFromBox(al); }, 1050);
  });
}
function loadFromBox(al){
  if (S.radio) radioOff();
  newTape(); S.boxAlbum = {id:al.id, title:al.title}; S.playlist = null; S.ctxHold = performance.now() + 9000; S.expect = S.r.key || null;
  if (N){
    N.playAlbum(al.uri, al.title);
    if (N.hasListenerAccess()) chooseSource({kind:'remote'}, true, true);
    else toast('Turn on notification access for PHONY so it can follow Spotify.');
    S.boxAlbum = {id:al.id, title:al.title};
    ALBUM.title = al.title; ALBUM.artist = al.artist; ALBUM.img = al.img || art(al, 880, 880); ALBUM.key = 'box|' + al.id;
    S.albumFor = al.title; S.albumMode = true; S.playlist = null; S.ejected = true; insert(ALBUM_TAPE); renderBoxes();
    // the album's songs straight away, while Spotify switches
    if (al.tracks && al.tracks.length){ S.tracks = al.tracks.map(t => ({title:t.t, artist:al.artist, dur:t.d})); S.idx = 0; renderJList(); trackChanged(); }
    S.playing = true; S.startAt = S.cmdAt = performance.now(); setTimeout(() => sfx('latch'), 250); syncKeys();
    return;
  }
  const r = rng(al.year * 7 + al.title.length);
  const pool = TRACKS.slice().sort(() => r() - .5);
  S.src = {kind:'demo', title:al.title, album:al.id}; S.tracks = pool.slice(0, 7).map(t => ({title:t, artist:al.artist, dur:150 + Math.round(r() * 140)})); S.idx = 0; S.t = 0; S.dispP = 0;
  S.albumMode = true; renderJList();
  // In the app, this is where PHONY tells Spotify to play the album.
  insert(ALBUM_TAPE); renderBoxes();
  setTimeout(() => { if (!S.playing){ play(); sfx('latch'); syncKeys(); } }, 600);
}
function showBox(){
  readRadio();
  if (N){ readBox(); N.boxSync(false); }
  renderBoxes();
  // in the pocket the card drops out of the way and the box is under the player, as when closed
  if (slab()){ cardTo(false, true); inner.classList.add('away'); $('#cover').classList.remove('lift'); }
  if (S.open) $('.lid').classList.add('boxopen'); else $('#cover').classList.add('boxopen');
}
function hideBox(){ $('.lid').classList.remove('boxopen'); $('#cover').classList.remove('boxopen'); inner.classList.remove('away'); }
// demo: Spotify just played a whole album; it gets a case at the top of box 1
let moreI = 0;
window.phonyBoxNew = () => {
  const al = MORE[moreI++ % MORE.length]; if (CASES.find(c => c.id === al.id)) return;
  CASES.unshift(al); sortCases(CASES); renderBoxes(al.id);
  if (!S.ejected){ S.ejected = true; pause(); sfx('eject'); syncKeys(); showBox(); renderBoxes(al.id); }
};
window.phonyEject = () => { ensureAudio(); if (!S.ejected) eject(); };



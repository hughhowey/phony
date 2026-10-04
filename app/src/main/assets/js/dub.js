// PHONY · dubbing a tape for someone: a mixtape goes out as a message, with your handwriting on it

/* The message carries the Spotify playlist link (so anyone can play it) and a small packed copy of
   the tape itself for PHONY on the other phone: the shell, your writing on the spine, the songs
   and where you heard each one. The receiver shares the message to PHONY, or copies it and opens
   PHONY, and the tape is in their drawer, in your handwriting. */
let DUBS = store.get('dubs', []);
const DUB_SHELLS = ['love', 'friend', 'bff'];

// the writing, thinned: keep the points that shape a line (Ramer–Douglas–Peucker), on the 8:1 strip
function thinStroke(pts, eps){
  if (pts.length <= 4) return pts;
  const P = []; for (let i = 0; i < pts.length; i += 2) P.push([pts[i] * 8, pts[i + 1]]);
  const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
  const stack = [[0, P.length - 1]];
  while (stack.length){
    const [a, b] = stack.pop(); let far = 0, idx = -1;
    const [ax, ay] = P[a], [bx, by] = P[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++){ const d = Math.abs(dy * P[i][0] - dx * P[i][1] + bx * ay - by * ax) / L; if (d > far){ far = d; idx = i; } }
    if (far > eps && idx > 0){ keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  const out = []; P.forEach((p, i) => { if (keep[i]) out.push(+(p[0] / 8).toFixed(3), +p[1].toFixed(3)); });
  return out;
}
const b64u = { enc: bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)) };
async function packDub(obj){
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'undefined') return 'j' + b64u.enc(raw);
  const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  return 'z' + b64u.enc(z);
}
async function unpackDub(s){
  const bytes = b64u.dec(s.slice(1));
  const raw = s[0] === 'z' ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}

/* ---------- sending: hold a finished tape's case ---------- */
function openDub(m){
  if ($('.setup')) return;
  if (N && !m.playlistId){ toast('This tape has no playlist in Spotify yet.'); return; }
  if (N && !boxStatus.canShare){ toast('Sign in to Spotify again so PHONY can share a tape.'); N.spotifyLogin(); return; }
  const host = S.mode === 'open' ? $('#inner') : $('#cover');
  const c = el('div', 'setupcard dubcard');
  c.append(el('div', 'sk', 'DUB A COPY FOR'));
  const row = el('div', 'dubrow');
  DUB_SHELLS.forEach(id => {
    const d = DESIGNS.findIndex(x => x.id === id), b = el('button', 'dubtape'), cv = el('canvas');
    renderThumb(cv, DESIGNS[d], {title:'', side:'A', idx:0, cur:{title:''}, noTrack:true, strokes:m.strokes});
    b.append(cv, el('b', '', DESIGNS[d].name)); row.append(b);
    b.addEventListener('click', () => { ensureAudio(); sfx('key'); close(); sendDub(m, id); });
  });
  c.append(row);
  const keys = el('div', 'skeys'), cancel = el('button', 'scancel', 'NOT NOW'); keys.append(cancel); c.append(keys);
  const close = card(host, c);
  cancel.addEventListener('click', () => { ensureAudio(); sfx('tick'); close(); });
}
async function sendDub(m, shell){
  const songs = m.songs.map(s => ({t:s.title, a:s.artist, d:Math.round(s.dur || 0), p:(s.heard && s.heard.place) || '', o:(s.heard && s.heard.on) || '', at:(s.heard && s.heard.at) || s.rec || 0}));
  const strokes = (m.strokes || []).map(st => thinStroke(st, .012));
  const payload = {v:1, id:m.playlistId || 'demo', n:m.n, from:owner() || 'A friend', shell, s:strokes, songs, at0:m.started || 0, at1:m.ended || 0};
  const packed = await packDub(payload);
  const link = 'https://open.spotify.com/playlist/' + (m.playlistId || '');
  const text = `A tape I dubbed for you with PHONY. Play it on Spotify: ${link}\nOr share this message to PHONY and it goes in your drawer.\n#phony:${packed}`;
  if (!N){ toast(`Dubbed (${packed.length} characters). In the app this opens the share sheet.`); console.log(text); return; }
  // the playlist has to be reachable from the other phone: public (it was private until now)
  N.mixPublic(m.playlistId); window.phonyPublic = ok => { if (!ok) toast('Spotify wouldn\'t open the playlist up; the link may not play for them.'); N.shareText(text); };
}

/* ---------- receiving: a message shared to PHONY (or copied, then PHONY opened) ---------- */
async function takeDubs(){
  if (!N) return;
  let raw = []; try { raw = JSON.parse(N.takeDubs() || '[]'); } catch (e) { return; }
  let added = 0;
  for (const text of raw){
    const m = /#phony:([A-Za-z0-9_-]+)/.exec(text || ''); if (!m) continue;
    try {
      const p = await unpackDub(m[1]); if (!p || p.v !== 1 || !p.id) continue;
      if (DUBS.find(d => d.playlistId === p.id)) continue;
      const d = DESIGNS.findIndex(x => x.id === p.shell), rec = Date.now();
      DUBS.unshift({id:'dub:' + p.id, playlistId:p.id, from:p.from || '', d:d < 0 ? DESIGNS.findIndex(x => x.id === 'friend') : d, strokes:p.s || [], n:p.n || 1, dub:true, received:rec,
        started:p.at0 || rec, ended:p.at1 || rec, songs:(p.songs || []).map(s => ({title:s.t, artist:s.a || '', dur:s.d || 0, uri:'', heard:{place:s.p || '', on:s.o || '', at:s.at || 0}, rec:s.at || rec}))});
      added++;
    } catch (e) { }
  }
  if (added){ store.set('dubs', DUBS); toast(added === 1 ? 'A tape, dubbed for you: it\'s in the drawer.' : added + ' tapes dubbed for you are in the drawer.'); if (boxVisible()) renderBoxes(); }
}
window.phonyDubbed = () => { takeDubs(); };

// a dubbed tape in the drawer: their shell, their writing, their name under it
function dubEl(m){
  const b = document.createElement('button'); b.className = 'dubbed'; b.dataset.id = m.id; b.style.setProperty('--r', ((m.n * 7) % 5 - 2) + 'deg');
  if (S.mix === m){ const g = document.createElement('span'); g.className = 'gone'; g.innerHTML = '<i>in the player</i>'; b.append(g); b.disabled = true; }
  else { const cv = document.createElement('canvas'); renderThumb(cv, DESIGNS[m.d], {title:'', side:'A', idx:0, cur:{title:''}, noTrack:true, strokes:m.strokes}); b.append(cv); }
  const nm = document.createElement('b'); nm.textContent = 'dubbed by ' + (m.from || 'a friend'); b.append(nm);
  const sm = document.createElement('small'); sm.textContent = `${m.songs.length} ${m.songs.length === 1 ? 'SONG' : 'SONGS'} · ${mixRange(m).toUpperCase()}`; b.append(sm);
  b.addEventListener('click', () => { ensureAudio(); sfx('tick'); loadMix(m); });
  return b;
}

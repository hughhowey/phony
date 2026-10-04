// PHONY · start-up
/* ---------- boot ---------- */
// the canvases and the screen's shape are watched only now: drawing a shell needs every script loaded
wins.forEach(o => new ResizeObserver(() => sizeWin(o)).observe(o.canvas));
addEventListener('resize', layout);
applyFx(); setVol(N ? Math.max(0, N.getVolume()) : S.vol); renderJList(); tapeChanged(); layout();
const saved = store.get('src', null);
if (N && saved){
  if (saved.kind === 'remote' && N.hasListenerAccess()) chooseSource(saved, true);
  else if (saved.kind === 'local' && N.hasAudioPermission()) chooseSource(saved, true);
}
if (N && S.src.kind === 'demo') $('#mixtitle').textContent = 'Tap here for music';
// know the drawer's playlists from the start, so a playlist already playing in Spotify gets its tape
if (N) try { readBox(); } catch (e) {}
readRadio(); ensureBlank();
if (N) restoreTape();   // the tape that was in when PHONY was last open
S.booting = false; syncRec();
if (N) takeDubs();   // a tape dubbed for you may have arrived while PHONY was closed
// browser version only: jump the sample clock, for trying things out
if (!N) window.phonyTestSeek = t => { S.t = t < 0 ? dur(S.idx) + t : t; };
if (N) try { radioNoticeId = JSON.parse(N.radioNotice()).id; } catch (e) {}
requestAnimationFrame(loop);
// the phone's back button: fold up whatever's open, innermost first; false means nothing was
window.phonyBack = () => {
  const card = $('.setup, .namer, .caseview'); if (card){ card.remove(); return true; }
  if (foldOpen){ closeFold(); return true; }
  if (!sheet.hidden){ closeSheet(); return true; }
  if (S.ejected && boxVisible()){ putBack(); return true; }
  if (S.mode === 'pocket' && S.open){ cardTo(false); return true; }
  return false;
};
// the first time: whose player is this (the black shell's tag)
if ((N && !owner()) || new URLSearchParams(location.search).get('setup') === 'name') setTimeout(askOwner, 600);
if (new URLSearchParams(location.search).get('setup') === 'spotify') setTimeout(openSpotifySetup, 600);
// the pens' fonts only load when asked for, and the tapes are drawn on canvas, so ask
const penFonts = ['"Permanent Marker"', '"Nothing You Could Do"', '"Rock Salt"', '700 1px Caveat', '"Gochi Hand"', '"Reenie Beanie"'];
if (document.fonts) Promise.all(penFonts.map(f => document.fonts.load((/^\d/.test(f) ? f : '40px ' + f)).catch(() => {}))).then(() => document.fonts.ready).then(() => {
  Object.keys(thumbCache).forEach(k => delete thumbCache[k]); refreshShells(); tapeChanged(); if (boxVisible()) renderBoxes();
});

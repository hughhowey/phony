// PHONY · the cassettes: shells, labels, pens, and how a tape is drawn
const N = window.PhonyNative || null;
const W = 1000, H = 638, HUB1 = {x:290, y:280}, HUB2 = {x:710, y:280};
const RMIN = 72, RMAX = 206, LINEAR = 476, REMOTE_SIDE = 2700;
const PRINT = '"Barlow Condensed","Arial Narrow",sans-serif', HAND = '"Reenie Beanie","Bradley Hand",cursive';
const TAU = Math.PI * 2;

const DEMO = [
  {title:'Once in a Lifetime', artist:'Talking Heads', dur:259},
  {title:'Just Like Heaven', artist:'The Cure', dur:212},
  {title:'Take On Me', artist:'a-ha', dur:228},
  {title:'Hounds of Love', artist:'Kate Bush', dur:182},
  {title:'Everybody Wants to Rule the World', artist:'Tears for Fears', dur:251},
  {title:'Dancing in the Dark', artist:'Bruce Springsteen', dur:241},
];
const ALBUM = {title:'Low Tide Radio', artist:'The Marlinspikes', img:null, key:''};

function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function fit(c, text, x, y, maxW, size, family, weight=''){
  let s = size; c.font = `${weight} ${s}px ${family}`;
  while (c.measureText(text).width > maxW && s > 12){ s -= 2; c.font = `${weight} ${s}px ${family}`; }
  c.fillText(text, x, y);
}
function hand(c, text, x, y, maxW, size, color, tilt=-0.012){
  c.save(); c.translate(x, y); c.rotate(tilt); c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  fit(c, text, 0, 0, maxW, size, HAND); c.restore();
}
function writeStrip(c, x, y, w, h, fill, line){
  c.fillStyle = fill; c.fillRect(x, y, w, h);
  if (line){ c.strokeStyle = line; c.lineWidth = 2; c.strokeRect(x, y, w, h); }
}

const labels = {
  mix(c, info){
    const g = c.createLinearGradient(0, 50, 0, 470); g.addColorStop(0, '#f4edda'); g.addColorStop(1, '#e5dac0');
    c.fillStyle = g; c.fillRect(60, 50, 880, 420);
    c.fillStyle = '#c8372d'; c.fillRect(60, 62, 880, 28);
    c.fillStyle = '#ea8a2a'; c.fillRect(60, 94, 880, 12);
    c.fillStyle = '#f0c64c'; c.fillRect(60, 110, 880, 6);
    c.fillStyle = '#f8efdd'; c.font = `600 21px ${PRINT}`; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText('TYPE I  ·  NORMAL BIAS  ·  C60', 916, 77);
    c.strokeStyle = '#3a3226'; c.lineWidth = 3; c.strokeRect(80, 124, 46, 44);
    c.fillStyle = '#3a3226'; c.font = `800 38px ${PRINT}`; c.textAlign = 'center'; c.fillText(info.side, 103, 147);
    c.strokeStyle = 'rgba(80,110,165,.35)'; c.lineWidth = 1.6;
    [[140,166],[80,418],[80,452]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(920, y); c.stroke(); });
    if (info.pen) return;
    hand(c, info.title, 146, 160, 760, 60, '#1d3c8f');
    hand(c, `${info.idx + 1}. ${info.cur.title}`, 86, 413, 820, 42, '#1d3c8f', -0.006);
    if (info.cur.artist) hand(c, info.cur.artist, 112, 448, 780, 32, 'rgba(29,60,143,.8)', 0.004);
  },
  chrome(c, info){
    c.fillStyle = '#141418'; c.fillRect(60, 50, 880, 420);
    const cols = ['#c9a55a', '#efe0ae', '#9ea1a8', '#dfe1e5'];
    cols.forEach((col, i) => { c.fillStyle = col; c.beginPath(); const o = i * 24;
      c.moveTo(60 + o, 470); c.lineTo(76 + o, 470); c.lineTo(296 + o, 50); c.lineTo(280 + o, 50); c.fill(); });
    const sg = c.createLinearGradient(0, 80, 0, 160); sg.addColorStop(0, '#ffffff'); sg.addColorStop(.5, '#9ea3ab'); sg.addColorStop(.55, '#6c7078'); sg.addColorStop(1, '#e6e8eb');
    c.fillStyle = sg; c.font = `italic 800 98px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('HX·90', 340, 160);
    c.fillStyle = '#c9a55a'; c.font = `600 21px ${PRINT}`; c.textAlign = 'right'; c.fillText('HIGH BIAS  ·  CrO₂  ·  EQ 70µs', 918, 92);
    c.fillStyle = '#8b8e95'; c.fillText('SIDE ' + info.side, 918, 122);
    writeStrip(c, 92, 396, 818, 62, '#eceae3');
    if (!info.pen) hand(c, `${info.idx + 1}. ${info.cur.title}`, 104, 443, 790, 46, '#111');
  },
  clear(c, info){
    const g = c.createLinearGradient(60, 0, 940, 0); g.addColorStop(0, '#ff3f8e'); g.addColorStop(.55, '#ff8a3d'); g.addColorStop(1, '#ffd23f');
    c.fillStyle = g; c.fillRect(60, 56, 880, 96);
    c.fillStyle = '#111'; c.font = `italic 800 66px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('CLEAR 90', 88, 130);
    c.font = `600 21px ${PRINT}`; c.textAlign = 'right'; c.fillText('SEE-THRU SHELL · TYPE II · SIDE ' + info.side, 918, 128);
    writeStrip(c, 92, 400, 818, 58, 'rgba(255,255,255,.92)');
    if (!info.pen) hand(c, `${info.idx + 1}. ${info.cur.title}`, 104, 445, 790, 44, '#1b1b1b');
  },
  memphis(c, info){
    c.fillStyle = '#f7f4ec'; c.fillRect(60, 50, 880, 420);
    const r = rng(7), cols = ['#ff5fa2', '#19b5a5', '#ffcf33', '#1a1a1a', '#5b6cff'];
    for (let i = 0; i < 46; i++){
      const x = 60 + r() * 880, y = 50 + r() * 420, col = cols[(r() * cols.length) | 0], t = r();
      c.save(); c.translate(x, y); c.rotate(r() * Math.PI * 2); c.fillStyle = c.strokeStyle = col; c.lineWidth = 7; c.lineCap = 'round';
      if (t < .3){ c.beginPath(); for (let k = 0; k <= 12; k++){ const px = k * 7 - 42, py = Math.sin(k * .9) * 10; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      else if (t < .5){ c.beginPath(); c.moveTo(0, -16); c.lineTo(15, 12); c.lineTo(-15, 12); c.fill(); }
      else if (t < .7){ c.beginPath(); c.arc(0, 0, 6 + r() * 8, 0, 7); c.fill(); }
      else if (t < .85){ c.beginPath(); c.moveTo(-30, 0); c.lineTo(-15, -12); c.lineTo(0, 0); c.lineTo(15, -12); c.lineTo(30, 0); c.stroke(); }
      else { c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke(); }
      c.restore();
    }
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(84, 68, 500, 86, 10); c.fill();
    c.fillStyle = '#ffcf33'; c.font = `italic 800 60px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('PARTY TAPE ’89', 104, 132);
    writeStrip(c, 92, 398, 818, 60, '#ffffff', '#1a1a1a');
    if (!info.pen) hand(c, `${info.idx + 1}. ${info.cur.title}`, 104, 444, 790, 44, '#111');
  },
  metal(c, info){
    const g = c.createLinearGradient(60, 50, 940, 470); g.addColorStop(0, '#6a6e75'); g.addColorStop(.5, '#2d3036'); g.addColorStop(1, '#707580');
    c.fillStyle = g; c.fillRect(60, 50, 880, 420);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
    for (let y = 52; y < 470; y += 3){ c.beginPath(); c.moveTo(60, y); c.lineTo(940, y); c.stroke(); }
    c.fillStyle = '#d23a2e'; c.fillRect(60, 166, 880, 6);
    c.fillStyle = '#eceef1'; c.font = `800 112px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText('IV', 88, 158);
    c.font = `600 34px ${PRINT}`; c.fillText('METAL POSITION', 196, 112);
    c.fillStyle = '#b3b8bf'; c.font = `600 22px ${PRINT}`; c.fillText('MX 60  ·  EQ 70µs  ·  SIDE ' + info.side, 198, 146);
    writeStrip(c, 92, 398, 818, 60, '#d9dcdf');
    if (!info.pen) hand(c, `${info.idx + 1}. ${info.cur.title}`, 104, 444, 790, 44, '#101010');
  },
  album(c, info){
    const A = ALBUM;
    if (A.img){
      const iw = A.img.naturalWidth || A.img.width, ih = A.img.naturalHeight || A.img.height, dh = ih * 880 / iw;
      c.drawImage(A.img, 60, 50 + (420 - dh) / 2, 880, dh);
      let sh = c.createLinearGradient(0, 50, 0, 210); sh.addColorStop(0, 'rgba(0,0,0,.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(60, 50, 880, 160);
      sh = c.createLinearGradient(0, 370, 0, 470); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.65)'); c.fillStyle = sh; c.fillRect(60, 370, 880, 100);
    } else {
    const g = c.createLinearGradient(0, 50, 0, 340);
    g.addColorStop(0, '#2a1f5c'); g.addColorStop(.45, '#8d3b6e'); g.addColorStop(.78, '#f07a4a'); g.addColorStop(1, '#ffc36b');
    c.fillStyle = g; c.fillRect(60, 50, 880, 290);
    c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(730, 330, 120, Math.PI, 0); c.fill();
    c.fillStyle = '#18324f'; c.fillRect(60, 330, 880, 140);
    c.fillStyle = 'rgba(255,200,120,.55)';
    for (let i = 0; i < 7; i++){ const w = 180 - i * 22; c.fillRect(730 - w / 2, 344 + i * 17, w, 5); }
    }
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#fff3df'; fit(c, (A.title || '').toUpperCase(), 88, 124, 820, 62, PRINT, '800');
    c.fillStyle = 'rgba(255,243,223,.85)'; fit(c, (A.artist || '').toUpperCase().split('').join(' '), 90, 160, 820, 24, PRINT, '600');
    if (!info.noTrack) c.font = `600 30px ${PRINT}`, c.fillStyle = '#fff3df', fit(c, `${info.side || 'A'}${(info.sidePos != null ? info.sidePos : info.idx) + 1}  ${info.cur.title.toUpperCase()}`, 90, 438, 560, 30, PRINT, '600');
    // wear: fade, yellow, scratches, rubbed edges, a stain and a torn corner
    c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.42)'; c.fillRect(60, 50, 880, 420);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(222,196,150,.4)'; c.fillRect(60, 50, 880, 420);
    c.globalCompositeOperation = 'source-over';
    const r = rng(11);
    for (let i = 0; i < 90; i++){
      const x = 60 + r() * 880, y = 50 + r() * 420, len = 14 + r() * 150, a = (r() - .5) * .9;
      c.strokeStyle = `rgba(255,246,228,${.05 + r() * .2})`; c.lineWidth = .7 + r() * 1.8;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
    }
    c.strokeStyle = 'rgba(255,244,222,.14)'; c.lineWidth = 34; c.strokeRect(60, 50, 880, 420);
    c.strokeStyle = 'rgba(255,244,222,.2)'; c.lineWidth = 12; c.strokeRect(60, 50, 880, 420);
    const s = c.createRadialGradient(300, 420, 5, 300, 420, 90); s.addColorStop(0, 'rgba(255,255,255,.12)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = s; c.fillRect(200, 330, 200, 140);
    c.strokeStyle = 'rgba(110,70,30,.18)'; c.lineWidth = 5; c.beginPath(); c.arc(210, 118, 64, .3, 5.6); c.stroke();
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.beginPath(); c.moveTo(940, 50); c.lineTo(862, 50); c.lineTo(900, 70); c.lineTo(940, 104); c.fill();
    c.globalCompositeOperation = 'source-over';
  },
};



const TAPES = [
  {id:'mix', name:'Ferric mixtape', note:'Type I · 1984', shell:'#1c1c1f', bias:'normal', label:labels.mix, jc:{stripes:['#c8372d','#ea8a2a','#f0c64c'], type:'TYPE I · NORMAL · C60'}},
  {id:'chrome', name:'Chrome high bias', note:'Type II · 1987', shell:'#26262b', bias:'chrome', label:labels.chrome, jc:{stripes:['#141418','#c9a55a','#9ea1a8'], type:'HX·90 · HIGH BIAS · CrO₂'}},
  {id:'clear', name:'Clear shell', note:'Type II · 1993', shell:'rgba(190,232,244,.2)', clear:true, bias:'chrome', label:labels.clear, jc:{stripes:['#ff3f8e','#ff8a3d','#ffd23f'], type:'CLEAR 90 · TYPE II'}},
  {id:'memphis', name:'Party tape', note:'Type I · 1989', shell:'#f2efe8', bias:'normal', label:labels.memphis, jc:{stripes:['#ff5fa2','#19b5a5','#ffcf33'], type:'PARTY TAPE · C90'}},
  {id:'metal', name:'Metal position', note:'Type IV · 1985', shell:'#3a3c41', bias:'metal', label:labels.metal, jc:{stripes:['#2d3036','#d23a2e','#9aa0a8'], type:'MX 60 · METAL · TYPE IV'}},
  {id:'album', name:'Album tape', note:'Plays albums', shell:'#17171a', worn:true, bias:'normal', label:labels.album, printed:true},
];
const ALBUM_TAPE = 5, PL_TAPE = 6;

/* ---------- playlist tapes: ten more shells, after the real ones in the photos ---------- */
const smallCaps = (c, text, x, y, size, color, align='left', weight='600', spacing=0) => {
  c.fillStyle = color; c.font = `${weight} ${size}px ${PRINT}`; c.textAlign = align; c.textBaseline = 'alphabetic';
  if (spacing) text = text.split('').join(' '.repeat(spacing));
  c.fillText(text, x, y);
};
const moreLabels = {
  // clear shell, pink triangles, a green corner band (after a clear 90s tape)
  geo(c){
    c.fillStyle = 'rgba(255,255,255,.62)'; c.fillRect(60, 60, 880, 96);
    c.fillStyle = 'rgba(232,34,146,.74)';
    c.beginPath(); c.moveTo(60, 150); c.lineTo(360, 150); c.lineTo(60, 470); c.fill();
    c.beginPath(); c.moveTo(150, 470); c.lineTo(300, 290); c.lineTo(430, 470); c.fill();
    c.fillStyle = '#f4c21b'; c.fillRect(60, 176, 58, 66); smallCaps(c, 'A', 89, 226, 44, '#fff', 'center', '800');
    c.fillStyle = '#12a67c'; c.fillRect(846, 150, 94, 250); c.fillRect(440, 396, 500, 74);
    smallCaps(c, 'DYNAMAX', 470, 448, 44, '#fff', 'left', '800');
    c.font = `italic 800 40px ${PRINT}`; c.fillText('dB·S', 660, 448);
    smallCaps(c, '60', 893, 300, 52, '#fff', 'center', '800');
  },
  // smoke shell, cream "for recording" label, green racetrack round the window
  racetrack(c){
    c.fillStyle = '#efe6cf'; c.fillRect(60, 50, 880, 420);
    c.strokeStyle = '#5bb84a'; c.lineWidth = 46; c.beginPath(); c.roundRect(112, 168, 776, 230, 115); c.stroke();
    c.strokeStyle = 'rgba(91,184,74,.35)'; c.lineWidth = 60;
    c.beginPath(); c.moveTo(60, 470); c.lineTo(170, 360); c.moveTo(940, 470); c.lineTo(830, 360); c.stroke();
    smallCaps(c, 'FOR RECORDING', 500, 90, 30, '#2a2a2a', 'center', '600', 1);
    c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(250, 138); c.lineTo(750, 138); c.stroke();
    smallCaps(c, 'B', 96, 112, 58, '#1d1d1d', 'center', '800');
    smallCaps(c, 'HOKUTO', 500, 454, 50, '#2c6f25', 'center', '800');
    smallCaps(c, 'VG-712 · DT-60', 80, 450, 18, '#3a3a3a');
    smallCaps(c, 'NOT FOR SALE', 920, 428, 17, '#3a3a3a', 'right'); smallCaps(c, 'MADE IN JAPAN', 920, 452, 17, '#3a3a3a', 'right');
  },
  // teal shell, kraft label, two red stripes (after an old British label)
  kraft(c){
    c.fillStyle = '#e7cfaa'; c.fillRect(60, 50, 880, 420);
    const r = rng(41); c.lineWidth = 1;
    for (let i = 0; i < 160; i++){ c.strokeStyle = `rgba(120,80,40,${.04 + r() * .06})`; const x = 60 + r() * 880, y = 50 + r() * 420; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 + r() * 20, y + (r() - .5) * 4); c.stroke(); }
    c.fillStyle = '#cf3b35'; c.fillRect(246, 50, 12, 420); c.fillRect(266, 50, 12, 420);
    smallCaps(c, 'TC-RMC', 80, 80, 20, '#cf3b35'); smallCaps(c, '7052', 80, 104, 20, '#cf3b35');
    c.fillStyle = '#cf3b35'; c.fillRect(78, 124, 116, 42); smallCaps(c, 'RMC', 136, 157, 32, '#f6e6cc', 'center', '800');
    c.fillStyle = '#2f8e99'; c.beginPath(); c.roundRect(168, 162, 664, 236, 118); c.fill();
    smallCaps(c, '2', 888, 318, 96, '#cf3b35', 'center', '800');
  },
  // smoke shell, white label, red band, a strip of masking tape to write on
  redband(c){
    c.fillStyle = '#f3efe6'; c.fillRect(60, 50, 880, 420);
    c.fillStyle = '#e8471c'; c.fillRect(60, 164, 880, 232);
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect(150, 170, 700, 220, 18); c.fill();
    smallCaps(c, 'B', 104, 262, 62, '#1a1a1a', 'center', '800'); smallCaps(c, 'C-60', 104, 294, 20, '#1a1a1a', 'center');
    c.save(); c.translate(500, 104); c.rotate(-.014);
    c.fillStyle = 'rgba(230,217,184,.97)'; c.fillRect(-420, -38, 840, 76);
    const r = rng(9); for (let i = 0; i < 26; i++){ c.fillStyle = `rgba(160,130,80,${r() * .08})`; c.fillRect(-420 + r() * 840, -38, 2 + r() * 10, 76); }
    c.fillStyle = 'rgba(230,217,184,.97)'; for (let k = -1; k <= 1; k += 2){ c.beginPath(); for (let i = 0; i <= 8; i++){ const y = -38 + i * 9.5; c.lineTo(k * (420 + (i % 2 ? 7 : 0)), y); } c.fill(); }
    c.restore();
    smallCaps(c, 'NR ☐ON ☐OFF', 918, 158, 17, '#555', 'right');
    c.fillStyle = '#e8471c'; c.beginPath(); c.moveTo(400, 426); c.lineTo(450, 426); c.lineTo(450, 412); c.lineTo(478, 434); c.lineTo(450, 456); c.lineTo(450, 442); c.lineTo(400, 442); c.fill();
    smallCaps(c, 'KHF', 760, 454, 54, '#e8471c', 'left', '600'); smallCaps(c, '60', 850, 454, 54, '#1a1a1a', 'left', '600');
    smallCaps(c, 'TYPE I (NORMAL) POSITION', 84, 452, 17, '#333');
  },
  // clear shell, red pinstripes top left, a white strip to write on underneath
  clearred(c){
    c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(60, 56, 880, 104);
    c.fillStyle = '#d2262b'; for (let i = 0; i < 6; i++) c.fillRect(74, 72 + i * 11, 190, 6);
    smallCaps(c, 'ARKON', 290, 104, 40, '#2d2d2d', 'left', '800', 1);
    smallCaps(c, 'IEC I / TYPE I  NORMAL POSITION', 292, 134, 17, '#2d2d2d');
    c.fillStyle = '#c8a14a'; c.font = `italic 800 64px ${PRINT}`; c.textAlign = 'right'; c.fillText('D·90', 918, 128);
    c.fillStyle = 'rgba(255,255,255,.94)'; c.fillRect(92, 400, 818, 58); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.strokeRect(92, 400, 818, 58);
    smallCaps(c, 'A:', 104, 440, 26, '#2d2d2d', 'left', '800');
  },
  // black shell, cream label, sunset stripes through the middle
  sunset(c){
    c.fillStyle = '#f1e6cf'; c.fillRect(60, 50, 880, 420);
    [['#e9b489', 178, 26], ['#e37a45', 208, 22], ['#f1e6cf', 232, 8], ['#8fc4c6', 242, 30], ['#5e9ea6', 276, 14], ['#e9cfb0', 150, 8]].forEach(([col, y, h]) => { c.fillStyle = col; c.fillRect(60, y, 880, h); });
    const g = c.createLinearGradient(0, 300, 0, 470); g.addColorStop(0, 'rgba(233,207,176,0)'); g.addColorStop(1, 'rgba(233,207,176,.5)'); c.fillStyle = g; c.fillRect(60, 300, 880, 170);
  },
  // grey smoke, a silver top strip with side and length boxes (after a 90s chrome tape)
  side90(c){
    c.fillStyle = 'rgba(40,42,46,.5)'; c.fillRect(60, 50, 880, 420);
    c.fillStyle = '#d6d7d9'; c.fillRect(60, 58, 880, 92);
    c.fillStyle = '#1b1b1b'; c.fillRect(74, 66, 74, 76); smallCaps(c, 'SIDE', 111, 84, 13, '#ddd', 'center'); smallCaps(c, 'A', 111, 134, 50, '#fff', 'center', '800');
    c.fillStyle = '#f6f6f4'; c.fillRect(160, 68, 620, 72);
    c.strokeStyle = '#8a7a4a'; c.lineWidth = 3; c.strokeRect(798, 68, 124, 72); smallCaps(c, '90', 860, 128, 58, '#c49a3a', 'center', '800');
    smallCaps(c, 'POSITION CHROME', 500, 168, 20, '#d6b35c', 'center', '600', 1);
    smallCaps(c, 'SOLARA', 119, 292, 30, '#f2f2f2', 'center', '800');
    c.strokeStyle = '#d6b35c'; c.lineWidth = 2; c.strokeRect(836, 262, 90, 44); smallCaps(c, 'CRX II', 881, 294, 22, '#d6b35c', 'center', '800');
    smallCaps(c, 'IEC II / TYPE II · HIGH BIAS 70µs EQ', 500, 428, 18, '#d6b35c', 'center');
  },
  // near-black smoke, nothing but a logo and a red slash; you write on it in paint pen
  blacksf(c){
    const g = c.createLinearGradient(0, 50, 0, 470); g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(60, 50, 880, 420);
    c.fillStyle = '#e6e6e6'; c.beginPath(); c.moveTo(90, 104); c.lineTo(104, 80); c.lineTo(118, 104); c.fill();
    smallCaps(c, 'TAKA', 126, 104, 30, '#e6e6e6', 'left', '800', 1);
    c.fillStyle = '#e6e6e6'; c.font = `italic 600 64px ${ '"Zilla Slab",Georgia,serif' }`; c.textAlign = 'left'; c.fillText('SF', 400, 122);
    c.fillStyle = '#d23a2e'; c.beginPath(); c.moveTo(488, 128); c.lineTo(500, 128); c.lineTo(520, 76); c.lineTo(508, 76); c.fill();
    c.fillStyle = '#e6e6e6'; c.font = `italic 600 64px ${ '"Zilla Slab",Georgia,serif' }`; c.fillText('60', 524, 122);
    smallCaps(c, 'HIGH POSITION', 918, 98, 24, '#e6e6e6', 'right', '800'); smallCaps(c, 'IEC II / TYPE II', 918, 126, 20, '#e6e6e6', 'right');
    smallCaps(c, 'A:', 84, 170, 22, '#bbb', 'left', '800');
    smallCaps(c, 'HEAT RESISTANT / HIGH PRECISION MECHANISM', 500, 404, 15, '#9a4032', 'center');
  },
  // 90s sports tape: yellow shell, black label, pink and cyan lightning
  neon(c){
    c.fillStyle = '#141414'; c.fillRect(60, 50, 880, 420);
    const zig = (y, col, amp) => { c.strokeStyle = col; c.lineWidth = 10; c.lineJoin = 'miter'; c.beginPath(); for (let i = 0; i <= 22; i++){ const x = 60 + i * 42; i ? c.lineTo(x, y + (i % 2 ? -amp : amp)) : c.moveTo(x, y); } c.stroke(); };
    zig(170, '#ff2fa0', 12); zig(396, '#1fe0f0', 12);
    c.fillStyle = '#fff'; c.fillRect(90, 64, 820, 84); c.strokeStyle = '#ff2fa0'; c.lineWidth = 5; c.strokeRect(90, 64, 820, 84);
    c.fillStyle = '#ff2fa0'; c.font = `italic 800 48px ${PRINT}`; c.textAlign = 'left'; c.fillText('HYPER·X 90', 90, 454);
    smallCaps(c, 'EXTRA HIGH OUTPUT', 918, 450, 20, '#1fe0f0', 'right', '800', 1);
    [[120, 280], [880, 250]].forEach(([x, y]) => { c.fillStyle = '#ffe41c'; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x + 26, y + 16); c.lineTo(x - 26, y + 16); c.fill(); });
  },
  // pink shell, checkerboard header, lilac rules
  // red shell, cream label, a row of little hearts top and bottom
  love(c){
    c.fillStyle = '#f6e3df'; c.fillRect(60, 50, 880, 420);
    const heart = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + r * .9); c.bezierCurveTo(x - r * 1.3, y - r * .1, x - r * .6, y - r * 1.1, x, y - r * .35); c.bezierCurveTo(x + r * .6, y - r * 1.1, x + r * 1.3, y - r * .1, x, y + r * .9); c.fill(); };
    for (let i = 0; i < 17; i++){ heart(90 + i * 51, 82, 13, i % 3 ? '#b3202b' : '#e8a0a8'); heart(90 + i * 51, 438, 13, i % 3 ? '#b3202b' : '#e8a0a8'); }
    c.strokeStyle = 'rgba(179,32,43,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(100, 162); c.lineTo(900, 162); c.moveTo(100, 212); c.lineTo(900, 212); c.stroke();
    smallCaps(c, 'FOR YOU', 500, 400, 26, '#b3202b', 'center', '800', 6);
    smallCaps(c, 'A', 96, 126, 44, '#b3202b', 'center', '800');
  },
  // blue shell, white label, a yellow band
  friend(c){
    c.fillStyle = '#f6f3ea'; c.fillRect(60, 50, 880, 420);
    c.fillStyle = '#f4c21b'; c.fillRect(60, 50, 880, 60); c.fillRect(60, 400, 880, 70);
    c.strokeStyle = 'rgba(47,120,196,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(100, 162); c.lineTo(900, 162); c.moveTo(100, 212); c.lineTo(900, 212); c.stroke();
    smallCaps(c, 'FROM A FRIEND', 500, 94, 30, '#1a1a1a', 'center', '800', 4);
    smallCaps(c, 'PLAY LOUD', 500, 446, 26, '#2f78c4', 'center', '800', 6);
    smallCaps(c, 'A', 96, 126, 44, '#2f78c4', 'center', '800');
  },
  // pink shell, lilac label, glitter, stars
  bff(c){
    c.fillStyle = '#e9d6f5'; c.fillRect(60, 50, 880, 420);
    const r = rng(77);
    for (let i = 0; i < 260; i++){ c.fillStyle = r() < .5 ? 'rgba(247,209,74,.9)' : 'rgba(255,255,255,.95)'; const x = 60 + r() * 880, y = 50 + r() * 420, d = 1.5 + r() * 3; c.beginPath(); c.arc(x, y, d, 0, TAU); c.fill(); }
    const star = (x, y, R, col) => { c.fillStyle = col; c.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? R * .45 : R; k ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); };
    star(110, 100, 30, '#ff6fb5'); star(890, 110, 24, '#8f6fc4'); star(880, 430, 30, '#f7d14a'); star(120, 420, 22, '#8f6fc4');
    c.strokeStyle = 'rgba(143,111,196,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(100, 162); c.lineTo(900, 162); c.moveTo(100, 212); c.lineTo(900, 212); c.stroke();
    c.fillStyle = '#8f6fc4'; c.font = `44px "Gochi Hand", ${HAND}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('BFF 4 EVER', 500, 410);
  },
  pastel(c){
    c.fillStyle = '#fbf8f3'; c.fillRect(60, 50, 880, 420);
    for (let i = 0; i < 40; i++){ c.fillStyle = i % 2 ? '#cdb8ea' : '#f7e39a'; c.fillRect(60 + i * 22, 56, 22, 20); c.fillStyle = i % 2 ? '#f7e39a' : '#cdb8ea'; c.fillRect(60 + i * 22, 76, 22, 20); }
    c.strokeStyle = '#b9a2de'; c.lineWidth = 2; c.beginPath(); c.moveTo(90, 150); c.lineTo(910, 150); c.stroke();
    c.fillStyle = '#bfe6d3'; c.fillRect(60, 402, 880, 12);
    c.fillStyle = '#8f6fc4'; c.font = `italic 800 42px ${PRINT}`; c.textAlign = 'left'; c.fillText('CANDY 46', 90, 456);
    smallCaps(c, '♡ SIDE A', 918, 452, 22, '#8f6fc4', 'right', '800');
  },
};
// every shell a playlist can land on (the five first-generation tapes, with their printed
// track lines, are retired: whatever plays now always has its name written on the tape)
const DESIGNS = [
  {id:'geo', name:'Clear geo', shell:'rgba(205,230,240,.22)', clear:true, bias:'chrome', label:moreLabels.geo, write:{x:84, y:132, w:820, size:73}, jc:{stripes:['#e82292','#12a67c','#f4c21b'], type:'DYNAMAX dB·S 60 · TYPE II'}},
  {id:'racetrack', name:'For recording', shell:'#34373a', bias:'normal', label:moreLabels.racetrack, write:{x:256, y:134, w:490, size:46}, jc:{stripes:['#5bb84a','#efe6cf','#2c6f25'], type:'HOKUTO · FOR RECORDING · C60'}},
  {id:'kraft', name:'Kraft label', shell:'#2f8e99', bias:'normal', label:moreLabels.kraft, write:{x:300, y:144, w:600, size:66}, jc:{stripes:['#cf3b35','#e7cfaa','#cf3b35'], type:'RMC · TC 7052 · C60'}},
  {id:'redband', name:'Masking tape', shell:'rgba(62,50,44,.9)', bias:'normal', label:moreLabels.redband, write:{x:108, y:126, w:780, size:64}, jc:{stripes:['#e8471c','#1a1a1a','#e6d9b8'], type:'KHF60 · TYPE I NORMAL'}},
  {id:'clearred', name:'Clear D90', shell:'rgba(215,222,228,.24)', clear:true, bias:'normal', label:moreLabels.clearred, write:{x:152, y:444, w:740, size:54}, jc:{stripes:['#d2262b','#c8a14a','#d2262b'], type:'ARKON D·90 · TYPE I'}},
  {id:'sunset', name:'Sunset stripe', shell:'#161616', bias:'normal', label:moreLabels.sunset, write:{x:92, y:136, w:816, size:73}, jc:{stripes:['#e37a45','#e9b489','#8fc4c6'], type:'SUNSET STRIPE · C60'}},
  {id:'side90', name:'Chrome 90', shell:'rgba(66,68,72,.86)', bias:'chrome', label:moreLabels.side90, write:{x:176, y:126, w:590, size:61}, jc:{stripes:['#1b1b1b','#d6d7d9','#c49a3a'], type:'SOLARA CRX II · 90 · CrO₂'}},
  {id:'blacksf', name:'Black smoke', shell:'rgba(26,22,20,.93)', bias:'chrome', label:moreLabels.blacksf, write:{x:110, y:456, w:780, size:64, dark:true}, jc:{stripes:['#1d1a18','#d23a2e','#e6e6e6'], type:'TAKA SF 60 · HIGH POSITION'}},
  {id:'neon', name:'Hyper-X', shell:'#f2dc12', bias:'chrome', label:moreLabels.neon, write:{x:106, y:130, w:790, size:68}, jc:{stripes:['#141414','#ff2fa0','#1fe0f0'], type:'HYPER·X 90 · EXTRA HIGH OUTPUT'}},
  {id:'pastel', name:'Candy 46', shell:'#f2c3cd', bias:'normal', label:moreLabels.pastel, write:{x:96, y:142, w:810, size:68}, jc:{stripes:['#cdb8ea','#f7e39a','#bfe6d3'], type:'CANDY 46 · TYPE I'}},
  // the three a dubbed tape comes on (never handed to a playlist): for someone you love, a friend, a best friend
  {id:'love', dub:true, name:'With love', shell:'#b3202b', bias:'normal', label:moreLabels.love, write:{x:120, y:150, w:760, size:66}, jc:{stripes:['#b3202b','#f6e3df','#e8a0a8'], type:'DUBBED WITH LOVE · C90'}},
  {id:'friend', dub:true, name:'From a friend', shell:'#2f78c4', bias:'normal', label:moreLabels.friend, write:{x:110, y:150, w:780, size:66}, jc:{stripes:['#2f78c4','#f4c21b','#f6f3ea'], type:'FROM A FRIEND · C90'}},
  {id:'bff', dub:true, name:'BFF', shell:'#ff6fb5', bias:'normal', label:moreLabels.bff, write:{x:120, y:150, w:760, size:66}, jc:{stripes:['#ff6fb5','#8f6fc4','#f7d14a'], type:'BFF · 4 EVER · C90'}},
];

// what each playlist was written in; dark: for writing on black
const PENS = {
  ballpoint:{font:'"Nothing You Could Do"', color:'#1f3a93', k:.86, thin:true},
  sharpie:{font:'"Permanent Marker"', color:'#161616', k:.8, bleed:true},
  redfelt:{font:'Caveat', weight:'700', color:'#c02a2a', k:1.08, bleed:true},
  greenfelt:{font:'Caveat', weight:'700', color:'#1d6b3a', k:1.08, bleed:true},
  pencil:{font:'"Reenie Beanie"', color:'#3f3f44', k:1.2, thin:true},
  purplegel:{font:'"Gochi Hand"', color:'#57289a', k:.92},
  bluemarker:{font:'"Rock Salt"', color:'#173f9c', k:.68, thin:true},
  silver:{font:'"Permanent Marker"', color:'#e3e6ea', k:.8, dark:true, bleed:true},
  whitegel:{font:'Caveat', weight:'700', color:'#f7f3ea', k:1.08, dark:true},
  gold:{font:'"Rock Salt"', color:'#e9c566', k:.68, dark:true, thin:true},
  pinkpaint:{font:'"Gochi Hand"', color:'#ff9ccf', k:.92, dark:true, bleed:true},
};
function penWrite(c, pen, text, wr, tilt){
  c.save(); c.translate(wr.x, wr.y); c.rotate(tilt || 0); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let sz = wr.size * pen.k; const set = () => { c.font = `${pen.weight || ''} ${sz}px ${pen.font}`; };
  set(); while (c.measureText(text).width > wr.w && sz > 16){ sz -= 2; set(); }
  if (pen.bleed){ c.globalAlpha = .35; c.fillStyle = pen.color; c.fillText(text, .8, .6); c.fillText(text, -.6, .4); }
  c.globalAlpha = pen.dark ? .96 : .92; c.fillStyle = pen.color; c.fillText(text, 0, 0);
  // a little more ink, so the name still reads when the tape is small
  c.lineWidth = sz * (pen.thin ? .045 : .022); c.lineJoin = 'round'; c.strokeStyle = pen.color; c.strokeText(text, 0, 0);
  c.restore();
}

const packR = f => Math.sqrt(RMIN * RMIN + Math.max(0, Math.min(1, f)) * (RMAX * RMAX - RMIN * RMIN));

function drawInternals(c, a1, a2, p){
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d1e22'); g.addColorStop(1, '#0a0a0c');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const R1 = packR(1 - p), R2 = packR(p);
  c.strokeStyle = '#4a3322'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(HUB1.x - R1 * .72, HUB1.y + R1 * .69); c.lineTo(122, 566); c.lineTo(878, 566); c.lineTo(HUB2.x + R2 * .72, HUB2.y + R2 * .69); c.stroke();
  [122, 878].forEach(x => { c.fillStyle = '#cfc8b9'; c.beginPath(); c.arc(x, 560, 17, 0, 7); c.fill(); c.fillStyle = '#6d675c'; c.beginPath(); c.arc(x, 560, 6, 0, 7); c.fill(); });
  c.fillStyle = '#7d6a53'; c.fillRect(470, 574, 60, 18);
  [[HUB1, R1, a1], [HUB2, R2, a2]].forEach(([h, R, a]) => {
    const pg = c.createRadialGradient(h.x, h.y, RMIN * .9, h.x, h.y, R);
    pg.addColorStop(0, '#2a1c13'); pg.addColorStop(1, '#5c4029');
    c.fillStyle = pg; c.beginPath(); c.arc(h.x, h.y, R, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,220,180,.05)'; c.lineWidth = 1.5;
    for (let rr = RMIN + 10; rr < R; rr += 13){ c.beginPath(); c.arc(h.x, h.y, rr, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(255,235,210,.07)'; c.beginPath(); c.moveTo(h.x, h.y); c.arc(h.x, h.y, R, -2.5, -1.9); c.fill();
    c.save(); c.translate(h.x, h.y); c.rotate(a);
    c.fillStyle = '#ece6d8'; c.beginPath(); c.arc(0, 0, RMIN - 4, 0, 7); c.fill();
    c.strokeStyle = '#b8ae9a'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#b9b09c'; for (let i = 0; i < 3; i++){ c.rotate(Math.PI * 2 / 3); c.beginPath(); c.arc(0, -52, 7, 0, 7); c.fill(); }
    c.fillStyle = '#0e0e10'; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill();
    c.fillStyle = '#e9e3d5'; for (let i = 0; i < 6; i++){ c.rotate(Math.PI / 3); c.fillRect(-5, -35, 10, 13); }
    c.fillStyle = '#8c826e'; c.fillRect(-3, -(RMIN - 6), 6, 14);
    c.restore();
  });
}

function drawShell(c, tape, info){
  c.clearRect(0, 0, W, H);
  c.save();
  c.beginPath(); c.roundRect(0, 0, W, H, 34); c.fillStyle = tape.shell; c.fill();
  const sh = c.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,255,255,.08)'); sh.addColorStop(1, 'rgba(0,0,0,.15)');
  c.fillStyle = sh; c.fill();
  c.save(); c.beginPath(); c.roundRect(60, 50, 880, 420, 14); c.clip(); tape.label(c, info);
  if (info.strokes && tape.write){ const wr = tape.write; drawStrokes(c, info.strokes, wr.x, wr.y - wr.size * .95, wr.w, wr.size * 1.2, wr.dark ? '#e9e6e0' : '#2b2b30', wr.size * .07); }
  else if (info.pen && tape.write) penWrite(c, info.pen, info.title, tape.write, info.tilt); c.restore();
  // head area
  c.beginPath(); c.moveTo(168, 638); c.lineTo(206, 500); c.lineTo(794, 500); c.lineTo(832, 638);
  c.fillStyle = tape.clear ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.14)'; c.fill();
  c.strokeStyle = tape.clear ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'; c.lineWidth = 3; c.stroke();
  // window and openings
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
  c.beginPath(); c.roundRect(178, 172, 644, 216, 108); c.fill();
  [[232, 598, 44, 40], [724, 598, 44, 40], [462, 588, 76, 50], [352, 604, 40, 34], [608, 604, 40, 34]].forEach(r => c.fillRect(...r));
  c.globalCompositeOperation = 'source-over';
  c.beginPath(); c.roundRect(178, 172, 644, 216, 108);
  c.fillStyle = 'rgba(200,220,235,.05)'; c.fill();
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 7; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.roundRect(183, 177, 634, 206, 103); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)';
  for (let i = 0; i <= 10; i++){ const x = 400 + i * 20; c.fillRect(x - 1, 180, 2, i % 5 ? 8 : 14); }
  // screws
  [[40, 40], [960, 40], [40, 598], [960, 598], [500, 530]].forEach(([x, y]) => {
    const sg = c.createRadialGradient(x - 4, y - 4, 2, x, y, 13); sg.addColorStop(0, '#e6e6e6'); sg.addColorStop(1, '#6c6c6c');
    c.fillStyle = sg; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill();
    c.strokeStyle = '#3a3a3a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.moveTo(x, y - 7); c.lineTo(x, y + 7); c.stroke();
  });
  if (tape.worn){
    const r = rng(23);
    for (let i = 0; i < 70; i++){
      const x = r() * W, y = r() * H, len = 8 + r() * 60, a = r() * 6.3;
      c.strokeStyle = `rgba(255,255,255,${.04 + r() * .1})`; c.lineWidth = 1 + r();
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
    }
  }
  c.beginPath(); c.roundRect(1.5, 1.5, W - 3, H - 3, 33);
  c.strokeStyle = tape.clear ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.12)'; c.lineWidth = 3; c.stroke();
  c.restore();
}



function drawMechanism(c, ang){
  c.save(); c.translate(0, -90);
  let g = c.createLinearGradient(0, 640, 0, 690); g.addColorStop(0, '#e9ecef'); g.addColorStop(1, '#8b9096');
  c.fillStyle = g; c.beginPath(); c.roundRect(356, 634, 44, 46, 6); c.fill();
  g = c.createLinearGradient(0, 628, 0, 710); g.addColorStop(0, '#f4f6f8'); g.addColorStop(.5, '#b9bfc5'); g.addColorStop(1, '#7c8288');
  c.fillStyle = g; c.beginPath(); c.roundRect(454, 626, 92, 76, 10); c.fill();
  c.fillStyle = '#2a2d31'; c.fillRect(498, 628, 4, 22);
  c.fillStyle = '#5a5f65'; c.fillRect(470, 700, 60, 40);
  c.strokeStyle = '#6f757b'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(746, 668); c.lineTo(800, 700); c.stroke();
  c.save(); c.translate(746, 664); c.rotate(ang * 4);
  c.fillStyle = '#121214'; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.stroke();
  c.fillStyle = '#9aa0a6'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-2, -28, 4, 8);
  c.restore();
  c.fillStyle = '#dfe3e6'; c.beginPath(); c.arc(746, 622, 8, 0, TAU); c.fill();
  c.strokeStyle = '#c9cdd1'; c.lineWidth = 3; c.beginPath();
  for (let i = 0; i <= 12; i++){ const x = 560 + i * 12, y = 680 + (i % 2 ? -10 : 10); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  c.restore();
}
function drawSpindles(c, a1, a2){
  [[HUB1, a1], [HUB2, a2]].forEach(([h, a]) => {
    c.save(); c.translate(h.x, h.y); c.rotate(a);
    c.fillStyle = '#3b3f45'; c.beginPath(); c.arc(0, 0, 58, 0, TAU); c.fill();
    c.fillStyle = '#e6e8ea'; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
    for (let i = 0; i < 6; i++){ c.rotate(Math.PI / 3); c.fillRect(-4, -34, 8, 14); }
    c.restore();
  });
}
function drawChassis(c, cw, ch){
  const g = c.createLinearGradient(0, 0, cw, ch); g.addColorStop(0, '#34373d'); g.addColorStop(1, '#17191c');
  c.fillStyle = g; c.fillRect(0, 0, cw, ch);
  c.strokeStyle = 'rgba(255,255,255,.028)'; c.lineWidth = 1;
  for (let y = 0; y < ch; y += 3){ c.beginPath(); c.moveTo(0, y); c.lineTo(cw, y); c.stroke(); }
  const u = cw / 100;
  c.fillStyle = 'rgba(255,255,255,.18)'; c.font = `600 ${2.6 * u}px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText('INSERT TAPE, SIDE A FACING OUT', 6 * u, 8 * u);
}
function renderThumb(canvas, tape, info){
  const dpr = Math.min(2, window.devicePixelRatio || 1), w = 300;
  canvas.width = w * dpr; canvas.height = Math.round(w * H / W) * dpr;
  const c = canvas.getContext('2d'), k = canvas.width / W;
  const shell = document.createElement('canvas'); shell.width = canvas.width; shell.height = canvas.height;
  const sc = shell.getContext('2d'); sc.setTransform(k, 0, 0, k, 0, 0); drawShell(sc, tape, info || infoFor(0));
  c.setTransform(k, 0, 0, k, 0, 0); drawInternals(c, .4, 1.1, .32); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(shell, 0, 0);
}

/* ---------- a MiniDisc: a translucent caddy with the disc turning inside ---------- */
// drawn into a window of w×h; ang turns the disc; info names the label the way a tape's is named
function drawMD(c, w, h, ang, info){
  const MW = 680, MH = 720, k = Math.min(w / MW, h / MH) * .96;
  c.save(); c.translate((w - MW * k) / 2, (h - MH * k) / 2); c.scale(k, k);
  // the disc, under the caddy
  const cx = 340, cy = 400, R = 286;
  c.save(); c.beginPath(); c.roundRect(0, 0, MW, MH, 40); c.clip();
  c.fillStyle = '#121218'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
  const sheen = c.createConicGradient(ang * .35, cx, cy);
  ['rgba(255,120,200,.55)', 'rgba(120,200,255,.55)', 'rgba(180,255,160,.5)', 'rgba(255,220,120,.5)', 'rgba(255,120,200,.55)'].forEach((col, i, a) => sheen.addColorStop(i / (a.length - 1), col));
  c.fillStyle = sheen; c.globalAlpha = .55; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.arc(cx, cy, 96, 0, TAU, true); c.fill('evenodd'); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1; for (let r = 110; r < R; r += 9){ c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
  // the hub: a steel clamp plate with its centre hole and locating notches, turning with the disc
  c.fillStyle = '#c9ccd1'; c.beginPath(); c.arc(cx, cy, 92, 0, TAU); c.fill();
  const hg = c.createRadialGradient(cx - 20, cy - 24, 10, cx, cy, 92); hg.addColorStop(0, 'rgba(255,255,255,.6)'); hg.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = hg; c.beginPath(); c.arc(cx, cy, 92, 0, TAU); c.fill();
  c.fillStyle = '#17171b'; c.beginPath(); c.arc(cx, cy, 30, 0, TAU); c.fill();
  c.save(); c.translate(cx, cy); c.rotate(ang); c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 3; i++){ c.rotate(TAU / 3); c.beginPath(); c.arc(58, 0, 9, 0, TAU); c.fill(); } c.restore();
  c.restore();
  // the caddy: translucent, with a thicker frame and the shutter across the top
  c.beginPath(); c.roundRect(0, 0, MW, MH, 40); c.fillStyle = 'rgba(150,170,200,.26)'; c.fill();
  c.lineWidth = 14; c.strokeStyle = 'rgba(200,215,235,.55)'; c.beginPath(); c.roundRect(7, 7, MW - 14, MH - 14, 36); c.stroke();
  c.fillStyle = 'rgba(215,225,240,.55)'; c.fillRect(0, 150, 150, 440); c.fillRect(530, 150, 150, 440);   // the solid sides of the caddy
  const sh = c.createLinearGradient(0, 0, 0, 120); sh.addColorStop(0, '#e6e9ec'); sh.addColorStop(.45, '#b3b9c0'); sh.addColorStop(.55, '#8f969e'); sh.addColorStop(1, '#d4d8dc');
  c.fillStyle = sh; c.beginPath(); c.roundRect(0, 0, MW, 120, [40, 40, 10, 10]); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(60, 46, 560, 28);   // the shutter's slot
  c.fillStyle = '#5a6068'; c.font = `800 22px ${PRINT}`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('◀ OPEN', 24, 100);
  // the label strip, written in whatever pen the tape would have been
  c.fillStyle = '#f4f0e6'; c.beginPath(); c.roundRect(40, 572, 600, 108, 10); c.fill();
  c.fillStyle = '#b3202b'; c.beginPath(); c.arc(596, 626, 30, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.font = `800 30px ${PRINT}`; c.textAlign = 'center'; c.fillText('80', 596, 627);
  c.save(); c.beginPath(); c.rect(52, 580, 500, 92); c.clip();
  if (info && info.strokes && info.strokes.length) drawStrokes(c, info.strokes, 60, 584, 480, 84, '#2b2b30', 4);
  else if (info && info.pen) penWrite(c, info.pen, info.title || '', {x:62, y:642, w:470, size:54}, info.tilt || 0);
  else if (info && info.title) hand(c, info.title, 62, 642, 470, 54, '#1d3c8f');
  c.restore();
  // a gleam across the lid
  const gl = c.createLinearGradient(0, 0, MW, MH); gl.addColorStop(.3, 'rgba(255,255,255,0)'); gl.addColorStop(.42, 'rgba(255,255,255,.16)'); gl.addColorStop(.5, 'rgba(255,255,255,0)');
  c.fillStyle = gl; c.beginPath(); c.roundRect(0, 0, MW, MH, 40); c.fill();
  c.restore();
}

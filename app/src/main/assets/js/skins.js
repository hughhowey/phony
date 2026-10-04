// PHONY · the shells the player comes in, and the pencil trick
/* ---------- skins: hold the hidden spot on each shell to swap in the next one ---------- */
const svgBolt = (c1, c2) => `<svg viewBox="0 0 40 60" width="100%" height="100%"><path d="M24 1 L4 34 H18 L12 59 L36 22 H22 Z" fill="${c1}" stroke="${c2}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const svgStar = (c1, c2) => `<svg viewBox="0 0 50 50" width="100%" height="100%"><path d="M25 2 L31 18 L48 18 L34 29 L39 47 L25 36 L11 47 L16 29 L2 18 L19 18 Z" fill="${c1}" stroke="${c2}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
const svgHeart = (c1, c2) => `<svg viewBox="0 0 50 46" width="100%" height="100%"><path d="M25 44 C8 31 2 22 2 13 C2 6 8 2 14 2 C19 2 23 5 25 9 C27 5 31 2 36 2 C42 2 48 6 48 13 C48 22 42 31 25 44 Z" fill="${c1}" stroke="${c2}" stroke-width="3"/></svg>`;
// an AM/FM dial: the needle is live (drag it; see radio.js), the knob turns with it
const DIAL = (style = '', rows = '', knob = '') => `<div class="dial" style="${style}"><span class="row am" style="${rows}"><b>AM</b><b>52</b><b>75</b><b>100</b><b>130</b><b>171</b></span><span class="row fm" style="${rows}"><b>FM</b><b>87</b><b>92</b><b>96</b><b>102</b><b>108</b></span><i class="lamp"></i><i class="needle"></i><i class="knob" style="${knob}"></i></div>`;
const svgPaw = c => `<svg viewBox="0 0 50 50" width="100%" height="100%"><ellipse cx="25" cy="33" rx="12" ry="10" fill="${c}"/><circle cx="10" cy="22" r="5" fill="${c}"/><circle cx="20" cy="12" r="5.2" fill="${c}"/><circle cx="31" cy="12" r="5.2" fill="${c}"/><circle cx="41" cy="22" r="5" fill="${c}"/></svg>`;
const svgSmile = `<svg viewBox="0 0 50 50" width="100%" height="100%"><circle cx="25" cy="25" r="23" fill="#ffe13a" stroke="#1a1a1a" stroke-width="2.5"/><circle cx="17" cy="19" r="3.4" fill="#1a1a1a"/><circle cx="33" cy="19" r="3.4" fill="#1a1a1a"/><path d="M13 29 Q25 42 37 29" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/></svg>`;
const gear = (x, y, d, cls='') => `<div class="gear ${cls}" style="position:absolute;left:${x}cqw;top:${y}%;width:${d}cqw;height:${d}cqw"></div>`;
const GUTS = gear(4, 6, 16, 'solid') + gear(14, 10, 9, 'rev') + gear(55, 70, 18, 'solid rev') + gear(62, 83, 8) +
  `<div class="beltline" style="position:absolute;left:10cqw;top:44%;width:56cqw;height:14%"></div>` +
  `<div style="position:absolute;left:30cqw;top:88%;width:16cqw;height:5%;border-radius:1cqw;background:#6a2a00"></div>` +
  `<div style="position:absolute;left:4cqw;top:62%;width:7cqw;height:22%;border-radius:1cqw;border:.5cqw solid #6a2a00"></div>`;
const SKINS = [
  {id:'blue', odeco:`
    <div class="plate secret" style="right:4cqw;bottom:3.5cqw;transform:rotate(-2deg)">AUTO SHUT-OFF</div>`, name:'Blue', secret:'.jacks', deco:''},
  {id:'radio', name:'Silver radio recorder', secret:'.mic', deco:`
    ${DIAL()}
    <div class="grille2"></div>
    <div class="scotch" style="left:-3cqw;top:38%;width:16cqw;height:5cqw;transform:rotate(62deg)"></div>`, odeco:`
    ${DIAL('left:3cqw;right:auto;width:34cqw;top:3cqw;height:7.4cqw;font-size:1.2cqw', 'right:7cqw', 'width:4.6cqw;height:4.6cqw;margin-top:-2.3cqw')}
    <div class="scotch secret" style="right:-3cqw;bottom:6cqw;width:22cqw;height:5.6cqw;transform:rotate(-40deg)"></div>`},
  {id:'black', odeco:`
    <div class="dymo2 secret" style="left:2cqw;bottom:2cqw;transform:rotate(-3deg);font-size:2.3cqw">PROPERTY OF HUGH</div>
    <div class="stk" style="right:3cqw;top:3cqw;width:14cqw;height:5.6cqw;border-radius:.6cqw;background:#e8401e;color:#fff;font-size:2.3cqw;letter-spacing:.14em;transform:rotate(4deg)">REC · 1987</div>
    <div class="scotch" style="right:-3cqw;bottom:6cqw;width:22cqw;height:5.6cqw;transform:rotate(-40deg)"></div>`, name:'Black recorder', deco:`
    <div class="grille" style="left:2.6cqw;top:22%;width:9cqw;height:42%"></div>
    <div class="grille" style="right:2.6cqw;top:22%;width:9cqw;height:42%"></div>
    <div class="dymo2 secret" style="left:6cqw;top:1.4%;transform:rotate(-2deg)">PROPERTY OF HUGH</div>
    <div class="scotch" style="right:-2cqw;bottom:9%;width:22cqw;height:6cqw;transform:rotate(-38deg)"></div>
    <div class="stk" style="left:5cqw;bottom:1.6%;width:15cqw;height:6cqw;border-radius:.6cqw;background:#e8401e;color:#fff;font-size:2.4cqw;letter-spacing:.14em;transform:rotate(3deg)">REC · 1987</div>`},
  {id:'pink', odeco:`
    <div class="stk" style="left:2cqw;top:2cqw;width:9cqw;height:13cqw;transform:rotate(-14deg);box-shadow:none;filter:drop-shadow(0 .4cqw .4cqw rgba(0,0,0,.35))">${svgBolt('#fff36b','#1a1a1a')}</div>
    <div class="stk" style="left:3cqw;bottom:3cqw;width:10cqw;height:10cqw;border-radius:50%;box-shadow:none;filter:drop-shadow(0 .4cqw .4cqw rgba(0,0,0,.35));transform:rotate(-10deg)">${svgSmile}</div>
    <div class="band secret" style="right:-8cqw;bottom:14cqw;width:44cqw;transform:rotate(-38deg)"></div>`, name:'Pink 80s', deco:`
    <div class="stk" style="left:2cqw;top:1.5%;width:9cqw;height:13cqw;transform:rotate(-14deg);box-shadow:none;filter:drop-shadow(0 .4cqw .4cqw rgba(0,0,0,.35))">${svgBolt('#fff36b','#1a1a1a')}</div>
    <div class="stk" style="right:2.5cqw;top:1.5%;width:10cqw;height:10cqw;border-radius:50%;box-shadow:none;filter:drop-shadow(0 .4cqw .4cqw rgba(0,0,0,.35));transform:rotate(12deg)">${svgSmile}</div>
    <div class="stk" style="left:3cqw;bottom:1.5%;width:9cqw;height:9cqw;box-shadow:none;filter:drop-shadow(0 .4cqw .4cqw rgba(0,0,0,.3));transform:rotate(-8deg)">${svgStar('#27e2c0','#1a1a1a')}</div>
    <div class="tag" style="right:3cqw;bottom:1.5%;font-size:5.4cqw;color:#fff36b;transform:rotate(-8deg);text-shadow:.3cqw .3cqw 0 #5b3cff">RAD!</div>
    <div class="band secret" style="left:-6cqw;top:57%;width:92cqw;transform:rotate(-9deg)"></div>`},
  {id:'shoebox', name:'Shoebox recorder', counter:true, deco:`
    ${DIAL('left:8cqw;right:8cqw;top:2.2%;height:8.4cqw;background:linear-gradient(180deg,#f2f0ea,#d9d7cf);box-shadow:inset 0 0 0 .3cqw #8a8a86,inset 0 .4cqw .8cqw rgba(0,0,0,.2)')}
    <div class="lcdmini secret" style="right:7cqw;bottom:2.4%"><b>DUR</b><span class="skincnt">000</span></div>
    <div class="tag" style="left:6cqw;bottom:3.2%;font-size:3.6cqw;color:#2b2b30;transform:rotate(-3deg);padding:.4cqw 1.6cqw;background:rgba(232,218,184,.95);box-shadow:0 .3cqw .5cqw rgba(0,0,0,.25)">do not erase</div>
    <div class="screw" style="left:2cqw;top:1.4%"></div><div class="screw" style="right:2cqw;top:1.4%"></div>`, odeco:`
    ${DIAL('left:3cqw;right:auto;width:34cqw;top:3cqw;height:7.4cqw;font-size:1.2cqw;background:linear-gradient(180deg,#f2f0ea,#d9d7cf);box-shadow:inset 0 0 0 .3cqw #8a8a86', 'right:7cqw', 'width:4.6cqw;height:4.6cqw;margin-top:-2.3cqw')}
    <div class="lcdmini secret" style="right:4cqw;bottom:3cqw"><b>DUR</b><span class="skincnt">000</span></div>
    <div class="tag" style="left:4cqw;top:3cqw;font-size:3.2cqw;color:#2b2b30;transform:rotate(-2deg);padding:.4cqw 1.6cqw;background:rgba(232,218,184,.95);box-shadow:0 .3cqw .5cqw rgba(0,0,0,.25)">do not erase</div>`},
  {id:'orange', odeco:`
    <div class="screw" style="left:1.2cqw;top:1.2cqw"></div>
    <div class="screw" style="right:1.2cqw;top:1.2cqw"></div>
    <div class="screw" style="left:1.2cqw;bottom:1.2cqw"></div>
    <div class="screw loose secret" style="right:1.2cqw;bottom:1.2cqw"></div>
    <div class="stk" style="left:4cqw;top:6cqw;width:9cqw;height:9cqw;border-radius:50%;background:#1a1a1a;color:#ff8a1c;font-size:3.8cqw;transform:rotate(-14deg)">90</div>`, name:'Clear orange', guts:true, deco:`
    <div class="screw" style="left:5cqw;top:5%"></div>
    <div class="screw" style="right:5cqw;top:5%"></div>
    <div class="screw" style="right:5cqw;bottom:4%"></div>
    <div class="screw loose secret" style="left:5cqw;bottom:4%"></div>
    <div class="stk" style="right:6cqw;top:24%;width:9cqw;height:9cqw;border-radius:50%;background:#1a1a1a;color:#ff8a1c;font-size:3.8cqw;transform:rotate(14deg)">90</div>
    <div class="scotch" style="left:-3cqw;top:40%;width:18cqw;height:5.4cqw;transform:rotate(58deg)"></div>`},
  {id:'digital', odeco:`
    <div class="lcdkey secret" style="left:4cqw;bottom:3cqw;pointer-events:auto;color:#e8e4dc"><i></i>DISPLAY</div>
    <div class="scotch" style="right:-3cqw;top:4cqw;width:20cqw;height:5.4cqw;transform:rotate(36deg)"></div>`, name:'Silver digital', deco:`
    <div class="engrave" style="left:0;right:0;top:9%;text-align:center;color:#4a463f">DIGITAL · AUTO REVERSE · DOLBY B</div>
    <div class="lcdkeys" style="left:0;right:0;bottom:17%;justify-content:center;pointer-events:none">
      <div class="lcdkey secret" style="pointer-events:auto"><i></i>DISPLAY</div>
      <div class="lcdkey"><i></i>MODE</div>
      <div class="lcdkey"><i></i>EQ</div>
    </div>
    <div class="scotch" style="right:-3cqw;top:2%;width:20cqw;height:5.4cqw;transform:rotate(34deg)"></div>
    <div class="crack" style="left:6cqw;bottom:7%;width:14cqw;transform:rotate(-6deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.7) 10%,rgba(255,255,255,.7) 90%,transparent)"></div>`},
  {id:'sport', name:'All-weather', deco:`
    <div class="latch" style="left:10cqw;right:10cqw;top:2%"></div>
    <div class="oprled secret" style="right:5cqw;top:9%"><i></i>OPR · BATT</div>
    <div class="tag" style="left:5cqw;top:8.6%;font-family:var(--f-print);font-weight:800;font-style:italic;font-size:4.2cqw;letter-spacing:.06em;color:#141414">ALL-WEATHER</div>
    <div class="strap" style="left:4cqw;bottom:2%;transform:rotate(-20deg)"></div>
    ${DIAL('left:16cqw;right:6cqw;bottom:1.8%;top:auto;height:8cqw;background:linear-gradient(180deg,#2a2a2a,#161616);color:#f2b61c;box-shadow:inset 0 0 0 .3cqw #000,inset 0 .4cqw .8cqw rgba(0,0,0,.6)')}
    <div class="scuff" style="right:2cqw;top:12%;width:12cqw;height:18cqw;opacity:.6"></div>`, odeco:`
    <div class="latch" style="left:6cqw;right:6cqw;top:2.6cqw"></div>
    ${DIAL('left:3cqw;right:auto;width:34cqw;bottom:3cqw;top:auto;height:7.4cqw;font-size:1.2cqw;background:linear-gradient(180deg,#2a2a2a,#161616);color:#f2b61c;box-shadow:inset 0 0 0 .3cqw #000', 'right:7cqw', 'width:4.6cqw;height:4.6cqw;margin-top:-2.3cqw')}
    <div class="oprled secret" style="right:5cqw;bottom:3.4cqw"><i></i>OPR · BATT</div>
    <div class="strap" style="left:4cqw;bottom:3cqw;transform:rotate(-16deg)"></div>`},
  {id:'yellow', odeco:`
    <div class="tag" style="left:3cqw;top:2cqw;font-size:5.4cqw;color:#e7c21b;transform:rotate(-8deg);text-shadow:.3cqw .3cqw 0 #000">SPIN IT</div>
    <div class="stk secret" style="right:3cqw;bottom:4cqw;width:12cqw;height:12cqw;border-radius:50%;background:radial-gradient(circle at 50% 50%,#2c9a4a 0 55%,#1f7a37 56%);color:#f2f2f2;font-size:2.4cqw;letter-spacing:.06em;transform:rotate(-12deg);overflow:hidden">
      <span style="text-align:center;line-height:1">FRESH<br>CUTS</span>
      <i style="position:absolute;right:-.2cqw;top:-.2cqw;width:5cqw;height:5cqw;background:linear-gradient(225deg,#e7c21b 50%,#d7e8d9 50%,#9fb7a2);box-shadow:-.4cqw .4cqw .6cqw rgba(0,0,0,.35);border-bottom-left-radius:2cqw"></i>
    </div>
    <div class="duct" style="left:-3cqw;bottom:22cqw;width:24cqw;height:6.4cqw;transform:rotate(-6deg)"></div>`, name:'Beat-up yellow', deco:`
    <div class="tag" style="left:4cqw;top:.6%;font-size:6cqw;color:#141414;transform:rotate(-5deg)">SPIN IT</div>
    <div class="tag" style="right:3cqw;top:26%;font-size:3.6cqw;color:#c0231a;transform:rotate(84deg);transform-origin:right top">PROPERTY</div>
    <div class="stk secret" style="left:1.2cqw;bottom:18%;width:12cqw;height:12cqw;border-radius:50%;background:radial-gradient(circle at 50% 50%,#2c9a4a 0 55%,#1f7a37 56%);color:#f2f2f2;font-size:2.6cqw;letter-spacing:.06em;transform:rotate(-12deg);overflow:hidden">
      <span style="text-align:center;line-height:1">FRESH<br>CUTS</span>
      <i style="position:absolute;right:-.2cqw;top:-.2cqw;width:6cqw;height:6cqw;background:linear-gradient(225deg,#e7c21b 50%,#d7e8d9 50%,#9fb7a2);box-shadow:-.4cqw .4cqw .6cqw rgba(0,0,0,.35);border-bottom-left-radius:2cqw"></i>
    </div>
    <div class="stk" style="left:22cqw;bottom:1.4%;width:15cqw;height:6cqw;border-radius:.6cqw;background:#f2eee4;color:#d2231a;font-size:3cqw;transform:rotate(6deg);clip-path:polygon(0 0,100% 4%,97% 100%,4% 94%)">NO DISCO</div>
    <div class="duct" style="left:-3cqw;top:43%;width:30cqw;height:7cqw;transform:rotate(-4deg)"></div>
    <div class="crack" style="left:20cqw;top:47%;width:20cqw;transform:rotate(9deg)"></div>
    <div class="band" style="left:60cqw;top:-2%;width:3cqw;height:104%;border-radius:1.4cqw;background:linear-gradient(90deg,#1a4fb0,#0c2f75)"></div>`},
  {id:'blush', odeco:`
    <div class="stk secret" style="left:3cqw;bottom:4cqw;width:12cqw;height:11cqw;box-shadow:none;filter:drop-shadow(0 .4cqw .5cqw rgba(0,0,0,.3));transform:rotate(-10deg)">${svgHeart('#ff4f8b','#fff')}</div>
    <div class="stk" style="right:4cqw;top:3cqw;width:7cqw;height:7cqw;box-shadow:none;filter:drop-shadow(0 .3cqw .4cqw rgba(0,0,0,.25));transform:rotate(16deg)">${svgStar('#fff','#e0a1b8')}</div>
    <div class="tag" style="right:4cqw;bottom:4cqw;font-size:4.6cqw;color:#fff;transform:rotate(-6deg);text-shadow:0 .2cqw .3cqw rgba(160,60,100,.5)">xoxo</div>`, name:'Clear blush', guts:true, deco:`
    <div class="stk secret" style="left:2cqw;top:60%;width:12cqw;height:11cqw;box-shadow:none;filter:drop-shadow(0 .4cqw .5cqw rgba(0,0,0,.3));transform:rotate(-10deg)">${svgHeart('#ff4f8b','#fff')}</div>
    <div class="stk" style="right:4cqw;top:1.2%;width:7cqw;height:7cqw;box-shadow:none;filter:drop-shadow(0 .3cqw .4cqw rgba(0,0,0,.25));transform:rotate(16deg)">${svgStar('#fff','#e0a1b8')}</div>
    <div class="tag" style="left:4cqw;top:1%;font-size:4.6cqw;color:#fff;transform:rotate(-6deg);text-shadow:0 .2cqw .3cqw rgba(160,60,100,.5)">xoxo</div>
    <div class="scotch" style="right:-2cqw;bottom:8%;width:20cqw;height:5.4cqw;transform:rotate(-30deg)"></div>`},
  {id:'toy', name:'Kid\'s player', deco:`
    <div class="paw secret" style="left:4cqw;top:3%;transform:rotate(-18deg)">${svgPaw('#7b3fb8')}</div>
    <div class="paw" style="right:5cqw;top:8%;width:6cqw;height:6cqw;transform:rotate(22deg)">${svgPaw('#7b3fb8')}</div>
    <div class="paw" style="left:8cqw;bottom:4%;width:6.5cqw;height:6.5cqw;transform:rotate(10deg)">${svgPaw('#e84a7f')}</div>
    <div class="stk" style="right:4cqw;bottom:3%;width:10cqw;height:10cqw;border-radius:50%;background:#5cc24a;color:#fff;font-size:5cqw;box-shadow:0 .5cqw 0 #2f7f34,0 .8cqw 1cqw rgba(0,0,0,.25)">♪</div>`, odeco:`
    <div class="paw secret" style="left:3cqw;bottom:3cqw;width:10cqw;height:10cqw;transform:rotate(-14deg)">${svgPaw('#7b3fb8')}</div>
    <div class="paw" style="right:4cqw;top:3cqw;width:7cqw;height:7cqw;transform:rotate(18deg)">${svgPaw('#e84a7f')}</div>`},
  {id:'smoke', name:'Smoky clear', guts:true, deco:`
    <div class="mesh" style="left:6cqw;right:6cqw;top:2.6%;height:5.2cqw"></div>
    <div class="plate secret" style="left:50%;bottom:3.4%;transform:translateX(-50%);white-space:nowrap">STEREO CASSETTE PLAYER</div>
    <div class="screw" style="left:2cqw;bottom:2%;width:3cqw;height:3cqw"></div><div class="screw" style="right:2cqw;bottom:2%;width:3cqw;height:3cqw"></div>`, odeco:`
    <div class="mesh" style="left:3cqw;right:3cqw;top:3cqw;height:5cqw"></div>
    <div class="plate secret" style="right:4cqw;bottom:3.5cqw;transform:rotate(-2deg);white-space:nowrap">STEREO CASSETTE PLAYER</div>`},
  {id:'hifi', name:'Clear-front hi-fi', deco:`
    <div class="chromerow" style="left:50%;top:1.8%;transform:translateX(-50%)"><i class="chrome"></i><i class="chrome"></i><i class="chrome"></i><i class="chrome secret"></i></div>
    <div class="engrave" style="left:0;right:0;bottom:2.2%;text-align:center;color:#4a4f56">DIRECT DRIVE · METAL TAPE · NR</div>`, odeco:`
    <div class="chromerow" style="left:4cqw;top:3cqw"><i class="chrome"></i><i class="chrome"></i><i class="chrome secret"></i></div>
    <div class="engrave" style="right:4cqw;bottom:3.4cqw;color:#4a4f56">DIRECT DRIVE</div>`},
  {id:'stripe', name:'Silver stripe', deco:`
    <div class="redline" style="left:0;right:0;top:3.6%"></div><div class="redline" style="left:0;right:0;top:3.6%;margin-top:2cqw;height:.5cqw;opacity:.8"></div>
    <div class="badge secret" style="right:5cqw;bottom:2.4%;transform:rotate(-2deg)">HI·FI</div>
    <div class="scotch" style="left:-3cqw;bottom:14%;width:18cqw;height:5cqw;transform:rotate(-58deg)"></div>`, odeco:`
    <div class="redline" style="left:0;right:0;top:4cqw"></div><div class="redline" style="left:0;right:0;top:4cqw;margin-top:2cqw;height:.5cqw;opacity:.8"></div>
    <div class="badge secret" style="right:4cqw;bottom:3.4cqw;transform:rotate(-2deg)">HI·FI</div>`},
];
const PREVIEW_SKINS = [
  {id:'md', name:'MiniDisc', media:'md', lcd:true, secret:'.mic', model:'PORTABLE MD RECORDER', deco:`
    <div class="mdlcd"><span class="mdtrk">TRK 01</span><span class="mdtitle"><i class="mdtext"></i></span><span class="mdtime">00:00</span><span class="bat"></span></div>
    <div class="jog"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="engrave" style="left:0;right:0;top:2.2%;text-align:center;color:#4a463f">MINIDISC RECORDER · ATRAC · 80</div>`, odeco:`
    <div class="mdlcd" style="left:4cqw;right:auto;width:46cqw;bottom:3cqw;height:8cqw"><span class="mdtrk">TRK 01</span><span class="mdtitle"><i class="mdtext"></i></span><span class="mdtime">00:00</span></div>
    <div class="scotch secret" style="right:-3cqw;top:4cqw;width:20cqw;height:5.4cqw;transform:rotate(36deg)"></div>`},
];
if (new URLSearchParams(location.search).get('skin') === 'md') SKINS.push(PREVIEW_SKINS[0]);
let skinI = (() => { const q = new URLSearchParams(location.search).get('skin'); const f = SKINS.findIndex(k => k.id === q); return f >= 0 ? f : Math.max(0, SKINS.findIndex(k => k.id === store.get('skin', 'blue'))); })();
const cover = $('#cover'), face = $('#cover .face'), deco = $('#cover .deco'), odeco = $('#inner .deckfull .deco');
$('#cover .guts').innerHTML = GUTS;
$('#cover .lcd .eq').innerHTML = '<i></i>'.repeat(16);
let holdSkin = 0;
function applySkin(){
  const k = SKINS[skinI];
  cover.dataset.skin = k.id; $('#inner').dataset.skin = k.id;
  const named = h => (h || '').replaceAll('PROPERTY OF HUGH', ownerTag());
  $('#cover .model').textContent = k.model || 'STEREO CASSETTE PLAYER';
  const html = d => named(typeof d === 'function' ? d() : d);
  deco.innerHTML = html(k.deco); odeco.innerHTML = html(k.odeco);
  // the hidden spot: one on the closed player, one on the open one
  $$('.secret-on').forEach(e => e.classList.remove('secret-on'));
  [k.secret ? $('#cover ' + k.secret) : deco.querySelector('.secret'), odeco.querySelector('.secret')].forEach(spot => {
    if (spot){ spot.classList.add('secret-on'); armSecret(spot); }
  });
  if (typeof syncDial === 'function') syncDial();
  requestAnimationFrame(() => wins.forEach(sizeWin));
}
function armSecret(el){
  if (el._armed) return; el._armed = true;
  const start = e => { if (!el.classList.contains('secret-on')) return; e.stopPropagation(); ensureAudio(); clearTimeout(holdSkin); sfx('tick'); holdSkin = setTimeout(nextSkin, 900); };
  const stop = () => clearTimeout(holdSkin);
  el.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, stop));
  el.addEventListener('contextmenu', e => e.preventDefault());
}
function nextSkin(){
  sfx('eject'); try { N && N.haptic(2); } catch (e) {}
  const wm = S.mode === 'open' ? $('#inner .deckfull') : $('#cover .walkman'); wm.classList.remove('swapping'); void wm.offsetWidth; wm.classList.add('swapping');
  setTimeout(() => { skinI = (skinI + 1) % SKINS.length; store.set('skin', SKINS[skinI].id); applySkin(); sfx('insert'); }, 240);
  setTimeout(() => wm.classList.remove('swapping'), 520);
}
applySkin();
// the digital display follows the tape
let lcdT = 0, lcdKey = '';
function updateLcd(now){
  if (now - lcdT < 110) return; lcdT = now;
  const v = Math.floor(((((S.a2 - S.cOff) / TAU * .55) % 1000) + 1000) % 1000);
  if (SKINS[skinI].counter){ const t = String(v).padStart(3, '0'); $$('.skincnt').forEach(e => { if (e.textContent !== t) e.textContent = t; }); }
  if (SKINS[skinI].lcd){
    const tr = S.tracks[S.idx] || {}, key = (tr.title || '') + (tr.artist || '');
    if (key !== lcdKey){ lcdKey = key; $$('.mdtext').forEach(e => { e.textContent = [tr.title, tr.artist].filter(Boolean).join('  ·  ') || 'NO DISC'; }); }
    const trk = 'TRK ' + String(S.idx + 1).padStart(2, '0'), tm = fmt(Math.max(0, S.t)).padStart(5, '0');
    $$('.mdtrk').forEach(e => { if (e.textContent !== trk) e.textContent = trk; }); $$('.mdtime').forEach(e => { if (e.textContent !== tm) e.textContent = tm; });
  }
  if (SKINS[skinI].id !== 'digital') return;
  const tr = S.tracks[S.idx] || {}, key = (tr.title || '') + (tr.artist || '');
  if (key !== lcdKey){ lcdKey = key; $('#cover .lcdtitle').textContent = [tr.title, tr.artist].filter(Boolean).join('  ·  ') || 'NO TAPE'; }
  $('#cover .lcdcnt').textContent = String(v).padStart(3, '0');
  const on = S.motor > .5;
  $$('#cover .lcd .eq i').forEach((b, i) => { const base = on ? .25 + .6 * Math.abs(Math.sin(now / (260 + i * 37) + i * 1.7)) * (1 - i / 26) + Math.random() * .15 : .08; b.style.height = Math.min(100, base * 100) + '%'; });
}
/* ---------- the pencil trick: open view only (the bay is hidden in the pocket); stick it in a reel and wind ---------- */
// the top reel is the take-up reel: winding it pulls the tape forward. The bottom one winds it back.
/* ---------- the pencils: six in the jar, one picked at random each time ---------- */
// drawn as a six-sided pencil seen from the side, so it can turn: faces roll past and the lettering goes with them
const PENCILS = [
  {id:'classic', len:1.5, faces:['#f4bf18'], text:'No. 2 · HB · SOFT · MADE IN U.S.A.', ink:'#2a2210', ferrule:'silver', eraser:'#f07487', erLen:.62},
  {id:'chewed', len:.74, faces:['#f1bb1a'], text:'No. 2 · HB', ink:'#2a2210', ferrule:'gold', eraser:'#d99aa0', erLen:.22, bites:[.62, .7, .77], chips:true},
  {id:'stripes', len:1.48, faces:['#191919', '#c3262a'], text:'HB · 2 · DRAWING · GERMANY', ink:'#f2f2f2', textFace:1, cap:'#191919', capLen:.5},
  {id:'carpenter', len:1.42, faces:['#e3c08f', '#d9b27c'], grain:true, text:'CARPENTER · FIRM · No. 3', ink:'#4a3018', end:'cut'},
  {id:'drafting', len:1.5, faces:['#1d6a48'], text:'DRAFTING  2B  ·  HI-DENSITY', ink:'#d8b257', cap:'#f3f1e8', capLen:.42},
  {id:'souvenir', len:.6, faces:['#2a63ba'], text:"ST. GEORGE'S · GRENADA W.I. ✶", ink:'#ffffff', ferrule:'silver', eraser:'#ef8597', erLen:.3, bites:[.56, .66]},
];
const shade = (hex, k) => { const v = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return `rgb(${f(v >> 16)},${f((v >> 8) & 255)},${f(v & 255)})`; };
// x runs from the tip (0) to the end (L); T is the thickness; phi turns it; clip hides what's inside the reel
function drawPencil(c, P, L, T, phi, clip){
  const R = T / 2, cy = T * .6, gLen = T * .55, coneEnd = T * 2.3, r = rng(P.id.length * 41);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.save();
  // in the reel: you see the pencil on your side of the hub's centre, and past it only what's inside the round hole
  if (clip){ c.beginPath(); c.rect(clip.x, -T, c.canvas.width, T * 4); c.arc(clip.x, cy, clip.r, 0, TAU); c.clip(); }
  // the ferrule and eraser (or a dipped cap, or a cut end) take up the back
  const erW = P.eraser ? T * P.erLen * 1.6 : 0, feW = P.ferrule ? T * .62 : 0, bodyEnd = L - erW - feW;
  const capStart = P.cap ? bodyEnd - T * P.capLen * 1.6 : bodyEnd;
  // the six faces
  for (let k = 0; k < 6; k++){
    const a0 = phi + k * Math.PI / 3 - Math.PI / 6, a1 = a0 + Math.PI / 3, mid = a0 + Math.PI / 6, nz = Math.cos(mid);
    if (nz <= 0) continue;
    const y0 = cy - R * Math.sin(a0), y1 = cy - R * Math.sin(a1), top = Math.min(y0, y1), h = Math.abs(y0 - y1);
    const light = Math.max(.45, Math.min(1.25, .62 + .32 * nz + .3 * Math.sin(mid)));
    const base = P.faces[k % P.faces.length];
    c.fillStyle = shade(base, light); c.fillRect(coneEnd - 1, top, capStart - coneEnd + 1, h + .6);
    if (P.cap){ c.fillStyle = shade(P.cap, light); c.fillRect(capStart, top, bodyEnd - capStart, h + .6); }
    if (P.grain){ c.strokeStyle = 'rgba(120,80,40,.18)'; c.lineWidth = 1; for (let g = 0; g < 3; g++){ const gy = top + h * (.2 + .3 * g + (r() - .5) * .1); c.beginPath(); c.moveTo(coneEnd, gy); for (let x = coneEnd; x < bodyEnd; x += T * 2) c.lineTo(x, gy + Math.sin(x / T + k + g) * h * .06); c.stroke(); } }
    // the lettering, on its face, squashed as the face turns away
    if (P.text && k === (P.textFace || 0) && nz > .18){
      c.save(); c.beginPath(); c.rect(coneEnd, top, bodyEnd - coneEnd, h); c.clip();
      c.translate(coneEnd + T * 3.2, (y0 + y1) / 2); c.scale(1, nz);
      c.fillStyle = P.ink; c.globalAlpha = .82; c.font = `600 ${R * .62}px ${PRINT}`; c.textBaseline = 'middle';
      c.fillText(P.text.split('').join(' '), 0, 0); c.restore();
    }
    // tooth marks: creases pressed across the faces (top teeth one side, bottom the other), paint chipped to the wood
    (P.bites || []).forEach((bx, bi) => {
      const rb = rng(Math.round(bx * 1000) + k * 13);
      if ((k + bi) % 3 === 2) return;
      const x = L * bx + (rb() - .5) * T * .3, yA = Math.min(y0, y1), yB = Math.max(y0, y1);
      c.save(); c.beginPath(); c.rect(coneEnd, yA, bodyEnd - coneEnd, yB - yA); c.clip();
      for (let t = 0; t < 2; t++){
        const xx = x + t * T * (.22 + rb() * .1), bow = T * (.06 + rb() * .06) * (rb() < .5 ? -1 : 1);
        c.strokeStyle = 'rgba(70,42,6,' + (.45 + .3 * nz).toFixed(2) + ')'; c.lineWidth = T * .055; c.lineCap = 'round';
        c.beginPath(); c.moveTo(xx - T * .05, yA - 1); c.quadraticCurveTo(xx + bow, (yA + yB) / 2, xx + T * .04, yB + 1); c.stroke();
        c.strokeStyle = 'rgba(255,250,220,.35)'; c.lineWidth = T * .025;
        c.beginPath(); c.moveTo(xx - T * .01, yA - 1); c.quadraticCurveTo(xx + bow + T * .04, (yA + yB) / 2, xx + T * .08, yB + 1); c.stroke();
      }
      if (P.chips && rb() < .7){
        c.fillStyle = '#d9b07a'; c.beginPath();
        const cx0 = x + T * (.05 + rb() * .2), cy0 = yA + (yB - yA) * (.25 + rb() * .5), n = 6;
        for (let q = 0; q < n; q++){ const a = q / n * TAU, rr = T * (.05 + rb() * .07); const px = cx0 + Math.cos(a) * rr * 1.6, py = cy0 + Math.sin(a) * rr * nz; q ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.fill();
      }
      c.restore();
    });
    // the edge catches the light
    c.fillStyle = 'rgba(255,255,255,' + (.18 * nz).toFixed(3) + ')'; c.fillRect(coneEnd, Math.min(y0, y1), bodyEnd - coneEnd, 1.2);
  }
  if (P.bites){ c.save(); c.globalCompositeOperation = 'destination-out';
    P.bites.forEach((bx, bi) => { const rb = rng(Math.round(bx * 997)); [cy - R - 1, cy + R + 1].forEach((ey, side) => { const x = L * bx + (rb() - .5) * T * .3 + side * T * .12, d = T * (.05 + rb() * .05);
      c.beginPath(); c.moveTo(x - T * .09, ey); c.lineTo(x, ey + (side ? -d : d)); c.lineTo(x + T * .09, ey); c.fill(); }); });
    c.restore(); }
  // the sharpened end: bare wood, scalloped where the paint stops, then the lead
  const wood = c.createLinearGradient(0, cy - R, 0, cy + R); wood.addColorStop(0, '#f2d5a6'); wood.addColorStop(.55, '#e2b67c'); wood.addColorStop(1, '#bf8d55');
  c.fillStyle = wood; c.beginPath(); c.moveTo(gLen, cy - T * .11); c.lineTo(coneEnd, cy - R * .99); c.lineTo(coneEnd, cy + R * .99); c.lineTo(gLen, cy + T * .11); c.fill();
  for (let k = 0; k < 6; k++){
    const a0 = phi + k * Math.PI / 3 - Math.PI / 6, a1 = a0 + Math.PI / 3, mid = a0 + Math.PI / 6, nz = Math.cos(mid);
    if (nz <= 0) continue;
    const y0 = cy - R * Math.sin(a0), y1 = cy - R * Math.sin(a1);
    c.fillStyle = wood; c.beginPath(); c.moveTo(coneEnd - 1, y0); c.quadraticCurveTo(coneEnd + T * .2 * nz, (y0 + y1) / 2, coneEnd - 1, y1); c.fill();
  }
  const lead = c.createLinearGradient(0, cy - T * .12, 0, cy + T * .12); lead.addColorStop(0, '#77777e'); lead.addColorStop(1, '#2c2c31');
  c.fillStyle = lead; c.beginPath(); c.moveTo(0, cy); c.lineTo(gLen, cy - T * .11); c.lineTo(gLen, cy + T * .11); c.fill();
  // the back end
  if (P.ferrule){
    const g = c.createLinearGradient(0, cy - R, 0, cy + R), gold = P.ferrule === 'gold';
    g.addColorStop(0, gold ? '#fff1b8' : '#fbfbfb'); g.addColorStop(.45, gold ? '#c9a44a' : '#b4bac0'); g.addColorStop(.55, gold ? '#9c7a2a' : '#8b9298'); g.addColorStop(1, gold ? '#e8cc7a' : '#d6dade');
    c.fillStyle = g; c.fillRect(bodyEnd, cy - R * 1.02, feW, T * 1.02);
    c.strokeStyle = gold ? 'rgba(110,80,20,.55)' : 'rgba(90,96,102,.6)'; c.lineWidth = 1.2;
    [.12, .22, .74, .84].forEach(f => { c.beginPath(); c.moveTo(bodyEnd + feW * f, cy - R); c.lineTo(bodyEnd + feW * f, cy + R); c.stroke(); });
  }
  if (P.eraser){
    const g = c.createLinearGradient(0, cy - R, 0, cy + R); g.addColorStop(0, shade(P.eraser, 1.15)); g.addColorStop(.5, P.eraser); g.addColorStop(1, shade(P.eraser, .78));
    c.fillStyle = g; c.beginPath(); c.roundRect(bodyEnd + feW - 1, cy - R * .96, erW + 1, T * .96, [0, T * .28, T * .28, 0]); c.fill();
  } else if (P.cap){
    const g = c.createLinearGradient(0, cy - R, 0, cy + R); g.addColorStop(0, shade(P.cap, 1.12)); g.addColorStop(1, shade(P.cap, .8));
    c.fillStyle = g; c.beginPath(); c.ellipse(bodyEnd, cy, T * .18, R * .97, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  } else if (P.end === 'cut'){
    c.fillStyle = '#c99a62'; c.fillRect(bodyEnd - 2, cy - R, 3, T);
  }
  // where it goes into the reel, the hub's shadow falls on it
  // down in the hole it's dark, darker the deeper it goes; the rim throws a soft shadow across it
  if (clip){
    c.save(); c.beginPath(); c.arc(clip.x, cy, clip.r, 0, TAU); c.clip();
    const s = c.createLinearGradient(clip.x + clip.r, 0, clip.x - clip.r, 0);
    s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(.35, 'rgba(0,0,0,.35)'); s.addColorStop(1, 'rgba(0,0,0,.8)');
    c.fillStyle = s; c.fillRect(clip.x - clip.r, 0, clip.r * 2, cy * 2); c.restore();
  }
  c.restore();
}

const pencil = $('#pencil'), pwob = $('#pencil .pwob'), pcv = $('#pencil canvas');
let pen = null;
// the pencil you're using today; tomorrow you'll have grabbed a different one
function todaysPencil(){
  const d = new Date(), today = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const got = store.get('pencil', null);
  if (got && got.day === today && PENCILS[got.i]) return got.i;
  let i; do { i = Math.floor(Math.random() * PENCILS.length); } while (got && i === got.i && PENCILS.length > 1);
  store.set('pencil', {day:today, i}); return i;
}
// the pencil in hand: size and draw it (clip: how much of it has gone into the reel)
function penCanvas(cv, P, halfW, thick){
  const T = thick, L = P.len * halfW, d = Math.min(3, devicePixelRatio || 1);
  cv.width = Math.round((L + 4) * d); cv.height = Math.round(T * 1.2 * d);
  cv.style.width = (L + 4) + 'px'; cv.style.height = (T * 1.2) + 'px'; cv.style.marginTop = (-T * .6) + 'px';
  return {T, L, d};
}
function redrawPen(){
  if (!pen) return; const g = pen.geo, c = pcv.getContext('2d'); c.setTransform(g.d, 0, 0, g.d, 0, 0);
  drawPencil(c, pen.P, g.L, g.T, pen.phi, null);
}
function reelSpots(){
  const o = wins.find(w => w.mode === 'deck'); if (!o || !o.canvas.width) return null;
  const r = o.canvas.getBoundingClientRect(), host = $('#inner .deckfull').getBoundingClientRect();
  const k = r.width / o.canvas.width, sc = o.scale * k, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const at = h => ({x:cx + sc * (h.y - H / 2) - host.left, y:cy - sc * (h.x - W / 2) - host.top});
  return {ff:at(HUB2), rew:at(HUB1), r:RMAX * sc, hole:34 * sc, host};
}
function aimPencil(p, t){
  const host = $('#inner .deckfull');
  // from the hub toward the top-right corner, a little past it
  const cx = host.clientWidth * 1.05, cy = -host.clientHeight * .12, ang = Math.atan2(cy - p.y, cx - p.x);
  pencil.style.left = p.x + 'px'; pencil.style.top = p.y + 'px';
  const wob = t == null ? 0 : Math.sin(t * 9) * .035, slide = t == null ? 70 : 0;
  pwob.style.transform = `rotate(${ang + wob}rad) translateX(${slide}cqw)`;
}
function penDown(e){
  if (!S.open || S.ejected || foldOpen || pen) return;
  const sp = reelSpots(); if (!sp) return;
  const x = e.clientX - sp.host.left, y = e.clientY - sp.host.top;
  const which = Math.hypot(x - sp.ff.x, y - sp.ff.y) < sp.r ? 'ff' : Math.hypot(x - sp.rew.x, y - sp.rew.y) < sp.r ? 'rew' : null;
  if (!which) return;
  e.preventDefault(); ensureAudio();
  const pi = todaysPencil();
  const halfW = $('#inner .deckfull').parentElement.clientWidth;
  pen = {which, id:e.pointerId, t0:performance.now(), P:PENCILS[pi], phi:Math.random() * TAU, inserted:false, holeR:sp.hole, last:performance.now()};
  // it goes in past the sharpened end, so the six sides of the body grip the teeth of the reel
  pen.geo = penCanvas(pcv, pen.P, halfW, halfW * .066); pen.geo.anchor = pen.geo.T * .3;
  pcv.style.marginLeft = (-pen.geo.anchor) + 'px'; pcv.dataset.p = pen.P.id;
  redrawPen();
  setTimeout(() => { if (pen && pen.which === which){ pen.inserted = true; redrawPen(); } }, 230);
  // it arrives from off-screen, then goes into the hub
  pencil.style.transition = 'none'; pwob.style.transition = 'none'; aimPencil(sp[which]); void pencil.offsetWidth;
  pencil.style.transition = ''; pwob.style.transition = ''; pencil.classList.add('on');
  requestAnimationFrame(() => aimPencil(sp[which], 0));
  sfx('tick'); try { N && N.haptic(1); } catch (err) {}
  setTimeout(() => { if (pen && pen.which === which){ if (S.sideEnd || S.flipped){ if (which === 'ff') return; unEnd(); } S.cue = which === 'ff' ? 1 : -1; S.cueK = 5; pwob.style.transition = 'none'; spin(); } }, 200);
}
// while it winds, the pencil turns (slower than the reel) and the hand wobbles a little
function spin(){
  if (!pen) return; const now = performance.now(), dt = Math.min(.05, (now - pen.last) / 1000); pen.last = now;
  pen.phi += (pen.which === 'ff' ? 1 : -1) * 3.4 * dt; redrawPen();
  const sp = reelSpots(); if (sp) aimPencil(sp[pen.which], (now - pen.t0) / 1000); pen.raf = requestAnimationFrame(spin);
}
function penUp(e){
  if (!pen || (e && e.pointerId !== pen.id)) return;
  cancelAnimationFrame(pen.raf); pen.inserted = false; redrawPen(); const sp = reelSpots(), which = pen.which; pen = null;
  if (S.cue){ S.cue = 0; S.cueK = 9; sfx('tick'); if (isRemote()) N.remoteCmd('seek', String(Math.round(S.t * 1000))); }
  pwob.style.transition = ''; if (sp) aimPencil(sp[which]);
  setTimeout(() => { if (!pen) pencil.classList.remove('on'); }, 200);
}
$('#inner .deck').addEventListener('pointerdown', penDown);
addEventListener('pointerup', penUp); addEventListener('pointercancel', penUp);
$('#inner .deck').style.touchAction = 'none';


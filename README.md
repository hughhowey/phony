# PHONY

A portable cassette player for the Galaxy Z Fold 8, and for a tall phone like the Galaxy S26 Ultra.

- **Closed** (cover screen): the front of the player. Reels turn in the window, the keys on the silver side panel click, the tape pack moves from reel to reel as the side plays. The J-card is under the player: swipe up on the window and the player lifts to show it (the keys still work); tap the card and it slides up over the player, drag it down by its spine and it slips back. At the far end of the unfolded J-card there's one more stop with nothing on it but the player, dimmed; tap it and everything folds up.
- **Open** (inner screen): the J-card with the tracklist, tape counter and tape shelf on the left, the cassette filling the bay on the right.
- **In the pocket** (a tall, narrow phone): the closed player sits across the top at its true proportions, never stretched, and the J-card is tucked in a pocket beneath it with its spine and the song banner showing. Tap or drag the card and it slides up over the player: the song list, the counter and a row of keys. Drag it down by its spine or the banner and it slips back. Everything else works as when closed: press ■ with the tape stopped and the card drops away, the player slides up and the tape box is underneath; tap the song title on the raised card to unfold the J-card. The page picks the pocket by the screen's shape, so it's the same app on both phones; the black shell's name tag reads PROPERTY OF SHAY on the pocket phone until PHONY asks for a name on install.

## Getting it on your phone

PHONY is free and open source, and it isn't in an app store. The newest build is always at

https://github.com/hughhowey/phony/releases/download/latest/phony.apk

Download it on the phone and open it to install (Android asks once to allow installs from your browser). Open PHONY, and the first time it asks whose player it is: that name goes on the black shell's tag.

**The music.** Tap the title on the J-card (open the phone, or pull the card up on a tall phone) to choose. "Whatever is playing now" needs notification access, which PHONY opens the settings for; after that it follows Spotify, YouTube Music, podcasts, anything. Songs saved on the phone need no setup at all.

**The tape box, the drawer and the mixtapes** come from Spotify, and they need a Spotify app of your own, because Spotify only serves a few accounts per app. It's five minutes:

1. Go to developer.spotify.com/dashboard (Spotify Premium is required) and create an app. Call it anything.
2. Redirect URI: `phony://callback`. APIs used: Web API and Android.
3. Save, then open the app's Settings → User Management and add the Spotify account(s) that will use it (yours included if you log in to the dashboard with a different account).
4. Copy the Client ID. In PHONY, press ■ with the tape stopped to open the box, tap the note in it, and paste the ID. Then tap the note again to sign in, once, in the browser.

Spotify lets a development-mode app serve five accounts, and signs you out after six months; when that happens the note in the box says so and a tap signs you back in.

## Shells

PHONY has fourteen shells, in this order: blue, a silver radio recorder with an AM/FM dial, black recorder, pink 80s, a shoebox desk recorder with piano keys and a DUR counter, clear orange, silver digital, an all-weather yellow one with a latch and a strap, beat-up yellow, clear blush, a kid's player in yellow and green, a smoky clear one with the works showing, a clear-front hi-fi with chrome buttons, and silver with a red stripe. The three with a dial are spread through the order so a radio is never far. There's no menu. Each shell hides a spot (a label, a sticker, a rubber band, a loose screw, a button, a knob, a badge); press and hold it for about a second and the next shell snaps on. A quick tap does nothing. The shell you land on stays.

## Music

Tap the title at the top of the J-card (open view) to choose:

- **Whatever is playing now** – Spotify, YouTube Music, podcasts. PHONY becomes the remote and shows the song, the queue and the cover. Two songs in a row from the same album swap in the worn album tape.
- **All songs** or **an album** saved on the phone. Albums play on the album tape with their own cover art.

## The tape box

Press **■** while the tape is stopped to eject it. Closed, the player slides up and the tape box is underneath; open, the J-card slides away and the box is behind it. The box holds the albums saved in your Spotify library, ten to a box, oldest release year first (same year: by artist). Tap a spine to take the case out, tap the case to load the tape, and Spotify plays that album. Save or remove an album in Spotify and the box follows.

The first time, tap the note in the box to sign in to Spotify (once, in the browser). The first album you play asks Spotify's permission once too. Needs Spotify Premium and the Spotify app on the phone.

## The drawer

Under the boxes is a drawer of playlist tapes: your twenty most recently played Spotify playlists, tossed in loose. Press and hold a tape to pick it up and drag it where you want it; the drawer keeps your order, and a playlist new to the drawer lands on top. Each playlist gets its own shell (fifteen designs, after real 80s and 90s tapes) and its name written on the label in a pen of its own: ballpoint, Sharpie, felt tip, pencil, gel, or paint pen on the dark shells. The shell and pen stay with the playlist. Tap one and Spotify plays it. Start a playlist in Spotify itself and its tape goes into the player.

"Recently played" comes from Spotify's recent history plus every playlist PHONY sees playing; if that's fewer than twenty, the rest are your playlists in Spotify's order. The drawer needs one more Spotify sign-in to read playlists (tap the note in the drawer).

## The dial

Three shells have a radio in them: the silver radio recorder, the shoebox recorder and the all-weather one. Drag the needle along the FM dial and you get static, then a station: real ones, playing live through PHONY (WFMU, KEXP, KCRW's Eclectic 24, Radio Paradise, and a run of SomaFM channels, from Underground 80s to Secret Agent). The lamp on the dial lights when a station is locked in. The tape waits while the radio plays; ◀◀ and ▶▶ step from station to station, ■ switches the radio off, and ▶ is back to the tape where it left off. The banner on the J-card shows the station and whatever it says is playing. Every song a station names goes "on the radio" for the blank tape, below. The streams are the stations' own, for personal listening; the list is at the top of `js/radio.js` if you want other stations on your dial. The radio needs a signal.

## The radio and the blank tape

Hear a song you love out in the world, name it with Shazam, and it goes "on the radio": up to three songs wait there (a fourth pushes the oldest off). PHONY catches them three ways: Shazam's notification, Shazam's **Share** button pointed at PHONY, or Shazam's own "My Shazam Tracks" playlist in Spotify if Shazam is linked to Spotify.

The blank tape sits at the top of the drawer with a red REC sticker. Put it in and it plays the oldest song waiting. Only a full listen records it: pause and wind back all you like, but skip it or wind forward and it's gone for good. After each song the tape stops; if more are waiting it records the next. A blank holds 90 minutes (45 a side). Play it any time like any other tape; stopped at the end of what's on it, ▶ records whatever's waiting.

When it's full, press **■** and write its name on the spine with the pencil (**RUB OUT** turns the pencil over). It goes into the MY TAPES box, spine out, and a fresh blank drops into the drawer. Each tape is a private playlist in Spotify too.

A mixtape's J-card has your writing on the spine, the songs with where and when you heard each one, sleeve notes pairing each song with the photo you took nearest that moment and a few lines about the artist, the words, and its ports of call. Photos stay on the phone; the card asks once.

## No signal

Out of signal (a plane, a passage), PHONY still follows and controls whatever Spotify is playing, since that goes through the phone, not the internet. A tape from the box or the drawer plays if Spotify has that album or playlist downloaded; so does a song picked on the J-card. The box, the drawer and every J-card PHONY has already fetched are kept on the phone. A song recorded off the radio with no signal goes onto its Spotify playlist the next time there is one.

## Dubbing a tape for someone

Press and hold a finished tape's case in the MY TAPES box and PHONY offers three shells to dub it onto: one with hearts, one from a friend, one for a best friend. Pick one and the phone's share sheet opens with a message: a Spotify link anyone can play, and, folded into the same message, the tape itself for PHONY on the other phone — your handwriting on the spine, the songs, and where you heard each one (place names and dates, nothing more). The other person shares that message to PHONY (or copies it and opens PHONY), and the tape is in their drawer on the shell you chose, in your writing, "dubbed by" you; its J-card says where you heard each song. The first dub asks you to sign in to Spotify once more, so PHONY can open the playlist up for them.

## Sides

An album plays like a cassette: Side A is the first half of the songs. When Side A runs out the tape stops; press **■** to flip it and **▶** to play Side B. The silver digital shell has auto reverse and carries on by itself.

## The pencil trick

Open, touch a reel and a pencil comes in from the corner, puts its point in the hub, and turns as it winds: the top reel winds forward, the bottom one back. Let go and it plays from there. There are six pencils in the jar (a classic yellow, a chewed stub, black-and-red stripes, bare wood, a green drafting pencil, a souvenir stub from St. George's), one a day: the same pencil all day, a different one tomorrow.

## The J-card

Tap the song title and artist on the J-card (open view) and the album's J-card unfolds across the screen: the cover, the spine, both sides of the tape with running times and credits, the words to the song that's playing (they light up line by line as it plays), liner notes about the album, the band with a photo, and last, the ports of call: everywhere the album has really been played (three of its songs heard through in that place), one line per place, with a tally mark for each time after the first (and a stamp on the front for where it first played). That page asks for approximate location once; out of signal, a place is noted by position and named later. Swipe anywhere on the card to unfold further; at the far end the card sits on the left and the tape plays beside it. Tap a song to play it, or tap a line of the words to jump to it. **FOLD IT UP** or tap outside to put it back.

Album details and the band photo come from Spotify, the liner notes and band story from Wikipedia, the words from LRCLIB (lrclib.net, an open lyrics library). Not every song or album has all of them; the card leaves out what it can't find. Everything found is saved on the phone, so a card opens again with no signal. On Wi-Fi, PHONY also works through every album in the tape box in the background, so their J-cards (and the words to every song on them) are ready offline. The music itself still comes from Spotify: to play offline, download the album or playlist in the Spotify app.

## The rule

PHONY doesn't hold your hand. No menus, no hints, no "tap here" labels: things are there for whoever fiddles with it and finds them, the way it was out on the street with a skateboard, a Walkman and your friends. New features follow that.

## How it's built

- `app/src/main/assets/` – the whole player is a web page. Opens in a desktop browser too (uses a silent sample mix).
  - `index.html` – the markup; `phony.css` – the looks, including every shell.
  - `js/tapes.js` – the cassettes: shells, labels, pens, and how a tape is drawn.
  - `js/player.js` – the player: state, transport, keys, the window and bay, the J-card list, the phone bridge, the main loop.
  - `js/box.js` – the tape box and the drawer. `js/jcard.js` – the fold-out J-card. `js/skins.js` – the shells and the pencil trick. `js/mixtape.js` – the radio and the blank tape. `js/boot.js` – start-up.
  - The scripts share one scope and load in that order; a later file may use anything an earlier one defines.
- `MainActivity.kt` – shows the page full screen and bridges it to the phone.
- `PlaybackService.kt` – plays saved songs in the background (Media3), with lock-screen controls.
- `Library.kt` – reads songs and album art from Android's media library.
- `RemoteWatcher.kt` – follows and controls other apps' players.
- `SpotifyBox.kt` – reads your saved albums and recent playlists from Spotify and tells the Spotify app what to play.
- `LinerNotes.kt` – fetches what goes on the fold-out J-card. Uses Spotify's App Remote library (`app/libs`, from github.com/spotify/android-sdk, Apache 2.0).

## Builds

Every push to `main` builds a signed APK and puts it at:

https://github.com/hughhowey/phony/releases/download/latest/phony.apk

Signing uses two repository secrets: `PHONY_KEYSTORE_BASE64` and `PHONY_KEYSTORE_PASSWORD`. Keep the same key forever; a different key means uninstalling before the next update installs.

A third secret, `PHONY_SPOTIFY_CLIENT_ID`, bakes a Spotify client ID into the build so the phones that belong to that app never have to paste one. Without it, PHONY asks for an ID on the phone; an ID pasted on the phone always wins over the built-in one.

PHONY is under the MIT licence (see LICENSE).

Fonts are from Google Fonts under the SIL Open Font License (see `assets/fonts/licenses`).

package com.hughhowey.phony

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.media.AudioManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import androidx.webkit.WebViewAssetLoader
import com.google.common.util.concurrent.ListenableFuture

/**
 * The whole player UI is a web page bundled in the app (assets/index.html).
 * This activity shows it full screen and gives it a small bridge ("PhonyNative")
 * to the phone's music library, the playback service, and other apps' players.
 * The page picks the closed or open look from the screen's shape, so folding
 * and unfolding never reloads it.
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private lateinit var library: Library
    private lateinit var remote: RemoteWatcher
    private lateinit var box: SpotifyBox
    private lateinit var places: Places
    private lateinit var photos: Photos
    private lateinit var radio: Radio
    private val photoResults = java.util.concurrent.ConcurrentHashMap<String, String>()
    private lateinit var notes: LinerNotes
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var controller: MediaController? = null
    private val main = Handler(Looper.getMainLooper())
    private lateinit var audio: AudioManager

    @Volatile private var itemCount = 0
    @Volatile private var stateJson = """{"playing":false,"index":0,"pos":0,"dur":0,"ended":false}"""

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            library.invalidate()
            refreshPage()
        }

    private val photoLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { refreshPage() }

    private val locationLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { refreshPage() }

    private val tick = object : Runnable {
        override fun run() {
            updateState()
            remote.poll()
            main.postDelayed(this, 50)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.attributes = window.attributes.apply {
            layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        window.setBackgroundDrawable(null)

        library = Library(this)
        remote = RemoteWatcher(this)
        box = SpotifyBox(this, remote) {
            js("window.phonyBoxChanged && window.phonyBoxChanged()")
            if (::notes.isInitialized) notes.prefetch()
        }
        intent?.data?.let { box.handleRedirect(it) }
        notes = LinerNotes(this, box) { id -> js("window.phonyNotes && window.phonyNotes(${org.json.JSONObject.quote(id)})") }
        audio = getSystemService(AudioManager::class.java)
        places = Places(this)
        photos = Photos(this)
        radio = Radio.get(this).also { r ->
            r.box = box; r.places = places
            r.onChange = { js("window.phonyRadio && window.phonyRadio()") }
        }
        handleShare(intent)
        lockOrientation()

        val assets = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = false
            settings.textZoom = 100
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            isHapticFeedbackEnabled = false
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    assets.shouldInterceptRequest(request.url)
                // the page is the player and nothing else: a link of any kind never navigates it away
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.url.host != "appassets.androidplatform.net"
            }
            addJavascriptInterface(Bridge(), "PhonyNative")
        }
        setContentView(web)
        hideSystemBars()
        // the back button folds up whatever's open on the page (J-card, box, a card); with nothing open it leaves as usual
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.phonyBack ? window.phonyBack() : false") { r ->
                    if (r != "true") { isEnabled = false; onBackPressedDispatcher.onBackPressed(); isEnabled = true }
                }
            }
        })
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        val future = MediaController.Builder(this, token).buildAsync()
        controllerFuture = future
        future.addListener({
            controller = try { future.get() } catch (e: Exception) { null }
        }, ContextCompat.getMainExecutor(this))
    }

    /**
     * Cover screen: always upright (the closed player). Inner screen: always wide, so
     * turning the open phone never swaps the cassette bay for the closed view.
     * Both still flip 180° with the sensor.
     */
    private fun lockOrientation() {
        val inner = resources.configuration.smallestScreenWidthDp >= 600
        val want = if (inner) ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE else ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
        if (requestedOrientation != want) requestedOrientation = want
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        lockOrientation()
    }

    private fun hideSystemBars() {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) { hideSystemBars(); dubFromClipboard() }
    }

    override fun onResume() {
        super.onResume()
        // the 20-a-second poll of the player and the other app runs only while PHONY is on screen
        main.removeCallbacks(tick)
        main.post(tick)
        library.invalidate()
        refreshPage()
        box.sync(false)
        box.watch(true)
        notes.prefetch()
        if (::radio.isInitialized) radio.resolveSoon()
    }

    override fun onPause() {
        main.removeCallbacks(tick)
        box.watch(false)
        super.onPause()
    }

    // Spotify's sign-in page comes back here (phony://callback).
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.data?.let { box.handleRedirect(it) }
        handleShare(intent)
    }

    /** Shazam's Share button, pointed at PHONY: the song goes on the radio. A dubbed tape's message: the tape goes in the drawer. */
    private fun handleShare(i: Intent?) {
        if (i?.action != Intent.ACTION_SEND) return
        val text = i.getStringExtra(Intent.EXTRA_TEXT) ?: return
        if (text.contains("#phony:")) takeDub(text)
        else if (::radio.isInitialized) radio.fromShare(text)
        i.action = null
    }

    // ----- a tape dubbed for you: the message waits here until the page reads it -----
    private val dubPrefs by lazy { getSharedPreferences("dubs", MODE_PRIVATE) }
    private fun takeDub(text: String) {
        val key = text.substringAfter("#phony:").take(40)
        val seen = dubPrefs.getStringSet("seen", emptySet()) ?: emptySet()
        if (key in seen) return
        val list = try { org.json.JSONArray(dubPrefs.getString("waiting", "[]")) } catch (e: Exception) { org.json.JSONArray() }
        list.put(text)
        dubPrefs.edit().putString("waiting", list.toString()).putStringSet("seen", (seen + key).toList().takeLast(50).toSet()).apply()
        js("window.phonyDubbed && window.phonyDubbed()")
    }
    /** A dubbed tape's message copied from a chat: PHONY looks at the clipboard when it comes to the front. */
    private fun dubFromClipboard() {
        try {
            val cm = getSystemService(android.content.ClipboardManager::class.java) ?: return
            val text = cm.primaryClip?.getItemAt(0)?.coerceToText(this)?.toString() ?: return
            if (text.contains("#phony:")) takeDub(text)
        } catch (e: Exception) { }
    }

    private fun js(code: String) { main.post { if (::web.isInitialized) web.evaluateJavascript(code, null) } }

    override fun onDestroy() {
        main.removeCallbacks(tick)
        box.release()
        notes.stopped = true
        controllerFuture?.let { MediaController.releaseFuture(it) }
        controller = null
        web.destroy()
        super.onDestroy()
    }

    /** Lets the page redraw its music chooser after a permission prompt or a trip to settings. */
    private fun refreshPage() {
        if (::web.isInitialized) web.evaluateJavascript("window.phonyRefresh && window.phonyRefresh()", null)
    }

    private fun updateState() {
        val c = controller ?: return
        itemCount = c.mediaItemCount
        val dur = c.duration.let { if (it == C.TIME_UNSET || it < 0) 0L else it }
        val playing = c.isPlaying || (c.playWhenReady && c.playbackState == Player.STATE_BUFFERING)
        val ended = c.playbackState == Player.STATE_ENDED
        stateJson = """{"playing":$playing,"index":${c.currentMediaItemIndex},"pos":${c.currentPosition.coerceAtLeast(0)},"dur":$dur,"ended":$ended}"""
    }

    private fun onMain(block: () -> Unit) { main.post(block) }

    /**
     * Everything the page can ask the phone to do. These run on the page's own thread,
     * so anything touching the player is handed to the main thread.
     */
    inner class Bridge {

        // ----- songs saved on the phone -----
        @JavascriptInterface fun hasAudioPermission(): Boolean = library.hasPermission()

        @JavascriptInterface fun requestAudioPermission() = onMain { permissionLauncher.launch(Library.permissions()) }

        @JavascriptInterface fun getLibrary(): String = library.summaryJson()

        @JavascriptInterface
        fun loadSource(type: String, id: String): String {
            val key = "$type:$id"
            // Reopening the app shouldn't restart what's already playing.
            NowLoaded.tracks?.let { if (NowLoaded.key == key && itemCount > 0) return Library.tracksJson(it) }
            val tracks = library.tracksFor(type, id)
            NowLoaded.key = key
            NowLoaded.tracks = tracks
            val items = tracks.map { it.toMediaItem() }
            onMain {
                controller?.run {
                    setMediaItems(items)
                    prepare()
                }
            }
            return Library.tracksJson(tracks)
        }

        @JavascriptInterface fun getAlbumArt(id: String): String = library.albumArt(id.toLongOrNull() ?: -1L)

        @JavascriptInterface fun getState(): String = stateJson

        @JavascriptInterface fun play() = onMain {
            controller?.run {
                if (playbackState == Player.STATE_ENDED) seekTo(0, 0L)
                if (playbackState == Player.STATE_IDLE) prepare()
                play()
            }
        }

        @JavascriptInterface fun pause() = onMain { controller?.pause() }

        @JavascriptInterface fun seekTo(ms: Long) = onMain { controller?.seekTo(ms.coerceAtLeast(0L)) }

        @JavascriptInterface fun skipTo(index: Int) = onMain {
            controller?.run { if (index in 0 until mediaItemCount) seekTo(index, 0L) }
        }

        /** Tape speed wobble: pitch moves with speed, like a real motor. */
        @JavascriptInterface fun setSpeed(rate: Float) = onMain {
            val r = rate.coerceIn(0.8f, 1.2f)
            controller?.setPlaybackParameters(PlaybackParameters(r, r))
        }

        /** The wheel works the phone's media volume, same as the side buttons (Bluetooth included). */
        @JavascriptInterface fun setVolume(v: Float) = onMain {
            val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val index = Math.round(v.coerceIn(0f, 1f) * max)
            if (index != audio.getStreamVolume(AudioManager.STREAM_MUSIC)) audio.setStreamVolume(AudioManager.STREAM_MUSIC, index, 0)
        }

        @JavascriptInterface fun getVolume(): Float {
            val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            return if (max > 0) audio.getStreamVolume(AudioManager.STREAM_MUSIC).toFloat() / max else -1f
        }

        // ----- whatever another app is playing -----
        @JavascriptInterface fun hasListenerAccess(): Boolean = remote.hasAccess()

        @JavascriptInterface fun openListenerSettings() = onMain {
            val detail = if (Build.VERSION.SDK_INT >= 30) {
                Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS).putExtra(
                    Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
                    ComponentName(this@MainActivity, PhonyNotificationListener::class.java).flattenToString()
                )
            } else null
            try {
                startActivity(detail ?: Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            } catch (e: Exception) {
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }
        }

        @JavascriptInterface fun useRemote(on: Boolean) {
            remote.enabled = on
            if (on) onMain { controller?.pause() }
        }

        @JavascriptInterface fun getRemote(): String = remote.json

        @JavascriptInterface fun getRemoteArt(): String = remote.artDataUrl()

        @JavascriptInterface fun remoteCmd(cmd: String, arg: String) = onMain { remote.command(cmd, arg) }

        // ----- the tape box: albums saved in Spotify -----
        @JavascriptInterface fun spotifyStatus(): String = box.statusJson()
        @JavascriptInterface fun spotifyLogin() = onMain { box.startLogin() }
        /** The Spotify app PHONY signs in as: paste the client ID of your own (see the README). */
        @JavascriptInterface fun setSpotifyClientId(id: String) = onMain { box.setClientId(id) }
        @JavascriptInterface fun boxSync(force: Boolean) = box.sync(force)
        @JavascriptInterface fun getBox(): String = box.boxJson()
        @JavascriptInterface fun getCover(id: String): String = box.coverDataUrl(id)
        /** The drawer: up to twenty playlists, most recently played first. */
        @JavascriptInterface fun getDrawer(): String = box.drawerJson()
        /** What Spotify says it's playing: {type: "album"|"playlist"|…, uri, album, albumUri}, or "". */
        @JavascriptInterface fun spotifyContext(): String = box.contextJson

        /** Tell the Spotify app to play an album; answers window.phonyPlayed(ok, message). */
        @JavascriptInterface fun playAlbum(uri: String, title: String) = onMain {
            box.play(uri, title) { ok, msg -> js("window.phonyPlayed && window.phonyPlayed($ok, ${org.json.JSONObject.quote(msg)})") }
        }

        /** Tell the Spotify app to play a playlist; answers window.phonyPlayed(ok, message) like playAlbum. */
        @JavascriptInterface fun playPlaylist(uri: String, name: String) = onMain {
            box.play(uri, name) { ok, msg -> js("window.phonyPlayed && window.phonyPlayed($ok, ${org.json.JSONObject.quote(msg)})") }
        }

        // ----- the fold-out J-card -----
        /** Fetch an album's liner notes; answers window.phonyNotes(id), then the page calls takeNotes(id). */
        @JavascriptInterface fun fetchNotes(id: String, title: String, artist: String, albumUri: String) = notes.album(id, title, artist, albumUri)
        @JavascriptInterface fun fetchLyrics(id: String, track: String, artist: String, album: String, durSec: Int) = notes.lyrics(id, track, artist, album, durSec)
        @JavascriptInterface fun takeNotes(id: String): String = notes.take(id)

        /** Jump to a song on an album (tapped in the song list). */
        @JavascriptInterface fun playAlbumAt(uri: String, index: Int) = onMain {
            box.playAt(uri, index) { ok, msg -> if (!ok) js("window.phonyPlayed && window.phonyPlayed(false, ${org.json.JSONObject.quote("Spotify didn't skip there ($msg).")})") }
        }

        // ----- ports of call: where an album was played -----
        @JavascriptInterface fun hasLocation(): Boolean = places.hasPermission()
        @JavascriptInterface fun requestLocation() = onMain { locationLauncher.launch(android.Manifest.permission.ACCESS_COARSE_LOCATION) }
        /** {lat, lon, at, place} or "" (no permission or no fix yet). */
        @JavascriptInterface fun whereAmI(): String = places.here()
        @JavascriptInterface fun placeName(lat: Double, lon: Double): String = places.name(lat, lon)

        // ----- the real radio: a station streams through PHONY's own player -----
        @JavascriptInterface fun tuneRadio(url: String, name: String) = onMain {
            remote.enabled = false
            NowLoaded.key = "radio:$url"; NowLoaded.tracks = null
            val uri = android.net.Uri.parse(url)
            val item = MediaItem.Builder().setMediaId("radio").setUri(uri)
                .setRequestMetadata(MediaItem.RequestMetadata.Builder().setMediaUri(uri).build())
                .setMediaMetadata(MediaMetadata.Builder().setTitle(name).setArtist("On the radio").build()).build()
            controller?.run { setMediaItem(item); prepare(); play() }
        }
        @JavascriptInterface fun radioOff() = onMain { controller?.run { stop(); clearMediaItems() }; NowLoaded.key = ""; NowLoaded.tracks = null }
        /** What the station says is playing: {title, artist, at}. */
        @JavascriptInterface fun onAir(): String = radio.onAirJson()

        // ----- the radio and the blank tape -----
        /** Songs heard and waiting for the blank tape: [{key, title, artist, uri, dur, album, at, lat, lon, place, how}]. */
        @JavascriptInterface fun radioWaiting(): String = radio.waitingJson()
        @JavascriptInterface fun radioDrop(key: String) = radio.drop(key)
        @JavascriptInterface fun radioNotice(): String = org.json.JSONObject().put("id", radio.noticeId).put("text", radio.notice).toString()
        /** Test hook: put a song on the radio by name. */
        @JavascriptInterface fun radioHeard(title: String, artist: String) = radio.heard(title, artist, "test")
        @JavascriptInterface fun playTrack(uri: String, title: String) = onMain {
            box.play(uri, title) { ok, msg -> js("window.phonyPlayed && window.phonyPlayed($ok, ${org.json.JSONObject.quote(msg)})") }
        }
        @JavascriptInterface fun mixCreate(name: String) = onMain { box.mixCreate(name) { id -> js("window.phonyMixMade && window.phonyMixMade(${org.json.JSONObject.quote(id)})") } }
        @JavascriptInterface fun mixAdd(id: String, uri: String) = box.mixAdd(id, uri)
        @JavascriptInterface fun mixRename(id: String, name: String) = box.mixRename(id, name)

        // ----- dubbing a tape for someone -----
        @JavascriptInterface fun mixPublic(id: String) = onMain { box.mixPublic(id) { ok -> js("window.phonyPublic && window.phonyPublic($ok)") } }
        @JavascriptInterface fun shareText(text: String) = onMain {
            val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text).putExtra(Intent.EXTRA_SUBJECT, "A tape, dubbed for you")
            startActivity(Intent.createChooser(send, "Send the tape with…"))
        }
        /** Messages with a dubbed tape in them, waiting for the page: ["…#phony:…"], then forgotten. */
        @JavascriptInterface fun takeDubs(): String {
            val s = dubPrefs.getString("waiting", "[]") ?: "[]"
            dubPrefs.edit().putString("waiting", "[]").apply()
            return s
        }
        @JavascriptInterface fun artistNotes(id: String, name: String) = notes.artist(id, name)

        // ----- camera photos for a mixtape's J-card -----
        @JavascriptInterface fun hasPhotos(): Boolean = photos.hasPermission()
        @JavascriptInterface fun requestPhotos() = onMain { photoLauncher.launch(photos.permission) }
        /** req: {near:[t…]} or {from, to, n}; answers window.phonyPhotos(id), then takePhotos(id). */
        @JavascriptInterface fun fetchPhotos(id: String, req: String) {
            Thread {
                val r = try { org.json.JSONObject(req) } catch (e: Exception) { org.json.JSONObject() }
                val out = org.json.JSONObject()
                r.optJSONArray("near")?.let { ts -> val a = org.json.JSONArray(); for (k in 0 until ts.length()) a.put(photos.near(ts.getLong(k))); out.put("near", a) }
                if (r.has("from")) out.put("across", org.json.JSONArray(photos.across(r.getLong("from"), r.getLong("to"), r.optInt("n", 6))))
                photoResults[id] = out.toString()
                js("window.phonyPhotos && window.phonyPhotos(${org.json.JSONObject.quote(id)})")
            }.start()
        }
        @JavascriptInterface fun takePhotos(id: String): String = photoResults.remove(id) ?: ""

        // ----- feel -----
        @JavascriptInterface
        fun haptic(level: Int) {
            val v = getSystemService(Vibrator::class.java) ?: return
            if (!v.hasVibrator()) return
            v.vibrate(
                VibrationEffect.createPredefined(
                    if (level >= 2) VibrationEffect.EFFECT_HEAVY_CLICK else VibrationEffect.EFFECT_CLICK
                )
            )
        }
    }
}

/** What's loaded into the player, kept for the life of the app process. */
object NowLoaded {
    @Volatile var key: String = ""
    @Volatile var tracks: List<Library.Track>? = null
}

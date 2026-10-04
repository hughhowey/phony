package com.hughhowey.phony

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.util.Base64
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.concurrent.atomic.AtomicBoolean

/**
 * The tape box: the albums saved in your Spotify library, each with its cover,
 * and the drawer of playlist tapes: the twenty playlists played most recently.
 *
 * - Reading the library uses Spotify's Web API. You sign in once in the browser;
 *   after that PHONY keeps a refresh key and never asks again.
 * - Playing an album uses Spotify's App Remote, which tells the Spotify app on
 *   the phone what to play. The first time, Spotify asks you to allow it.
 */
class SpotifyBox(private val ctx: Context, private val remoteWatcher: RemoteWatcher, private val onChange: () -> Unit) {

    companion object {
        const val REDIRECT = "phony://callback"
        private const val SCOPES = "user-library-read user-modify-playback-state user-read-playback-state user-read-currently-playing " +
            "playlist-read-private playlist-read-collaborative user-read-recently-played playlist-modify-private playlist-modify-public"
        private const val PLAY_SCOPE = "user-modify-playback-state"
        private const val LIST_SCOPES = "playlist-read-private user-read-recently-played"
        const val DRAWER = 20
        private const val MIX_SCOPE = "playlist-modify-private"
        private const val SHARE_SCOPE = "playlist-modify-public"
    }

    private val prefs = ctx.getSharedPreferences("spotify", Context.MODE_PRIVATE)

    /**
     * Which Spotify app PHONY signs in as. Spotify only serves a handful of accounts per app, so
     * everyone makes their own (five minutes on developer.spotify.com) and pastes its client ID
     * here. A build can carry one of its own (PHONY_SPOTIFY_CLIENT_ID when the APK is made), which
     * a pasted one overrides. Changing it signs the phone out: the saved key belonged to the old app.
     */
    val clientId: String get() = prefs.getString("clientId", null)?.takeIf { it.isNotBlank() } ?: BuildConfig.SPOTIFY_CLIENT_ID
    val hasClientId get() = clientId.isNotBlank()
    fun setClientId(id: String) {
        val clean = id.trim().lowercase().filter { it in "0123456789abcdef" }
        if (clean.isEmpty() || clean == clientId) return
        signOut()
        prefs.edit().putString("clientId", clean).apply()
        onChange()
    }
    private val boxFile = File(ctx.filesDir, "box.json")
    private val coverDir = File(ctx.filesDir, "covers").apply { mkdirs() }
    private val drawerFile = File(ctx.filesDir, "playlists.json")

    @Volatile var state = "idle"; private set      // idle · loading · ready · error
    @Volatile var message = ""; private set
    private val syncing = AtomicBoolean(false)
    @Volatile private var access: String? = null
    @Volatile private var accessUntil = 0L
    private var remote: SpotifyAppRemote? = null

    val signedIn get() = prefs.getString("refresh", null) != null
    /** Signed in with permission to change what Spotify plays (added after the first version). */
    val canPlay get() = signedIn && (prefs.getString("scope", "") ?: "").contains(PLAY_SCOPE)
    /** Signed in with permission to make the mixtape playlists (added with the blank tape). */
    val canMix get() = signedIn && (prefs.getString("scope", "") ?: "").contains(MIX_SCOPE)
    /** Signed in with permission to open a mixtape's playlist up, so a tape can be dubbed for someone (added with dubbing). */
    val canShare get() = signedIn && (prefs.getString("scope", "") ?: "").contains(SHARE_SCOPE)
    /** Signed in with permission to read playlists and what played lately (added with the playlist drawer). */
    val canPlaylists get() = signedIn && LIST_SCOPES.split(" ").all { (prefs.getString("scope", "") ?: "").contains(it) }

    /** A validated connection to the internet (a plane's captive portal doesn't count). */
    private fun online(): Boolean {
        val cm = ctx.getSystemService(ConnectivityManager::class.java) ?: return false
        val c = cm.getNetworkCapabilities(cm.activeNetwork ?: return false) ?: return false
        return c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    /** The page may be reading a file while it's rewritten: write beside it, then swap, so it never sees half a file. */
    private fun File.writeWhole(text: String) {
        val tmp = File(parentFile, "$name.tmp")
        tmp.writeText(text)
        if (!tmp.renameTo(this)) { writeText(text); tmp.delete() }
    }

    fun statusJson(): String = JSONObject()
        .put("hasClientId", hasClientId)
        .put("clientId", clientId)
        .put("signedIn", signedIn)
        .put("state", state)
        .put("message", message)
        .put("updated", if (boxFile.exists()) boxFile.lastModified() else 0L)
        .put("spotify", SpotifyAppRemote.isSpotifyInstalled(ctx))
        .put("canPlay", canPlay)
        .put("canPlaylists", canPlaylists)
        .put("canMix", canMix)
        .put("canShare", canShare)
        .put("notice", notice)
        .put("noticeId", noticeId)
        .toString()

    fun boxJson(): String = if (boxFile.exists()) boxFile.readText() else "[]"
    fun drawerJson(): String = if (drawerFile.exists()) drawerFile.readText() else "[]"

    // ---------- signing in (PKCE, in the browser) ----------

    fun startLogin() {
        if (!hasClientId) { tell("Paste a Spotify client ID first."); return }
        // each sign-in page gets its own key, so an older Spotify tab still works when you agree in it
        val verifier = randomString(64)
        val st = randomString(16)
        prefs.edit().putString("pkce_$st", verifier).putString("verifier", verifier).apply()
        val challenge = b64url(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray()))
        val url = "https://accounts.spotify.com/authorize" +
            "?response_type=code&client_id=$clientId" +
            "&scope=" + enc(SCOPES) +
            "&redirect_uri=" + enc(REDIRECT) +
            "&code_challenge_method=S256&code_challenge=$challenge&state=$st"
        ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /** The browser hands back phony://callback?code=… (or ?error=…). */
    fun handleRedirect(uri: Uri): Boolean {
        if (uri.scheme != "phony" || uri.host != "callback") return false
        val code = uri.getQueryParameter("code")
        if (code == null) {
            // App Remote's own sign-in can come back here too, without a code; ignore that.
            uri.getQueryParameter("error")?.let { tell("Spotify said no ($it).") }
            return true
        }
        if (code == prefs.getString("lastCode", null)) return true // already used (e.g. the app was reopened with the same link)
        prefs.edit().putString("lastCode", code).apply()
        val verifier = uri.getQueryParameter("state")?.let { prefs.getString("pkce_$it", null) }
            ?: prefs.getString("verifier", null)
            ?: run { tell("Sign-in expired. Tap the note in the box again."); return true }
        if (!boxFile.exists()) { state = "loading"; message = "" }
        tell("Signing in to Spotify…")
        Thread {
            try {
                val j = token("grant_type=authorization_code&code=${enc(code)}&redirect_uri=${enc(REDIRECT)}&client_id=$clientId&code_verifier=${enc(verifier)}")
                saveTokens(j)
                tell(if (canPlay) "Signed in. PHONY can now change what Spotify plays." else "Signed in, but Spotify didn't grant control of playback.")
                syncNow()
            } catch (e: Exception) {
                if (!boxFile.exists()) state = "error"
                tell("Couldn't sign in to Spotify (" + (e.message ?: e.javaClass.simpleName) + ").")
            }
        }.start()
        return true
    }

    /** A one-line message for the page to show. */
    @Volatile var notice = ""; private set
    @Volatile var noticeId = 0; private set
    fun tell(msg: String) { notice = msg; noticeId++; message = msg; onChange() }

    fun signOut() {
        val keep = prefs.getString("clientId", null)
        prefs.edit().clear().apply(); keep?.let { prefs.edit().putString("clientId", it).apply() }
        access = null; accessUntil = 0
        boxFile.delete(); drawerFile.delete(); state = "idle"; onChange()
    }

    private fun saveTokens(j: JSONObject) {
        access = j.getString("access_token")
        accessUntil = System.currentTimeMillis() + (j.optLong("expires_in", 3600) - 60) * 1000
        j.optString("refresh_token").takeIf { it.isNotEmpty() }?.let { prefs.edit().putString("refresh", it).apply() }
        j.optString("scope").takeIf { it.isNotEmpty() }?.let { prefs.edit().putString("scope", it).apply() }
    }

    private fun accessToken(): String {
        access?.let { if (System.currentTimeMillis() < accessUntil) return it }
        val refresh = prefs.getString("refresh", null) ?: throw IllegalStateException("signed out")
        val j = try {
            token("grant_type=refresh_token&refresh_token=${enc(refresh)}&client_id=$clientId")
        } catch (e: HttpError) {
            if (e.code == 400 || e.code == 401) prefs.edit().remove("refresh").apply()
            throw e
        }
        saveTokens(j)
        return access!!
    }

    private fun token(body: String): JSONObject {
        val c = URL("https://accounts.spotify.com/api/token").openConnection() as HttpURLConnection
        c.requestMethod = "POST"; c.doOutput = true; c.connectTimeout = 15000; c.readTimeout = 20000
        c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
        try {
            c.outputStream.use { it.write(body.toByteArray()) }
            val code = c.responseCode
            if (code != 200) {
                val why = try { JSONObject(c.errorStream.bufferedReader().use { it.readText() }).let { it.optString("error_description").ifEmpty { it.optString("error") } } } catch (e: Exception) { "" }
                throw HttpError(code, why)
            }
            return JSONObject(c.inputStream.bufferedReader().use { it.readText() })
        } finally { c.disconnect() }
    }

    // ---------- the library ----------

    /** Refresh the box in the background, unless it was refreshed in the last minute. */
    fun sync(force: Boolean) {
        if (!signedIn || syncing.get()) return
        if (!force && boxFile.exists() && System.currentTimeMillis() - boxFile.lastModified() < 60_000) return
        Thread { syncNow() }.start()
    }

    private fun syncNow() {
        if (!syncing.compareAndSet(false, true)) return
        if (!boxFile.exists()) { state = "loading"; onChange() }
        try {
            try { flushMixQueue() } catch (e: Exception) { }
            val out = JSONArray()
            var next: String? = "https://api.spotify.com/v1/me/albums?limit=50"
            var pages = 0
            while (next != null && pages < 20) {
                val j = JSONObject(get(next)); pages++
                val items = j.getJSONArray("items")
                for (i in 0 until items.length()) {
                    // one odd entry (an album Spotify has pulled, a local-files album) must not sink the whole box
                    val item = items.optJSONObject(i) ?: continue
                    val a = item.optJSONObject("album") ?: continue
                    if (a.optString("id").isEmpty()) continue
                    val artists = a.optJSONArray("artists")
                    val artist = (0 until (artists?.length() ?: 0)).joinToString(", ") { k -> artists!!.getJSONObject(k).optString("name") }
                    val tracks = JSONArray()
                    a.optJSONObject("tracks")?.optJSONArray("items")?.let { ts ->
                        for (k in 0 until ts.length()) {
                            val t = ts.getJSONObject(k)
                            tracks.put(JSONObject().put("t", t.optString("name")).put("d", t.optLong("duration_ms") / 1000))
                        }
                    }
                    val id = a.optString("id")
                    out.put(JSONObject()
                        .put("id", id)
                        .put("uri", a.optString("uri", "spotify:album:$id"))
                        .put("title", a.optString("name"))
                        .put("artist", artist)
                        .put("year", a.optString("release_date").take(4))
                        .put("added", item.optString("added_at"))
                        .put("tracks", tracks)
                        .put("cover", pickImage(a.optJSONArray("images"))))
                }
                next = j.optString("next").takeIf { it.isNotEmpty() && it != "null" }
            }
            boxFile.writeWhole(out.toString())
            state = "ready"; message = ""
            onChange()
            try { syncDrawer() } catch (e: Exception) { }
            // covers, after the box is up
            for (i in 0 until out.length()) {
                val a = out.getJSONObject(i)
                val f = File(coverDir, a.getString("id") + ".jpg")
                val u = a.optString("cover")
                if (f.exists() || u.isEmpty()) continue
                try { f.writeBytes(URL(u).openStream().use { s -> s.readBytes() }) } catch (e: Exception) { }
                if (i % 6 == 5) onChange()
            }
            onChange()
        } catch (e: Exception) {
            state = if (boxFile.exists()) "ready" else "error"
            message = when {
                !signedIn -> "Sign in to Spotify again."
                // development mode: Spotify only serves the accounts listed under the app's users in the developer dashboard
                e is HttpError && e.code == 403 -> "Spotify won't serve this account on that app. Add it to the app's users in the developer dashboard, or paste your own app's client ID."
                e is HttpError -> "Spotify said no (${e.message})."
                else -> "Couldn't reach Spotify."
            }
            onChange()
        } finally { syncing.set(false) }
    }

    private fun pickImage(imgs: JSONArray?): String {
        if (imgs == null || imgs.length() == 0) return ""
        var best = imgs.getJSONObject(0)
        for (i in 0 until imgs.length()) {
            val im = imgs.getJSONObject(i)
            val w = im.optInt("width"); val bw = best.optInt("width")
            // the smallest one that's still at least 600 px, else the biggest
            if ((w >= 600 && (bw < 600 || w < bw)) || (bw < 600 && w > bw)) best = im
        }
        return best.optString("url")
    }

    fun coverDataUrl(id: String): String {
        val f = File(coverDir, id.filter { it.isLetterOrDigit() } + ".jpg")
        if (!f.exists()) return ""
        return "data:image/jpeg;base64," + Base64.encodeToString(f.readBytes(), Base64.NO_WRAP)
    }

    private fun get(u: String): String {
        val c = URL(u).openConnection() as HttpURLConnection
        c.connectTimeout = 15000; c.readTimeout = 20000
        c.setRequestProperty("Authorization", "Bearer " + accessToken())
        try {
            val code = c.responseCode
            if (code == 401) access = null
            if (code != 200) {
                val why = try { JSONObject(c.errorStream.bufferedReader().use { it.readText() }).optJSONObject("error")?.optString("message") ?: "" } catch (e: Exception) { "" }
                throw HttpError(code, why)
            }
            return c.inputStream.bufferedReader().use { it.readText() }
        } finally { c.disconnect() }
    }

    // ---------- the drawer: playlists, most recently played first ----------

    /**
     * Twenty playlists. First the ones played lately (Spotify's recently-played list,
     * plus every playlist PHONY has seen Spotify playing), newest first; then, if there
     * aren't twenty yet, the rest of your playlists in the order Spotify lists them.
     */
    private fun syncDrawer() {
        if (!canPlaylists) return
        val lib = mutableListOf<JSONObject>()
        var next: String? = "https://api.spotify.com/v1/me/playlists?limit=50"
        var pages = 0
        while (next != null && pages < 6) {
            val j = JSONObject(get(next)); pages++
            val items = j.optJSONArray("items") ?: JSONArray()
            for (i in 0 until items.length()) {
                val pl = items.optJSONObject(i) ?: continue
                val name = pl.optString("name")
                if (name.equals("My Shazam Tracks", true)) { shazamList = pl.optString("id"); continue }
                if (pl.optString("id") in mixIds()) continue
                playlistEntry(pl)?.let { e -> lib.add(e) }
            }
            next = j.optString("next").takeIf { it.isNotEmpty() && it != "null" }
        }
        // when each playlist last played: Spotify's list (last 50 songs) and PHONY's own notes
        val played = HashMap<String, Long>()
        try {
            val r = JSONObject(get("https://api.spotify.com/v1/me/player/recently-played?limit=50")).optJSONArray("items") ?: JSONArray()
            for (i in 0 until r.length()) {
                val row = r.getJSONObject(i)
                val cx = row.optJSONObject("context") ?: continue
                if (cx.optString("type") != "playlist") continue
                val at = try { java.time.Instant.parse(row.optString("played_at")).toEpochMilli() } catch (e: Exception) { 0L }
                val u = cx.optString("uri"); if (u.isNotEmpty() && at > (played[u] ?: 0L)) played[u] = at
            }
        } catch (e: Exception) { }
        val mine = localPlays()
        mine.keys().forEach { u -> val at = mine.optLong(u); if (at > (played[u] ?: 0L)) played[u] = at }
        // a playlist you played but don't follow: look it up (Spotify may refuse other people's)
        val known = lib.associateBy { it.getString("uri") }.toMutableMap()
        played.keys.filter { it !in known }.sortedByDescending { played[it] }.take(DRAWER).forEach { u ->
            val id = u.substringAfterLast(':')
            try { playlistEntry(JSONObject(get("https://api.spotify.com/v1/playlists/$id?fields=id,uri,name,owner(display_name),items(total),tracks(total)")))?.let { e -> known[u] = e } } catch (e: Exception) { }
        }
        shazamList?.let { id -> try { watchShazam(id) } catch (e: Exception) { } }
        val recent = played.keys.filter { it in known && it.substringAfterLast(':') !in mixIds() }.sortedByDescending { played[it] }
        val order = (recent + lib.map { it.getString("uri") }).distinct().take(DRAWER)
        val out = JSONArray()
        order.forEach { u -> out.put(known[u]!!.put("played", played[u] ?: 0L)) }
        drawerFile.writeWhole(out.toString())
        onChange()
    }

    private fun playlistEntry(pl: JSONObject): JSONObject? {
        val id = pl.optString("id"); if (id.isEmpty()) return null
        // Spotify renamed a playlist's "tracks" to "items" in 2026; read either
        val count = (pl.optJSONObject("items") ?: pl.optJSONObject("tracks"))?.optInt("total") ?: 0
        return JSONObject().put("id", id).put("uri", pl.optString("uri", "spotify:playlist:$id"))
            .put("name", pl.optString("name")).put("owner", pl.optJSONObject("owner")?.optString("display_name") ?: "").put("count", count)
    }

    private fun localPlays(): JSONObject = try { JSONObject(prefs.getString("plays", "{}") ?: "{}") } catch (e: Exception) { JSONObject() }

    /** A playlist just played: note the time and move it to the front of the drawer. */
    fun markPlayed(uri: String) {
        if (!uri.startsWith("spotify:playlist:")) return
        val now = System.currentTimeMillis()
        val plays = localPlays().put(uri, now)
        // keep the notes small: the 60 most recent
        if (plays.length() > 60) {
            val keep = plays.keys().asSequence().toList().sortedByDescending { plays.optLong(it) }.take(60).toSet()
            plays.keys().asSequence().toList().filter { it !in keep }.forEach { plays.remove(it) }
        }
        prefs.edit().putString("plays", plays.toString()).apply()
        val list = try { JSONArray(drawerJson()) } catch (e: Exception) { JSONArray() }
        val items = (0 until list.length()).map { list.getJSONObject(it) }
        val hit = items.firstOrNull { it.optString("uri") == uri }
        if (hit == null) { if (canPlaylists && !syncing.get()) Thread { try { syncDrawer() } catch (e: Exception) { } }.start(); return }
        if (items.first() === hit) return
        val out = JSONArray(); out.put(hit.put("played", now)); items.filter { it !== hit }.forEach { out.put(it) }
        drawerFile.writeWhole(out.toString())
        onChange()
    }

    // ---------- the radio and the blank tape ----------

    @Volatile private var shazamList: String? = null

    /** New songs in Shazam's own Spotify playlist go on the radio. The first look only notes where the list is up to. */
    private fun watchShazam(id: String) {
        val j = JSONObject(get("https://api.spotify.com/v1/playlists/$id/items?limit=50&fields=items(added_at,item(name,uri,duration_ms,artists(name),album(name)),track(name,uri,duration_ms,artists(name),album(name)))"))
        val items = j.optJSONArray("items") ?: return
        val mark = prefs.getLong("shazamMark", 0L)
        var newest = mark
        for (i in 0 until items.length()) {
            val it = items.getJSONObject(i)
            val at = try { java.time.Instant.parse(it.optString("added_at")).toEpochMilli() } catch (e: Exception) { 0L }
            if (at > newest) newest = at
            if (mark == 0L || at <= mark) continue
            val t = it.optJSONObject("item") ?: it.optJSONObject("track") ?: continue
            val ar = t.optJSONArray("artists")?.optJSONObject(0)?.optString("name") ?: ""
            Radio.get(ctx).heard(t.optString("name"), ar, "shazam list", t.optString("uri"), t.optLong("duration_ms") / 1000, t.optJSONObject("album")?.optString("name") ?: "")
        }
        prefs.edit().putLong("shazamMark", if (mark == 0L) maxOf(newest, System.currentTimeMillis()) else newest).apply()
    }

    /** A song heard on the radio, on Spotify: {uri, title, artist, album, dur} or null. */
    fun findTrack(title: String, artist: String): JSONObject? {
        if (!signedIn) return null
        val clean = { x: String -> x.replace(Regex("\\s*[(\\[][^)\\]]*[)\\]]"), "").trim() }
        val q = enc(if (artist.isNotBlank()) "track:${clean(title)} artist:${artist.split(",", "&").first().trim()}" else clean(title))
        val items = JSONObject(api("GET", "https://api.spotify.com/v1/search?type=track&limit=5&q=$q", null)).optJSONObject("tracks")?.optJSONArray("items") ?: return null
        if (items.length() == 0) return null
        var best = items.getJSONObject(0)
        for (i in 0 until items.length()) { val c = items.getJSONObject(i); if (c.optString("name").equals(title.trim(), true)) { best = c; break } }
        return JSONObject().put("uri", best.optString("uri")).put("title", best.optString("name"))
            .put("artist", best.optJSONArray("artists")?.optJSONObject(0)?.optString("name") ?: "")
            .put("album", best.optJSONObject("album")?.optString("name") ?: "").put("dur", best.optLong("duration_ms") / 1000)
    }

    private fun mixIds(): Set<String> = (prefs.getString("mixIds", "") ?: "").split(",").filter { it.isNotEmpty() }.toSet()

    /** A new mixtape playlist (private). done(id or "") on the main thread. */
    fun mixCreate(name: String, done: (String) -> Unit) {
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        Thread {
            val id = try {
                JSONObject(api("POST", "https://api.spotify.com/v1/me/playlists", JSONObject().put("name", name).put("public", false)
                    .put("description", "Recorded off the radio with PHONY.").toString())).optString("id")
            } catch (e: Exception) { "" }
            if (id.isNotEmpty()) prefs.edit().putString("mixIds", (mixIds() + id).joinToString(",")).apply()
            main.post { done(id) }
        }.start()
    }

    /** Put a recorded song on the end of a mixtape playlist. With no signal it waits in line for the next sync. */
    fun mixAdd(id: String, uri: String) {
        Thread { if (!online() || !mixAddNow(id, uri)) queueMixAdd(id, uri) }.start()
    }

    private fun mixAddNow(id: String, uri: String): Boolean {
        val body = JSONObject().put("uris", JSONArray().put(uri)).toString()
        return try { api("POST", "https://api.spotify.com/v1/playlists/$id/items", body); true }
        catch (e: Exception) { try { api("POST", "https://api.spotify.com/v1/playlists/$id/tracks", body); true } catch (e2: Exception) { false } }
    }

    @Synchronized private fun queueMixAdd(id: String, uri: String) {
        val q = try { JSONArray(prefs.getString("mixQueue", "[]")) } catch (e: Exception) { JSONArray() }
        q.put(JSONObject().put("id", id).put("uri", uri))
        prefs.edit().putString("mixQueue", q.toString()).apply()
    }

    /** Songs recorded with no signal go onto their playlists now. */
    private fun flushMixQueue() {
        val q = synchronized(this) { try { JSONArray(prefs.getString("mixQueue", "[]")) } catch (e: Exception) { JSONArray() } }
        if (q.length() == 0) return
        val left = JSONArray()
        for (i in 0 until q.length()) { val e = q.getJSONObject(i); if (!mixAddNow(e.getString("id"), e.getString("uri"))) left.put(e) }
        synchronized(this) { prefs.edit().putString("mixQueue", left.toString()).apply() }
    }

    /** A dubbed tape's playlist has to play on the other phone: make it public. done(ok) on the main thread. */
    fun mixPublic(id: String, done: (Boolean) -> Unit) {
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        Thread {
            val ok = try { api("PUT", "https://api.spotify.com/v1/playlists/$id", JSONObject().put("public", true).toString()); true } catch (e: Exception) { false }
            main.post { done(ok) }
        }.start()
    }

    fun mixRename(id: String, name: String) {
        Thread { try { api("PUT", "https://api.spotify.com/v1/playlists/$id", JSONObject().put("name", name).toString()) } catch (e: Exception) { } }.start()
    }

    // ---------- playing an album ----------

    /**
     * Start an album. Three ways, in order, stopping at the first that works:
     * 1. Spotify's Web API, on this phone's Spotify (needs the play permission, and a signal).
     * 2. Android's media controls: ask Spotify's player to play the album's link.
     * 3. Spotify's App Remote.
     * The last two are local to the phone: with no signal they're tried at once, and Spotify
     * plays whatever it has downloaded.
     * done() runs on the main thread; on failure the message says what each way answered.
     */
    fun play(uri: String, title: String, done: (Boolean, String) -> Unit) {
        val isList = uri.startsWith("spotify:playlist:")
        val isSong = uri.startsWith("spotify:track:")
        if (isList) markPlayed(uri)
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        Thread {
            val notes = mutableListOf<String>()
            var web: String? = if (!online()) "web: no signal" else "web: not allowed yet"
            if (canPlay && online()) {
                web = try { playWeb(uri); null } catch (e: Exception) { "web: " + (e.message ?: e.javaClass.simpleName) }
            }
            if (web == null) { main.post { done(true, "web") }; return@Thread }
            notes += web
            main.post {
                if (remoteWatcher.playFromUri(uri)) {
                    // give Spotify a moment, then check it actually switched
                    main.postDelayed({
                        if (if (isSong) remoteWatcher.playingTitle(title) else if (isList) remoteWatcher.playingQueue(title) else remoteWatcher.playingAlbum(title)) done(true, "media controls (" + notes.joinToString("; ") + ")")
                        else { notes += "media controls: no change"; viaAppRemote(uri, notes, done) }
                    }, 2500)
                } else { notes += "media controls: Spotify isn't open"; viaAppRemote(uri, notes, done) }
            }
        }.start()
    }

    private fun playWeb(uri: String, offset: Int = -1) {
        val devices = JSONObject(api("GET", "https://api.spotify.com/v1/me/player/devices", null)).optJSONArray("devices") ?: JSONArray()
        var id: String? = null
        for (i in 0 until devices.length()) { val d = devices.getJSONObject(i); if (d.optBoolean("is_active")) { id = d.optString("id"); break } }
        if (id == null) for (i in 0 until devices.length()) { val d = devices.getJSONObject(i); if (d.optString("type").equals("Smartphone", true)) { id = d.optString("id"); break } }
        val q = if (id.isNullOrEmpty()) "" else "?device_id=" + enc(id)
        val body = if (uri.startsWith("spotify:track:")) JSONObject().put("uris", JSONArray().put(uri)) else JSONObject().put("context_uri", uri)
        if (offset >= 0) body.put("offset", JSONObject().put("position", offset))
        api("PUT", "https://api.spotify.com/v1/me/player/play$q", body.toString())
    }

    private fun viaAppRemote(uri: String, notes: MutableList<String>, done: (Boolean, String) -> Unit) {
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        var answered = false
        val finish = { ok: Boolean, note: String ->
            if (!answered) {
                answered = true
                if (ok) done(true, "app remote (" + notes.joinToString("; ") + ")") else { notes += "app remote: $note"; done(false, "Spotify didn't switch albums (" + notes.joinToString("; ") + ")") }
            }
        }
        main.postDelayed({ finish(false, "no answer") }, 10_000)
        val go = { r: SpotifyAppRemote ->
            r.playerApi.play(uri).setResultCallback { finish(true, "") }.setErrorCallback { t -> finish(false, t.javaClass.simpleName + " " + (t.message ?: "")) }
        }
        remote?.let { r -> if (r.isConnected) { go(r); return } }
        if (!SpotifyAppRemote.isSpotifyInstalled(ctx)) { finish(false, "Spotify isn't installed"); return }
        val params = ConnectionParams.Builder(clientId).setRedirectUri(REDIRECT).showAuthView(true).build()
        SpotifyAppRemote.connect(ctx, params, object : Connector.ConnectionListener {
            override fun onConnected(r: SpotifyAppRemote) { remote = r; go(r) }
            override fun onFailure(t: Throwable) { finish(false, t.javaClass.simpleName + " " + (t.message ?: "")) }
        })
    }

    // ---------- what Spotify is playing (is it an album?) ----------

    @Volatile var contextJson = ""; private set
    @Volatile private var watching = false
    private var lastSeenList = ""

    /** While PHONY is on screen, ask Spotify every few seconds whether it's playing an album. */
    fun watch(on: Boolean) {
        if (on == watching) return
        watching = on
        if (!on) return
        Thread {
            while (watching) {
                if (canPlay && remoteWatcher.enabled && !online()) contextJson = ""   // no signal: no answer, rather than yesterday's
                else if (canPlay && remoteWatcher.enabled) {
                    contextJson = try {
                        val body = api("GET", "https://api.spotify.com/v1/me/player/currently-playing", null)
                        if (body.isBlank()) "" else {
                            val j = JSONObject(body)
                            val ctxObj = j.optJSONObject("context")
                            val alb = j.optJSONObject("item")?.optJSONObject("album")
                            val type = ctxObj?.optString("type") ?: ""
                            val cu = ctxObj?.optString("uri") ?: ""
                            if (type == "playlist" && cu != lastSeenList) { lastSeenList = cu; markPlayed(cu) }
                            JSONObject()
                                .put("type", type)
                                .put("uri", ctxObj?.optString("uri") ?: "")
                                .put("album", alb?.optString("name") ?: "")
                                .put("albumUri", alb?.optString("uri") ?: "")
                                .toString()
                        }
                    } catch (e: Exception) { contextJson }
                }
                try { Thread.sleep(4000) } catch (e: InterruptedException) { }
            }
        }.start()
    }

    private fun api(method: String, u: String, body: String?): String {
        val c = URL(u).openConnection() as HttpURLConnection
        c.requestMethod = method; c.connectTimeout = 10000; c.readTimeout = 15000
        c.setRequestProperty("Authorization", "Bearer " + accessToken())
        if (body != null) {
            c.doOutput = true
            c.setRequestProperty("Content-Type", "application/json")
            c.outputStream.use { it.write(body.toByteArray()) }
        } else if (method == "PUT") c.setFixedLengthStreamingMode(0)
        try {
            val code = c.responseCode
            if (code == 401) access = null
            if (code == 204) return ""
            if (code !in 200..299) {
                val msg = try { JSONObject(c.errorStream.bufferedReader().use { it.readText() }).optJSONObject("error")?.optString("message") } catch (e: Exception) { null }
                throw IllegalStateException("$code" + if (msg.isNullOrEmpty()) "" else " $msg")
            }
            return c.inputStream.bufferedReader().use { it.readText() }
        } finally { c.disconnect() }
    }

    /** A Web API read for the liner notes (null when signed out or it fails). */
    /** Null when signed out or Spotify says no; throws IOException when there's no signal. */
    fun webGet(u: String): JSONObject? = if (!signedIn) null else try { JSONObject(api("GET", u, null)) } catch (e: java.io.IOException) { throw e } catch (e: Exception) { null }

    /** Play an album from a given song (0 = the first). Needs the play permission; done() on the main thread. */
    fun playAt(uri: String, index: Int, done: (Boolean, String) -> Unit) {
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        Thread {
            val r = if (!online()) "no signal" else try { playWeb(uri, index); null } catch (e: Exception) { e.message ?: e.javaClass.simpleName }
            if (r == null) { main.post { done(true, "") }; return@Thread }
            // no signal (or Spotify said no): App Remote can jump to a song on an album it has downloaded
            main.post {
                val go = { ar: SpotifyAppRemote -> ar.playerApi.skipToIndex(uri, index).setResultCallback { done(true, "app remote") }.setErrorCallback { t -> done(false, r + "; app remote: " + (t.message ?: t.javaClass.simpleName)) } }
                remote?.takeIf { it.isConnected }?.let { go(it); return@post }
                if (!SpotifyAppRemote.isSpotifyInstalled(ctx)) { done(false, r); return@post }
                val params = ConnectionParams.Builder(clientId).setRedirectUri(REDIRECT).showAuthView(true).build()
                SpotifyAppRemote.connect(ctx, params, object : Connector.ConnectionListener {
                    override fun onConnected(ar: SpotifyAppRemote) { remote = ar; go(ar) }
                    override fun onFailure(t: Throwable) { done(false, r + "; app remote: " + (t.message ?: t.javaClass.simpleName)) }
                })
            }
        }.start()
    }

    fun release() { remote?.let { SpotifyAppRemote.disconnect(it) }; remote = null }

    // ---------- bits ----------

    private class HttpError(val code: Int, why: String = "") : Exception("HTTP $code" + if (why.isEmpty()) "" else " $why")

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")
    private fun b64url(b: ByteArray) = Base64.encodeToString(b, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    private fun randomString(n: Int): String {
        val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        val r = SecureRandom()
        return (1..n).map { chars[r.nextInt(chars.length)] }.joinToString("")
    }

}

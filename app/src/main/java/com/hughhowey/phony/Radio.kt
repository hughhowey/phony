package com.hughhowey.phony

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * "The radio": songs you heard out in the world and named with Shazam, waiting for the blank
 * tape. Three at most; a fourth pushes the oldest off (the DJ would have talked over it by now).
 *
 * Songs arrive three ways: Shazam's notification (PHONY reads Shazam's and nobody else's),
 * Shazam's Share button pointed at PHONY, or Shazam's own "My Shazam Tracks" playlist in Spotify.
 * Each is looked up on Spotify so the tape can play it, and stamped with where you were.
 */
class Radio private constructor(private val ctx: Context) {

    companion object {
        const val WAITING = 3
        @Volatile private var one: Radio? = null
        fun get(ctx: Context): Radio = one ?: synchronized(this) { one ?: Radio(ctx.applicationContext).also { one = it } }
    }

    private val file = File(ctx.filesDir, "radio.json")
    private val seenFile = File(ctx.filesDir, "radio-seen.json")
    var box: SpotifyBox? = null
    // the listener can run with PHONY closed, so without the app's Places it makes its own
    var places: Places? = null
    private val ownPlaces by lazy { Places(ctx) }
    var onChange: (() -> Unit)? = null
    /** A line for the page to show the next time it's open: what was just caught. */
    @Volatile var notice = ""; private set
    @Volatile var noticeId = 0; private set

    @Synchronized fun waitingJson(): String = if (file.exists()) file.readText() else "[]"

    // ---------- the real radio: what the station says is playing ----------

    @Volatile var onAirTitle = ""; private set
    @Volatile var onAirArtist = ""; private set
    @Volatile var onAirAt = 0L; private set
    private var lastRaw = ""

    /** A station's "Artist - Title" line. Real songs (with an artist) go on the radio for the blank tape; station idents don't. */
    fun onAir(raw: String) {
        val s = raw.trim()
        if (s == lastRaw) return
        lastRaw = s
        val cut = s.indexOf(" - ")
        onAirArtist = if (cut > 0) s.substring(0, cut).trim() else ""
        onAirTitle = if (cut > 0) s.substring(cut + 3).trim() else s
        onAirAt = System.currentTimeMillis()
        if (onAirTitle.isNotEmpty() && onAirArtist.isNotEmpty()) heard(onAirTitle, onAirArtist, "radio")
        onChange?.invoke()
    }

    fun onAirJson(): String = JSONObject().put("title", onAirTitle).put("artist", onAirArtist).put("at", onAirAt).toString()

    @Synchronized private fun list(): MutableList<JSONObject> {
        val a = try { JSONArray(waitingJson()) } catch (e: Exception) { JSONArray() }
        return (0 until a.length()).map { a.getJSONObject(it) }.toMutableList()
    }
    @Synchronized private fun save(l: List<JSONObject>) { file.writeText(JSONArray(l).toString()); onChange?.invoke() }

    /** A song heard: queue it (unless it's already waiting or was caught a moment ago). */
    fun heard(title: String, artist: String, how: String, uri: String = "", dur: Long = 0, album: String = "") {
        val t = title.trim(); val a = artist.trim()
        if (t.isEmpty()) return
        val key = (t + "|" + a).lowercase()
        synchronized(this) {
            val l = list()
            if (l.any { it.optString("key") == key }) return
            // the same song through two routes (notification, then the Spotify playlist): once is enough
            val seen = try { JSONObject(if (seenFile.exists()) seenFile.readText() else "{}") } catch (e: Exception) { JSONObject() }
            if (System.currentTimeMillis() - seen.optLong(key) < 6 * 3600_000) return
            seen.put(key, System.currentTimeMillis())
            if (seen.length() > 80) seen.keys().asSequence().toList().sortedBy { seen.optLong(it) }.take(seen.length() - 80).forEach { seen.remove(it) }
            seenFile.writeText(seen.toString())
            val o = JSONObject().put("key", key).put("title", t).put("artist", a).put("how", how).put("at", System.currentTimeMillis())
                .put("uri", uri).put("dur", dur).put("album", album)
            try { (places ?: ownPlaces).here().takeIf { it.isNotEmpty() }?.let { JSONObject(it) }?.let { h -> o.put("lat", h.optDouble("lat")).put("lon", h.optDouble("lon")).put("place", h.optString("place")) } } catch (e: Exception) { }
            l.add(o)
            while (l.size > WAITING) l.removeAt(0)
            save(l)
            // the real radio names a song every few minutes; those don't need announcing
            if (how != "radio") { notice = "On the radio: $t" + (if (a.isNotEmpty()) " · $a" else ""); noticeId++ }
        }
        if (uri.isEmpty()) resolveSoon()
    }

    /** Recorded, or skipped for good. */
    fun drop(key: String) = synchronized(this) { save(list().filter { it.optString("key") != key }) }

    /** Find the waiting songs on Spotify (needs a signal; tried again whenever the app opens). */
    fun resolveSoon() {
        val b = box ?: return
        Thread {
            val l = synchronized(this) { list() }
            var changed = false
            for (o in l) {
                if (o.optString("uri").isNotEmpty()) continue
                val hit = try { b.findTrack(o.optString("title"), o.optString("artist")) } catch (e: Exception) { null } ?: continue
                o.put("uri", hit.optString("uri")).put("dur", hit.optLong("dur")).put("album", hit.optString("album"))
                if (o.optString("artist").isEmpty()) o.put("artist", hit.optString("artist"))
                o.put("title", hit.optString("title").ifEmpty { o.optString("title") })
                changed = true
            }
            if (changed) synchronized(this) {
                // keep anything that arrived meanwhile
                val now = list(); val byKey = l.associateBy { it.optString("key") }
                save(now.map { byKey[it.optString("key")] ?: it })
            }
        }.start()
    }

    // ---------- the three ways in ----------

    /** Shazam's notifications. Only real results count: not "Listening…", "Auto Shazam is on" and the like. */
    fun fromNotification(pkg: String, title: String?, text: String?, big: String?, ongoing: Boolean) {
        if (!pkg.startsWith("com.shazam")) return
        val ti = (title ?: "").trim(); val tx = (big ?: text ?: "").trim()
        val chatter = Regex("(?i)shazam|listening|tap to|auto shazam|searching|no result|couldn.t|try again|offline|pending|syncing|update")
        if (ti.isEmpty() || tx.isEmpty()) return
        if (ongoing && chatter.containsMatchIn(ti + " " + tx)) return
        // "Song by Artist" in one line, or the song as the title and the artist below it
        Regex("^(.+?) by (.+)$").find(tx)?.takeIf { chatter.containsMatchIn(ti) }?.let { m -> heard(m.groupValues[1], m.groupValues[2], "shazam"); return }
        if (chatter.containsMatchIn(ti)) return
        heard(ti, tx.removePrefix("by ").trim(), "shazam")
    }

    /** Shazam's Share button: "I used Shazam to discover Song by Artist. https://www.shazam.com/track/…" */
    fun fromShare(text: String): Boolean {
        val s = text.trim()
        Regex("(?i)discover (.+) by (.+?)\\.?\\s+https?://").find(s)?.let { heard(it.groupValues[1], it.groupValues[2], "share"); return true }
        Regex("(?i)^(.+?) by (.+?)\\.?\\s*(https?://\\S+)?$").find(s)?.let { heard(it.groupValues[1], it.groupValues[2], "share"); return true }
        // just a link: the song's name is in it (shazam.com/track/123/song-name-artist)
        Regex("(?i)shazam\\.com/(?:[a-z-]+/)?(?:track|song)/\\d+/([a-z0-9-]+)").find(s)?.let { heard(it.groupValues[1].replace('-', ' '), "", "share"); return true }
        val before = s.substringBefore("http").trim()
        if (before.isNotEmpty()) { heard(before, "", "share"); return true }
        return false
    }
}

package com.fitech.app

import android.content.Intent
import android.media.AudioManager
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MediaButton")
class MediaButtonPlugin : Plugin() {

    companion object {
        private const val TAP_WINDOW_MS = 400L
        var instance: MediaButtonPlugin? = null
    }

    private var mediaSession: MediaSession? = null
    private var tapCount = 0
    private var lastTapTime = 0L
    private val handler = Handler(Looper.getMainLooper())
    private var pendingTap: Runnable? = null

    override fun load() {
        instance = this
        try {
            setupMediaSession()
        } catch (e: Exception) {
            android.util.Log.e("MediaButtonPlugin", "setupMediaSession failed", e)
        }
    }

    private fun setupMediaSession() {
        val audioManager = context.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager

        // Request audio focus so the system routes media button events to us
        @Suppress("DEPRECATION")
        audioManager.requestAudioFocus(
            { },
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN
        )

        val session = MediaSession(context, "FiTechSession")

        session.setCallback(object : MediaSession.Callback() {
            override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
                val event = mediaButtonIntent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
                    ?: return false
                if (event.action == KeyEvent.ACTION_DOWN) {
                    return handleTap(event.keyCode)
                }
                return false
            }

            // Called by some earbuds for play/pause
            override fun onPlay() { handleTap(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) }
            override fun onPause() { handleTap(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) }
        })

        // Must set an active PlaybackState so Android routes media buttons to this session
        val state = PlaybackState.Builder()
            .setActions(
                PlaybackState.ACTION_PLAY_PAUSE or
                PlaybackState.ACTION_PLAY or
                PlaybackState.ACTION_PAUSE
            )
            .setState(PlaybackState.STATE_PLAYING, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f)
            .build()

        session.setPlaybackState(state)
        session.isActive = true
        mediaSession = session
    }

    @PluginMethod
    fun startListening(call: PluginCall) {
        if (mediaSession == null) {
            try {
                setupMediaSession()
            } catch (e: Exception) {
                android.util.Log.e("MediaButtonPlugin", "setupMediaSession failed", e)
                call.reject("MediaSession setup failed: ${e.message}")
                return
            }
        }
        call.resolve()
    }

    // Also called from MainActivity.dispatchKeyEvent as a backup for wired earbuds
    fun handleTap(keyCode: Int): Boolean {
        if (keyCode != KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE &&
            keyCode != KeyEvent.KEYCODE_HEADSETHOOK &&
            keyCode != KeyEvent.KEYCODE_MEDIA_PLAY &&
            keyCode != KeyEvent.KEYCODE_MEDIA_PAUSE) {
            return false
        }

        val now = System.currentTimeMillis()
        pendingTap?.let { handler.removeCallbacks(it) }

        if (now - lastTapTime < TAP_WINDOW_MS) {
            tapCount++
        } else {
            tapCount = 1
        }
        lastTapTime = now

        pendingTap = Runnable {
            val eventName = when {
                tapCount >= 3 -> "tripleTap"
                tapCount == 2 -> "doubleTap"
                else          -> "singleTap"
            }
            notifyListeners(eventName, JSObject())
            tapCount = 0
        }
        handler.postDelayed(pendingTap!!, TAP_WINDOW_MS)
        return true
    }

    override fun handleOnDestroy() {
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
        instance = null
    }
}

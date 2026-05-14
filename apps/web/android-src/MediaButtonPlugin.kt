package com.fitech.app

import android.media.AudioManager
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
        // Time window to wait for additional taps before firing event
        private const val TAP_WINDOW_MS = 400L
        var instance: MediaButtonPlugin? = null
    }

    private var tapCount = 0
    private var lastTapTime = 0L
    private val handler = Handler(Looper.getMainLooper())
    private var pendingTap: Runnable? = null

    override fun load() {
        instance = this
        requestAudioFocus()
    }

    private fun requestAudioFocus() {
        try {
            val audioManager = context.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                { },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
        } catch (_: Exception) {}
    }

    @PluginMethod
    fun startListening(call: PluginCall) {
        requestAudioFocus()
        call.resolve()
    }

    // Called by MainActivity when a media key event is received
    fun onMediaButton(keyCode: Int): Boolean {
        if (keyCode != KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE &&
            keyCode != KeyEvent.KEYCODE_HEADSETHOOK) {
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
}

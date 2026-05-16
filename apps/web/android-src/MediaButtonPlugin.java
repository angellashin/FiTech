package com.fitech.app;

import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaButton")
public class MediaButtonPlugin extends Plugin {

    public static MediaButtonPlugin instance = null;

    // Wired earbud fallback: counts rapid HEADSETHOOK presses within this window.
    private static final long TAP_WINDOW_MS = 600L;
    private MediaSession mediaSession = null;
    private AudioTrack silentTrack = null;
    private int tapCount = 0;
    private long lastTapTime = 0L;
    private Handler handler = null;
    private Runnable pendingTap = null;

    @Override
    public void load() {
        instance = this;
        handler = new Handler(Looper.getMainLooper());
    }

    private void startSilentAudio() {
        // Android only routes media buttons to the "current media app" when it's
        // actively playing audio. We loop a 1-second silent PCM buffer so the OS
        // treats FiTech as a playing audio app and routes earbud button events here.
        try {
            int sampleRate = 8000;
            int numSamples = sampleRate;
            int bufferBytes = numSamples * 2;

            silentTrack = new AudioTrack(
                    AudioManager.STREAM_MUSIC,
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferBytes,
                    AudioTrack.MODE_STATIC);

            silentTrack.write(new short[numSamples], 0, numSamples);
            silentTrack.setLoopPoints(0, numSamples, -1);
            silentTrack.play();
        } catch (Throwable e) {
            android.util.Log.w("MediaButtonPlugin", "Silent audio setup failed: " + e);
        }
    }

    private void setupMediaSession() {
        AudioManager audioManager = (AudioManager)
                getContext().getSystemService(android.content.Context.AUDIO_SERVICE);

        //noinspection deprecation
        audioManager.requestAudioFocus(
                focusChange -> { },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN);

        startSilentAudio();

        MediaSession session = new MediaSession(getContext(), "FiTechSession");

        session.setCallback(new MediaSession.Callback() {
            // Bluetooth earbuds send AVRCP commands — the earbud firmware handles
            // multi-tap detection internally and sends already-interpreted commands:
            //   1 tap  → onPlay / onPause / onMediaButtonEvent(PLAY_PAUSE)
            //   2 taps → onSkipToNext / onMediaButtonEvent(MEDIA_NEXT)
            //   3 taps → onSkipToPrevious / onMediaButtonEvent(MEDIA_PREVIOUS)
            // Wired earbuds send raw HEADSETHOOK keypresses, so we still count those.

            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                //noinspection deprecation
                KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (event == null || event.getAction() != KeyEvent.ACTION_DOWN) return false;
                return handleKeyCode(event.getKeyCode());
            }

            @Override public void onPlay()           { fireTap("singleTap"); }
            @Override public void onPause()          { fireTap("singleTap"); }
            @Override public void onSkipToNext()     { fireTap("doubleTap"); }
            @Override public void onSkipToPrevious() { fireTap("tripleTap"); }
        });

        PlaybackState state = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_PLAY
                        | PlaybackState.ACTION_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT
                        | PlaybackState.ACTION_SKIP_TO_PREVIOUS)
                .setState(PlaybackState.STATE_PLAYING,
                        PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f)
                .build();

        session.setPlaybackState(state);
        session.setActive(true);
        mediaSession = session;
    }

    // Called from MediaSession.Callback for already-interpreted AVRCP commands.
    private void fireTap(String eventName) {
        if (handler == null) return;
        handler.post(() -> {
            notifyListeners(eventName, new JSObject());
        });
    }

    // Routes a raw keycode. Bluetooth earbuds arriving here are already AVRCP-mapped;
    // wired HEADSETHOOK is counted within a time window.
    public boolean handleKeyCode(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_MEDIA_NEXT:
                fireTap("doubleTap");
                return true;
            case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
                fireTap("tripleTap");
                return true;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
            case KeyEvent.KEYCODE_HEADSETHOOK:
                countWiredTap();
                return true;
            default:
                return false;
        }
    }

    // Tap-counting for wired earbuds that send repeated HEADSETHOOK events.
    private void countWiredTap() {
        if (handler == null) return;
        long now = System.currentTimeMillis();
        if (pendingTap != null) handler.removeCallbacks(pendingTap);

        if (now - lastTapTime < TAP_WINDOW_MS) {
            tapCount++;
        } else {
            tapCount = 1;
        }
        lastTapTime = now;

        pendingTap = new Runnable() {
            @Override
            public void run() {
                String eventName;
                if (tapCount >= 3)    eventName = "tripleTap";
                else if (tapCount == 2) eventName = "doubleTap";
                else                  eventName = "singleTap";
                notifyListeners(eventName, new JSObject());
                tapCount = 0;
            }
        };
        handler.postDelayed(pendingTap, TAP_WINDOW_MS);
    }

    // Legacy entry point kept for MainActivity.dispatchKeyEvent (wired earbud backup).
    public boolean handleTap(int keyCode) {
        return handleKeyCode(keyCode);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (mediaSession == null) {
            try {
                setupMediaSession();
            } catch (Throwable e) {
                android.util.Log.e("MediaButtonPlugin", "setupMediaSession failed: " + e);
                call.reject("MediaSession setup failed: " + e.getMessage());
                return;
            }
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (silentTrack != null) {
            try { silentTrack.stop(); silentTrack.release(); } catch (Throwable e) { /* ignore */ }
            silentTrack = null;
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        instance = null;
        handler = null;
    }
}

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

    private static final long TAP_WINDOW_MS = 400L;
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
            int numSamples = sampleRate; // 1 second
            int bufferBytes = numSamples * 2; // 16-bit PCM = 2 bytes/sample

            silentTrack = new AudioTrack(
                    AudioManager.STREAM_MUSIC,
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferBytes,
                    AudioTrack.MODE_STATIC);

            silentTrack.write(new short[numSamples], 0, numSamples); // all zeros = silence
            silentTrack.setLoopPoints(0, numSamples, -1);            // loop forever
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
                focusChange -> { /* no-op: we keep focus */ },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN);

        // Play silent audio so Android treats us as the active media app and
        // routes Bluetooth/wired earbud button events to our MediaSession.
        startSilentAudio();

        MediaSession session = new MediaSession(getContext(), "FiTechSession");

        session.setCallback(new MediaSession.Callback() {
            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                //noinspection deprecation
                KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                if (event == null) return false;
                if (event.getAction() == KeyEvent.ACTION_DOWN) {
                    return handleTap(event.getKeyCode());
                }
                return false;
            }

            @Override
            public void onPlay() { handleTap(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE); }

            @Override
            public void onPause() { handleTap(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE); }
        });

        PlaybackState state = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_PLAY
                        | PlaybackState.ACTION_PAUSE)
                .setState(PlaybackState.STATE_PLAYING,
                        PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1f)
                .build();

        session.setPlaybackState(state);
        session.setActive(true);
        mediaSession = session;
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

    public boolean handleTap(int keyCode) {
        if (keyCode != KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                && keyCode != KeyEvent.KEYCODE_HEADSETHOOK
                && keyCode != KeyEvent.KEYCODE_MEDIA_PLAY
                && keyCode != KeyEvent.KEYCODE_MEDIA_PAUSE) {
            return false;
        }

        if (handler == null) return false;

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
                if (tapCount >= 3) eventName = "tripleTap";
                else if (tapCount == 2) eventName = "doubleTap";
                else eventName = "singleTap";
                notifyListeners(eventName, new JSObject());
                tapCount = 0;
            }
        };
        handler.postDelayed(pendingTap, TAP_WINDOW_MS);
        return true;
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

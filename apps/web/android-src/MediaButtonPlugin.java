package com.fitech.app;

import android.content.Intent;
import android.media.AudioManager;
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
    private int tapCount = 0;
    private long lastTapTime = 0L;
    private Handler handler = null;
    private Runnable pendingTap = null;

    @Override
    public void load() {
        instance = this;
        handler = new Handler(Looper.getMainLooper());
    }

    private void setupMediaSession() {
        AudioManager audioManager = (AudioManager)
                getContext().getSystemService(android.content.Context.AUDIO_SERVICE);

        //noinspection deprecation
        audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);

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
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        instance = null;
        handler = null;
    }
}

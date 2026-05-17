package com.fitech.app;

import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.TextToSpeech.OnInitListener;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Locale;

@CapacitorPlugin(name = "FiTechTTS")
public class FiTechTTSPlugin extends Plugin implements OnInitListener {

    private TextToSpeech tts = null;
    private boolean initialized = false;

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), this);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int result = tts.setLanguage(Locale.US);
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                initialized = true;
            } else {
                // Fall back to device default locale
                tts.setLanguage(Locale.getDefault());
                initialized = true;
            }
        }
        android.util.Log.d("FiTechTTS", "onInit status=" + status + " initialized=" + initialized);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        float rate = call.getFloat("rate", 1.0f);
        float pitch = call.getFloat("pitch", 1.0f);

        if (text == null || text.isEmpty()) {
            call.resolve();
            return;
        }
        if (!initialized || tts == null) {
            android.util.Log.w("FiTechTTS", "TTS not initialized yet");
            call.resolve();
            return;
        }

        tts.setSpeechRate(rate);
        tts.setPitch(pitch);

        String utteranceId = "fitech_" + System.currentTimeMillis();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
        } else {
            //noinspection deprecation
            HashMap<String, String> params = new HashMap<>();
            params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);
            //noinspection deprecation
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
        }
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (initialized && tts != null) {
            tts.stop();
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        initialized = false;
    }
}

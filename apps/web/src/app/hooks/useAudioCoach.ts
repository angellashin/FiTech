import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FiTechTTS } from '../lib/fitechTTS';

export function useAudioCoach(enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Native Android: always supported via the custom FiTechTTS Java plugin
      setIsSupported(true);
    } else {
      setIsSupported(
        typeof window !== 'undefined' &&
          'speechSynthesis' in window &&
          'SpeechSynthesisUtterance' in window,
      );
      // Pre-warm the voice list — Android WebView loads voices lazily.
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    }
  }, []);

  const speak = useCallback(
    async (message: string) => {
      if (!enabled || !message) return;

      // --- Native Android path (custom FiTechTTS Java plugin) ---
      if (Capacitor.isNativePlatform()) {
        try {
          await FiTechTTS.stop();
          await FiTechTTS.speak({ text: message, rate: 0.95, pitch: 1.0 });
        } catch (err) {
          android_log('TTS speak failed: ' + String(err));
        }
        return;
      }

      // --- Browser path (Web Speech API) ---
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 0.9;

      // Explicitly select a voice — required on some platforms.
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const voice =
          voices.find((v) => v.lang === 'en-US') ??
          voices.find((v) => v.lang.startsWith('en')) ??
          voices[0];
        if (voice) utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  const stop = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await FiTechTTS.stop();
      } catch {
        // ignore
      }
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return { isSupported, speak, stop };
}

function android_log(_msg: string) {
  // no-op in production; useful for debugging
}

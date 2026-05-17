import { useCallback, useEffect, useState } from 'react';

export function useAudioCoach(enabled: boolean) {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        'SpeechSynthesisUtterance' in window,
    );
    // Pre-warm the voice list — Android WebView loads voices lazily and
    // won't produce audio if no voice is selected when speak() is called.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speak = useCallback(
    (message: string) => {
      if (!enabled || !message || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 0.9;

      // Android WebView requires an explicit voice; without one it silently
      // does nothing. Pick the first en-US voice, fall back to any English
      // voice, then use whatever is available.
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

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { isSupported, speak, stop };
}

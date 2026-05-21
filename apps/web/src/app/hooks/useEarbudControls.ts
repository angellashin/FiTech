import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { MediaButton, type EarbudTapEvent } from '../lib/mediaButton';

export type EarbudPlatform = 'capacitor' | 'mediasession' | 'unsupported';

export interface EarbudHandlers {
  onSingleTap: () => void;
  onDoubleTap: () => void;
  onTripleTap: () => void;
}

export interface EarbudDiagnostics {
  platform: EarbudPlatform;
  active: boolean;
  isAudioPlaying: boolean;
  rawEventCount: number;
  lastRawEvent: string | null;
  lastTapKind: EarbudTapEvent | null;
  lastTapAt: number | null;
  errors: string[];
}

export interface EarbudControls {
  diagnostics: EarbudDiagnostics;
  /** Call this inside a user-gesture handler to force the silent audio to play. */
  activateAudio: () => void;
}

const TAP_WINDOW_MS = 400;

// Generate a short silent WAV blob URL. MediaSession action handlers only fire
// reliably when the browser thinks the page is playing audio, so we loop a
// silent audio element while the session is active.
function makeSilentAudioUrl(): string {
  const sampleRate = 8000;
  const durationSec = 1;
  const numSamples = durationSec * sampleRate;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

export function useEarbudControls(handlers: EarbudHandlers, enabled = true): EarbudControls {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Keep a ref to the silent audio element so activateAudio() can reach it
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [diagnostics, setDiagnostics] = useState<EarbudDiagnostics>(() => ({
    platform: 'unsupported',
    active: false,
    isAudioPlaying: false,
    rawEventCount: 0,
    lastRawEvent: null,
    lastTapKind: null,
    lastTapAt: null,
    errors: [],
  }));

  /** Must be called from inside a user-gesture handler (click / touchend). */
  const activateAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) return; // already playing
    audio.play().catch(() => {});
  }, []);

  // Mutable counters that don't need to trigger re-render every tap
  const stateRef = useRef({
    rawEventCount: 0,
    tapCount: 0,
    lastTapAt: 0,
    pendingTimer: null as ReturnType<typeof setTimeout> | null,
  });

  const recordEvent = (rawEvent: string) => {
    stateRef.current.rawEventCount += 1;
    setDiagnostics((prev) => ({
      ...prev,
      rawEventCount: stateRef.current.rawEventCount,
      lastRawEvent: rawEvent,
    }));
  };

  const fireTap = (kind: EarbudTapEvent) => {
    setDiagnostics((prev) => ({
      ...prev,
      lastTapKind: kind,
      lastTapAt: Date.now(),
    }));
    if (kind === 'singleTap') handlersRef.current.onSingleTap();
    else if (kind === 'doubleTap') handlersRef.current.onDoubleTap();
    else handlersRef.current.onTripleTap();
  };

  // Used only for the browser path. Capacitor plugin handles its own windowing.
  const registerBrowserTap = (rawEvent: string) => {
    recordEvent(rawEvent);
    const now = Date.now();
    const s = stateRef.current;
    if (s.pendingTimer) clearTimeout(s.pendingTimer);
    s.tapCount = now - s.lastTapAt < TAP_WINDOW_MS ? s.tapCount + 1 : 1;
    s.lastTapAt = now;
    s.pendingTimer = setTimeout(() => {
      const count = s.tapCount;
      s.tapCount = 0;
      if (count >= 3) fireTap('tripleTap');
      else if (count === 2) fireTap('doubleTap');
      else fireTap('singleTap');
    }, TAP_WINDOW_MS);
  };

  useEffect(() => {
    if (!enabled) return;

    // --- Capacitor (Android APK) path ---
    if (Capacitor.isNativePlatform()) {
      let cleanup: Array<() => void> = [];
      let cancelled = false;

      const setup = async () => {
        try {
          await MediaButton.startListening();
          if (cancelled) return;

          const wire = async (event: EarbudTapEvent) => {
            const handle = (await MediaButton.addListener(event, () => {
              recordEvent(event);
              fireTap(event);
            })) as PluginListenerHandle;
            cleanup.push(() => {
              void handle.remove();
            });
          };

          await wire('singleTap');
          await wire('doubleTap');
          await wire('tripleTap');

          setDiagnostics((prev) => ({ ...prev, platform: 'capacitor', active: true }));
        } catch (err) {
          setDiagnostics((prev) => ({
            ...prev,
            platform: 'capacitor',
            active: false,
            errors: [...prev.errors, `Capacitor setup failed: ${String(err)}`],
          }));
        }
      };

      void setup();

      return () => {
        cancelled = true;
        cleanup.forEach((fn) => fn());
        cleanup = [];
        setDiagnostics((prev) => ({ ...prev, active: false }));
      };
    }

    // --- Browser (MediaSession) path ---
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      setDiagnostics((prev) => ({ ...prev, platform: 'unsupported', active: false }));
      return;
    }

    const audioUrl = makeSilentAudioUrl();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.loop = true;
    // Volume 1.0 on an all-zero (silent) WAV = no audible output, but Android's
    // audio-focus system sees "volume > 0 media playing" and routes AVRCP
    // (Bluetooth media-button) events to Chrome. Lower values can fail this check.
    audio.volume = 1.0;
    audio.preload = 'auto';
    // Attach to DOM — some Android Chrome builds require the element to be in the
    // document tree before they register the media session for AVRCP routing.
    audio.style.display = 'none';
    document.body.appendChild(audio);

    // Track whether audio is actually playing so we can surface it in diagnostics.
    const onPlay = () => setDiagnostics((prev) => ({ ...prev, isAudioPlaying: true }));
    const onPause = () => setDiagnostics((prev) => ({ ...prev, isAudioPlaying: false }));
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Autoplay may be blocked on mobile — retry on every user gesture until it succeeds.
    const tryPlay = () => {
      if (!audio.paused) return;
      audio.play().catch(() => {});
    };

    const onGesture = () => tryPlay();
    document.addEventListener('touchstart', onGesture);
    document.addEventListener('click', onGesture);

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay blocked — will play on next user gesture via the listeners above
      });
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'FiTech Workout',
        artist: 'FiTech',
      });
      navigator.mediaSession.playbackState = 'playing';

      // iOS converts physical button multi-press into distinct events at the OS level:
      //   single press  → 'pause' / 'play'
      //   double press  → 'nexttrack'        (one event, not two play events)
      //   triple press  → 'previoustrack'    (one event, not three play events)
      // So nexttrack / previoustrack must map DIRECTLY to doubleTap / tripleTap,
      // while play/pause go through the accumulator for devices that fire multiple events.
      const onAccumulate = (event: string) => () => registerBrowserTap(event);
      navigator.mediaSession.setActionHandler('play', onAccumulate('play'));
      navigator.mediaSession.setActionHandler('pause', onAccumulate('pause'));
      // Direct mapping for iOS double/triple press
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        recordEvent('nexttrack');
        fireTap('doubleTap');
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        recordEvent('previoustrack');
        fireTap('tripleTap');
      });
      // Some earbuds use seekforward/seekbackward instead of next/previous
      try {
        navigator.mediaSession.setActionHandler('seekforward', onAccumulate('seekforward'));
      } catch {
        // Optional MediaSession action is not supported in every browser.
      }
      try {
        navigator.mediaSession.setActionHandler('seekbackward', onAccumulate('seekbackward'));
      } catch {
        // Optional MediaSession action is not supported in every browser.
      }

      setDiagnostics((prev) => ({ ...prev, platform: 'mediasession', active: true }));
    } catch (err) {
      setDiagnostics((prev) => ({
        ...prev,
        errors: [...prev.errors, `MediaSession setup failed: ${String(err)}`],
      }));
    }

    return () => {
      document.removeEventListener('touchstart', onGesture);
      document.removeEventListener('click', onGesture);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audioRef.current = null;
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        try {
          navigator.mediaSession.setActionHandler('seekforward', null);
        } catch {
          // Optional MediaSession action is not supported in every browser.
        }
        try {
          navigator.mediaSession.setActionHandler('seekbackward', null);
        } catch {
          // Optional MediaSession action is not supported in every browser.
        }
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // ignore
      }
      audio.pause();
      audio.src = '';
      if (audio.parentNode) audio.parentNode.removeChild(audio);
      URL.revokeObjectURL(audioUrl);
      // Reading stateRef.current here is intentional — we want the latest
      // pendingTimer at unmount time, not the one captured when the effect ran.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const s = stateRef.current;
      if (s.pendingTimer) clearTimeout(s.pendingTimer);
      setDiagnostics((prev) => ({ ...prev, active: false, isAudioPlaying: false }));
    };
    // We intentionally only re-run when `enabled` toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { diagnostics, activateAudio };
}

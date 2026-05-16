import { useEffect, useRef, useState } from 'react';
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
  rawEventCount: number;
  lastRawEvent: string | null;
  lastTapKind: EarbudTapEvent | null;
  lastTapAt: number | null;
  errors: string[];
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

export function useEarbudControls(handlers: EarbudHandlers, enabled = true): EarbudDiagnostics {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const [diagnostics, setDiagnostics] = useState<EarbudDiagnostics>(() => ({
    platform: 'unsupported',
    active: false,
    rawEventCount: 0,
    lastRawEvent: null,
    lastTapKind: null,
    lastTapAt: null,
    errors: [],
  }));

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
    audio.loop = true;
    audio.volume = 0.0001; // effectively silent but not exactly 0 (some browsers treat 0 as "not playing")
    audio.preload = 'auto';

    const playPromise = audio.play();
    // Autoplay may be rejected if there's no user gesture yet.
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        setDiagnostics((prev) => ({
          ...prev,
          errors: [
            ...prev.errors,
            `Silent audio autoplay blocked (${String(err)}). Tap once on screen first.`,
          ],
        }));
      });
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'FiTech Workout',
        artist: 'FiTech',
      });
      navigator.mediaSession.playbackState = 'playing';

      const onPress = (event: string) => () => registerBrowserTap(event);
      navigator.mediaSession.setActionHandler('play', onPress('play'));
      navigator.mediaSession.setActionHandler('pause', onPress('pause'));
      // Some earbuds fire next/previous on multi-press
      navigator.mediaSession.setActionHandler('nexttrack', onPress('nexttrack'));
      navigator.mediaSession.setActionHandler('previoustrack', onPress('previoustrack'));

      setDiagnostics((prev) => ({ ...prev, platform: 'mediasession', active: true }));
    } catch (err) {
      setDiagnostics((prev) => ({
        ...prev,
        errors: [...prev.errors, `MediaSession setup failed: ${String(err)}`],
      }));
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // ignore
      }
      audio.pause();
      audio.src = '';
      URL.revokeObjectURL(audioUrl);
      // Reading stateRef.current here is intentional — we want the latest
      // pendingTimer at unmount time, not the one captured when the effect ran.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const s = stateRef.current;
      if (s.pendingTimer) clearTimeout(s.pendingTimer);
      setDiagnostics((prev) => ({ ...prev, active: false }));
    };
    // We intentionally only re-run when `enabled` toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return diagnostics;
}

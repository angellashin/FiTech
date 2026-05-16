import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type EarbudTapEvent = 'singleTap' | 'doubleTap' | 'tripleTap';

export interface MediaButtonPlugin {
  startListening(): Promise<void>;
  addListener(
    event: EarbudTapEvent,
    cb: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export const MediaButton = registerPlugin<MediaButtonPlugin>('MediaButton');

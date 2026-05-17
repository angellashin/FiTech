import { registerPlugin } from '@capacitor/core';

export interface FiTechTTSPlugin {
  speak(options: { text: string; rate?: number; pitch?: number }): Promise<void>;
  stop(): Promise<void>;
}

// Registers the native Android plugin by name "FiTechTTS" (matches @CapacitorPlugin(name = "FiTechTTS") in Java)
export const FiTechTTS = registerPlugin<FiTechTTSPlugin>('FiTechTTS');

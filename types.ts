export type GenerationMode = 'single' | 'multi';

export interface Speaker {
  name: string;
  voice: string;
}

export interface Preset {
  id: string;
  name: string;
  mode?: GenerationMode; // Optional for backward compatibility, defaults to 'single'
  voice: string;         // Primary voice for single mode
  speakers?: Speaker[];  // For multi mode
  systemInstruction: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: string; // Stores primary voice or "Multi-Speaker"
  timestamp: number;
  audioUrl: string; // Blob URL
  duration: number; // in seconds
}

export interface VoiceOption {
  value: string;
  label: string;
  gender: 'Male' | 'Female' | 'Neutral';
}

export interface Tab {
  id: string;
  title: string;
  text: string;
  
  // Config
  mode: GenerationMode;
  voice: string;        // Used for Single Mode
  speakers: Speaker[];  // Used for Multi Mode (must be length 2)
  systemInstruction: string;
  
  // State
  isGenerating: boolean;
  error: string | null;
}
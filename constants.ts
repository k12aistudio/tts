import { VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { value: 'Puck', label: 'Puck', gender: 'Male' },
  { value: 'Charon', label: 'Charon', gender: 'Male' },
  { value: 'Kore', label: 'Kore', gender: 'Female' },
  { value: 'Fenrir', label: 'Fenrir', gender: 'Male' },
  {value: 'Achernar',label: 'Achernar',gender:'Female'},
];

export const DEFAULT_INSTRUCTION = "Speak clearly and naturally.";

export const DEFAULT_PRESETS = [
  // Kore Presets
  {
    id: 'kore-std',
    name: 'Kore - Standard Narration',
    voice: 'Kore',
    systemInstruction: 'You are a professional narrator. Speak clearly, at a moderate pace, with a warm and engaging tone.',
  },
  {
    id: 'kore-calm',
    name: 'Kore - Calm Meditation',
    voice: 'Kore',
    systemInstruction: 'Speak in a slow, soothing, and soft whispery tone suitable for meditation or relaxation content.',
  },
  
{
  id: 'Achernar-Soft',
  name: 'Achernar - Soft',
  voice: 'Achernar',
  systemInstruction: 'Speak in a clear, calm, and encouraging tone, with a focus on clear articulation and patient explanation of concepts.'
},
  
  // Puck Presets
  {
    id: 'puck-story',
    name: 'Puck - Expressive Storyteller',
    voice: 'Puck',
    systemInstruction: 'You are an expressive storyteller. Use dynamic intonation, pauses for effect, and convey emotion and suspense.',
  },
  {
    id: 'puck-energetic',
    name: 'Puck - Energetic Promo',
    voice: 'Puck',
    systemInstruction: 'Speak with high energy, enthusiasm, and a faster pace. Perfect for commercials or exciting announcements.',
  },

  // Charon Presets
  {
    id: 'charon-news',
    name: 'Charon - News Anchor',
    voice: 'Charon',
    systemInstruction: 'Speak with a formal, authoritative, and objective tone like a professional news anchor.',
  },
  {
    id: 'charon-doc',
    name: 'Charon - Deep Documentary',
    voice: 'Charon',
    systemInstruction: 'Speak slowly and gravely with a deep, resonant tone suitable for a serious documentary or historical narration.',
  },

  // Fenrir Presets
  {
    id: 'fenrir-audiobook',
    name: 'Fenrir - Fantasy Audiobook',
    voice: 'Fenrir',
    systemInstruction: 'Speak with a rough, gritty, and dramatic tone suitable for fantasy or sci-fi character dialogue.',
  },
  {
    id: 'fenrir-instruct',
    name: 'Fenrir - Firm Instruction',
    voice: 'Fenrir',
    systemInstruction: 'Speak directly, firmly, and authoritatively. Clear and concise.',
  },
];

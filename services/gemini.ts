import { GoogleGenAI, Modality } from "@google/genai";
import { base64ToUint8Array, decodePcmData, audioBufferToWav } from "./audioUtils";
import { GenerationMode, Speaker } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

interface GenerateOptions {
  mode: GenerationMode;
  voiceName?: string; // For single mode
  speakers?: Speaker[]; // For multi mode (exactly 2)
  systemInstruction?: string;
}

export async function generateSpeech(
  text: string,
  options: GenerateOptions
): Promise<{ blob: Blob; duration: number }> {
  
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // Determine prompt based on mode
  let finalPrompt = text;
  
  // For Single mode, we might prepend system instructions.
  // For Multi mode, system instructions are also useful, but the prompt structure dictates the turn-taking.
  if (options.systemInstruction) {
    finalPrompt = `${options.systemInstruction}\n\n${text}`;
  }

  let speechConfig: any = {};

  if (options.mode === 'single') {
    if (!options.voiceName) throw new Error("Voice name required for single speaker mode.");
    speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: options.voiceName },
      },
    };
  } else {
    // Multi-speaker mode
    if (!options.speakers || options.speakers.length !== 2) {
      throw new Error("Multi-speaker mode requires exactly 2 defined speakers.");
    }
    
    speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: options.speakers.map(s => ({
          speaker: s.name,
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: s.voice }
          }
        }))
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [
        {
          parts: [{ text: finalPrompt }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: speechConfig,
      },
    });

    // Extract base64 audio data
    // The response structure for audio modality puts data in the first candidate's first part's inlineData
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini API. The config might be invalid.");
    }

    // Process Audio
    const pcmBytes = base64ToUint8Array(base64Audio);
    const audioBuffer = await decodePcmData(pcmBytes, 24000); // 24kHz is standard for this model
    const wavBlob = audioBufferToWav(audioBuffer);

    return {
      blob: wavBlob,
      duration: audioBuffer.duration
    };

  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    throw new Error(error.message || "Failed to generate speech.");
  }
}
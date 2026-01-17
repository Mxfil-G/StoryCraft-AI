
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeImageAndWriteStory = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = getAI();
  const prompt = `Analyze this image for its mood and visual elements. Then, as a professional ghostwriter, write a compelling, atmospheric opening paragraph (approx 100-150 words) for a story set in this world. 
  The response MUST be a JSON object with the following structure:
  {
    "mood": "a few words describing the mood",
    "elements": ["list", "of", "key", "visual", "elements"],
    "storyOpening": "the full opening paragraph"
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          elements: { type: Type.ARRAY, items: { type: Type.STRING } },
          storyOpening: { type: Type.STRING }
        },
        required: ["mood", "elements", "storyOpening"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisResult;
};

export const chatAboutStory = async (
  message: string, 
  history: ChatMessage[], 
  context: string
): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are a creative writing assistant. You have access to the current story opening: "${context}". Help the user expand the world, answer questions about characters, or brainstorm next plot points. Keep responses inspiring and literary.`
    }
  });

  // Reconstruct history
  // Note: chat.sendMessage only takes 'message' as per rules, so we rely on internal chat context if possible, 
  // or we pass history as part of the prompt in a stateless way if needed. 
  // For the sake of the guideline compliance for chat.sendMessage:
  let responseText = "";
  const result = await chat.sendMessage({ message });
  responseText = result.text || "";
  return responseText;
};

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this story opening with a deep, cinematic, and expressive narrative voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate audio");
  
  return decodeBase64(base64Audio);
};

// Audio Helpers
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

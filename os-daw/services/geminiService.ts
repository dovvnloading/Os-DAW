import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ProjectState } from "../types";

const SYSTEM_INSTRUCTION = `
You are "Os-Daw Assistant", an expert audio engineer and creative producer integrated into a web-based Digital Audio Workstation called Os-Daw.
Your goal is to assist the user with sound design, composition, and understanding the DAW's features.

You have access to the current "Project State" (BPM, Tracks, Synth Settings). 
When the user asks for help, analyze the provided JSON state to give context-aware advice.
For example, if they ask "Why is my synth quiet?", check the 'masterGain', 'attack', 'decay', or if the track is muted.

Keep responses concise, professional, and encouraging. Use technical terms correctly (ADSR, Oscillator, Filter Cutoff).
Do not be intrusive.
`;

let chatSession: Chat | null = null;

export const initChat = (apiKey: string) => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });
};

export const sendMessageToAi = async (message: string, projectState: ProjectState): Promise<string> => {
  if (!chatSession) {
    // Try to retrieve key from env if not explicitly passed earlier (though we rely on init)
    if (process.env.API_KEY) {
        initChat(process.env.API_KEY);
    } else {
        return "AI Assistant is not configured. Please ensure API_KEY is set in environment.";
    }
  }

  if(!chatSession) return "Error initializing AI.";

  // Inject state context invisibly to the user's prompt logic, or append it
  const contextPrompt = `
  [Current Project State JSON]:
  ${JSON.stringify({
    bpm: projectState.bpm,
    tracks: projectState.tracks.map(t => ({
      name: t.name,
      type: t.type,
      muted: t.muted,
      synthParams: t.type === 'synth' ? t.synthParams : 'N/A'
    }))
  })}
  
  User Query: ${message}
  `;

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message: contextPrompt });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};

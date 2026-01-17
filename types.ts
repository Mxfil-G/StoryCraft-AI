
export interface AnalysisResult {
  mood: string;
  elements: string[];
  storyOpening: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  image: string | null;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  isGeneratingAudio: boolean;
  chatHistory: ChatMessage[];
  isChatting: boolean;
}

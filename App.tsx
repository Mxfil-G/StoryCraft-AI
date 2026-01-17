
import React, { useState, useCallback, useRef } from 'react';
import { Header, Footer } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { analyzeImageAndWriteStory, generateSpeech, chatAboutStory, decodeAudioData } from './services/geminiService';
import { AppState, ChatMessage } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    analysis: null,
    isAnalyzing: false,
    isGeneratingAudio: false,
    chatHistory: [],
    isChatting: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setState(prev => ({ ...prev, image: base64, analysis: null, chatHistory: [] }));
        startAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (image: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
      const result = await analyzeImageAndWriteStory(image);
      setState(prev => ({ ...prev, analysis: result, isAnalyzing: false }));
    } catch (error) {
      console.error("Analysis failed:", error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleReadAloud = async () => {
    if (!state.analysis?.storyOpening || state.isGeneratingAudio) return;
    
    setState(prev => ({ ...prev, isGeneratingAudio: true }));
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioData = await generateSpeech(state.analysis.storyOpening);
      const buffer = await decodeAudioData(audioData, audioContextRef.current);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setState(prev => ({ ...prev, isGeneratingAudio: false }));
      source.start();
    } catch (error) {
      console.error("Audio generation failed:", error);
      setState(prev => ({ ...prev, isGeneratingAudio: false }));
    }
  };

  const handleSendMessage = async (msg: string) => {
    const newMsg: ChatMessage = { role: 'user', text: msg };
    setState(prev => ({ 
      ...prev, 
      chatHistory: [...prev.chatHistory, newMsg],
      isChatting: true 
    }));

    try {
      const context = state.analysis?.storyOpening || "";
      const response = await chatAboutStory(msg, state.chatHistory, context);
      const modelMsg: ChatMessage = { role: 'model', text: response };
      setState(prev => ({ 
        ...prev, 
        chatHistory: [...prev.chatHistory, modelMsg],
        isChatting: false 
      }));
    } catch (error) {
      console.error("Chat failed:", error);
      setState(prev => ({ ...prev, isChatting: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Image & Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div className="relative group rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-900 aspect-square flex items-center justify-center shadow-2xl transition-all hover:border-indigo-500/50">
              {state.image ? (
                <img src={state.image} alt="Uploaded" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-10">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <i className="fas fa-cloud-upload-alt text-slate-500 text-3xl"></i>
                  </div>
                  <h2 className="text-xl font-medium text-slate-300">Start Your Story</h2>
                  <p className="text-slate-500 text-sm mt-2">Upload an image to inspire the AI storyteller.</p>
                </div>
              )}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            {state.analysis && (
              <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-medium">
                  <i className="fas fa-tags"></i>
                  <span>Analysis Results</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {state.analysis.mood}
                  </span>
                  {state.analysis.elements.map((el, i) => (
                    <span key={i} className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs">
                      {el}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Generated Story & Chat */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {state.isAnalyzing ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 flex-1">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                  <i className="fas fa-magic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 text-xl"></i>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl serif-title">Whispering to the Muse...</h3>
                  <p className="text-slate-400 max-w-sm">Our AI is deciphering the shadows and colors of your image to weave a narrative thread.</p>
                </div>
              </div>
            ) : state.analysis ? (
              <div className="space-y-8 flex-1 flex flex-col">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 relative shadow-2xl flex-1">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-indigo-500/50 text-6xl font-serif">“</span>
                    <button 
                      onClick={handleReadAloud}
                      disabled={state.isGeneratingAudio}
                      className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 group"
                    >
                      {state.isGeneratingAudio ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Preparing Voice...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-volume-up group-hover:scale-110 transition-transform"></i>
                          <span className="text-sm font-medium">Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xl leading-relaxed text-slate-200 serif-title italic">
                    {state.analysis.storyOpening}
                  </p>
                  
                  <div className="flex justify-end mt-8">
                    <span className="text-indigo-500/50 text-6xl font-serif">”</span>
                  </div>
                </div>

                <div className="h-[400px]">
                  <ChatInterface 
                    history={state.chatHistory} 
                    onSendMessage={handleSendMessage} 
                    isLoading={state.isChatting} 
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1">
                <i className="fas fa-pen-nib text-slate-700 text-5xl"></i>
                <h3 className="text-2xl text-slate-400 serif-title">The Canvas is Empty</h3>
                <p className="text-slate-500 max-w-xs">Upload an image to start generating your story.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;

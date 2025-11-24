import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { ProjectState, ChatMessage } from '../types';
import { sendMessageToAi } from '../services/geminiService';

interface AssistantProps {
  projectState: ProjectState;
  isOpen: boolean;
  onClose: () => void;
}

export const Assistant: React.FC<AssistantProps> = ({ projectState, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi! I'm your Os-Daw AI Assistant. Need help with your beat or sound design?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await sendMessageToAi(userMsg.text, projectState);
    
    const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-20 bottom-0 w-96 bg-daw-bg border-l border-daw-surface/10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="h-16 border-b border-daw-surface/10 flex items-center justify-between px-6 bg-daw-bg shrink-0">
        <div className="flex items-center gap-2 text-daw-text font-semibold">
          <Sparkles size={18} className="text-white" />
          <span>AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-daw-muted hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-daw-bg/50 shadow-neu-pressed" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-neu-out ${
              msg.role === 'user' 
                ? 'bg-daw-surface text-white rounded-tr-none' 
                : 'bg-daw-bg text-daw-muted rounded-tl-none border border-daw-surface/10'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-daw-bg shadow-neu-out text-daw-muted text-xs px-4 py-2 rounded-full animate-pulse border border-daw-surface/10">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-daw-surface/10 bg-daw-bg shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="w-full bg-daw-bg shadow-neu-pressed rounded-full py-3 pl-6 pr-14 text-sm text-daw-text focus:outline-none placeholder:text-daw-muted/50 focus:shadow-neu-in transition-shadow"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-daw-text hover:text-white rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
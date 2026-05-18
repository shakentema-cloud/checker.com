import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, Info, Bot, X, Sparkles, User } from 'lucide-react';
import { getGrandmasterAssistantReply } from "@/lib/assistant";

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'ai',
    content: "Greetings! I'm your Checkmate Pro Grandmaster AI. Whether you want to analyze a complex endgame, understand a tactical sequence, or practice a drill, I'm here to help. What would you like to explore today?"
  }
];

export const FloatingAiAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isChatOpen]);

  const respondToUser = (userMsg: string, nextMessages: ChatMessage[]) => {
    setIsTyping(true);
    setTimeout(() => {
      const response = getGrandmasterAssistantReply(userMsg, nextMessages);
      setMessages([...nextMessages, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 500 + Math.random() * 350);
  };

  const handleSend = () => {
    if (!message.trim() || isTyping) return;
    const newMsg = message.trim();
    const nextMessages = [...messages, { role: 'user' as const, content: newMsg }];
    setMessages(nextMessages);
    setMessage('');
    respondToUser(newMsg, nextMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating 3D Glowing AI Logo */}
      <button 
        className={`floating-ai-button relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform ${
          isChatOpen ? 'rotate-90 scale-90 opacity-0 pointer-events-none' : 'rotate-0 opacity-100'
        }`}
        onClick={() => setIsChatOpen(true)}
        style={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.9) 0%, rgba(217,119,6,0.9) 100%)',
          boxShadow: '0 0 20px rgba(234, 179, 8, 0.4), 0 0 40px rgba(217, 119, 6, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>
        <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
        <div className="relative z-10 text-white shadow-sm">
          <Bot className="w-8 h-8" />
        </div>
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-amber-500"></div>
      </button>

      {/* Chat Interface */}
      <div 
        ref={chatRef}
        className={`absolute bottom-0 right-0 w-[400px] sm:w-[500px] transition-all duration-300 origin-bottom-right ${
          isChatOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative flex flex-col h-[600px] max-h-[85vh] rounded-3xl bg-zinc-900 shadow-[0_0_50px_-12px_rgba(217,119,6,0.5)] border border-amber-900/30 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-zinc-950/80 border-b border-amber-900/20 backdrop-blur-md z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center border border-amber-500/30">
                  <Bot className="w-5 h-5 text-amber-500" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-900 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 hidden sm:block">Grandmaster AI</h3>
                <h3 className="text-sm font-semibold text-zinc-100 sm:hidden">AI</h3>
                <p className="text-xs text-amber-500/80 font-medium tracking-wide w-full truncate">Pro Coach Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                Checkers Coach
              </span>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-2 mr-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-zinc-100" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-900/50 scroll-smooth custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0 pt-1">
                  {msg.role === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-tr-sm' 
                      : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5 h-12">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-zinc-950 p-4 shrink-0 border-t border-amber-900/20 backdrop-blur-xl">
            <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full px-5 py-4 bg-transparent border-none outline-none resize-none text-[15px] text-zinc-100 placeholder-zinc-500 max-h-[120px] overflow-y-auto min-h-[56px] pr-14"
                placeholder="Ask any question about checkers or Checker.com..."
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <button 
                onClick={handleSend}
                disabled={!message.trim() || isTyping}
                className="absolute right-3 bottom-2.5 p-2 bg-amber-600 rounded-xl text-white shadow-md disabled:bg-zinc-800 disabled:text-zinc-600 transition-all hover:bg-amber-500 active:scale-95"
              >
                <Send className="w-4 h-4 translate-x-px" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                 <button className="text-zinc-500 hover:text-amber-500 transition-colors p-1" title="Upload game file">
                   <Paperclip className="w-4 h-4" />
                 </button>
                 <button className="text-zinc-500 hover:text-amber-500 transition-colors p-1" title="Voice Input">
                   <Mic className="w-4 h-4" />
                 </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Info className="w-3 h-3" />
                <span>Shift + Enter to break line</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(217, 119, 6, 0.4);
        }
      `}</style>
    </div>
  );
};

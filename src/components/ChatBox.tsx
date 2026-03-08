import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Bot, Loader2, Download } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useWebLLM';

interface Props {
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: string;
  isGenerating: boolean;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onClear: () => void;
  onInit: () => void;
}

function ChatBox({ isLoaded, isLoading, loadProgress, isGenerating, messages, onSend, onClear, onInit }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || !isLoaded) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden backdrop-blur-xl"
      style={{
        background: 'hsla(220, 40%, 8%, 0.85)',
        border: '1px solid hsla(190, 60%, 30%, 0.25)',
        boxShadow: '0 8px 32px hsla(220, 50%, 4%, 0.6), inset 0 1px 0 hsla(190, 60%, 40%, 0.08)',
        width: '380px',
        maxHeight: '420px',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid hsla(190, 60%, 30%, 0.15)' }}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" style={{ color: 'hsl(190 100% 55%)' }} />
          <span className="text-xs font-medium tracking-wider uppercase" style={{ color: 'hsl(210 20% 65%)' }}>
            Neural Chat
          </span>
          {isLoaded && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(160 100% 50%)', boxShadow: '0 0 6px hsl(160 100% 50%)' }} />
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="p-1 rounded transition-colors hover:bg-white/5" title="Clear chat">
            <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(210 15% 40%)' }} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] max-h-[280px]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.3) transparent' }}>
        {!isLoaded && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-6">
            <p className="text-xs text-center" style={{ color: 'hsl(210 15% 45%)' }}>
              Load the AI model to start chatting.<br />
              <span style={{ color: 'hsl(210 15% 35%)' }}>Runs 100% in your browser via WebGPU.</span>
            </p>
            <button
              onClick={onInit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{
                background: 'hsla(190, 100%, 55%, 0.12)',
                border: '1px solid hsla(190, 100%, 55%, 0.3)',
                color: 'hsl(190 100% 60%)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Load Model (~700MB)
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(190 100% 55%)' }} />
            <p className="text-[10px] text-center max-w-[280px] leading-relaxed" style={{ color: 'hsl(210 15% 45%)', fontFamily: 'var(--font-mono)' }}>
              {loadProgress}
            </p>
          </div>
        )}

        {isLoaded && messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full py-6">
            <p className="text-xs" style={{ color: 'hsl(210 15% 35%)' }}>Say hello to Neural! 👋</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'hsla(190, 100%, 55%, 0.12)',
                      border: '1px solid hsla(190, 100%, 55%, 0.2)',
                      color: 'hsl(190 80% 75%)',
                    }
                  : {
                      background: 'hsla(220, 30%, 15%, 0.6)',
                      border: '1px solid hsla(210, 20%, 25%, 0.3)',
                      color: 'hsl(210 15% 75%)',
                    }
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*]:m-0 [&>*]:text-xs [&>p]:leading-relaxed">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {isGenerating && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex items-center gap-1 pl-1">
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'hsl(190 100% 55%)' }} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid hsla(190, 60%, 30%, 0.12)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoaded ? 'Type a message...' : 'Load model first...'}
            disabled={!isLoaded || isGenerating}
            className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-40 disabled:opacity-30"
            style={{ color: 'hsl(210 15% 75%)', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || !isLoaded}
            className="p-1.5 rounded-lg transition-all disabled:opacity-20"
            style={{
              background: input.trim() ? 'hsla(190, 100%, 55%, 0.15)' : 'transparent',
              color: 'hsl(190 100% 55%)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;

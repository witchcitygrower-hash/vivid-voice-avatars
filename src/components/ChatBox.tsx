import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Bot, Loader2, Download, Volume2, VolumeX, Mic, MicOff, Image, X, ChevronDown, Sparkles, Cpu } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useWebLLM';
import { AVAILABLE_MODELS, type ModelOption } from '@/config/models';

interface Props {
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: string;
  isGenerating: boolean;
  messages: ChatMessage[];
  currentModelId: string | null;
  ttsEnabled: boolean;
  ttsLoading: boolean;
  ttsLoaded: boolean;
  ttsSpeaking: boolean;
  ttsProgress: string;
  onSend: (message: string) => void;
  onClear: () => void;
  onInit: (modelId: string) => void;
  onToggleTTS: () => void;
}

function ChatBox({
  isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId,
  ttsEnabled, ttsLoading, ttsLoaded, ttsSpeaking, ttsProgress,
  onSend, onClear, onInit, onToggleTTS,
}: Props) {
  const [input, setInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(AVAILABLE_MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isGenerating || !isLoaded) return;
    const msg = imagePreview ? `[Image attached]\n${text}` : text;
    onSend(msg);
    setInput('');
    setImagePreview(null);
  };

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const activeModel = AVAILABLE_MODELS.find(m => m.id === currentModelId);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden backdrop-blur-2xl"
      style={{
        background: 'hsla(220, 40%, 6%, 0.92)',
        border: '1px solid hsla(190, 60%, 30%, 0.2)',
        boxShadow: '0 12px 48px hsla(220, 50%, 2%, 0.7), inset 0 1px 0 hsla(190, 60%, 40%, 0.06)',
        width: '400px',
        maxHeight: '500px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid hsla(190, 60%, 30%, 0.12)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bot className="w-4.5 h-4.5" style={{ color: 'hsl(190 100% 55%)' }} />
            {isLoaded && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: 'hsl(160 100% 50%)', boxShadow: '0 0 6px hsl(160 100% 50%)' }} />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'hsl(210 20% 70%)' }}>
              Neural Chat
            </span>
            {activeModel && (
              <p className="text-[9px] mt-0.5" style={{ color: 'hsl(190 60% 45%)', fontFamily: 'var(--font-mono)' }}>
                {activeModel.name} ({activeModel.params})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* TTS Toggle */}
          <button
            onClick={onToggleTTS}
            className="p-1.5 rounded-lg transition-all"
            style={{
              background: ttsEnabled ? 'hsla(190, 100%, 55%, 0.12)' : 'transparent',
              color: ttsEnabled ? 'hsl(190 100% 55%)' : 'hsl(210 15% 40%)',
            }}
            title={ttsEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          {messages.length > 0 && (
            <button onClick={onClear} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(210 15% 40%)' }} />
            </button>
          )}
        </div>
      </div>

      {/* TTS Loading indicator */}
      {ttsLoading && (
        <div className="px-4 py-1.5 flex items-center gap-2" style={{ borderBottom: '1px solid hsla(190, 60%, 30%, 0.08)', background: 'hsla(190, 100%, 55%, 0.04)' }}>
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'hsl(190 100% 55%)' }} />
          <span className="text-[9px]" style={{ color: 'hsl(190 60% 50%)', fontFamily: 'var(--font-mono)' }}>{ttsProgress || 'Loading TTS...'}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[140px] max-h-[320px]" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.3) transparent' }}>

        {/* Model Picker - shown when not loaded */}
        {!isLoaded && !isLoading && (
          <div className="flex flex-col gap-3 py-4">
            <div className="text-center">
              <Cpu className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(190 80% 50%)' }} />
              <p className="text-xs font-medium mb-1" style={{ color: 'hsl(210 20% 70%)' }}>Select an AI Model</p>
              <p className="text-[10px]" style={{ color: 'hsl(210 15% 40%)' }}>
                Runs 100% in your browser via WebGPU
              </p>
            </div>

            {/* Model selector button */}
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: 'hsla(220, 30%, 12%, 0.8)',
                border: '1px solid hsla(190, 60%, 30%, 0.25)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: 'hsl(190 80% 65%)' }}>{selectedModel.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'hsla(190, 100%, 55%, 0.1)', color: 'hsl(190 80% 55%)', fontFamily: 'var(--font-mono)' }}>
                    {selectedModel.params}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'hsl(210 15% 45%)' }}>{selectedModel.description}</p>
              </div>
              <ChevronDown className="w-4 h-4 shrink-0 ml-2 transition-transform" style={{ color: 'hsl(210 15% 45%)', transform: showModelPicker ? 'rotate(180deg)' : 'none' }} />
            </button>

            {/* Model dropdown */}
            {showModelPicker && (
              <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-xl p-1.5" style={{ background: 'hsla(220, 30%, 10%, 0.9)', border: '1px solid hsla(190, 60%, 30%, 0.15)' }}>
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                    style={{
                      background: selectedModelId === model.id ? 'hsla(190, 100%, 55%, 0.08)' : 'transparent',
                      border: selectedModelId === model.id ? '1px solid hsla(190, 100%, 55%, 0.2)' : '1px solid transparent',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium" style={{ color: selectedModelId === model.id ? 'hsl(190 80% 65%)' : 'hsl(210 15% 65%)' }}>
                          {model.name}
                        </span>
                        <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: 'hsla(190, 100%, 55%, 0.08)', color: 'hsl(190 60% 50%)', fontFamily: 'var(--font-mono)' }}>
                          {model.params}
                        </span>
                      </div>
                      <p className="text-[9px] mt-0.5" style={{ color: 'hsl(210 15% 40%)' }}>{model.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="w-1 h-3 rounded-full" style={{ background: j < model.quality ? 'hsl(190 100% 55%)' : 'hsla(210, 15%, 30%, 0.4)' }} />
                        ))}
                      </div>
                      <p className="text-[8px] mt-0.5" style={{ color: 'hsl(210 15% 35%)', fontFamily: 'var(--font-mono)' }}>{model.size}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Load button */}
            <button
              onClick={() => onInit(selectedModelId)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.15), hsla(190, 100%, 55%, 0.08))',
                border: '1px solid hsla(190, 100%, 55%, 0.3)',
                color: 'hsl(190 100% 60%)',
                boxShadow: '0 4px 16px hsla(190, 100%, 55%, 0.1)',
              }}
            >
              <Download className="w-4 h-4" />
              Load {selectedModel.name} ({selectedModel.size})
            </button>

            <p className="text-[9px] text-center" style={{ color: 'hsl(210 15% 30%)' }}>
              Requires WebGPU • Model cached after first download
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="relative">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(190 100% 55%)' }} />
              <div className="absolute inset-0 animate-ping" style={{ border: '1px solid hsla(190, 100%, 55%, 0.2)', borderRadius: '50%' }} />
            </div>
            <div className="text-center">
              <p className="text-[10px] max-w-[300px] leading-relaxed" style={{ color: 'hsl(210 15% 50%)', fontFamily: 'var(--font-mono)' }}>
                {loadProgress}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {isLoaded && messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
            <Sparkles className="w-6 h-6" style={{ color: 'hsl(190 80% 50%)' }} />
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'hsl(210 15% 55%)' }}>Neural is ready!</p>
              <p className="text-[10px] mt-1" style={{ color: 'hsl(210 15% 35%)' }}>
                Say hello, ask anything, or upload an image 👋
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.12), hsla(190, 100%, 55%, 0.06))',
                      border: '1px solid hsla(190, 100%, 55%, 0.2)',
                      color: 'hsl(190 80% 80%)',
                      borderBottomRightRadius: '6px',
                    }
                  : {
                      background: 'hsla(220, 25%, 13%, 0.7)',
                      border: '1px solid hsla(210, 20%, 22%, 0.4)',
                      color: 'hsl(210 15% 78%)',
                      borderBottomLeftRadius: '6px',
                    }
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*]:m-0 [&>*]:text-xs [&>p]:leading-relaxed [&_code]:text-[10px] [&_code]:bg-white/5 [&_code]:px-1 [&_code]:rounded">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isGenerating && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex items-center gap-1.5 pl-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{
                  background: 'hsl(190 100% 55%)',
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '600ms',
                }}
              />
            ))}
          </div>
        )}

        {/* TTS speaking indicator */}
        {ttsSpeaking && (
          <div className="flex items-center gap-2 pl-1">
            <Volume2 className="w-3 h-3 animate-pulse" style={{ color: 'hsl(190 100% 55%)' }} />
            <span className="text-[9px]" style={{ color: 'hsl(190 60% 50%)', fontFamily: 'var(--font-mono)' }}>Speaking...</span>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 py-2 shrink-0" style={{ borderTop: '1px solid hsla(190, 60%, 30%, 0.1)' }}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="Upload preview" className="h-16 rounded-lg object-cover" style={{ border: '1px solid hsla(190, 60%, 30%, 0.2)' }} />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(0 70% 50%)', color: 'white' }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[9px] mt-1" style={{ color: 'hsl(30 80% 55%)' }}>
            ⚠ Image context not yet supported by browser LLMs
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid hsla(190, 60%, 30%, 0.1)' }}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'hsla(220, 25%, 12%, 0.6)',
            border: '1px solid hsla(190, 60%, 30%, 0.12)',
          }}
        >
          {/* Image upload */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isLoaded}
            className="p-1 rounded transition-colors disabled:opacity-20 hover:bg-white/5"
            style={{ color: 'hsl(210 15% 45%)' }}
            title="Upload image"
          >
            <Image className="w-4 h-4" />
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoaded ? 'Message Neural...' : 'Load a model first...'}
            disabled={!isLoaded || isGenerating}
            className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-30 disabled:opacity-30"
            style={{ color: 'hsl(210 15% 80%)', fontFamily: 'var(--font-mono)' }}
          />

          {/* Voice input */}
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={!isLoaded}
            className="p-1 rounded transition-all disabled:opacity-20"
            style={{
              color: isRecording ? 'hsl(340 80% 55%)' : 'hsl(210 15% 45%)',
              background: isRecording ? 'hsla(340, 80%, 55%, 0.1)' : 'transparent',
            }}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send */}
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || !isLoaded}
            className="p-1.5 rounded-lg transition-all disabled:opacity-15"
            style={{
              background: input.trim() ? 'hsla(190, 100%, 55%, 0.15)' : 'transparent',
              color: 'hsl(190 100% 55%)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Loader2, Download, Volume2, VolumeX, Mic, MicOff, Image, X, ChevronDown, Sparkles, Cpu, Zap, CircuitBoard } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useWebLLM';
import { AVAILABLE_MODELS } from '@/config/models';

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
      className="flex flex-col overflow-hidden"
      style={{
        background: 'hsla(215, 35%, 5%, 0.95)',
        border: '1px solid hsla(190, 80%, 35%, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 0 60px hsla(190, 100%, 50%, 0.04), 0 20px 60px hsla(220, 50%, 2%, 0.8), inset 0 1px 0 hsla(190, 80%, 50%, 0.08)',
        width: '380px',
        maxHeight: '480px',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{
          background: 'linear-gradient(180deg, hsla(215, 30%, 10%, 0.8), hsla(215, 30%, 8%, 0.4))',
          borderBottom: '1px solid hsla(190, 80%, 35%, 0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <CircuitBoard className="w-4 h-4" style={{ color: 'hsl(190 90% 55%)' }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: 'hsl(190 60% 70%)' }}>
                Neural
              </span>
              {isLoaded && (
                <span
                  className="text-[8px] px-1.5 py-px rounded tracking-wider uppercase"
                  style={{
                    background: 'hsla(160, 100%, 50%, 0.1)',
                    border: '1px solid hsla(160, 100%, 50%, 0.2)',
                    color: 'hsl(160 80% 55%)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Online
                </span>
              )}
            </div>
            {activeModel && (
              <p className="text-[8px] -mt-0.5 tracking-wider" style={{ color: 'hsl(210 15% 40%)', fontFamily: 'var(--font-mono)' }}>
                {activeModel.name} • {activeModel.params}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onToggleTTS}
            className="p-1.5 rounded-md transition-all"
            style={{
              background: ttsEnabled ? 'hsla(190, 100%, 55%, 0.1)' : 'transparent',
              color: ttsEnabled ? 'hsl(190 90% 55%)' : 'hsl(210 15% 35%)',
            }}
            title={ttsEnabled ? 'Mute voice' : 'Unmute voice'}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          {messages.length > 0 && (
            <button onClick={onClear} className="p-1.5 rounded-md transition-colors hover:bg-white/5" title="Clear">
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'hsl(210 15% 35%)' }} />
            </button>
          )}
        </div>
      </div>

      {/* TTS Loading bar */}
      {ttsLoading && (
        <div
          className="px-4 py-1.5 flex items-center gap-2"
          style={{ background: 'hsla(190, 100%, 55%, 0.03)', borderBottom: '1px solid hsla(190, 80%, 35%, 0.06)' }}
        >
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'hsl(190 80% 50%)' }} />
          <span className="text-[8px] tracking-wider" style={{ color: 'hsl(190 50% 45%)', fontFamily: 'var(--font-mono)' }}>
            {ttsProgress || 'LOADING VOICE ENGINE...'}
          </span>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[130px] max-h-[300px]"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.2) transparent' }}
      >
        {/* Model Picker */}
        {!isLoaded && !isLoading && (
          <div className="flex flex-col gap-3 py-3">
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.08), hsla(220, 60%, 30%, 0.08))',
                  border: '1px solid hsla(190, 80%, 40%, 0.15)',
                }}
              >
                <Cpu className="w-6 h-6" style={{ color: 'hsl(190 80% 55%)' }} />
              </div>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: 'hsl(190 40% 65%)' }}>Select AI Model</p>
              <p className="text-[9px] mt-1" style={{ color: 'hsl(210 15% 35%)', fontFamily: 'var(--font-mono)' }}>
                IN-BROWSER • WEBGPU • PRIVATE
              </p>
            </div>

            {/* Model selector */}
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: 'hsla(215, 25%, 10%, 0.8)',
                border: '1px solid hsla(190, 70%, 35%, 0.2)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium" style={{ color: 'hsl(190 70% 65%)' }}>{selectedModel.name}</span>
                  <span
                    className="text-[8px] px-1.5 py-px rounded"
                    style={{
                      background: 'hsla(190, 100%, 55%, 0.08)',
                      color: 'hsl(190 60% 50%)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {selectedModel.params}
                  </span>
                </div>
                <p className="text-[9px] mt-0.5 truncate" style={{ color: 'hsl(210 15% 40%)' }}>{selectedModel.description}</p>
              </div>
              <ChevronDown
                className="w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200"
                style={{ color: 'hsl(210 15% 40%)', transform: showModelPicker ? 'rotate(180deg)' : 'none' }}
              />
            </button>

            {/* Dropdown */}
            {showModelPicker && (
              <div
                className="space-y-0.5 max-h-[180px] overflow-y-auto rounded-lg p-1"
                style={{
                  background: 'hsla(215, 30%, 8%, 0.95)',
                  border: '1px solid hsla(190, 70%, 35%, 0.12)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsla(190, 60%, 30%, 0.2) transparent',
                }}
              >
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = selectedModelId === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all"
                      style={{
                        background: isSelected ? 'hsla(190, 100%, 55%, 0.06)' : 'transparent',
                        border: isSelected ? '1px solid hsla(190, 100%, 55%, 0.15)' : '1px solid transparent',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium" style={{ color: isSelected ? 'hsl(190 70% 65%)' : 'hsl(210 15% 60%)' }}>
                            {model.name}
                          </span>
                          <span className="text-[7px] px-1 rounded" style={{ background: 'hsla(190, 100%, 55%, 0.06)', color: 'hsl(190 50% 45%)', fontFamily: 'var(--font-mono)' }}>
                            {model.params}
                          </span>
                        </div>
                        <p className="text-[8px] mt-0.5" style={{ color: 'hsl(210 15% 35%)' }}>{model.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-px">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div
                              key={j}
                              className="w-[3px] h-2.5 rounded-sm"
                              style={{ background: j < model.quality ? 'hsl(190 100% 55%)' : 'hsla(210, 15%, 25%, 0.5)' }}
                            />
                          ))}
                        </div>
                        <p className="text-[7px] mt-0.5" style={{ color: 'hsl(210 15% 30%)', fontFamily: 'var(--font-mono)' }}>{model.size}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Load button */}
            <button
              onClick={() => onInit(selectedModelId)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.12), hsla(190, 100%, 55%, 0.05))',
                border: '1px solid hsla(190, 100%, 55%, 0.25)',
                color: 'hsl(190 90% 60%)',
                boxShadow: '0 2px 12px hsla(190, 100%, 55%, 0.08)',
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              Initialize {selectedModel.name}
              <span className="text-[8px] opacity-60" style={{ fontFamily: 'var(--font-mono)' }}>({selectedModel.size})</span>
            </button>

            <p className="text-[8px] text-center tracking-wider" style={{ color: 'hsl(210 15% 28%)', fontFamily: 'var(--font-mono)' }}>
              CACHED AFTER FIRST DOWNLOAD
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="relative w-10 h-10">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'hsla(190, 100%, 55%, 0.3)' }} />
              <Cpu className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: 'hsl(190 80% 55%)' }} />
            </div>
            <p className="text-[9px] max-w-[280px] leading-relaxed text-center" style={{ color: 'hsl(210 15% 45%)', fontFamily: 'var(--font-mono)' }}>
              {loadProgress}
            </p>
          </div>
        )}

        {/* Ready state */}
        {isLoaded && messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <Sparkles className="w-5 h-5" style={{ color: 'hsl(190 70% 50%)' }} />
            <p className="text-[11px] font-medium" style={{ color: 'hsl(190 40% 55%)' }}>Neural is ready</p>
            <p className="text-[9px]" style={{ color: 'hsl(210 15% 35%)', fontFamily: 'var(--font-mono)' }}>
              TYPE A MESSAGE TO BEGIN
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] px-3 py-2 text-[11px] leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'hsla(190, 100%, 55%, 0.08)',
                      border: '1px solid hsla(190, 100%, 55%, 0.15)',
                      borderRadius: '12px 12px 4px 12px',
                      color: 'hsl(190 60% 75%)',
                    }
                  : {
                      background: 'hsla(215, 25%, 12%, 0.6)',
                      border: '1px solid hsla(210, 20%, 20%, 0.3)',
                      borderRadius: '12px 12px 12px 4px',
                      color: 'hsl(210 12% 75%)',
                    }
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*]:m-0 [&>*]:text-[11px] [&>p]:leading-relaxed [&_code]:text-[9px] [&_code]:bg-white/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_strong]:text-[hsl(190_60%_65%)]">
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
          <div className="flex items-center gap-1 pl-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    background: 'hsl(190 100% 55%)',
                    animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Speaking indicator */}
        {ttsSpeaking && (
          <div className="flex items-center gap-1.5 pl-1">
            <div className="flex items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{
                    background: 'hsl(190 100% 55%)',
                    height: `${6 + Math.sin(Date.now() / 200 + i) * 4}px`,
                    animation: `pulse 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                  }}
                />
              ))}
            </div>
            <span className="text-[8px] tracking-wider" style={{ color: 'hsl(190 50% 45%)', fontFamily: 'var(--font-mono)' }}>
              SPEAKING
            </span>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid hsla(190, 80%, 35%, 0.08)' }}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="Upload" className="h-14 rounded-md object-cover" style={{ border: '1px solid hsla(190, 60%, 30%, 0.2)' }} />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(0 60% 45%)', color: 'white' }}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-2.5 shrink-0"
        style={{ borderTop: '1px solid hsla(190, 80%, 35%, 0.08)' }}
      >
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'hsla(215, 25%, 10%, 0.5)',
            border: '1px solid hsla(190, 70%, 35%, 0.1)',
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isLoaded}
            className="p-1 rounded transition-colors disabled:opacity-15 hover:bg-white/5"
            style={{ color: 'hsl(210 15% 38%)' }}
            title="Attach image"
          >
            <Image className="w-3.5 h-3.5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoaded ? 'Message Neural...' : 'Load model first...'}
            disabled={!isLoaded || isGenerating}
            className="flex-1 bg-transparent text-[11px] outline-none placeholder:opacity-25 disabled:opacity-20"
            style={{ color: 'hsl(210 12% 75%)', fontFamily: 'var(--font-mono)' }}
          />

          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={!isLoaded}
            className="p-1 rounded transition-all disabled:opacity-15"
            style={{
              color: isRecording ? 'hsl(340 80% 55%)' : 'hsl(210 15% 38%)',
              background: isRecording ? 'hsla(340, 80%, 55%, 0.1)' : 'transparent',
            }}
            title={isRecording ? 'Stop' : 'Voice input'}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isGenerating || !isLoaded}
            className="p-1.5 rounded-md transition-all disabled:opacity-10"
            style={{
              background: input.trim() ? 'hsla(190, 100%, 55%, 0.12)' : 'transparent',
              border: input.trim() ? '1px solid hsla(190, 100%, 55%, 0.2)' : '1px solid transparent',
              color: 'hsl(190 90% 55%)',
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

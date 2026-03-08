import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Loader2, Volume2, VolumeX, Mic, MicOff, Image, X, ChevronDown, Sparkles, Cpu, Zap, CircuitBoard, Eye, MessageCircle } from 'lucide-react';
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

const capabilityConfig: Record<string, { icon: typeof MessageCircle; label: string; hsl: string; glowColor: string }> = {
  text: { icon: MessageCircle, label: 'Text Chat', hsl: '190 100% 55%', glowColor: 'hsla(190, 100%, 55%, 0.4)' },
  voice: { icon: Volume2, label: 'Voice Output', hsl: '160 90% 50%', glowColor: 'hsla(160, 90%, 50%, 0.4)' },
  vision: { icon: Eye, label: 'Image Understanding', hsl: '280 85% 65%', glowColor: 'hsla(280, 85%, 65%, 0.4)' },
};

function CapabilityBadge({ cap, size = 'sm' }: { cap: string; size?: 'sm' | 'md' }) {
  const info = capabilityConfig[cap];
  if (!info) return null;
  const Icon = info.icon;
  const isMd = size === 'md';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        padding: isMd ? '2px 8px' : '1px 5px',
        background: `hsla(${info.hsl} / 0.08)`,
        border: `1px solid hsla(${info.hsl} / 0.25)`,
        boxShadow: `0 0 ${isMd ? '10px' : '6px'} hsla(${info.hsl} / 0.15), inset 0 0 ${isMd ? '8px' : '4px'} hsla(${info.hsl} / 0.05)`,
        color: `hsl(${info.hsl})`,
        fontFamily: 'var(--font-mono)',
        fontSize: isMd ? '9px' : '7px',
        letterSpacing: '0.05em',
      }}
      title={info.label}
    >
      <Icon style={{ width: isMd ? 11 : 8, height: isMd ? 11 : 8, filter: `drop-shadow(0 0 3px ${info.glowColor})` }} />
      {isMd && <span>{info.label}</span>}
    </span>
  );
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
    onSend(imagePreview ? `[Image attached]\n${text}` : text);
    setInput('');
    setImagePreview(null);
  };

  const handleVoiceInput = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e: any) => setInput(Array.from(e.results).map((x: any) => x[0].transcript).join(''));
    r.onend = () => setIsRecording(false);
    r.onerror = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
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
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{
          background: 'linear-gradient(180deg, hsla(215, 30%, 8%, 0.9), hsla(215, 30%, 6%, 0.4))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-3">
          <CircuitBoard className="w-4 h-4 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">
                Neural Chat
              </span>
              {activeModel && (
                <span className="text-[8px] px-1.5 py-0.5 rounded tracking-wider" style={{
                  background: 'hsla(190, 100%, 55%, 0.06)',
                  border: '1px solid hsla(190, 100%, 55%, 0.12)',
                  color: 'hsl(var(--primary))',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {activeModel.name}
                </span>
              )}
              {activeModel && (
                <div className="flex items-center gap-1">
                  {activeModel.capabilities.map(cap => {
                    const info = capabilityIcons[cap];
                    if (!info) return null;
                    const Icon = info.icon;
                    return (
                      <span key={cap} className="flex items-center gap-0.5 text-[7px] px-1 py-px rounded" style={{
                        background: `${info.color}10`,
                        border: `1px solid ${info.color}20`,
                        color: info.color,
                        fontFamily: 'var(--font-mono)',
                      }} title={info.label}>
                        <Icon className="w-2 h-2" />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {ttsLoading && (
            <div className="flex items-center gap-1.5 mr-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-[8px] tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                TTS
              </span>
            </div>
          )}
          <button
            onClick={onToggleTTS}
            className="p-1.5 rounded-md transition-all"
            style={{
              background: ttsEnabled ? 'hsla(190, 100%, 55%, 0.08)' : 'transparent',
              color: ttsEnabled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
            title={ttsEnabled ? 'Mute' : 'Unmute'}
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          {messages.length > 0 && (
            <button onClick={onClear} className="p-1.5 rounded-md transition-colors hover:bg-muted">
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.15) transparent' }}
      >
        {/* Model Picker */}
        {!isLoaded && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col gap-4 max-w-md w-full">
              <div className="text-center">
                <div
                  className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.06), hsla(220, 60%, 30%, 0.06))',
                    border: '1px solid hsla(190, 80%, 40%, 0.12)',
                  }}
                >
                  <Cpu className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-medium tracking-wide text-primary">Select AI Model</p>
                <p className="text-[10px] mt-1.5 tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  IN-BROWSER • WEBGPU • 100% PRIVATE
                </p>
              </div>

              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{selectedModel.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                      background: 'hsla(190, 100%, 55%, 0.06)',
                      color: 'hsl(var(--primary))',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {selectedModel.params}
                    </span>
                    {/* Capability badges */}
                    <div className="flex items-center gap-0.5">
                      {selectedModel.capabilities.map(cap => {
                        const info = capabilityIcons[cap];
                        if (!info) return null;
                        const Icon = info.icon;
                        return (
                          <span key={cap} className="flex items-center gap-0.5 text-[7px] px-1 py-px rounded" style={{
                            background: `${info.color}10`,
                            border: `1px solid ${info.color}20`,
                            color: info.color,
                            fontFamily: 'var(--font-mono)',
                          }} title={info.label}>
                            <Icon className="w-2.5 h-2.5" />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[10px] mt-0.5 text-muted-foreground">{selectedModel.description}</p>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0 ml-3 transition-transform text-muted-foreground" style={{ transform: showModelPicker ? 'rotate(180deg)' : 'none' }} />
              </button>

              {showModelPicker && (
                <div className="space-y-0.5 max-h-[260px] overflow-y-auto rounded-xl p-1.5" style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'hsla(190, 60%, 30%, 0.15) transparent',
                }}>
                  {AVAILABLE_MODELS.map((model) => {
                    const sel = selectedModelId === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModelId(model.id); setShowModelPicker(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                        style={{
                          background: sel ? 'hsla(190, 100%, 55%, 0.05)' : 'transparent',
                          border: sel ? '1px solid hsla(190, 100%, 55%, 0.12)' : '1px solid transparent',
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-medium" style={{ color: sel ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                              {model.name}
                            </span>
                            <span className="text-[8px] px-1 py-px rounded" style={{ background: 'hsla(190, 100%, 55%, 0.05)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-mono)' }}>
                              {model.params}
                            </span>
                            {/* Capability badges in picker */}
                            <div className="flex items-center gap-0.5">
                              {model.capabilities.map(cap => {
                                const info = capabilityIcons[cap];
                                if (!info) return null;
                                const Icon = info.icon;
                                return (
                                  <span key={cap} title={info.label} className="flex items-center">
                                    <Icon className="w-2.5 h-2.5" style={{ color: info.color, opacity: 0.7 }} />
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <p className="text-[9px] mt-0.5 text-muted-foreground">{model.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-px">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <div key={j} className="w-[3px] h-3 rounded-sm" style={{ background: j < model.quality ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
                            ))}
                          </div>
                          <p className="text-[7px] mt-0.5 text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{model.size}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Capability legend */}
              <div className="flex items-center justify-center gap-3">
                {Object.entries(capabilityIcons).map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <div key={key} className="flex items-center gap-1">
                      <Icon className="w-2.5 h-2.5" style={{ color: info.color }} />
                      <span className="text-[8px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{info.label}</span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onInit(selectedModelId)}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.1), hsla(190, 100%, 55%, 0.04))',
                  border: '1px solid hsla(190, 100%, 55%, 0.2)',
                  color: 'hsl(var(--primary))',
                  boxShadow: '0 4px 20px hsla(190, 100%, 55%, 0.06)',
                }}
              >
                <Zap className="w-4 h-4" />
                Initialize {selectedModel.name}
                <span className="text-[9px] opacity-50" style={{ fontFamily: 'var(--font-mono)' }}>({selectedModel.size})</span>
              </button>

              <p className="text-[8px] text-center tracking-[0.2em] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                CACHED AFTER FIRST DOWNLOAD
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative w-12 h-12">
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'hsla(190, 100%, 55%, 0.2)' }} />
              <Cpu className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <p className="text-[10px] max-w-sm text-center leading-relaxed text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              {loadProgress}
            </p>
          </div>
        )}

        {/* Ready */}
        {isLoaded && messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <p className="text-sm font-medium text-primary">Neural is ready</p>
            <p className="text-[10px] tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              TYPE A MESSAGE TO BEGIN
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[70%] px-4 py-2.5 text-[12px] leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'hsla(190, 100%, 55%, 0.06)',
                      border: '1px solid hsla(190, 100%, 55%, 0.12)',
                      borderRadius: '16px 16px 4px 16px',
                      color: 'hsl(190 50% 72%)',
                    }
                  : {
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '16px 16px 16px 4px',
                      color: 'hsl(var(--foreground))',
                    }
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*]:m-0 [&>*]:text-[12px] [&>p]:leading-relaxed [&_code]:text-[10px] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_strong]:text-primary">
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
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: '600ms',
              }} />
            ))}
          </div>
        )}

        {/* Speaking indicator */}
        {ttsSpeaking && (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-end gap-[2px]">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-[3px] rounded-full bg-primary animate-pulse" style={{
                  height: `${6 + i * 2}px`,
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
            <span className="text-[9px] tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>SPEAKING</span>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-5 py-2 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="relative inline-block">
            <img src={imagePreview} alt="" className="h-16 rounded-lg object-cover border border-border" />
            <button onClick={() => setImagePreview(null)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-destructive text-destructive-foreground">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!isLoaded} className="p-1 rounded transition-colors disabled:opacity-10 hover:bg-muted text-muted-foreground" title="Attach">
            <Image className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoaded ? 'Message Neural...' : 'Load a model first...'}
            disabled={!isLoaded || isGenerating}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/30 disabled:opacity-15"
            style={{ fontFamily: 'var(--font-mono)' }}
          />

          <button type="button" onClick={handleVoiceInput} disabled={!isLoaded} className="p-1 rounded transition-all disabled:opacity-10" style={{
            color: isRecording ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
            background: isRecording ? 'hsla(340, 80%, 55%, 0.08)' : 'transparent',
          }} title="Voice">
            {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </button>

          <button type="submit" disabled={!input.trim() || isGenerating || !isLoaded} className="p-1.5 rounded-lg transition-all disabled:opacity-8 text-primary" style={{
            background: input.trim() ? 'hsla(190, 100%, 55%, 0.1)' : 'transparent',
            border: input.trim() ? '1px solid hsla(190, 100%, 55%, 0.15)' : '1px solid transparent',
          }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;

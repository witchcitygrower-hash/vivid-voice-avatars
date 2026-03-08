import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Trash2, Loader2, Volume2, VolumeX, Mic, MicOff, ChevronDown, Sparkles, Cpu, Zap, CircuitBoard, Settings2, MessageCircle, Clock, Hash, Gauge, RefreshCw } from 'lucide-react';
import type { ChatMessage, GenerationStats, ModelSettings } from '@/hooks/useWebLLM';
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
  lastStats: GenerationStats | null;
  settings: ModelSettings;
  onSend: (message: string) => void;
  onClear: () => void;
  onInit: (modelId: string) => void;
  onToggleTTS: () => void;
  onUpdateSettings: (partial: Partial<ModelSettings>) => void;
}

function StatsBar({ stats, isGenerating }: { stats: GenerationStats | null; isGenerating: boolean }) {
  if (!stats && !isGenerating) return null;
  const mono = { fontFamily: 'var(--font-mono)' };
  return (
    <div className="flex items-center gap-4 px-5 py-1.5 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsla(215, 30%, 6%, 0.6)' }}>
      {isGenerating && !stats && (
        <div className="flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span className="text-[10px] text-primary tracking-wider" style={mono}>GENERATING</span>
        </div>
      )}
      {stats && (
        <>
          <div className="flex items-center gap-1" title="Tokens generated">
            <Hash className="w-3 h-3 text-primary" style={{ filter: 'drop-shadow(0 0 3px hsla(190, 100%, 55%, 0.4))' }} />
            <span className="text-[10px] text-muted-foreground" style={mono}>{stats.tokensGenerated} tokens</span>
          </div>
          <div className="flex items-center gap-1" title="Speed">
            <Gauge className="w-3 h-3" style={{ color: 'hsl(160 90% 50%)', filter: 'drop-shadow(0 0 3px hsla(160, 90%, 50%, 0.4))' }} />
            <span className="text-[10px] text-muted-foreground" style={mono}>{stats.tokensPerSecond.toFixed(1)} tok/s</span>
          </div>
          <div className="flex items-center gap-1" title="Response time">
            <Clock className="w-3 h-3" style={{ color: 'hsl(45 100% 55%)', filter: 'drop-shadow(0 0 3px hsla(45, 100%, 55%, 0.4))' }} />
            <span className="text-[10px] text-muted-foreground" style={mono}>{(stats.totalTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </>
      )}
    </div>
  );
}

function SettingsPanel({ settings, onUpdate, onClose }: { settings: ModelSettings; onUpdate: (p: Partial<ModelSettings>) => void; onClose: () => void }) {
  const mono = { fontFamily: 'var(--font-mono)' };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'hsla(220, 50%, 4%, 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm mx-4 rounded-xl p-5 space-y-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 0 60px hsla(190, 100%, 50%, 0.05)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold tracking-wider uppercase text-primary" style={mono}>Model Settings</span>
          </div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" style={mono}>
            CLOSE
          </button>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block" style={mono}>System Prompt</label>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            rows={3}
            className="w-full bg-background text-sm text-foreground rounded-lg px-3 py-2 border border-border outline-none resize-none focus:border-primary/30 transition-colors"
            style={mono}
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] tracking-wider uppercase text-muted-foreground" style={mono}>Temperature</label>
            <span className="text-[11px] text-primary" style={mono}>{settings.temperature.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0" max="2" step="0.1"
            value={settings.temperature}
            onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${settings.temperature / 2 * 100}%, hsl(var(--muted)) ${settings.temperature / 2 * 100}%)` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground" style={mono}>Precise</span>
            <span className="text-[9px] text-muted-foreground" style={mono}>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] tracking-wider uppercase text-muted-foreground" style={mono}>Max Tokens</label>
            <span className="text-[11px] text-primary" style={mono}>{settings.maxTokens}</span>
          </div>
          <input
            type="range" min="64" max="2048" step="64"
            value={settings.maxTokens}
            onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(settings.maxTokens - 64) / (2048 - 64) * 100}%, hsl(var(--muted)) ${(settings.maxTokens - 64) / (2048 - 64) * 100}%)` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground" style={mono}>Short</span>
            <span className="text-[9px] text-muted-foreground" style={mono}>Long</span>
          </div>
        </div>

        {/* Top P */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] tracking-wider uppercase text-muted-foreground" style={mono}>Top P</label>
            <span className="text-[11px] text-primary" style={mono}>{settings.topP.toFixed(2)}</span>
          </div>
          <input
            type="range" min="0.1" max="1" step="0.05"
            value={settings.topP}
            onChange={(e) => onUpdate({ topP: parseFloat(e.target.value) })}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(settings.topP - 0.1) / 0.9 * 100}%, hsl(var(--muted)) ${(settings.topP - 0.1) / 0.9 * 100}%)` }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-muted-foreground" style={mono}>Focused</span>
            <span className="text-[9px] text-muted-foreground" style={mono}>Diverse</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SETTINGS: ModelSettings = {
  systemPrompt: 'You are a friendly, helpful robot assistant called Neural. Keep responses concise and engaging. Use casual, warm language.',
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.9,
};

function ChatBox({
  isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId,
  ttsEnabled, ttsLoading, ttsLoaded, ttsSpeaking, ttsProgress, lastStats, settings = DEFAULT_SETTINGS,
  onSend, onClear, onInit, onToggleTTS, onUpdateSettings,
}: Props) {
  const [input, setInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(AVAILABLE_MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wantsModelSwitch, setWantsModelSwitch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    onSend(text);
    setInput('');
    requestAnimationFrame(() => inputRef.current?.focus());
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

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const activeModel = AVAILABLE_MODELS.find(m => m.id === currentModelId);
  const mono = { fontFamily: 'var(--font-mono)' };

  const totalWords = messages.reduce((sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length, 0);

  // Show model picker if not loaded or user wants to switch
  const showModelSelection = (!isLoaded && !isLoading) || wantsModelSwitch;

  const handleInitModel = (modelId: string) => {
    setWantsModelSwitch(false);
    onInit(modelId);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel settings={settings} onUpdate={onUpdateSettings} onClose={() => setShowSettings(false)} />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{
          background: 'linear-gradient(180deg, hsla(215, 30%, 8%, 0.9), hsla(215, 30%, 6%, 0.4))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-3">
          <CircuitBoard className="w-5 h-5 text-primary" style={{ filter: 'drop-shadow(0 0 4px hsla(190, 100%, 55%, 0.4))' }} />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-[0.12em] uppercase text-primary">
              Neural Chat
            </span>
            {activeModel && !wantsModelSwitch && (
              <button
                onClick={() => setWantsModelSwitch(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all hover:bg-muted/50 group"
                title="Change model"
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded tracking-wider" style={{
                  background: 'hsla(190, 100%, 55%, 0.06)',
                  border: '1px solid hsla(190, 100%, 55%, 0.12)',
                  color: 'hsl(var(--primary))',
                  ...mono,
                }}>
                  {activeModel.name} • {activeModel.params}
                </span>
                <RefreshCw className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {ttsLoading && (
            <div className="flex items-center gap-1.5 mr-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-[10px] tracking-wider text-muted-foreground" style={mono}>TTS</span>
            </div>
          )}
          {isLoaded && (
            <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-md transition-all hover:bg-muted" title="Settings">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={onToggleTTS} className="p-1.5 rounded-md transition-all" style={{
            background: ttsEnabled ? 'hsla(190, 100%, 55%, 0.08)' : 'transparent',
            color: ttsEnabled ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }} title={ttsEnabled ? 'Mute TTS' : 'Enable TTS'}>
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {messages.length > 0 && (
            <button onClick={onClear} className="p-1.5 rounded-md transition-colors hover:bg-muted" title="New Chat">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
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
        {showModelSelection && (
          <div className="flex flex-col items-center justify-start pt-6 sm:justify-center sm:pt-0 h-full">
            <div className="flex flex-col gap-3 sm:gap-4 max-w-md w-full px-2">
              <div className="text-center">
                {wantsModelSwitch && (
                  <button
                    onClick={() => setWantsModelSwitch(false)}
                    className="text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                    style={mono}
                  >
                    ← Back to chat
                  </button>
                )}
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.06), hsla(220, 60%, 30%, 0.06))',
                  border: '1px solid hsla(190, 80%, 40%, 0.12)',
                }}>
                  <Cpu className="w-6 h-6 sm:w-7 sm:h-7 text-primary" style={{ filter: 'drop-shadow(0 0 6px hsla(190, 100%, 55%, 0.4))' }} />
                </div>
                <p className="text-sm sm:text-base font-medium tracking-wide text-primary">
                  {wantsModelSwitch ? 'Switch AI Model' : 'Select AI Model'}
                </p>
                <p className="text-[10px] sm:text-xs mt-1 tracking-wider text-muted-foreground" style={mono}>
                  IN-BROWSER • WEBGPU • 100% PRIVATE
                </p>
                {/* Feature highlights */}
                {!wantsModelSwitch && (
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                    {[
                      { icon: MessageCircle, label: 'Chat', hsl: '190 100% 55%' },
                      { icon: Mic, label: 'Voice', hsl: '190 100% 55%' },
                      { icon: Volume2, label: 'TTS', hsl: '160 90% 50%' },
                      { icon: Sparkles, label: 'Private', hsl: '45 100% 55%' },
                    ].map(({ icon: Icon, label, hsl }) => (
                      <span key={label} className="inline-flex items-center gap-1 rounded-full" style={{
                        padding: '2px 6px', background: `hsla(${hsl} / 0.08)`, border: `1px solid hsla(${hsl} / 0.25)`,
                        color: `hsl(${hsl})`, fontSize: '9px', letterSpacing: '0.05em', ...mono,
                      }}>
                        <Icon style={{ width: 10, height: 10 }} />
                        <span>{label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{selectedModel.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                      background: 'hsla(190, 100%, 55%, 0.06)', color: 'hsl(var(--primary))', ...mono,
                    }}>{selectedModel.params}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                      background: 'hsla(160, 90%, 50%, 0.06)', color: 'hsl(160 90% 50%)', ...mono,
                    }}>{selectedModel.vram} VRAM</span>
                  </div>
                  <p className="text-xs mt-0.5 text-muted-foreground">{selectedModel.description}</p>
                </div>
                <ChevronDown className="w-4 h-4 shrink-0 ml-3 transition-transform text-muted-foreground" style={{ transform: showModelPicker ? 'rotate(180deg)' : 'none' }} />
              </button>

              {showModelPicker && (
                <div className="space-y-0.5 max-h-[320px] overflow-y-auto rounded-xl p-1.5" style={{
                  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                  scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.15) transparent',
                }}>
                  {AVAILABLE_MODELS
                    .filter(m => showAllModels || m.featured)
                    .map((model) => {
                    const sel = selectedModelId === model.id;
                    const isCurrentModel = model.id === currentModelId;
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
                            <span className="text-xs font-medium" style={{ color: sel ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}>
                              {model.name}
                            </span>
                            {isCurrentModel && (
                              <span className="text-[8px] px-1 py-px rounded" style={{ background: 'hsla(160, 90%, 50%, 0.1)', color: 'hsl(160 80% 50%)', ...mono }}>
                                LOADED
                              </span>
                            )}
                            <span className="text-[9px] px-1 py-px rounded" style={{ background: 'hsla(190, 100%, 55%, 0.05)', color: 'hsl(var(--primary))', ...mono }}>
                              {model.params}
                            </span>
                            <span className="text-[8px] px-1 py-px rounded" style={{ background: 'hsla(160, 90%, 50%, 0.05)', color: 'hsl(160 70% 45%)', ...mono }}>
                              {model.vram}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5 text-muted-foreground">{model.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-px">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <div key={j} className="w-[3px] h-3 rounded-sm" style={{ background: j < model.quality ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }} />
                            ))}
                          </div>
                          <p className="text-[8px] mt-0.5 text-muted-foreground" style={mono}>{model.size}</p>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowAllModels(!showAllModels)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      color: 'hsl(var(--primary))',
                      background: 'hsla(190, 100%, 55%, 0.03)',
                      border: '1px solid hsla(190, 100%, 55%, 0.08)',
                      ...mono,
                    }}
                  >
                    {showAllModels ? '− Show less' : `+ ${AVAILABLE_MODELS.filter(m => !m.featured).length} more models`}
                  </button>
                </div>
              )}

              <button
                onClick={() => handleInitModel(selectedModelId)}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, hsla(190, 100%, 55%, 0.1), hsla(190, 100%, 55%, 0.04))',
                  border: '1px solid hsla(190, 100%, 55%, 0.2)',
                  color: 'hsl(var(--primary))',
                  boxShadow: '0 4px 20px hsla(190, 100%, 55%, 0.06)',
                }}
              >
                <Zap className="w-4 h-4" />
                {wantsModelSwitch ? 'Switch to' : 'Initialize'} {selectedModel.name}
                <span className="text-[10px] opacity-50" style={mono}>({selectedModel.size})</span>
              </button>

              <p className="text-[9px] text-center tracking-[0.15em] text-muted-foreground" style={mono}>
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
            <p className="text-xs max-w-sm text-center leading-relaxed text-muted-foreground" style={mono}>
              {loadProgress}
            </p>
          </div>
        )}

        {/* Ready */}
        {isLoaded && messages.length === 0 && !isLoading && !wantsModelSwitch && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Sparkles className="w-8 h-8 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsla(190, 100%, 55%, 0.4))' }} />
            <p className="text-base font-medium text-primary">Neural is ready</p>
            <p className="text-xs tracking-wider text-muted-foreground" style={mono}>
              TYPE OR SPEAK A MESSAGE TO BEGIN
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" style={mono}>
                <Mic className="w-3.5 h-3.5" style={{ color: 'hsl(190 100% 55%)' }} /> Voice Input
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" style={mono}>
                <Volume2 className="w-3.5 h-3.5" style={{ color: 'hsl(160 90% 50%)' }} /> Voice Output
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" style={mono}>
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" /> Settings
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[75%] px-4 py-3 text-sm leading-relaxed"
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
                <div className="prose prose-sm prose-invert max-w-none [&>*]:m-0 [&>*]:text-sm [&>p]:leading-relaxed [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_strong]:text-primary [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing / processing indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '600ms',
                }} />
              ))}
            </div>
            <span className="text-[10px] tracking-wider text-muted-foreground" style={mono}>
              THINKING
            </span>
          </div>
        )}

        {/* Speaking indicator */}
        {ttsSpeaking && (
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-end gap-[2px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[3px] rounded-full animate-pulse" style={{
                  background: 'hsl(160 90% 50%)',
                  height: `${5 + i * 2}px`,
                  animationDelay: `${i * 0.08}s`,
                  filter: 'drop-shadow(0 0 3px hsla(160, 90%, 50%, 0.4))',
                }} />
              ))}
            </div>
            <span className="text-[10px] tracking-wider" style={{ color: 'hsl(160 70% 50%)', ...mono }}>SPEAKING</span>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <StatsBar stats={lastStats} isGenerating={isGenerating} />

      {/* Conversation info bar */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-5 py-1 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))', background: 'hsla(215, 30%, 6%, 0.4)' }}>
          <span className="text-[9px] text-muted-foreground" style={mono}>{messages.length} messages • {totalWords} words</span>
          <span className="text-[9px] text-muted-foreground" style={mono}>temp: {settings.temperature} • max: {settings.maxTokens}</span>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-border">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoaded ? 'Type or use mic to speak...' : 'Load a model first...'}
            disabled={!isLoaded}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/30 disabled:opacity-15"
            style={mono}
          />

          <button type="button" onClick={handleVoiceInput} disabled={!isLoaded} className="p-1.5 rounded-lg transition-all disabled:opacity-10" style={{
            color: isRecording ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
            background: isRecording ? 'hsla(340, 80%, 55%, 0.1)' : 'transparent',
            border: isRecording ? '1px solid hsla(340, 80%, 55%, 0.2)' : '1px solid transparent',
            boxShadow: isRecording ? '0 0 10px hsla(340, 80%, 55%, 0.15)' : 'none',
          }} title={isRecording ? 'Stop recording' : 'Voice input'}>
            {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
          </button>

          <button type="submit" disabled={!input.trim() || isGenerating || !isLoaded} className="p-1.5 rounded-lg transition-all disabled:opacity-8 text-primary" style={{
            background: input.trim() ? 'hsla(190, 100%, 55%, 0.1)' : 'transparent',
            border: input.trim() ? '1px solid hsla(190, 100%, 55%, 0.15)' : '1px solid transparent',
            boxShadow: input.trim() ? '0 0 10px hsla(190, 100%, 55%, 0.1)' : 'none',
          }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;

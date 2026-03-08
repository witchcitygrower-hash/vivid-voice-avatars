import { useWebLLM } from '@/hooks/useWebLLM';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAvatarAnimations, detectAction, type AvatarAction } from '@/hooks/useAvatarAnimations';
import SVGAvatar from '@/components/SVGAvatar';
import ChatBox from '@/components/ChatBox';
import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Plus, MessageSquare, Trash2, Cpu, Volume2 } from 'lucide-react';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

const emptyAudioData: AudioData = {
  volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
};

const COOL_ACTIONS: AvatarAction[] = [
  'backflip', 'frontflip', 'spin', 'dance', 'breakdance', 'robot_dance',
  'moonwalk', 'disco', 'cartwheel', 'hadouken', 'kamehameha', 'super_saiyan',
  'barrel_roll', 'matrix_dodge', 'explode', 'teleport', 'glitch', 'power_up',
  'lightning', 'tornado', 'rainbow', 'helicopter', 'corkscrew', 'moonjump',
];

const Index = () => {
  const { isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId, lastStats, settings, initEngine, sendMessage, clearMessages, setMessages, updateSettings } = useWebLLM();
  const tts = useKokoroTTS();
  const history = useChatHistory();
  const avatar = useAvatarAnimations();
  const wasGeneratingRef = useRef(false);
  const actionCooldownRef = useRef(0);
  const ttsInitStarted = useRef(false);
  const [pendingReveal, setPendingReveal] = useState(false); // true = hiding last assistant msg while TTS synthesizes

  // Pre-load Kokoro TTS immediately
  useEffect(() => {
    if (!ttsInitStarted.current) {
      ttsInitStarted.current = true;
      tts.initTTS();
    }
  }, []);

  // Sync messages to active session
  useEffect(() => {
    if (history.activeSessionId && messages.length > 0) {
      history.updateSession(history.activeSessionId, messages, currentModelId);
    }
  }, [messages, currentModelId]);

  const performanceActions: AvatarAction[] = ['nod', 'wave', 'wave_both', 'sway', 'shrug', 'point', 'salute', 'happy', 'think', 'confused'];

  const detectActionRobust = useCallback((text: string): AvatarAction | null => {
    const detected = detectAction(text);
    if (detected) return detected;

    const lower = text.toLowerCase();
    // "do something cool/random/fun" → pick a random cool action
    if (/something (cool|random|fun|crazy|awesome|wild|sick|epic)|random (animation|action|move|trick)|surprise me|show me something/i.test(lower)) {
      return COOL_ACTIONS[Math.floor(Math.random() * COOL_ACTIONS.length)];
    }
    if (lower.includes('back flip') || lower.includes('backflip') || lower.includes('flip')) return 'backflip';
    if (lower.includes('explod') || lower.includes('boom')) return 'explode';
    if (lower.includes('spin') || lower.includes('rotate')) return 'spin';
    if (lower.includes('dance') || lower.includes('groove')) return 'dance';
    if (lower.includes('wave')) return 'wave';
    if (lower.includes('jump')) return 'jump';
    return null;
  }, []);

  const triggerActionSafely = useCallback((action: AvatarAction) => {
    const now = performance.now();
    if (now - actionCooldownRef.current < 280) return;
    actionCooldownRef.current = now;
    avatar.triggerAction(action);
  }, [avatar.triggerAction]);

  const pickAmbientAction = useCallback((): AvatarAction => {
    return performanceActions[Math.floor(Math.random() * performanceActions.length)];
  }, []);

  // When generation finishes, hide text, synthesize TTS, then reveal text + animation together
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        const userMsg = messages[messages.length - 2];
        const actionFromUser = userMsg ? detectActionRobust(userMsg.content) : null;
        const actionFromAssistant = detectActionRobust(lastMsg.content);
        const action = actionFromUser || actionFromAssistant || pickAmbientAction();

        // Hide the assistant message while TTS synthesizes
        setPendingReveal(true);

        tts.speak(lastMsg.content, () => {
          // Audio is now playing — reveal text and trigger animation simultaneously
          setPendingReveal(false);
          triggerActionSafely(action);
        });
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, messages, tts.speak, detectActionRobust, pickAmbientAction, triggerActionSafely]);

  // Compute visible messages: hide streaming assistant text AND pending reveal
  const visibleMessages = useMemo(() => {
    // While generating, hide the streaming assistant placeholder
    if (isGenerating && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      return messages.slice(0, -1);
    }
    // While TTS is synthesizing, hide the completed assistant message
    if (pendingReveal && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') {
      return messages.slice(0, -1);
    }
    return messages;
  }, [messages, isGenerating, pendingReveal]);

  const handleSend = useCallback((text: string) => {
    if (!history.activeSessionId) {
      history.createSession(currentModelId);
    }
    sendMessage(text);
  }, [history.activeSessionId, currentModelId, sendMessage, history.createSession]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    history.setActiveSessionId(null);
  }, [clearMessages, history.setActiveSessionId]);

  const handleSwitchChat = useCallback((id: string) => {
    const session = history.sessions.find(s => s.id === id);
    if (session) {
      history.switchSession(id);
      setMessages(session.messages);
    }
  }, [history.sessions, history.switchSession, setMessages]);

  const activeAudioData = tts.isSpeaking ? tts.audioData : emptyAudioData;
  const mono = { fontFamily: 'var(--font-mono)' };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-background">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="bgGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGrid)" />
        </svg>
      </div>

      {/* Left sidebar */}
      <div
        className="absolute top-0 left-0 bottom-0 z-30 flex flex-col"
        style={{
          width: '240px',
          background: 'hsla(215, 35%, 5%, 0.98)',
          borderRight: '1px solid hsl(var(--border))',
        }}
      >
        {/* Avatar section */}
        <div className="p-3 shrink-0">
          <div
            className="rounded-xl overflow-hidden relative"
            style={{
              height: '200px',
              background: 'hsla(215, 35%, 6%, 0.9)',
              border: '1px solid hsla(190, 80%, 40%, 0.2)',
              boxShadow: '0 0 40px hsla(190, 100%, 50%, 0.06)',
            }}
          >
            <SVGAvatar audioData={activeAudioData} isListening={tts.isSpeaking} action={avatar.currentAction} actionProgress={avatar.animProgress} />

            {/* Status dot */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5" style={mono}>
              <div
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: tts.isSpeaking ? 'hsl(160 100% 55%)' : isGenerating ? 'hsl(45 100% 55%)' : 'hsl(var(--muted-foreground))',
                  boxShadow: tts.isSpeaking ? '0 0 8px hsl(160 100% 55%)' : isGenerating ? '0 0 8px hsl(45 100% 55%)' : 'none',
                }}
              />
              <span className="text-[7px] tracking-[0.15em] uppercase" style={{
                color: tts.isSpeaking ? 'hsl(160 70% 55%)' : isGenerating ? 'hsl(45 80% 55%)' : 'hsl(var(--muted-foreground))',
              }}>
                {tts.isSpeaking ? 'Speaking' : isGenerating ? 'Thinking' : 'Standby'}
              </span>
            </div>

            {/* System badges */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
              <span className="text-[8px] tracking-[0.2em] uppercase font-medium text-primary" style={mono}>
                Neural
              </span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'LLM', ready: isLoaded, loading: isLoading },
                  { label: 'STT', ready: true, loading: false },
                  { label: 'TTS', ready: tts.isLoaded, loading: tts.isLoading },
                ].map(({ label, ready, loading }) => (
                  <span
                    key={label}
                    className="text-[5px] px-1 py-px rounded tracking-wider"
                    style={{
                      background: ready ? 'hsla(160, 100%, 50%, 0.1)' : loading ? 'hsla(45, 100%, 55%, 0.1)' : 'hsla(210, 15%, 30%, 0.2)',
                      border: `1px solid ${ready ? 'hsla(160, 100%, 50%, 0.2)' : loading ? 'hsla(45, 100%, 55%, 0.2)' : 'hsla(210, 15%, 30%, 0.1)'}`,
                      color: ready ? 'hsl(160 80% 55%)' : loading ? 'hsl(45 80% 55%)' : 'hsl(var(--muted-foreground))',
                      ...mono,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audio bars when speaking */}
        {tts.isSpeaking && (
          <div className="px-3 pb-2 flex flex-col gap-1 shrink-0" style={mono}>
            {[
              { label: 'VOL', value: activeAudioData.volume, color: 'hsl(var(--primary))' },
              { label: 'BASS', value: activeAudioData.bass, color: 'hsl(var(--accent))' },
              { label: 'MID', value: activeAudioData.mid, color: 'hsl(var(--secondary))' },
              { label: 'HIGH', value: activeAudioData.treble, color: 'hsl(160 80% 50%)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[7px] tracking-wider w-6 text-right text-muted-foreground">{label}</span>
                <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full transition-all duration-75" style={{ width: `${value * 100}%`, background: color, boxShadow: value > 0.3 ? `0 0 6px ${color}` : 'none' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System info */}
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg" style={{ background: 'hsla(215, 25%, 8%, 0.5)', border: '1px solid hsl(var(--border))' }}>
            <div className="flex-1 space-y-1">
              {currentModelId ? (
                <>
                  <div className="flex items-center gap-1">
                    <Cpu className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[8px] text-primary" style={mono}>{currentModelId.split('-').slice(0, 2).join(' ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5" style={{ color: tts.isLoaded ? 'hsl(160 80% 50%)' : 'hsl(var(--muted-foreground))' }} />
                    <span className="text-[8px] text-muted-foreground" style={mono}>Kokoro TTS {tts.isLoaded ? '✓' : tts.isLoading ? '...' : '✗'}</span>
                  </div>
                </>
              ) : (
                <span className="text-[8px] text-muted-foreground" style={mono}>No model loaded</span>
              )}
            </div>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-3 py-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'hsla(190, 100%, 55%, 0.06)',
              border: '1px solid hsla(190, 100%, 55%, 0.15)',
              color: 'hsl(var(--primary))',
              ...mono,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-wider uppercase">New Chat</span>
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsla(190, 60%, 30%, 0.15) transparent' }}>
          <div className="flex items-center gap-2 py-2">
            <span className="text-[8px] tracking-[0.2em] uppercase text-muted-foreground" style={mono}>
              History
            </span>
            <div className="flex-1 h-px bg-border" />
            {history.sessions.length > 0 && (
              <span className="text-[7px] text-muted-foreground" style={mono}>{history.sessions.length}</span>
            )}
          </div>

          {history.sessions.length === 0 && (
            <p className="text-[9px] text-muted-foreground text-center py-4" style={mono}>
              No conversations yet
            </p>
          )}

          <div className="space-y-0.5">
            {history.sessions.map((session) => {
              const isActive = session.id === history.activeSessionId;
              return (
                <div
                  key={session.id}
                  className="group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: isActive ? 'hsla(190, 100%, 55%, 0.06)' : 'transparent',
                    border: isActive ? '1px solid hsla(190, 100%, 55%, 0.1)' : '1px solid transparent',
                  }}
                  onClick={() => handleSwitchChat(session.id)}
                >
                  <MessageSquare className="w-3 h-3 shrink-0" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] truncate" style={{
                      color: isActive ? 'hsl(190 60% 65%)' : 'hsl(210 10% 55%)',
                      ...mono,
                    }}>
                      {session.title}
                    </p>
                    <p className="text-[7px] text-muted-foreground" style={mono}>
                      {session.messages.length} msgs
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); history.deleteSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-destructive/10"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="absolute inset-0 z-10 flex flex-col" style={{ paddingLeft: '240px' }}>
        <ChatBox
          isLoaded={isLoaded}
          isLoading={isLoading}
          loadProgress={loadProgress}
          isGenerating={isGenerating}
          messages={messages}
          currentModelId={currentModelId}
          ttsEnabled={tts.ttsEnabled}
          ttsLoading={tts.isLoading}
          ttsLoaded={tts.isLoaded}
          ttsSpeaking={tts.isSpeaking}
          ttsProgress={tts.loadProgress}
          lastStats={lastStats}
          settings={settings}
          onSend={handleSend}
          onClear={handleNewChat}
          onInit={initEngine}
          onToggleTTS={tts.toggleTTS}
          onUpdateSettings={updateSettings}
        />
      </div>
    </div>
  );
};

export default Index;

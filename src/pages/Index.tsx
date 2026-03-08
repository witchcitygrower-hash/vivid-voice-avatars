import { useWebLLM } from '@/hooks/useWebLLM';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import SVGAvatar from '@/components/SVGAvatar';
import AudioVisualizer from '@/components/AudioVisualizer';
import ChatBox from '@/components/ChatBox';
import { useEffect, useRef } from 'react';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

const emptyAudioData: AudioData = {
  volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
};

const Index = () => {
  const { isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId, initEngine, sendMessage, clearMessages } = useWebLLM();
  const tts = useKokoroTTS();
  const prevMsgCountRef = useRef(messages.length);
  const wasGeneratingRef = useRef(false);

  // Auto-speak when assistant message finishes generating
  useEffect(() => {
    // Detect transition from generating to not generating
    if (wasGeneratingRef.current && !isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        console.log('LLM finished, triggering TTS for:', lastMsg.content.substring(0, 50));
        tts.speak(lastMsg.content);
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, messages, tts.speak]);

  // Audio data from TTS for avatar
  const activeAudioData = tts.isSpeaking ? tts.audioData : emptyAudioData;
  const isActive = tts.isSpeaking;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={{ background: 'hsl(220 50% 4%)' }}>
      {/* Avatar */}
      <SVGAvatar audioData={activeAudioData} isListening={isActive} />

      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, hsla(220, 50%, 4%, 0.9), transparent)' }} />

      {/* Title */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <h1 className="text-lg tracking-[0.4em] uppercase font-light" style={{ fontFamily: 'var(--font-display)', color: 'hsl(210 20% 50%)' }}>
          Neural <span className="font-semibold" style={{ color: 'hsl(190 100% 55%)' }}>Avatar</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isActive ? 'hsl(190 100% 55%)' : 'hsl(210 15% 40%)',
              boxShadow: isActive ? '0 0 8px hsl(190 100% 55%)' : 'none',
            }}
          />
          <p className="text-[10px] tracking-[0.25em]" style={{ fontFamily: 'var(--font-mono)', color: 'hsl(210 15% 45%)' }}>
            {tts.isSpeaking ? 'SPEAKING — TTS ACTIVE' : isGenerating ? 'THINKING — GENERATING' : 'STANDBY — AWAITING INPUT'}
          </p>
        </div>
      </div>

      {/* Audio visualizer */}
      <AudioVisualizer audioData={activeAudioData} isListening={isActive} />

      {/* Chat box */}
      <div className="absolute bottom-4 right-4 z-20">
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
          onSend={sendMessage}
          onClear={clearMessages}
          onInit={initEngine}
          onToggleTTS={tts.toggleTTS}
        />
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, hsla(220, 50%, 4%, 0.9), transparent)' }} />

      {/* Stats - shown when TTS speaking */}
      {isActive && (
        <div className="absolute bottom-10 left-5 flex flex-col gap-1.5 text-left z-10" style={{ fontFamily: 'var(--font-mono)' }}>
          {[
            { label: 'VOL', value: activeAudioData.volume, color: 'hsl(190 100% 55%)' },
            { label: 'BASS', value: activeAudioData.bass, color: 'hsl(340 80% 55%)' },
            { label: 'MID', value: activeAudioData.mid, color: 'hsl(260 70% 60%)' },
            { label: 'HI', value: activeAudioData.treble, color: 'hsl(160 80% 50%)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[9px] tracking-wider w-6" style={{ color: 'hsl(210 15% 40%)' }}>{label}</span>
              <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'hsla(210, 15%, 20%, 0.5)' }}>
                <div className="h-full rounded-full transition-all duration-75" style={{ width: `${value * 100}%`, background: color, boxShadow: value > 0.3 ? `0 0 6px ${color}` : 'none' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;

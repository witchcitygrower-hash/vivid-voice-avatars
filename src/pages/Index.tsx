import { useWebLLM } from '@/hooks/useWebLLM';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import SVGAvatar from '@/components/SVGAvatar';
import ChatBox from '@/components/ChatBox';
import { useEffect, useRef } from 'react';
import type { AudioData } from '@/hooks/useAudioAnalyzer';

const emptyAudioData: AudioData = {
  volume: 0, bass: 0, mid: 0, treble: 0, frequencies: null, waveform: null,
};

const Index = () => {
  const { isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId, initEngine, sendMessage, clearMessages } = useWebLLM();
  const tts = useKokoroTTS();
  const wasGeneratingRef = useRef(false);
  const ttsInitStarted = useRef(false);

  // Pre-load Kokoro TTS immediately
  useEffect(() => {
    if (!ttsInitStarted.current) {
      ttsInitStarted.current = true;
      tts.initTTS();
    }
  }, []);

  // Auto-speak when assistant message finishes
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        tts.speak(lastMsg.content);
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, messages, tts.speak]);

  const activeAudioData = tts.isSpeaking ? tts.audioData : emptyAudioData;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={{ background: 'hsl(220 50% 4%)' }}>
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="bgGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(190 80% 50%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGrid)" />
        </svg>
      </div>

      {/* Streamer-style avatar - top left */}
      <div
        className="absolute top-4 left-4 z-30 rounded-2xl overflow-hidden"
        style={{
          width: '220px',
          height: '220px',
          background: 'hsla(215, 35%, 6%, 0.9)',
          border: '1px solid hsla(190, 80%, 40%, 0.2)',
          boxShadow: '0 0 40px hsla(190, 100%, 50%, 0.06), 0 8px 32px hsla(220, 50%, 2%, 0.6)',
        }}
      >
        <div className="w-full h-full relative">
          <SVGAvatar audioData={activeAudioData} isListening={tts.isSpeaking} />

          {/* Status dot overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
            <div
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: tts.isSpeaking ? 'hsl(160 100% 55%)' : isGenerating ? 'hsl(45 100% 55%)' : 'hsl(210 15% 35%)',
                boxShadow: tts.isSpeaking ? '0 0 8px hsl(160 100% 55%)' : isGenerating ? '0 0 8px hsl(45 100% 55%)' : 'none',
              }}
            />
            <span className="text-[7px] tracking-[0.15em] uppercase" style={{
              color: tts.isSpeaking ? 'hsl(160 70% 55%)' : isGenerating ? 'hsl(45 80% 55%)' : 'hsl(210 15% 35%)',
            }}>
              {tts.isSpeaking ? 'Speaking' : isGenerating ? 'Thinking' : 'Standby'}
            </span>
          </div>

          {/* Name label */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span className="text-[8px] tracking-[0.2em] uppercase font-medium" style={{ color: 'hsl(190 60% 55%)', fontFamily: 'var(--font-mono)' }}>
              Neural
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: 'LLM', ready: isLoaded, loading: isLoading },
                { label: 'TTS', ready: tts.isLoaded, loading: tts.isLoading },
              ].map(({ label, ready, loading }) => (
                <span
                  key={label}
                  className="text-[6px] px-1 py-px rounded tracking-wider"
                  style={{
                    background: ready ? 'hsla(160, 100%, 50%, 0.1)' : loading ? 'hsla(45, 100%, 55%, 0.1)' : 'hsla(210, 15%, 30%, 0.2)',
                    border: `1px solid ${ready ? 'hsla(160, 100%, 50%, 0.2)' : loading ? 'hsla(45, 100%, 55%, 0.2)' : 'hsla(210, 15%, 30%, 0.1)'}`,
                    color: ready ? 'hsl(160 80% 55%)' : loading ? 'hsl(45 80% 55%)' : 'hsl(210 15% 30%)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audio level bars under avatar when speaking */}
      {tts.isSpeaking && (
        <div className="absolute top-[240px] left-4 z-20 flex flex-col gap-1" style={{ width: '220px', fontFamily: 'var(--font-mono)' }}>
          {[
            { label: 'VOL', value: activeAudioData.volume, color: 'hsl(190 100% 55%)' },
            { label: 'BASS', value: activeAudioData.bass, color: 'hsl(340 80% 55%)' },
            { label: 'MID', value: activeAudioData.mid, color: 'hsl(260 70% 60%)' },
            { label: 'HIGH', value: activeAudioData.treble, color: 'hsl(160 80% 50%)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[7px] tracking-wider w-6 text-right" style={{ color: 'hsl(210 15% 35%)' }}>{label}</span>
              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'hsla(210, 15%, 15%, 0.6)' }}>
                <div className="h-full rounded-full transition-all duration-75" style={{ width: `${value * 100}%`, background: color, boxShadow: value > 0.3 ? `0 0 6px ${color}` : 'none' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen chat */}
      <div className="absolute inset-0 z-10 flex flex-col" style={{ paddingLeft: '248px', paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
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
    </div>
  );
};

export default Index;

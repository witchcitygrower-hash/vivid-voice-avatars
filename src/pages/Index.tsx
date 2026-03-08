import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { useWebLLM } from '@/hooks/useWebLLM';
import { useKokoroTTS } from '@/hooks/useKokoroTTS';
import SVGAvatar from '@/components/SVGAvatar';
import AudioVisualizer from '@/components/AudioVisualizer';
import ChatBox from '@/components/ChatBox';
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

const Index = () => {
  const { isListening, audioData: micAudioData, startListening, stopListening } = useAudioAnalyzer();
  const { isLoaded, isLoading, loadProgress, isGenerating, messages, currentModelId, initEngine, sendMessage, clearMessages } = useWebLLM();
  const tts = useKokoroTTS();
  const prevMsgCountRef = useRef(messages.length);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && !isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content && tts.ttsEnabled && tts.isLoaded) {
        tts.speak(lastMsg.content);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isGenerating, tts.ttsEnabled, tts.isLoaded]);

  // Merge audio: TTS takes priority, then mic
  const activeAudioData = tts.isSpeaking ? tts.audioData : micAudioData;
  const isActive = tts.isSpeaking || isListening;

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
            {tts.isSpeaking ? 'SPEAKING — TTS ACTIVE' : isListening ? 'ACTIVE — PROCESSING AUDIO' : 'STANDBY — AWAITING INPUT'}
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

      {/* Mic button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={isListening ? stopListening : startListening}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full cursor-pointer transition-all duration-500 outline-none"
          style={{
            background: isListening
              ? 'radial-gradient(circle, hsla(190, 100%, 55%, 0.15), transparent)'
              : 'hsla(210, 20%, 20%, 0.5)',
            border: `1px solid ${isListening ? 'hsla(190, 100%, 55%, 0.4)' : 'hsla(210, 15%, 30%, 0.5)'}`,
            boxShadow: isListening ? '0 0 20px hsla(190, 100%, 55%, 0.2)' : 'none',
          }}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" style={{ color: 'hsl(190 100% 55%)' }} />
          ) : (
            <Mic className="w-5 h-5" style={{ color: 'hsl(210 15% 50%)' }} />
          )}
          {isListening && (
            <span className="absolute inset-0 rounded-full animate-ping" style={{ border: '1px solid hsla(190, 100%, 55%, 0.15)' }} />
          )}
        </button>
        <p className="text-center text-[10px] mt-2 tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono)', color: 'hsl(210 15% 40%)' }}>
          {isListening ? 'TAP TO STOP' : 'TAP TO SPEAK'}
        </p>
      </div>

      {/* Stats */}
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

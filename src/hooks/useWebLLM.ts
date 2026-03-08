import { useState, useRef, useCallback } from 'react';
import * as webllm from '@mlc-ai/web-llm';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export interface GenerationStats {
  tokensGenerated: number;
  tokensPerSecond: number;
  totalTimeMs: number;
  promptTokens: number;
}

export interface ModelSettings {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

const DEFAULT_SETTINGS: ModelSettings = {
  systemPrompt: 'You are a friendly, helpful robot assistant called Neural. Keep responses concise and engaging. Use casual, warm language.',
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.9,
};

export function useWebLLM() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [lastStats, setLastStats] = useState<GenerationStats | null>(null);
  const [settings, setSettings] = useState<ModelSettings>(DEFAULT_SETTINGS);
  const engineRef = useRef<webllm.MLCEngine | null>(null);

  const initEngine = useCallback(async (modelId: string) => {
    if (isLoading) return;

    if (engineRef.current) {
      engineRef.current = null;
      setIsLoaded(false);
    }

    setIsLoading(true);
    setLoadProgress('Initializing WebGPU...');

    try {
      const engine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          setLoadProgress(report.text);
        },
      });
      engineRef.current = engine;
      setCurrentModelId(modelId);
      setIsLoaded(true);
      setLoadProgress('');
    } catch (e) {
      console.error('Failed to load WebLLM:', e);
      setLoadProgress(`Error: ${e instanceof Error ? e.message : 'Failed to load model. WebGPU may not be supported.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!engineRef.current || isGenerating) return;

    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsGenerating(true);
    setLastStats(null);

    const startTime = performance.now();
    let tokenCount = 0;

    try {
      const chatMessages: webllm.ChatCompletionMessageParam[] = [
        { role: 'system', content: settings.systemPrompt },
        ...newMessages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ];

      let assistantContent = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const chunks = await engineRef.current.chat.completions.create({
        messages: chatMessages,
        stream: true,
        max_tokens: settings.maxTokens,
        temperature: settings.temperature,
        top_p: settings.topP,
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) tokenCount++;
        assistantContent += delta;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }

      const totalTime = performance.now() - startTime;
      setLastStats({
        tokensGenerated: tokenCount,
        tokensPerSecond: tokenCount / (totalTime / 1000),
        totalTimeMs: totalTime,
        promptTokens: newMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
      });
    } catch (e) {
      console.error('Generation error:', e);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  }, [messages, isGenerating, settings]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastStats(null);
  }, []);

  const updateSettings = useCallback((partial: Partial<ModelSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    isLoaded,
    isLoading,
    loadProgress,
    isGenerating,
    messages,
    currentModelId,
    lastStats,
    settings,
    initEngine,
    sendMessage,
    clearMessages,
    setMessages,
    updateSettings,
  };
}

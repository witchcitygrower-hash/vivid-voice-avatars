import { useState, useRef, useCallback, useEffect } from 'react';
import * as webllm from '@mlc-ai/web-llm';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function useWebLLM() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const engineRef = useRef<webllm.MLCEngine | null>(null);

  const initEngine = useCallback(async () => {
    if (engineRef.current || isLoading) return;
    setIsLoading(true);
    setLoadProgress('Initializing WebGPU...');

    try {
      const engine = await webllm.CreateMLCEngine(
        'Phi-3.5-mini-instruct-q4f16_1-MLC',
        {
          initProgressCallback: (report) => {
            setLoadProgress(report.text);
          },
        }
      );
      engineRef.current = engine;
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

    try {
      const chatMessages: webllm.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a friendly, helpful robot assistant called Neural. Keep responses concise and engaging. Use casual, warm language.',
        },
        ...newMessages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ];

      let assistantContent = '';

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const chunks = await engineRef.current.chat.completions.create({
        messages: chatMessages,
        stream: true,
        max_tokens: 256,
        temperature: 0.7,
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        assistantContent += delta;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      }
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
  }, [messages, isGenerating]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isLoaded,
    isLoading,
    loadProgress,
    isGenerating,
    messages,
    initEngine,
    sendMessage,
    clearMessages,
  };
}

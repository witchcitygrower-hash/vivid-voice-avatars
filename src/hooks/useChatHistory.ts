import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from './useWebLLM';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'neural-chat-history';

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

function generateTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New Chat';
  const text = firstUser.content.replace(/\[Image attached\]\n?/, '').trim();
  return text.length > 40 ? text.substring(0, 40) + '...' : text || 'New Chat';
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const createSession = useCallback((modelId: string | null): string => {
    const id = crypto.randomUUID();
    const session: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      modelId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(id);
    return id;
  }, []);

  const updateSession = useCallback((id: string, messages: ChatMessage[], modelId: string | null) => {
    setSessions(prev => prev.map(s =>
      s.id === id
        ? { ...s, messages, modelId, title: generateTitle(messages), updatedAt: Date.now() }
        : s
    ));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  }, [activeSessionId]);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    updateSession,
    deleteSession,
    switchSession,
    setActiveSessionId,
  };
}

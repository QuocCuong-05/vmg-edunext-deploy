import { useState, useRef, useCallback } from 'react';

export function useStreamChat({ api, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesRef = useRef(messages);
  const abortRef = useRef(null);
  const loadingRef = useRef(false);

  messagesRef.current = messages;
  loadingRef.current = isLoading;

  const append = useCallback(async (userMsg, options = {}) => {
    if (loadingRef.current) return;
    setError(null);

    const prevMessages = messagesRef.current;
    const newMessages = [...prevMessages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const token = localStorage.getItem('vmg_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(api, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: newMessages, mode: options.mode || 'chat' }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      }
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setMessages(prev => prev.slice(0, -1));
      }
      return false;
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [api]);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { messages, setMessages, append, isLoading, error, stop };
}

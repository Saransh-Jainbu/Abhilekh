import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/app.css';

const LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  pa: 'Punjabi',
  mr: 'Marathi',
};

export default function ChatPanel({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!documentId) return;
    setMessages([]);
    setHistoryLoading(true);
    const sessionId = localStorage.getItem('sessionId');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/documents/${documentId}/chat`, {
      headers: { 'x-session-id': sessionId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [documentId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const sessionId = localStorage.getItem('sessionId');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/documents/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          message: userMessage,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) {
                console.error('Stream error:', data.error);
                break;
              }
              if (data.text) {
                assistantMessage += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMessage;
                  return updated;
                });
              }
            } catch (e) {
              console.error('Failed to parse SSE:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Send message failed:', error);
      // Remove user message on error
      setMessages((prev) => prev.slice(0, -1));
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat">
      {/* Language selector */}
      <div className="chat-lang">
        <label>Chat language</label>
        <select
          className="chat-select"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={loading}
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="chat-window">
        <div className="chat-scroll">
          {historyLoading && (
            <p className="chat-empty">Loading chat history…</p>
          )}
          {!historyLoading && messages.length === 0 && (
            <p className="chat-empty">
              <span className="glyph">💬</span>
              Ask questions about this document
            </p>
          )}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isStreaming =
              !isUser && loading && i === messages.length - 1 && !msg.content;
            return (
              <div key={i} className={`bubble ${isUser ? 'user' : 'assistant'}`}>
                <p className="who">{isUser ? 'You' : 'Assistant'}</p>
                {isStreaming ? (
                  <span className="typing"><span /><span /><span /></span>
                ) : (
                  <p className="text">{msg.content}</p>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading || historyLoading}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={loading || historyLoading || !input.trim()}
          >
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

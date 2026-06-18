import { useState, useEffect, useRef } from 'react';
import { chat } from '../services/api';

export default function ChatPanel({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const response = await chat.getHistory(documentId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chat.sendMessage(documentId, userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.content }]);
    } catch (error) {
      console.error('Send message failed:', error);
      setMessages((prev) =>
        prev.filter((_, i) => i !== prev.length - 1)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
        {messages.length === 0 && (
          <p className="text-muted">Ask questions about this document</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '4px',
              background: msg.role === 'user' ? '#f0f0f0' : '#e8e8e8',
            }}
          >
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </p>
            <p style={{ fontSize: '14px' }}>{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

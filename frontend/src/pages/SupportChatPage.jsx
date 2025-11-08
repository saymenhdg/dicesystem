import React, { useState } from 'react';
import { Send, Bot, User, Headphones } from 'lucide-react';

const SupportChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'Hi! I am DiceBank Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    // Simulate AI response
    setTimeout(() => {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: "Here's what I found based on your question (demo). If you need, you can escalate to a human agent." }
      ]);
    }, 700);
  };

  const escalate = () => {
    setEscalated(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 2, role: 'bot', text: 'I have escalated your chat. A human agent will join shortly. (demo)' }
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><Bot size={18} /></div>
          <div>
            <p className="font-semibold text-gray-900">DiceBank Assistant</p>
            <p className="text-xs text-gray-500">AI support • {escalated ? 'Human agent requested' : 'Instant replies'}</p>
          </div>
        </div>
        <button onClick={escalate} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <Headphones size={16} /> Escalate to Human
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-[11px]">
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span>{m.role === 'user' ? 'You' : 'Assistant'}</span>
              </div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-gray-500">Assistant is typing…</div>
        )}
      </div>

      <form onSubmit={send} className="p-4 border-t flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
          <Send size={16} /> Send
        </button>
      </form>
    </div>
  );
};

export default SupportChatPage;

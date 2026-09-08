import { Bot, ChevronDown, Send, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, gymApi } from '../services/api';

const starterPrompts = [
  'How can I build muscle as a beginner?',
  'Create a simple weekly workout routine.',
  'What should I eat before a workout?',
];

export default function FitLifeAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I’m FitLife AI. Ask me anything about workouts, exercises, training, nutrition, or your FitLife account.' },
  ]);

  async function sendMessage(event, preset) {
    event?.preventDefault();
    const text = String(preset ?? message).trim();
    if (!text || busy) return;
    setMessage('');
    setOpen(true);
    setMessages(current => [...current, { role: 'user', text }]);
    setBusy(true);
    try {
      const response = await gymApi.aiChat(text);
      setMessages(current => [...current, { role: 'assistant', text: response.data?.response || 'I could not generate a response.' }]);
    } catch (error) {
      setMessages(current => [...current, { role: 'assistant', text: errorMessage(error) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className={`ai-assistant ${open ? 'ai-assistant--open' : ''}`}>
      {open && (
        <div className="ai-panel">
          <header className="ai-panel-head">
            <div><span className="ai-avatar"><Bot size={17} /></span><div><b>FitLife AI</b><small>Gym & fitness assistant</small></div></div>
            <button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={17} /></button>
          </header>
          <div className="ai-messages" aria-live="polite">
            {messages.map((item, index) => <div className={`ai-message ai-message--${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>)}
            {busy && <div className="ai-message ai-message--assistant ai-typing">Thinking…</div>}
          </div>
          {messages.length === 1 && <div className="ai-starters">{starterPrompts.map(prompt => <button type="button" key={prompt} onClick={event => sendMessage(event, prompt)}><Sparkles size={13} />{prompt}</button>)}</div>}
          <form className="ai-composer" onSubmit={sendMessage}>
            <input value={message} onChange={event => setMessage(event.target.value)} placeholder="Ask any fitness question…" aria-label="Ask FitLife AI" />
            <button type="submit" disabled={busy || !message.trim()} aria-label="Send message"><Send size={16} /></button>
          </form>
        </div>
      )}
      <button className="ai-toggle" type="button" onClick={() => setOpen(current => !current)} aria-expanded={open}>
        {open ? <ChevronDown size={18} /> : <Bot size={19} />}<span>{open ? 'Hide assistant' : 'Ask FitLife AI'}</span>
      </button>
    </aside>
  );
}

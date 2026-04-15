import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

export default function AIAssistant({ project, tasks, onClose }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: `Hi! I'm your AI assistant for **${project?.name}**. I can help you prioritize tasks, suggest improvements, or answer any questions about your project. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMsgs(p => [...p, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const todo       = tasks.filter(t => t.status === 'todo').length;
      const inProgress = tasks.filter(t => t.status === 'inprogress').length;
      const done       = tasks.filter(t => t.status === 'done').length;
      const overdue    = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;

      const { data } = await API.post('/ai/assistant', {
        message: userMsg,
        context: {
          projectName: project.name,
          totalTasks: tasks.length,
          done, inProgress, todo,
          memberCount: project.members.length,
          overdue,
        }
      });
      setMsgs(p => [...p, { role: 'ai', text: data.reply }]);
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  const suggestions = [
    'What should I prioritize?',
    'How is the team doing?',
    'What are overdue tasks?',
    'Suggest next steps',
  ];

  return (
    <div style={s.box}>
      <div style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={s.aiIcon}>✦</div>
          <div>
            <div style={s.title}>AI Assistant</div>
            <div style={s.sub}>Powered by Gemini</div>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
      </div>

      <div style={s.msgs}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
            {m.role === 'ai' && (
              <div style={s.aiAvatar}>✦</div>
            )}
            <div style={{
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--grad)' : 'var(--bg3)',
              border: m.role === 'user' ? 'none' : '1px solid var(--ai-border)',
              borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: '12px', lineHeight: '1.6', color: m.role === 'user' ? '#fff' : 'var(--text)', whiteSpace: 'pre-wrap' }}>{m.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={s.aiAvatar}>✦</div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--ai-border)', borderRadius: '2px 12px 12px 12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--ai)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {msgs.length <= 1 && (
        <div style={s.suggestions}>
          {suggestions.map((s2, i) => (
            <button key={i} onClick={() => setInput(s2)} className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--ai-border)', color: 'var(--ai)', fontSize: '11px' }}>
              {s2}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={send} style={s.input}>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about your project..."
          style={{ flex: 1, fontSize: '12px', borderRadius: '8px' }}
          disabled={loading} />
        <button type="submit" className="btn btn-ai btn-sm"
          disabled={!input.trim() || loading}
          style={{ padding: '8px 14px', borderRadius: '8px' }}>↑</button>
      </form>
    </div>
  );
}

const s = {
  box:       { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg2)', border: '1px solid var(--ai-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-ai)' },
  head:      { padding: '12px 14px', borderBottom: '1px solid var(--ai-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ai-dim)' },
  aiIcon:    { width: '28px', height: '28px', borderRadius: '7px', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: '700', flexShrink: 0 },
  title:     { fontSize: '13px', fontWeight: '700', color: 'var(--text)' },
  sub:       { fontSize: '10px', color: 'var(--ai)', letterSpacing: '0.02em' },
  msgs:      { flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column' },
  aiAvatar:  { width: '24px', height: '24px', borderRadius: '50%', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-start', marginTop: '2px' },
  suggestions:{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '0 12px 10px' },
  input:     { display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--ai-border)' },
};
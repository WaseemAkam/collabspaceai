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
        context: { projectName: project.name, totalTasks: tasks.length, done, inProgress, todo, memberCount: project.members.length, overdue }
      });
      setMsgs(p => [...p, { role: 'ai', text: data.reply }]);
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  const suggestions = ['What should I prioritize?', 'How is the team doing?', 'What are overdue tasks?', 'Suggest next steps'];

  return (
    <div style={s.box}>
      {/* Header */}
      <div style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={s.aiIcon}>✦</div>
          <div>
            <div style={s.title}>AI Assistant</div>
            <div style={s.sub}>Powered by Gemini</div>
          </div>
        </div>
        <button onClick={onClose} style={s.closeBtn}>✕</button>
      </div>

      {/* Messages */}
      <div style={s.msgs}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
            {m.role === 'ai' && <div style={s.aiAvatar}>✦</div>}
            <div style={{
              maxWidth: '85%',
              background: m.role === 'user' ? 'var(--grad)' : 'var(--bg3)',
              border: m.role === 'user' ? 'none' : '1px solid var(--ai-border)',
              borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: '12px', lineHeight: '1.6', color: m.role === 'user' ? '#fff' : 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={s.aiAvatar}>✦</div>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--ai-border)', borderRadius: '2px 12px 12px 12px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--ai)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />
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
            <button key={i} onClick={() => setInput(s2)} style={s.suggBtn}>{s2}</button>
          ))}
        </div>
      )}

      <form onSubmit={send} style={s.inputRow}>
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
  box:      { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg2)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid var(--ai-border)' },
  head:     { padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ai-dim)', flexShrink: 0 },
  aiIcon:   { width: '28px', height: '28px', borderRadius: '7px', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fff', fontWeight: '700', flexShrink: 0 },
  title:    { fontSize: '13px', fontWeight: '700', color: 'var(--text)' },
  sub:      { fontSize: '10px', color: 'var(--ai)', letterSpacing: '0.02em' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text3)', padding: '4px 8px', borderRadius: '6px', lineHeight: 1 },
  msgs:     { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column' },
  aiAvatar: { width: '22px', height: '22px', borderRadius: '50%', background: 'var(--grad-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', flexShrink: 0, marginRight: '7px', alignSelf: 'flex-start', marginTop: '2px' },
  suggestions:{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '0 12px 8px' },
  suggBtn:  { fontSize: '11px', padding: '5px 10px', borderRadius: '99px', border: '1px solid var(--ai-border)', background: 'var(--ai-dim)', color: 'var(--ai)', cursor: 'pointer', fontFamily: 'inherit' },
  inputRow: { display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 },
};
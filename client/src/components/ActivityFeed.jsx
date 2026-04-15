import { useState, useEffect } from 'react';
import API from '../api/axios';

const icons = { task: '◈', project: '◉', member: '👤', ai: '✦', chat: '💬' };
const colors = { task: 'var(--blue)', project: 'var(--green)', member: 'var(--purple)', ai: 'var(--ai)', chat: 'var(--amber)' };

export default function ActivityFeed({ projectId, onClose }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/activity/${projectId}`)
      .then(({ data }) => setActivities(data))
      .finally(() => setLoading(false));
  }, [projectId]);

  const fmt = d => {
    const diff = Date.now() - new Date(d);
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={s.box}>
      <div style={s.head}>
        <span style={s.title}>Activity Feed</span>
        <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
      </div>

      <div style={s.list}>
        {loading ? (
          <div style={s.center}>
            <span className="spinner" style={{ color: 'var(--blue)', width: '20px', height: '20px' }} />
          </div>
        ) : activities.length === 0 ? (
          <div style={s.center}>
            <p style={{ color: 'var(--text3)', fontSize: '12px' }}>No activity yet</p>
          </div>
        ) : (
          activities.map((a, i) => (
            <div key={a._id || i} style={s.item}>
              <div style={{ ...s.icon, color: colors[a.type] || 'var(--blue)' }}>
                {icons[a.type] || '◈'}
              </div>
              <div style={s.content}>
                <div style={s.text}>
                  <span style={s.user}>{a.userName}</span>
                  {' '}{a.action}
                  {a.target && <span style={s.target}> "{a.target}"</span>}
                </div>
                <div style={s.time}>{fmt(a.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  box:     { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' },
  head:    { padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:   { fontSize: '13px', fontWeight: '700' },
  list:    { flex: 1, overflowY: 'auto', padding: '8px' },
  center:  { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' },
  item:    { display: 'flex', gap: '10px', padding: '10px 8px', borderRadius: 'var(--radius)', transition: 'background 0.15s' },
  icon:    { fontSize: '14px', flexShrink: 0, marginTop: '2px', fontWeight: '700' },
  content: { flex: 1, minWidth: 0 },
  text:    { fontSize: '12px', lineHeight: '1.5', color: 'var(--text2)' },
  user:    { fontWeight: '600', color: 'var(--text)' },
  target:  { color: 'var(--blue2)', fontStyle: 'italic' },
  time:    { fontSize: '10px', color: 'var(--text3)', marginTop: '2px' },
};
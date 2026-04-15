import { useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const P = {
  high:   { color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'var(--red-border)',   label: 'High'   },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'var(--amber-border)', label: 'Medium' },
  low:    { color: 'var(--green)', bg: 'var(--green-dim)', border: 'var(--green-border)', label: 'Low'    },
};

export default function TaskCard({ task, onDelete }) {
  const [hov, setHov] = useState(false);
  const p = P[task.priority] || P.medium;
  const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const del = async (e) => {
    e.stopPropagation();
    await API.delete(`/tasks/${task._id}`);
    toast.success('Task deleted');
    onDelete(task._id);
  };

  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        background: hov ? 'var(--bg3)' : 'var(--bg3)',
        border: `1px solid ${hov ? p.border : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px', marginBottom: '8px',
        cursor: 'grab', transition: 'all 0.15s ease',
        transform: hov ? 'translateY(-1px)' : 'none',
        boxShadow: hov ? `0 4px 16px rgba(0,0,0,0.3)` : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Priority stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '2px', background: p.color, borderRadius: '99px 0 0 99px' }} />

      <div style={{ paddingLeft: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', padding: '2px 7px', borderRadius: '99px', background: p.bg, color: p.color, border: `1px solid ${p.border}`, flexShrink: 0 }}>
            {p.label}
          </span>
          <button onClick={del}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px', opacity: hov ? 1 : 0, transition: 'opacity 0.15s', padding: '0 2px', flexShrink: 0 }}>✕</button>
        </div>

        <p style={{ fontSize: '13px', fontWeight: '600', lineHeight: '1.4', marginBottom: task.description ? '5px' : '10px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {task.title}
        </p>

        {task.description && (
          <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.5', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          {task.deadline && (
            <span style={{ fontSize: '11px', fontWeight: '500', color: overdue ? 'var(--red)' : 'var(--text3)', background: overdue ? 'var(--red-dim)' : 'transparent', padding: overdue ? '1px 6px' : '0', borderRadius: '4px' }}>
              {overdue ? '⚠ ' : ''}{fmt(task.deadline)}
            </span>
          )}
          {task.assignedTo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '700', color: '#fff' }}>
                {task.assignedTo.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{task.assignedTo.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
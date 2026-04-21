import { useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const PRIORITY = {
  high:   { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)',  label: 'High'   },
  medium: { color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.22)', label: 'Medium' },
  low:    { color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)',  label: 'Low'    },
};

function getDeadlineStyle(deadline, status) {
  if (!deadline || status === 'done') return null;
  const diff = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0)  return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', label: 'Overdue' };
  if (diff < 3)  return { color: '#dc2626', bg: 'rgba(220,38,38,0.06)', label: `${Math.floor(diff)}d left` };
  if (diff < 7)  return { color: '#d97706', bg: 'rgba(217,119,6,0.07)', label: `${Math.floor(diff)}d left` };
  return { color: 'var(--text3)', bg: 'transparent', label: new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
}

export default function TaskCard({ task, onDelete, onEdit, isLeader }) {
  const [hov, setHov] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const dl = getDeadlineStyle(task.deadline, task.status);

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
        background: hov ? 'var(--bg)' : 'var(--bg2)',
        border: `1px solid ${hov ? p.border : 'var(--border)'}`,
        borderLeft: `3px solid ${p.color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 12px 12px 14px',
        marginBottom: '8px',
        cursor: 'grab',
        transition: 'all 0.15s ease',
        transform: hov ? 'translateY(-1px)' : 'none',
        boxShadow: hov ? 'var(--shadow-lg)' : 'var(--shadow)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '7px', gap: '8px' }}>
        <span style={{
          fontSize: '10px', fontWeight: '700',
          letterSpacing: '0.04em',
          padding: '2px 7px', borderRadius: '99px',
          background: p.bg, color: p.color,
          border: `1px solid ${p.border}`,
          flexShrink: 0,
        }}>
          {p.label}
        </span>
        {isLeader && (
          <div style={{ display: 'flex', gap: '4px', opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                fontSize: '12px', padding: '2px', lineHeight: 1
              }}
              title="Edit Task"
            >✏️</button>
            <button
              onClick={del}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer',
                fontSize: '12px', padding: '2px', lineHeight: 1
              }}
              title="Delete Task"
            >✕</button>
          </div>
        )}
      </div>

      <p style={{
        fontSize: '13px', fontWeight: '600',
        lineHeight: '1.4',
        marginBottom: task.description ? '5px' : '10px',
        color: 'var(--text)',
        letterSpacing: '-0.01em',
      }}>
        {task.title}
      </p>

      {task.description && (
        <p style={{
          fontSize: '11px', color: 'var(--text2)',
          lineHeight: '1.5', marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {dl && (
          <span style={{
            fontSize: '10px', fontWeight: '600',
            color: dl.color,
            background: dl.bg,
            padding: '2px 7px', borderRadius: '4px',
          }}>
            {dl.label}
          </span>
        )}
        {task.assignedTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: '700', color: '#fff',
            }}>
              {task.assignedTo.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '500' }}>
              {task.assignedTo.name?.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function CreateTaskModal({ projectId, members, onClose, onCreated, taskToEdit, onUpdated }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' });

  useEffect(() => {
    if (taskToEdit) {
      setForm({
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        priority: taskToEdit.priority || 'medium',
        deadline: taskToEdit.deadline ? taskToEdit.deadline.split('T')[0] : '',
        assignedTo: taskToEdit.assignedTo?._id || taskToEdit.assignedTo || ''
      });
    } else {
      setForm({ title: '', description: '', priority: 'medium', deadline: '', assignedTo: '' });
    }
  }, [taskToEdit]);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) payload.assignedTo = null;

      if (taskToEdit) {
        const { data } = await API.put(`/tasks/${taskToEdit._id}`, payload);
        toast.success('Task updated!');
        onUpdated(data);
      } else {
        const { data } = await API.post('/tasks', { ...payload, project: projectId });
        toast.success('Task created!');
        onCreated(data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const PC = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{taskToEdit ? 'Edit Task' : 'New Task'}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text2)' }}>{taskToEdit ? 'Update task details' : 'Add a task to the board'}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border2)' }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="label">Title *</label>
            <input placeholder="What needs to be done?" value={form.title} autoFocus
              onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea placeholder="Add more details..." rows={3} value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Deadline</label>
              <input type="date" value={form.deadline} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Assign To</label>
            <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>

          {/* Live preview */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PC[form.priority], flexShrink: 0, boxShadow: `0 0 6px ${PC[form.priority]}` }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: form.title ? 'var(--text)' : 'var(--text3)' }}>{form.title || 'Task preview...'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: 'auto' }}>{form.priority}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ border: '1px solid var(--border2)' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : (taskToEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
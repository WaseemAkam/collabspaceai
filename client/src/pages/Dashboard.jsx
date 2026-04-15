import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/projects', form);
      setProjects(prev => [...prev, data]);
      setForm({ name: '', description: '' });
      setShowForm(false);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    await API.delete(`/projects/${id}`);
    setProjects(prev => prev.filter(p => p._id !== id));
    toast.success('Deleted');
  };

  const COLORS = ['#4f8ef7','#34d399','#8b5cf6','#fbbf24','#f87171','#06b6d4'];
  const gc = name => COLORS[name?.charCodeAt(0) % COLORS.length];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.wrap}>

        {/* Header */}
        <div style={s.header} className="fade-up">
          <div>
            <p style={s.greet}>{greeting}, {user?.name?.split(' ')[0]}</p>
            <h1 style={s.title}>Dashboard</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={s.formBox} className="scale-in">
            <h3 style={s.formTitle}>Create project</h3>
            <form onSubmit={createProject} style={s.formInner}>
              <div style={{ flex: 1 }}>
                <label className="label">Project name *</label>
                <input placeholder="e.g. Final Year Project" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
              </div>
              <div style={{ flex: 2 }}>
                <label className="label">Description</label>
                <input placeholder="What is this project about?" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '9px 20px' }}>
                Create →
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div style={s.stats} className="fade-up d1">
          {[
            { label: 'Total Projects', value: projects.length, icon: '◈', color: 'var(--blue)' },
            { label: 'Team Members',   value: [...new Set(projects.flatMap(p => p.members.map(m => m._id)))].length, icon: '◉', color: 'var(--green)' },
            { label: 'Active Projects', value: projects.length, icon: '◆', color: 'var(--purple)' },
          ].map((st, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ ...s.statIcon, color: st.color }}>{st.icon}</div>
              <div>
                <div style={{ ...s.statVal, color: st.color }}>{st.value}</div>
                <div style={s.statLbl}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects */}
        {loading ? (
          <div style={s.center}>
            <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px', color: 'var(--blue)' }} />
          </div>
        ) : projects.length === 0 ? (
          <div style={s.empty} className="fade-up">
            <div style={{ fontSize: '48px', marginBottom: '16px' }} className="float">🚀</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No projects yet</h3>
            <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Project</button>
          </div>
        ) : (
          <>
            <p style={s.sectionLabel} className="fade-up d2">Projects ({projects.length})</p>
            <div style={s.grid}>
              {projects.map((p, i) => (
                <div key={p._id} style={s.card}
                  className={`fade-up d${Math.min(i+2,6)}`}
                  onClick={() => navigate(`/project/${p._id}`)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = gc(p.name) + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${gc(p.name)}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={s.cardHead}>
                    <div style={{ ...s.cardDot, background: gc(p.name) }} />
                    <button className="btn btn-danger btn-sm"
                      onClick={e => deleteProject(e, p._id)}
                      style={{ opacity: 0.7 }}>✕</button>
                  </div>
                  <h3 style={s.cardName}>{p.name}</h3>
                  <p style={s.cardDesc}>{p.description || 'No description'}</p>
                  <div style={s.cardFoot}>
                    <div style={s.memRow}>
                      {p.members.slice(0,4).map((m,mi) => (
                        <div key={m._id} style={{ ...s.memDot, background: COLORS[mi%COLORS.length], marginLeft: mi>0?'-6px':'0' }}>
                          {m.name[0].toUpperCase()}
                        </div>
                      ))}
                      <span style={s.memTxt}>{p.members.length} member{p.members.length!==1?'s':''}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: gc(p.name), fontWeight: '600' }}>Open →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: 'var(--bg)' },
  wrap:        { maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
  greet:       { fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' },
  title:       { fontSize: '32px', fontWeight: '800', letterSpacing: '-0.04em' },
  formBox:     { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: '24px' },
  formTitle:   { fontSize: '14px', fontWeight: '600', marginBottom: '16px' },
  formInner:   { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
  stats:       { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '32px' },
  statCard:    { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' },
  statIcon:    { fontSize: '24px', fontWeight: '800', flexShrink: 0 },
  statVal:     { fontSize: '28px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1 },
  statLbl:     { fontSize: '11px', color: 'var(--text3)', marginTop: '2px', letterSpacing: '0.04em' },
  sectionLabel:{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '12px' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' },
  card:        { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' },
  cardHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  cardDot:     { width: '10px', height: '10px', borderRadius: '50%' },
  cardName:    { fontSize: '15px', fontWeight: '700', marginBottom: '6px', letterSpacing: '-0.02em' },
  cardDesc:    { fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFoot:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  memRow:      { display: 'flex', alignItems: 'center', gap: '4px' },
  memDot:      { width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: '#fff', border: '1.5px solid var(--bg2)' },
  memTxt:      { fontSize: '11px', color: 'var(--text3)', marginLeft: '6px' },
  center:      { display: 'flex', justifyContent: 'center', padding: '80px' },
  empty:       { textAlign: 'center', padding: '80px 20px' },
};
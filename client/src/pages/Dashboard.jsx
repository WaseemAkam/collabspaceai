import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function getProjectDeadlineStatus(tasks) {
  if (!tasks || tasks.length === 0) return 'none';
  const pending = tasks.filter(t => t.status !== 'done' && t.deadline);
  if (pending.length === 0) return 'none';
  const earliest = Math.min(...pending.map(t => new Date(t.deadline)));
  const diff = (earliest - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'urgent';
  if (diff < 3) return 'urgent';
  if (diff < 7) return 'warn';
  return 'safe';
}

const DEADLINE_STYLES = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.18)', strip: '#dc2626' },
  warn:   { label: 'Due Soon', color: '#d97706', bg: 'rgba(217,119,6,0.07)', border: 'rgba(217,119,6,0.2)', strip: '#d97706' },
  safe:   { label: 'On Track', color: '#16a34a', bg: 'rgba(22,163,74,0.07)', border: 'rgba(22,163,74,0.18)', strip: '#16a34a' },
  none:   { label: null, color: 'var(--text3)', bg: 'var(--bg2)', border: 'var(--border)', strip: 'var(--border3)' },
};

const TABS = [
  { id: 'all',        label: 'All Projects' },
  { id: 'todo',       label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'done',       label: 'Completed' },
];

const COLORS = ['#2563eb','#16a34a','#7c3aed','#d97706','#dc2626','#0891b2'];
const gc = name => COLORS[name?.charCodeAt(0) % COLORS.length];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectTasks, setProjectTasks] = useState({}); // projectId -> tasks[]
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(data);

      // Fetch tasks for each project (for deadline coloring)
      const taskMap = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const { data: tasks } = await API.get(`/tasks/${p._id}`);
            taskMap[p._id] = tasks;
          } catch {
            taskMap[p._id] = [];
          }
        })
      );
      setProjectTasks(taskMap);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/projects', form);
      setProjects(prev => [...prev, data]);
      setProjectTasks(prev => ({ ...prev, [data._id]: [] }));
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

  // Filter projects by tab based on task status composition
  const getFilteredProjects = () => {
    if (tab === 'all') return projects;
    return projects.filter(p => {
      const tasks = projectTasks[p._id] || [];
      if (tab === 'done') return tasks.length > 0 && tasks.every(t => t.status === 'done');
      if (tab === 'inprogress') return tasks.some(t => t.status === 'inprogress');
      if (tab === 'todo') return tasks.length === 0 || tasks.every(t => t.status === 'todo');
      return true;
    });
  };

  const filtered = getFilteredProjects();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';


  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.wrap}>

        {/* Header */}
        <div style={s.header} className="fade-up">
          <div>
            <p style={s.greet}>{greeting}, {user?.name?.split(' ')[0]} 👋</p>
            <h1 style={s.title}>Your Projects</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}
            style={{ boxShadow: '0 2px 10px rgba(37,99,235,0.25)' }}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={s.formBox} className="scale-in">
            <h3 style={s.formTitle}>Create new project</h3>
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
            { label: 'Completed',      value: projects.filter(p => { const t = projectTasks[p._id] || []; return t.length > 0 && t.every(x => x.status === 'done'); }).length, icon: '✓', color: 'var(--green)' },
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

        {/* Tab bar */}
        <div style={s.tabBar} className="fade-up d2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...s.tabBtn,
                background: tab === t.id ? 'var(--bg2)' : 'transparent',
                color: tab === t.id ? 'var(--text)' : 'var(--text2)',
                fontWeight: tab === t.id ? '600' : '500',
                boxShadow: tab === t.id ? 'var(--shadow)' : 'none',
                borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
              }}
            >
              {t.label}
              <span style={{
                marginLeft: '6px',
                padding: '1px 7px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: '600',
                background: tab === t.id ? 'var(--blue-dim)' : 'var(--bg4)',
                color: tab === t.id ? 'var(--blue)' : 'var(--text3)',
              }}>
                {t.id === 'all' ? projects.length :
                  t.id === 'done' ? projects.filter(p => { const ts = projectTasks[p._id] || []; return ts.length > 0 && ts.every(x => x.status === 'done'); }).length :
                  t.id === 'inprogress' ? projects.filter(p => (projectTasks[p._id] || []).some(x => x.status === 'inprogress')).length :
                  projects.filter(p => { const ts = projectTasks[p._id] || []; return ts.length === 0 || ts.every(x => x.status === 'todo'); }).length
                }
              </span>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={s.center}>
            <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px', color: 'var(--blue)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.empty} className="fade-up">
            <div style={{ fontSize: '44px', marginBottom: '16px' }} className="float">
              {tab === 'done' ? '🏆' : tab === 'inprogress' ? '⚡' : tab === 'todo' ? '📋' : '🚀'}
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '700' }}>
              {tab === 'all' ? 'No projects yet' : `No ${tab === 'todo' ? 'to-do' : tab === 'inprogress' ? 'in-progress' : 'completed'} projects`}
            </h3>
            <p style={{ color: 'var(--text2)', marginBottom: '20px', fontSize: '13px' }}>
              {tab === 'all' ? 'Create your first project to get started' : `No projects match this filter`}
            </p>
            {tab === 'all' && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Project</button>
            )}
          </div>
        ) : (
          <div style={s.grid} className="fade-up d3">
            {filtered.map((p, i) => {
              const tasks = projectTasks[p._id] || [];
              const deadlineStatus = getProjectDeadlineStatus(tasks);
              const ds = DEADLINE_STYLES[deadlineStatus];
              const done = tasks.filter(t => t.status === 'done').length;
              const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
              const accentColor = gc(p.name);

              return (
                <div
                  key={p._id}
                  style={{
                    ...s.card,
                    borderLeft: `4px solid ${ds.strip}`,
                    background: ds.bg,
                    borderColor: ds.border,
                  }}
                  className="fade-up"
                  onClick={() => navigate(`/project/${p._id}`)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow)';
                  }}
                >
                  <div style={s.cardHead}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ ...s.cardAvatar, background: accentColor }}>
                        {p.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={s.cardName}>{p.name}</h3>
                        {ds.label && (
                          <span style={{
                            fontSize: '10px', fontWeight: '700',
                            color: ds.color, textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {ds.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={e => deleteProject(e, p._id)}
                      style={{ opacity: 0.6, padding: '4px 8px' }}
                    >✕</button>
                  </div>

                  <p style={s.cardDesc}>{p.description || 'No description provided.'}</p>

                  {/* Progress bar */}
                  {tasks.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '500' }}>Progress</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: ds.color }}>{pct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'var(--bg4)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: ds.strip,
                          borderRadius: '99px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={s.cardFoot}>
                    <div style={s.memRow}>
                      {p.members.slice(0,4).map((m, mi) => (
                        <div key={m._id} style={{
                          ...s.memDot,
                          background: COLORS[mi % COLORS.length],
                          marginLeft: mi > 0 ? '-6px' : '0',
                        }}>
                          {m.name[0].toUpperCase()}
                        </div>
                      ))}
                      <span style={s.memTxt}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: '600' }}>Open →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: 'var(--bg)' },
  wrap:        { maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' },
  greet:       { fontSize: '13px', color: 'var(--text2)', marginBottom: '4px', fontWeight: '500' },
  title:       { fontSize: '30px', fontWeight: '800', letterSpacing: '-0.04em', color: 'var(--text)' },

  formBox:     { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-xl)', padding: '20px 24px', marginBottom: '24px', boxShadow: 'var(--shadow)' },
  formTitle:   { fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--text)' },
  formInner:   { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },

  stats:       { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' },
  statCard:    {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: 'var(--shadow)',
  },
  statIcon:    { fontSize: '22px', fontWeight: '800', flexShrink: 0 },
  statVal:     { fontSize: '26px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1 },
  statLbl:     { fontSize: '11px', color: 'var(--text3)', marginTop: '2px', letterSpacing: '0.04em', fontWeight: '500' },

  tabBar:      {
    display: 'flex', gap: '2px',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '6px',
    marginBottom: '24px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
  },
  tabBtn:      {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'DM Sans, sans-serif',
    transition: 'all 0.15s ease',
    letterSpacing: '-0.01em',
  },

  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card:        {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', padding: '20px',
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: 'var(--shadow)',
  },
  cardHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  cardAvatar:  {
    width: '38px', height: '38px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '16px', color: '#fff', flexShrink: 0,
  },
  cardName:    { fontSize: '14px', fontWeight: '700', marginBottom: '2px', letterSpacing: '-0.02em', color: 'var(--text)' },
  cardDesc:    { fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFoot:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  memRow:      { display: 'flex', alignItems: 'center', gap: '4px' },
  memDot:      { width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: '700', color: '#fff', border: '2px solid var(--bg2)' },
  memTxt:      { fontSize: '11px', color: 'var(--text3)', marginLeft: '6px', fontWeight: '500' },

  center:      { display: 'flex', justifyContent: 'center', padding: '80px' },
  empty:       { textAlign: 'center', padding: '80px 20px' },
};
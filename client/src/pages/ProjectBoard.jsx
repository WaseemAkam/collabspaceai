import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import ChatBox from '../components/ChatBox';
import ActivityFeed from '../components/ActivityFeed';
import AIAssistant from '../components/AIAssistant';
import toast from 'react-hot-toast';

const COLS = [
  { id:'todo',       label:'To Do',       color:'#6b7280', dim:'rgba(107,114,128,0.08)'  },
  { id:'inprogress', label:'In Progress', color:'#fbbf24', dim:'rgba(251,191,36,0.08)'   },
  { id:'done',       label:'Done',        color:'#34d399', dim:'rgba(52,211,153,0.08)'   },
];

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject]     = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [modal, setModal]         = useState(false);
  const [addMem, setAddMem]       = useState(false);
  const [memEmail, setMemEmail]   = useState('');
  const [panel, setPanel]         = useState(null); // 'chat' | 'activity' | 'ai' | null
  const [loading, setLoading]     = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [summary, setSummary]     = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [aiGenLoading, setAiGenLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pr, tr] = await Promise.all([API.get('/projects'), API.get(`/tasks/${id}`)]);
        const found = pr.data.find(p => p._id === id);
        if (!found) { navigate('/'); return; }
        setProject(found);
        setTasks(tr.data);
      } catch { toast.error('Failed to load project'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const onDragEnd = async ({ draggableId, destination }) => {
    if (!destination) return;
    setTasks(p => p.map(t => t._id === draggableId ? {...t, status: destination.droppableId} : t));
    await API.put(`/tasks/${draggableId}`, { status: destination.droppableId });
    toast.success(`Task moved to ${destination.droppableId}`, { duration: 1500 });
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/projects/${id}/add-member`, { email: memEmail });
      setProject(data); setMemEmail(''); setAddMem(false);
      toast.success('Member added!');
    } catch (err) { toast.error(err.response?.data?.message || 'User not found'); }
  };

  // AI Task Generator
  const handleAIGenerate = async () => {
    setAiGenLoading(true);
    toast('🤖 AI is generating tasks...', { duration: 3000 });
    try {
      const { data } = await API.post('/ai/generate-tasks', {
        projectName: project.name,
        projectDescription: project.description || project.name,
      });
      const bulk = await API.post('/tasks/bulk', { tasks: data.tasks, projectId: id });
      setTasks(prev => [...prev, ...bulk.data]);
      toast.success(`✨ AI generated ${bulk.data.length} tasks!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    }
    setAiGenLoading(false);
  };

  // AI Progress Summarizer
  const handleSummarize = async () => {
    setAiLoading(true);
    setSummary('');
    setShowSummary(true);
    try {
      const { data } = await API.post('/ai/summarize', {
        projectName: project.name,
        tasks,
        memberCount: project.members.length,
      });
      setSummary(data.summary);
    } catch (err) {
      toast.error('Summary failed');
      setShowSummary(false);
    }
    setAiLoading(false);
  };

  const colTasks = cid => tasks.filter(t => t.status === cid);
  const done     = tasks.filter(t => t.status === 'done').length;
  const pct      = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)' }}>
        <span className="spinner" style={{ width: '28px', height: '28px', borderWidth: '2px', color: 'var(--blue)' }} />
        <p style={{ color: 'var(--text3)', marginTop: '12px', fontSize: '13px' }}>Loading project...</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar />

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSummary(false)}>
          <div className="modal-box modal-box-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="badge badge-ai" style={{ marginBottom: '8px' }}>✦ AI Progress Report</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{project.name}</h3>
              </div>
              <button onClick={() => setShowSummary(false)} className="btn btn-ghost btn-sm"
                style={{ border: '1px solid var(--border2)' }}>✕</button>
            </div>
            {aiLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: '28px', height: '28px', color: 'var(--ai)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text2)', fontSize: '13px' }}>AI is analyzing your project...</p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--ai-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <p style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{summary}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copied!'); }}>Copy Report</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.wrap}>
        {/* Header */}
        <div style={s.header} className="fade-up">
          <div style={s.hl}>
            <div style={s.badge}>{project?.name?.[0]?.toUpperCase()}</div>
            <div>
              <h1 style={s.title}>{project?.name}</h1>
              {project?.description && <p style={s.desc}>{project.description}</p>}
            </div>
          </div>
          <div style={s.hr}>
            {/* Progress */}
            <div style={s.progress}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${pct}%` }} />
              </div>
              <span style={s.progressTxt}>{pct}%</span>
            </div>

            {/* Members */}
            <div style={s.mems}>
              {project?.members?.slice(0,4).map((m,i) => (
                <div key={m._id} title={m.name}
                  style={{ ...s.memAv, marginLeft: i>0?'-8px':'0', zIndex: 10-i }}>
                  {m.name[0].toUpperCase()}
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border2)', marginLeft: '8px' }}
                onClick={() => setAddMem(!addMem)}>+ Member</button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => setPanel(panel==='chat'?null:'chat')}
              style={{ borderColor: panel==='chat' ? 'var(--blue)' : undefined }}>
              💬 Chat
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPanel(panel==='activity'?null:'activity')}
              style={{ borderColor: panel==='activity' ? 'var(--green)' : undefined }}>
              📋 Activity
            </button>
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ Task</button>
          </div>
        </div>

        {/* AI Toolbar */}
        <div style={s.aiBar} className="fade-up d1">
          <div style={s.aiLeft}>
            <span style={s.aiLabel}>✦ AI Tools</span>
            <button className="btn btn-ai btn-sm" onClick={handleAIGenerate} disabled={aiGenLoading}>
              {aiGenLoading ? <><span className="spinner" style={{color:'white'}} /> Generating...</> : '🤖 Generate Tasks with AI'}
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--ai-dim)', color: 'var(--ai)', border: '1px solid var(--ai-border)' }}
              onClick={handleSummarize} disabled={aiLoading}>
              {aiLoading ? <><span className="spinner" style={{color:'var(--ai)'}} /> Analyzing...</> : '📊 AI Progress Report'}
            </button>
            <button className="btn btn-sm" style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.25)' }}
              onClick={() => setPanel(panel==='ai'?null:'ai')}>
              💡 AI Assistant
            </button>
          </div>
          <div style={s.aiRight}>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {done}/{tasks.length} tasks complete
            </span>
          </div>
        </div>

        {/* Add Member */}
        {addMem && (
          <div style={s.memBox} className="scale-in">
            <form onSubmit={addMember} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label className="label">Add team member by email</label>
                <input type="email" placeholder="teammate@example.com"
                  value={memEmail} onChange={e => setMemEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '9px 20px' }}>Add Member</button>
              <button type="button" className="btn btn-ghost" style={{ border: '1px solid var(--border2)' }}
                onClick={() => setAddMem(false)}>Cancel</button>
            </form>
          </div>
        )}

        {/* Main: Board + Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: panel ? '1fr 340px' : '1fr', gap: '16px', alignItems: 'start' }}>
          {/* Kanban */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={s.board}>
              {COLS.map((col, ci) => (
                <div key={col.id} style={s.col} className={`fade-up d${ci+2}`}>
                  <div style={s.colHead}>
                    <div style={s.colLeft}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                      <span style={s.colLabel}>{col.label}</span>
                    </div>
                    <span style={{ ...s.colBadge, background: col.dim, color: col.color }}>
                      {colTasks(col.id).length}
                    </span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(prov, snap) => (
                      <div ref={prov.innerRef} {...prov.droppableProps}
                        style={{ ...s.drop, background: snap.isDraggingOver ? col.dim : 'transparent', borderColor: snap.isDraggingOver ? col.color + '30' : 'transparent' }}>
                        {colTasks(col.id).map((task, idx) => (
                          <Draggable key={task._id} draggableId={task._id} index={idx}>
                            {(prov2, snap2) => (
                              <div ref={prov2.innerRef} {...prov2.draggableProps} {...prov2.dragHandleProps}
                                style={{ ...prov2.draggableProps.style, opacity: snap2.isDragging ? 0.8 : 1 }}>
                                <TaskCard task={task} onDelete={did => setTasks(p => p.filter(t => t._id !== did))} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {prov.placeholder}
                        {colTasks(col.id).length === 0 && !snap.isDraggingOver && (
                          <div style={s.emptyCol}>
                            <p style={{ color: 'var(--text3)', fontSize: '12px' }}>No tasks</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>

          {/* Side Panel */}
          {panel === 'chat' && (
            <div style={s.sidePanel} className="fade-up">
              <ChatBox projectId={id} onClose={() => setPanel(null)} />
            </div>
          )}
          {panel === 'activity' && (
            <div style={s.sidePanel} className="fade-up">
              <ActivityFeed projectId={id} onClose={() => setPanel(null)} />
            </div>
          )}
          {panel === 'ai' && (
            <div style={s.sidePanel} className="fade-up">
              <AIAssistant project={project} tasks={tasks} onClose={() => setPanel(null)} />
            </div>
          )}
        </div>
      </div>

      {modal && (
        <CreateTaskModal projectId={id} members={project?.members || []}
          onClose={() => setModal(false)}
          onCreated={task => setTasks(p => [...p, task])} />
      )}
    </div>
  );
}

const s = {
  page:        { minHeight: '100vh', background: 'var(--bg)' },
  wrap:        { maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  hl:          { display: 'flex', alignItems: 'center', gap: '14px' },
  badge:       { width: '44px', height: '44px', borderRadius: '10px', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: '#fff', flexShrink: 0 },
  title:       { fontSize: '22px', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '2px' },
  desc:        { fontSize: '12px', color: 'var(--text3)' },
  hr:          { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  progress:    { display: 'flex', alignItems: 'center', gap: '8px' },
  progressBar: { width: '80px', height: '4px', background: 'var(--bg4)', borderRadius: '99px', overflow: 'hidden' },
  progressFill:{ height: '100%', background: 'var(--grad)', borderRadius: '99px', transition: 'width 0.5s ease' },
  progressTxt: { fontSize: '11px', color: 'var(--text2)', fontWeight: '600', minWidth: '30px' },
  mems:        { display: 'flex', alignItems: 'center' },
  memAv:       { width: '28px', height: '28px', borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px', color: '#fff', border: '2px solid var(--bg)', cursor: 'default' },
  aiBar:       { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  aiLeft:      { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  aiLabel:     { fontSize: '11px', fontWeight: '600', color: 'var(--ai)', letterSpacing: '0.06em', marginRight: '4px' },
  aiRight:     { display: 'flex', alignItems: 'center', gap: '8px' },
  memBox:      { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: '16px' },
  board:       { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' },
  col:         { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '14px', minHeight: '500px', display: 'flex', flexDirection: 'column' },
  colHead:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' },
  colLeft:     { display: 'flex', alignItems: 'center', gap: '8px' },
  colLabel:    { fontSize: '13px', fontWeight: '600', letterSpacing: '-0.01em' },
  colBadge:    { borderRadius: '99px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' },
  drop:        { flex: 1, borderRadius: 'var(--radius)', border: '2px dashed transparent', transition: 'all 0.15s', padding: '2px', minHeight: '400px' },
  emptyCol:    { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' },
  sidePanel:   { position: 'sticky', top: '68px', height: 'calc(100vh - 100px)' },
};
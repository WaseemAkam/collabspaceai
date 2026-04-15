import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>
            <div style={s.brandMark}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="url(#g1)"/>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="16" y2="16">
                  <stop offset="0%" stopColor="#4f8ef7"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient></defs>
              </svg>
            </div>
            <span style={s.brandName}>CollabSpace</span>
          </div>

          <div style={s.heroBlock}>
            <div className="badge badge-ai" style={{ marginBottom: '20px' }}>
              ✦ AI-Powered Project Management
            </div>
            <h1 style={s.h1}>
              The workspace<br />
              your team <span className="grad-text">deserves.</span>
            </h1>
            <p style={s.heroSub}>
              Kanban boards, real-time chat, AI task generation, and smart analytics — all in one place.
            </p>
          </div>

          <div style={s.feats}>
            {[
              { icon: '🤖', title: 'AI Task Generator',    desc: 'Describe your project, AI creates all tasks' },
              { icon: '📊', title: 'Smart Analytics',      desc: 'Track progress with beautiful charts'         },
              { icon: '💬', title: 'Real-time Chat',       desc: 'Collaborate with your team instantly'          },
              { icon: '⚡', title: 'Drag & Drop Kanban',   desc: 'Visual task management that works'             },
            ].map((f, i) => (
              <div key={i} style={s.feat} className={`fade-up d${i+1}`}>
                <span style={s.featIcon}>{f.icon}</span>
                <div>
                  <div style={s.featTitle}>{f.title}</div>
                  <div style={s.featDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card} className="scale-in">
          <div style={s.cardTop}>
            <h2 style={s.cardTitle}>Sign in</h2>
            <p style={s.cardSub}>Welcome back to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>
            <div>
              <label className="label">Email address</label>
              <input type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-primary btn-xl"
              style={{ width: '100%' }} disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : 'Sign in →'}
            </button>
          </form>

          <p style={s.foot}>
            No account? <Link to="/register" style={s.link}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', background: 'var(--bg)' },
  left:      { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', borderRight: '1px solid var(--border)', position: 'relative', overflow: 'hidden' },
  leftInner: { maxWidth: '500px', width: '100%' },
  brand:     { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '56px' },
  brandMark: { width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: '700', fontSize: '16px', letterSpacing: '-0.03em' },
  heroBlock: { marginBottom: '48px' },
  h1:        { fontSize: '48px', lineHeight: 1.05, marginBottom: '16px', fontWeight: '800' },
  heroSub:   { fontSize: '15px', color: 'var(--text2)', lineHeight: 1.7, maxWidth: '400px' },
  feats:     { display: 'flex', flexDirection: 'column', gap: '8px' },
  feat:      { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' },
  featIcon:  { fontSize: '20px', flexShrink: 0 },
  featTitle: { fontSize: '13px', fontWeight: '600', marginBottom: '2px' },
  featDesc:  { fontSize: '12px', color: 'var(--text3)' },
  right:     { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  card:      { width: '100%', maxWidth: '380px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-2xl)', padding: '36px', boxShadow: 'var(--shadow-xl)' },
  cardTop:   { marginBottom: '28px' },
  cardTitle: { fontSize: '24px', marginBottom: '6px', fontWeight: '700' },
  cardSub:   { fontSize: '13px', color: 'var(--text2)' },
  form:      { display: 'flex', flexDirection: 'column', gap: '18px' },
  foot:      { textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text2)' },
  link:      { color: 'var(--blue2)', textDecoration: 'none', fontWeight: '600' },
};
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  // Roles removed from global sign up
];

export default function Register() {
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', form);
      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.inner}>
          <div style={s.brand}>
            <div style={s.brandMark}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="url(#g2)"/>
                <defs><linearGradient id="g2" x1="0" y1="0" x2="16" y2="16">
                  <stop offset="0%" stopColor="#2563eb"/>
                  <stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient></defs>
              </svg>
            </div>
            <span style={s.brandName}>CollabSpace</span>
          </div>

          <h1 style={s.h1}>
            Start collaborating<br />
            <span className="grad-text">in minutes.</span>
          </h1>
          <p style={s.sub}>Free forever. No credit card. Everything your team needs to ship faster.</p>

          <div style={s.stats}>
            {[
              { v: '3 AI Features', l: 'Built in' },
              { v: 'Real-time', l: 'Collaboration' },
              { v: 'Free', l: 'Forever' },
            ].map((st, i) => (
              <div key={i} style={s.stat} className={`fade-up d${i+1}`}>
                <div style={s.sv}>{st.v}</div>
                <div style={s.sl}>{st.l}</div>
              </div>
            ))}
          </div>

          <div style={s.checkList}>
            {['Kanban board with drag & drop', 'Real-time team chat', 'AI-powered task generation', 'Progress reports & analytics'].map((item, i) => (
              <div key={i} style={s.checkItem}>
                <span style={s.checkIcon}>✓</span>
                <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card} className="scale-in">
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '6px', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text)' }}>
              Create account
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>Join your team on CollabSpace</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Full Name</label>
              <input
                placeholder="Your name" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-xl"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Creating...</> : 'Create account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text2)' }}>
            Have an account?{' '}
            <Link to="/login" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', background: 'var(--bg)' },
  left:      { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', borderRight: '1px solid var(--border)', background: 'var(--bg2)' },
  inner:     { maxWidth: '460px', width: '100%' },
  brand:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '52px' },
  brandMark: { width: '34px', height: '34px', borderRadius: '9px', background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' },
  brandName: { fontWeight: '800', fontSize: '16px', letterSpacing: '-0.04em', color: 'var(--text)' },
  h1:        { fontSize: '40px', lineHeight: 1.1, marginBottom: '14px', fontWeight: '800', letterSpacing: '-0.04em', color: 'var(--text)' },
  sub:       { fontSize: '15px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '40px' },
  stats:     { display: 'flex', gap: '32px', marginBottom: '36px' },
  stat:      { display: 'flex', flexDirection: 'column', gap: '2px' },
  sv:        { fontSize: '17px', fontWeight: '800', color: 'var(--blue)', letterSpacing: '-0.02em' },
  sl:        { fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.04em', fontWeight: '500' },
  checkList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  checkIcon: { width: '20px', height: '20px', borderRadius: '50%', background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 },
  right:     { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--bg)' },
  card:      { width: '100%', maxWidth: '400px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-2xl)', padding: '36px', boxShadow: 'var(--shadow-xl)' },
};
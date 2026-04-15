import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar({ notifications = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isBoard = location.pathname.includes('/project/');
  const isAnalytics = location.pathname.includes('/analytics');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav style={s.nav}>
      <div style={s.left}>
        <div style={s.logo} onClick={() => navigate('/')}>
          <div style={s.logoMark}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="url(#grad)" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="16" y2="16">
                  <stop offset="0%" stopColor="#4f8ef7"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={s.logoText}>CollabSpace</span>
        </div>

        <div style={s.navLinks}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/')}
            style={{ color: location.pathname === '/' ? 'var(--text)' : 'var(--text2)' }}
          >
            Dashboard
          </button>
          {isBoard && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)' }}>
              Board
            </button>
          )}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.userArea}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={s.userInfo}>
            <span style={s.userName}>{user?.name}</span>
            <span style={s.userEmail}>{user?.email}</span>
          </div>
        </div>
        <div style={s.divider} />
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

const s = {
  nav: {
    height: '52px',
    background: 'rgba(10,10,15,0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    position: 'sticky', top: 0, zIndex: 100,
  },
  left:     { display: 'flex', alignItems: 'center', gap: '4px' },
  logo:     { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginRight: '16px' },
  logoMark: {
    width: '28px', height: '28px', borderRadius: '7px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: '700', fontSize: '15px', letterSpacing: '-0.03em' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '2px' },
  right:    { display: 'flex', alignItems: 'center', gap: '12px' },
  userArea: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: 'var(--grad)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0,
  },
  userInfo:  { display: 'flex', flexDirection: 'column' },
  userName:  { fontSize: '12px', fontWeight: '600', lineHeight: 1.2 },
  userEmail: { fontSize: '10px', color: 'var(--text3)', lineHeight: 1.2 },
  divider:   { width: '1px', height: '20px', background: 'var(--border2)' },
};
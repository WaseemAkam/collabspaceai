import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

let socket;
const COLORS = ['#4f8ef7','#34d399','#8b5cf6','#fbbf24','#f87171','#06b6d4'];
const gc = n => COLORS[n?.charCodeAt(0) % COLORS.length];

export default function ChatBox({ projectId, onClose }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [live, setLive] = useState(false);
  const bottomRef = useRef();
  const inputRef  = useRef();

  useEffect(() => {
    API.get(`/messages/${projectId}`).then(({ data }) => setMsgs(data));
    socket = io('http://localhost:5000', { transports: ['websocket'] });
    socket.on('connect',    () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.emit('joinRoom', projectId);
    socket.on('receiveMessage', msg => setMsgs(p => [...p, msg]));
    return () => socket.disconnect();
  }, [projectId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !live) return;
    socket.emit('sendMessage', { content: text.trim(), senderId: user.id, senderName: user.name, projectId });
    setText('');
    inputRef.current?.focus();
  };

  const isMe  = msg => (msg.sender?._id || msg.sender) === user.id;
  const fmt   = d   => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={s.box}>
      <div style={s.head}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={s.headTitle}>Team Chat</span>
          <div style={{ ...s.dot, background: live ? 'var(--green)' : 'var(--red)', boxShadow: live ? '0 0 5px var(--green)' : 'none' }} />
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
      </div>

      <div style={s.msgs}>
        {msgs.length === 0 && (
          <div style={s.empty}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
            <p style={{ color: 'var(--text3)', fontSize: '12px' }}>No messages yet</p>
          </div>
        )}
        {msgs.map((msg, i) => {
          const mine  = isMe(msg);
          const name  = msg.sender?.name || 'Unknown';
          const color = gc(name);
          const showAv = !mine && (i === 0 || isMe(msgs[i-1]) || (msgs[i-1]?.sender?._id || msgs[i-1]?.sender) !== (msg.sender?._id || msg.sender));
          return (
            <div key={msg._id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
              {!mine && <div style={{ ...s.av, background: color, opacity: showAv ? 1 : 0 }}>{name[0]?.toUpperCase()}</div>}
              <div style={{ maxWidth: '80%' }}>
                {!mine && showAv && <div style={{ fontSize: '10px', fontWeight: '600', color, marginBottom: '3px', paddingLeft: '2px' }}>{name}</div>}
                <div style={{
                  background: mine ? 'var(--grad)' : 'var(--bg4)',
                  border: mine ? 'none' : '1px solid var(--border)',
                  borderRadius: mine ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                  padding: '8px 12px',
                }}>
                  <p style={{ fontSize: '13px', lineHeight: '1.5', color: mine ? '#fff' : 'var(--text)', wordBreak: 'break-word' }}>{msg.content}</p>
                  <span style={{ fontSize: '9px', color: mine ? 'rgba(255,255,255,0.5)' : 'var(--text3)', display: 'block', textAlign: 'right', marginTop: '3px' }}>{fmt(msg.createdAt)}</span>
                </div>
              </div>
              {mine && <div style={{ width: '24px', flexShrink: 0 }} />}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={s.input}>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          placeholder={live ? 'Message...' : 'Connecting...'}
          disabled={!live} style={{ flex: 1, borderRadius: '8px', fontSize: '13px' }} />
        <button type="submit" className="btn btn-primary btn-sm"
          disabled={!text.trim() || !live} style={{ padding: '8px 14px', borderRadius: '8px' }}>↑</button>
      </form>
    </div>
  );
}

const s = {
  box:  { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' },
  head: { padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headTitle: { fontSize: '13px', fontWeight: '700' },
  dot:  { width: '6px', height: '6px', borderRadius: '50%' },
  msgs: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px' },
  empty:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '32px' },
  av:   { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', flexShrink: 0, marginRight: '6px', alignSelf: 'flex-end' },
  input:{ display: 'flex', gap: '8px', padding: '10px 12px', borderTop: '1px solid var(--border)' },
};
import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '../api.js';

export default function NotificationBell() {
  const token = localStorage.getItem('vendor_token');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  function loadCount() {
    apiGet('/api/notifications/unread-count', token).then((r) => setUnread(r.count)).catch(() => {});
  }
  function loadList() {
    apiGet('/api/notifications', token).then(setItems).catch(() => {});
  }

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  function toggle() {
    if (!open) loadList();
    setOpen((v) => !v);
  }

  async function markAllRead() {
    await apiPut('/api/notifications/read-all', {}, token);
    setUnread(0);
    loadList();
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="cart-button" onClick={toggle} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="cart-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            <button className="secondary-button" onClick={markAllRead}>Mark all read</button>
          </div>
          {items.length === 0 && <p style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>Nothing yet.</p>}
          {items.map((n) => (
            <div key={n.id} className="notification-item" style={{ opacity: n.is_read ? 0.55 : 1 }}>
              <div style={{ fontSize: 13 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: 'rgba(32,26,21,0.5)', marginTop: 2 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

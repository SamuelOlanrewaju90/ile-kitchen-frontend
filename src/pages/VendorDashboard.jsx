import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

const STATUS_OPTIONS = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

function playNewOrderBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (err) {}
}

export default function VendorDashboard() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [savingOpen, setSavingOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('vendor_token');
  const user = JSON.parse(localStorage.getItem('vendor_user') || '{}');
  const previousOrderCount = useRef(null);

  function loadOrders() {
    apiGet('/api/orders', token)
      .then((result) => {
        if (previousOrderCount.current !== null && result.length > previousOrderCount.current) {
          playNewOrderBeep();
        }
        previousOrderCount.current = result.length;
        setOrders(result);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    apiGet('/api/vendors/me/profile', token).then(setProfile).catch((err) => setError(err.message));
    loadOrders();
    const interval = setInterval(loadOrders, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleOpen() {
    setSavingOpen(true);
    try {
      const updated = await apiPut('/api/vendors/me/profile', { is_open: !profile.is_open }, token);
      setProfile(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingOpen(false);
    }
  }

  async function updateStatus(id, order_status) {
    try {
      await apiPut(`/api/orders/${id}/status`, { order_status }, token);
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_user');
    navigate('/vendor/login');
  }

  return (
    <div>
      <div className="dash-header">
        <h1 style={{ fontSize: 22 }}>{profile?.name || 'Vendor dashboard'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {user.is_admin && (
            <Link to="/admin" className="cart-button" style={{ textDecoration: 'none' }}>
              Admin
            </Link>
          )}
          <button className="cart-button" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {error && <p className="error-banner">{error}</p>}

        {profile && !profile.is_approved && (
          <p className="error-banner">
            Your restaurant is pending admin approval and won't be visible to customers yet — but you can add menu items now so you're ready when approved.
          </p>
        )}

        {profile && (
          <div className="settings-panel">
            <div className="settings-row">
              <label>Currently open for orders</label>
              <label className="toggle-switch">
                <input type="checkbox" checked={profile.is_open} onChange={toggleOpen} disabled={savingOpen} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Orders</h2>
        {orders.length === 0 && !error && <p>No orders yet.</p>}

        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-top">
              <div>
                <strong>#{order.id} — {order.customer_name}</strong>
                <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{order.phone}</div>
              </div>
              <span className={`status-badge status-${order.order_status}`}>
                {order.order_status.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{order.address}</div>
            {order.notes && <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>Note: {order.notes}</div>}
            <div className="order-items-list">
              {order.items.map((item, idx) => <div key={idx}>{item.quantity} × {item.name}</div>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>₦{Number(order.total).toLocaleString()}</span>
            </div>
            <select className="status-select" value={order.order_status} onChange={(e) => updateStatus(order.id, e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

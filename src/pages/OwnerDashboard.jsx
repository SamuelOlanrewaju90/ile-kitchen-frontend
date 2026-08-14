import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

const STATUS_OPTIONS = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

// A short beep with no external audio file needed, so there's nothing
// extra to upload or host — just a couple of Web Audio API calls.
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
  } catch (err) {
    // Some browsers block audio until the user interacts with the page once — safe to ignore.
  }
}

function SettingsPanel({ settings, token, onSaved }) {
  const [open, setOpen] = useState(settings.restaurant_open !== 'false');
  const [deliveryTime, setDeliveryTime] = useState(settings.estimated_delivery_minutes || '');
  const [minOrder, setMinOrder] = useState(settings.min_order_amount || '0');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await apiPut(
        '/api/settings',
        {
          restaurant_open: String(open),
          estimated_delivery_minutes: deliveryTime,
          min_order_amount: minOrder,
          whatsapp_number: whatsapp
        },
        token
      );
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-panel">
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Restaurant settings</h2>

      <div className="settings-row">
        <label>Currently accepting orders</label>
        <label className="toggle-switch">
          <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="settings-row">
        <label>Estimated delivery time</label>
        <input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g. 30-45" />
      </div>

      <div className="settings-row">
        <label>Minimum order (₦)</label>
        <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
      </div>

      <div className="settings-row">
        <label>WhatsApp number</label>
        <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="234..." />
      </div>

      <button className="primary-button" style={{ marginTop: 12 }} disabled={saving} onClick={save}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save settings'}
      </button>
    </div>
  );
}

export default function OwnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('owner_token');
  const previousOrderCount = useRef(null);

  function load() {
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
    load();
    apiGet('/api/settings').then(setSettings).catch(() => {});
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id, order_status) {
    try {
      await apiPut(`/api/orders/${id}/status`, { order_status }, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('owner_token');
    navigate('/owner/login');
  }

  return (
    <div>
      <div className="dash-header">
        <h1 style={{ fontSize: 22 }}>Orders</h1>
        <button className="cart-button" onClick={logout}>Log out</button>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {error && <p className="error-banner">{error}</p>}

        {settings && (
          <SettingsPanel settings={settings} token={token} onSaved={setSettings} />
        )}

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
            {order.notes && (
              <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>Note: {order.notes}</div>
            )}

            <div className="order-items-list">
              {order.items.map((item, idx) => (
                <div key={idx}>{item.quantity} × {item.name}</div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>₦{Number(order.total).toLocaleString()}</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)', marginTop: 4 }}>
              Payment: {order.payment_method === 'cod' ? 'Pay on delivery' : `Paid online (${order.payment_status})`}
            </div>

            <select
              className="status-select"
              value={order.order_status}
              onChange={(e) => updateStatus(order.id, e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

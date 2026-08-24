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

function PayoutSettings({ profile, token, onSaved }) {
  const [subaccount, setSubaccount] = useState(profile.paystack_subaccount_code || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await apiPut('/api/vendors/me/profile', { paystack_subaccount_code: subaccount }, token);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-panel">
      <h2 style={{ fontSize: 16, marginBottom: 4 }}>Getting paid</h2>
      <p style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)', marginBottom: 12 }}>
        Your platform commission is <strong>{profile.commission_rate}%</strong>, taken from each order's food total (not the delivery fee).
      </p>
      <div className="field">
        <label>Paystack subaccount code (optional)</label>
        <input
          value={subaccount}
          onChange={(e) => setSubaccount(e.target.value)}
          placeholder="ACCT_xxxxxxxxxxxx"
        />
      </div>
      <p style={{ fontSize: 12, color: 'rgba(32,26,21,0.5)', marginBottom: 12 }}>
        Add this and online payments split automatically — your share lands straight in your own bank account via Paystack, no waiting on us. Without it, we hold online payments and settle with you manually, same as cash orders. Generate a subaccount code from your own Paystack dashboard under Settings → Subaccounts.
      </p>
      <button className="primary-button" disabled={saving} onClick={save}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  );
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

  const unpaidCodTotal = orders
    .filter((o) => o.order_status === 'delivered' && o.payment_method === 'cod' && !o.payout_settled)
    .reduce((sum, o) => sum + Number(o.platform_fee), 0);

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

        {profile && <PayoutSettings profile={profile} token={token} onSaved={setProfile} />}

        {unpaidCodTotal > 0 && (
          <p className="error-banner">
            You've collected cash orders totaling ₦{unpaidCodTotal.toLocaleString()} owed to the platform as commission. We'll reach out to settle this — or message us on WhatsApp anytime.
          </p>
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
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)', marginTop: 4 }}>
              Your payout: ₦{Number(order.vendor_payout).toLocaleString()} (₦{Number(order.platform_fee).toLocaleString()} platform commission)
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

export default function AdminPanel() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState(null);
  const [unsettled, setUnsettled] = useState([]);
  const [error, setError] = useState('');
  const [commissionEdits, setCommissionEdits] = useState({});
  const token = localStorage.getItem('vendor_token');

  function load() {
    apiGet('/api/vendors/admin/all', token).then(setVendors).catch((err) => setError(err.message));
    apiGet('/api/vendors/admin/stats', token).then(setStats).catch(() => {});
    apiGet('/api/orders/admin/unsettled', token).then(setUnsettled).catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setApproval(id, is_approved) {
    try {
      await apiPut(`/api/vendors/admin/${id}/approval`, { is_approved }, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveCommission(id) {
    const rate = commissionEdits[id];
    if (rate === undefined) return;
    try {
      await apiPut(`/api/vendors/admin/${id}/commission`, { commission_rate: rate }, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function settleOrder(orderId) {
    try {
      await apiPut(`/api/orders/${orderId}/settle`, {}, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const pending = vendors.filter((v) => !v.is_approved);
  const approved = vendors.filter((v) => v.is_approved);

  const totalPlatformOwed = unsettled
    .filter((o) => o.payment_method === 'cod')
    .reduce((sum, o) => sum + Number(o.platform_fee), 0);
  const totalRiderOwed = unsettled
    .filter((o) => o.rider_name)
    .reduce((sum, o) => sum + Number(o.rider_fee), 0);

  return (
    <div>
      <div className="dash-header">
        <h1 style={{ fontSize: 22 }}>Admin</h1>
        <Link to="/vendor/dashboard" className="cart-button" style={{ textDecoration: 'none' }}>
          My restaurant
        </Link>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {error && <p className="error-banner">{error}</p>}

        {stats && (
          <div className="settings-panel">
            <div className="settings-row"><label>Total vendors</label><span>{stats.vendors}</span></div>
            <div className="settings-row"><label>Approved vendors</label><span>{stats.approvedVendors}</span></div>
            <div className="settings-row"><label>Total orders</label><span>{stats.orders}</span></div>
            <div className="settings-row"><label>Gross revenue</label><span>₦{stats.revenue.toLocaleString()}</span></div>
            <div className="settings-row"><label>Platform earnings</label><span>₦{stats.platformEarnings.toLocaleString()}</span></div>
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Payouts to reconcile</h2>
        <div className="settings-panel">
          <div className="settings-row"><label>Cash commission owed to platform</label><span>₦{totalPlatformOwed.toLocaleString()}</span></div>
          <div className="settings-row"><label>Owed to riders</label><span>₦{totalRiderOwed.toLocaleString()}</span></div>
        </div>
        {unsettled.length === 0 && <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Nothing pending settlement.</p>}
        {unsettled.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-top">
              <strong>#{order.id} — {order.vendor_name}</strong>
              <span className="status-badge status-received">{order.payment_method === 'cod' ? 'Cash order' : 'Paid online'}</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>
              {order.payment_method === 'cod' && `Platform commission owed: ₦${Number(order.platform_fee).toLocaleString()}`}
              {order.rider_name && ` · Rider (${order.rider_name}) fee owed: ₦${Number(order.rider_fee).toLocaleString()}`}
            </div>
            <button className="secondary-button active" style={{ marginTop: 10 }} onClick={() => settleOrder(order.id)}>
              Mark settled
            </button>
          </div>
        ))}

        <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}>Pending approval ({pending.length})</h2>
        {pending.length === 0 && <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Nothing waiting right now.</p>}
        {pending.map((v) => (
          <div className="order-card" key={v.id}>
            <div className="order-card-top">
              <div>
                <strong>{v.name}</strong>
                <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{v.owner_name} · {v.owner_email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{v.cuisine_type} — {v.address}</div>
            <div className="order-actions">
              <button className="secondary-button active" onClick={() => setApproval(v.id, true)}>Approve</button>
              <button className="secondary-button" onClick={() => setApproval(v.id, false)}>Reject</button>
            </div>
          </div>
        ))}

        <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}>Approved vendors ({approved.length})</h2>
        {approved.map((v) => (
          <div className="order-card" key={v.id}>
            <div className="order-card-top">
              <div>
                <strong>{v.name}</strong>
                <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{v.owner_name} · {v.owner_email}</div>
              </div>
              <span className={`status-badge status-${v.is_open ? 'delivered' : 'cancelled'}`}>
                {v.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{v.cuisine_type} — {v.address}</div>
            <div className="settings-row" style={{ marginTop: 8 }}>
              <label>Commission %</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  style={{ width: 70 }}
                  defaultValue={v.commission_rate}
                  onChange={(e) => setCommissionEdits((prev) => ({ ...prev, [v.id]: e.target.value }))}
                />
                <button className="secondary-button" onClick={() => saveCommission(v.id)}>Save</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

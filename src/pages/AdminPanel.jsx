import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

export default function AdminPanel() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('vendor_token');

  function load() {
    apiGet('/api/vendors/admin/all', token).then(setVendors).catch((err) => setError(err.message));
    apiGet('/api/vendors/admin/stats', token).then(setStats).catch(() => {});
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

  const pending = vendors.filter((v) => !v.is_approved);
  const approved = vendors.filter((v) => v.is_approved);

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
            <div className="settings-row"><label>Platform revenue</label><span>₦{stats.revenue.toLocaleString()}</span></div>
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Pending approval ({pending.length})</h2>
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
          </div>
        ))}
      </div>
    </div>
  );
}

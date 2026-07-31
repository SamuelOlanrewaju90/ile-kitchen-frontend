import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

const STATUS_OPTIONS = ['received', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OwnerDashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('owner_token');

  function load() {
    apiGet('/api/orders', token)
      .then(setOrders)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000); // poll for new orders
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

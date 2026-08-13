import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api.js';

const STATUS_LABELS = {
  received: 'Order received',
  preparing: "We're preparing it",
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function MyOrders() {
  const [phone, setPhone] = useState(() => localStorage.getItem('customer_phone') || '');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookup(e) {
    e?.preventDefault();
    if (!phone.trim()) {
      setError('Enter the phone number you used when ordering.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await apiGet(`/api/orders/history?phone=${encodeURIComponent(phone.trim())}`);
      setOrders(result);
      localStorage.setItem('customer_phone', phone.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup if we already remember a phone number from a past order
  useEffect(() => {
    if (phone) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>My orders</h1>

      <form onSubmit={lookup}>
        <div className="field">
          <label>Phone number used at checkout</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" />
        </div>
        <button className="primary-button" disabled={loading}>
          {loading ? 'Looking up…' : 'Find my orders'}
        </button>
      </form>

      {error && <p className="error-banner" style={{ marginTop: 16 }}>{error}</p>}

      {orders && orders.length === 0 && !error && (
        <p style={{ marginTop: 20, color: 'rgba(32,26,21,0.6)' }}>
          No orders found for that number yet.
        </p>
      )}

      {orders && orders.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {orders.map((order) => (
            <Link
              to={`/order/${order.id}`}
              key={order.id}
              className="order-card"
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div className="order-card-top">
                <div>
                  <strong>Order #{order.id}</strong>
                  <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <span className={`status-badge status-${order.order_status}`}>
                  {STATUS_LABELS[order.order_status]}
                </span>
              </div>
              <div className="order-items-list">
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.quantity} × {item.name}
                    {idx < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 6 }}>
                <span>Total</span>
                <span>₦{Number(order.total).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

const STATUS_LABELS = {
  received: 'Order received',
  preparing: "We're preparing it",
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

function ReviewForm({ order, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (rating === 0) {
      setError('Tap a star to rate your order.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiPost('/api/reviews', { order_id: order.id, rating, comment });
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="review-form" onClick={(e) => e.stopPropagation()}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Rate this order</div>
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= rating ? 'filled' : ''} onClick={() => setRating(n)}>
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Optional comment…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{
          width: '100%',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '8px 10px',
          fontFamily: 'inherit',
          fontSize: 14,
          marginBottom: 8
        }}
      />
      {error && <p className="error-banner" style={{ marginBottom: 8 }}>{error}</p>}
      <button className="secondary-button active" disabled={submitting} onClick={submit}>
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </div>
  );
}

export default function MyOrders() {
  const [phone, setPhone] = useState(() => localStorage.getItem('customer_phone') || '');
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const { addItem } = useCart();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (phone) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function orderAgain(order, e) {
    e.stopPropagation();
    order.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ id: item.id, name: item.name, price: item.price });
      }
    });
    navigate('/checkout');
  }

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
            <div key={order.id} className="order-card">
              <Link to={`/order/${order.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
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

              <div className="order-actions">
                <button className="secondary-button" onClick={(e) => orderAgain(order, e)}>
                  Order again
                </button>
                {order.order_status === 'delivered' && !order.has_review && reviewingId !== order.id && (
                  <button
                    className="secondary-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewingId(order.id);
                    }}
                  >
                    Leave a review
                  </button>
                )}
              </div>

              {order.order_status === 'delivered' && order.has_review && (
                <p className="review-submitted">You rated this order {order.review_rating} ★ — thank you!</p>
              )}

              {reviewingId === order.id && (
                <ReviewForm
                  order={order}
                  onSubmitted={() => {
                    setReviewingId(null);
                    lookup();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../api.js';

const STATUS_LABELS = {
  received: 'Order received',
  preparing: "We're preparing it",
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    function load() {
      apiGet(`/api/orders/${id}`).then(setOrder).catch((err) => setError(err.message));
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) return <div className="form-page"><p className="error-banner">{error}</p></div>;
  if (!order) return <div className="form-page"><p>Loading your order…</p></div>;

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26 }}>Thank you, {order.customer_name.split(' ')[0]}!</h1>
      <p style={{ color: 'rgba(32,26,21,0.7)', marginBottom: 20 }}>Order #{order.id}</p>

      <span className={`status-badge status-${order.order_status}`}>
        {STATUS_LABELS[order.order_status]}
      </span>

      <div style={{ marginTop: 24 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>Order summary</h2>
        {order.items.map((item, idx) => (
          <div className="cart-summary-row" key={idx}>
            <span>{item.quantity} × {item.name}</span>
            <span>₦{(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="cart-summary-row">
          <span>Delivery fee</span>
          <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
        </div>
        <div className="cart-total-row">
          <span>Total</span>
          <span>₦{Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: 'rgba(32,26,21,0.7)' }}>
        Payment: {order.payment_method === 'cod' ? 'Pay on delivery' : 'Paid online'}
      </p>

      <Link to="/" style={{ display: 'inline-block', marginTop: 24, fontWeight: 600 }}>
        ← Back to menu
      </Link>
    </div>
  );
}

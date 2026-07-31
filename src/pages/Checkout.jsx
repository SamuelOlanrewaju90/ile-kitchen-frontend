import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { apiPost } from '../api.js';

const DELIVERY_FEE = 500;
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ customer_name: '', phone: '', address: '', notes: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = subtotal + DELIVERY_FEE;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.customer_name || !form.phone || !form.address) {
      setError('Please fill in your name, phone number, and delivery address.');
      return false;
    }
    if (paymentMethod === 'paystack' && !form.email) {
      setError('Please enter your email address for the payment receipt.');
      return false;
    }
    if (items.length === 0) {
      setError('Your cart is empty.');
      return false;
    }
    return true;
  }

  async function submitOrder(payment_reference = null) {
    setLoading(true);
    setError('');
    try {
      const order = await apiPost('/api/orders', {
        customer_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        items,
        payment_method: paymentMethod,
        payment_reference
      });
      clearCart();
      navigate(`/order/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePlaceOrder() {
    setError('');
    if (!validate()) return;

    if (paymentMethod === 'cod') {
      submitOrder();
      return;
    }

    // Paystack flow
    if (!PAYSTACK_PUBLIC_KEY) {
      setError('Online payment is not configured yet. Please choose pay on delivery.');
      return;
    }
    if (!window.PaystackPop) {
      setError('Payment could not load. Check your connection and try again.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: Math.round(total * 100), // kobo
      currency: 'NGN',
      ref: `ILE-${Date.now()}`,
      callback: function (response) {
        submitOrder(response.reference);
      },
      onClose: function () {
        setError('Payment was not completed.');
      }
    });
    handler.openIframe();
  }

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>Checkout</h1>

      {error && <p className="error-banner">{error}</p>}

      <div className="field">
        <label>Full name</label>
        <input value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} />
      </div>
      <div className="field">
        <label>Phone number</label>
        <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="For the delivery rider to reach you" />
      </div>
      <div className="field">
        <label>Delivery address</label>
        <textarea rows={3} value={form.address} onChange={(e) => update('address', e.target.value)} />
      </div>
      <div className="field">
        <label>Notes (optional)</label>
        <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Gate code, landmark, spice preference…" />
      </div>

      <h2 className="section-title" style={{ marginTop: 8 }}>Payment method</h2>
      <div className="payment-options">
        <button
          className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('cod')}
        >
          Pay on delivery
        </button>
        <button
          className={`payment-option ${paymentMethod === 'paystack' ? 'selected' : ''}`}
          onClick={() => setPaymentMethod('paystack')}
        >
          Pay online now
        </button>
      </div>

      {paymentMethod === 'paystack' && (
        <div className="field">
          <label>Email (for payment receipt)</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
      )}

      <div className="cart-summary-row">
        <span>Subtotal</span>
        <span>₦{subtotal.toLocaleString()}</span>
      </div>
      <div className="cart-summary-row">
        <span>Delivery fee</span>
        <span>₦{DELIVERY_FEE.toLocaleString()}</span>
      </div>
      <div className="cart-total-row">
        <span>Total</span>
        <span>₦{total.toLocaleString()}</span>
      </div>

      <button className="primary-button" disabled={loading} onClick={handlePlaceOrder}>
        {loading ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order' : `Pay ₦${total.toLocaleString()}`}
      </button>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { apiPost, apiGet } from '../api.js';

const DELIVERY_FEE = 500;
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

export default function Checkout() {
  const { items, subtotal, clearCart, vendorId, vendorName } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ customer_name: '', phone: '', address: '', notes: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    apiGet('/api/settings').then(setSettings).catch(() => {});
    if (vendorId) {
      apiGet(`/api/vendors/${vendorId}`).then(setVendor).catch(() => {});
    }
  }, [vendorId]);

  const total = subtotal + DELIVERY_FEE;
  const minOrder = settings ? Number(settings.min_order_amount || 0) : 0;
  const belowMinimum = minOrder > 0 && subtotal < minOrder;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (items.length === 0 || !vendorId) {
      setError('Your cart is empty.');
      return false;
    }
    if (!form.customer_name || !form.phone || !form.address) {
      setError('Please fill in your name, phone number, and delivery address.');
      return false;
    }
    if (paymentMethod === 'paystack' && !form.email) {
      setError('Please enter your email address for the payment receipt.');
      return false;
    }
    if (belowMinimum) {
      setError(`Minimum order amount is ₦${minOrder.toLocaleString()}. Add a bit more to your cart.`);
      return false;
    }
    return true;
  }

  async function submitOrder(payment_reference = null) {
    setLoading(true);
    setError('');
    try {
      const order = await apiPost('/api/orders', {
        vendor_id: vendorId,
        customer_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        items,
        payment_method: paymentMethod,
        payment_reference
      });
      localStorage.setItem('customer_phone', form.phone.trim());
      clearCart();
      navigate(`/order/${order.id}`);
    } catch (err) {
      // If the order already exists (webhook created it in the background
      // while this request was in flight — very rare, but possible on a
      // slow connection), just move on instead of showing an error.
      if (err.message && err.message.toLowerCase().includes('already')) {
        clearCart();
        navigate('/my-orders');
        return;
      }
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

    if (!PAYSTACK_PUBLIC_KEY) {
      setError('Online payment is not configured yet. Please choose pay on delivery.');
      return;
    }
    if (!window.PaystackPop) {
      setError('Payment could not load. Check your connection and try again.');
      return;
    }

    const paystackConfig = {
      key: PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: Math.round(total * 100),
      currency: 'NGN',
      ref: `ILE-${Date.now()}`,
      // Attached so the Paystack webhook can reconstruct this exact order
      // even if this browser tab closes the instant payment succeeds and
      // the callback below never runs. This is the fix that makes payment
      // confirmation reliable instead of depending only on this callback.
      metadata: {
        vendor_id: vendorId,
        customer_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        items: JSON.stringify(items)
      },
      onSuccess: function (response) {
        submitOrder(response.reference);
      },
      onCancel: function () {
        setError('Payment was not completed.');
      }
    };

    // If this vendor has added their own Paystack subaccount, split the
    // payment automatically: our platform_fee comes to us, the vendor
    // absorbs the standard Paystack transaction charge, and the rest
    // lands directly in the vendor's own bank account via Paystack —
    // no manual reconciliation needed for this part of the order.
    if (vendor?.paystack_subaccount_code) {
      const platformFee = Math.round(subtotal * (Number(vendor.commission_rate) / 100));
      paystackConfig.subaccount = vendor.paystack_subaccount_code;
      paystackConfig.transaction_charge = Math.round(platformFee * 100);
      paystackConfig.bearer = 'subaccount';
    }

    // v2 API: newTransaction() replaces setup()+openIframe(). It uses a
    // full-page redirect for the bank-auth/OTP step instead of a popup
    // window, which avoids the "about:blank" mobile popup-blocking issue.
    const popup = new window.PaystackPop();
    popup.newTransaction(paystackConfig);
  }

  if (items.length === 0) {
    return (
      <div className="form-page">
        <h1 style={{ fontSize: 26, marginBottom: 12 }}>Your cart is empty</h1>
        <Link to="/" style={{ fontWeight: 600 }}>← Browse restaurants</Link>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Checkout</h1>
      <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Ordering from {vendorName}</p>

      {error && <p className="error-banner">{error}</p>}

      {minOrder > 0 && <p className="min-order-notice">Minimum order: ₦{minOrder.toLocaleString()}</p>}

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
        <button className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
          Pay on delivery
        </button>
        <button className={`payment-option ${paymentMethod === 'paystack' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paystack')}>
          Pay online now
        </button>
      </div>

      {paymentMethod === 'paystack' && (
        <div className="field">
          <label>Email (for payment receipt)</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
      )}

      <div className="cart-summary-row"><span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span></div>
      <div className="cart-summary-row"><span>Delivery fee</span><span>₦{DELIVERY_FEE.toLocaleString()}</span></div>
      <div className="cart-total-row"><span>Total</span><span>₦{total.toLocaleString()}</span></div>

      <button className="primary-button" disabled={loading || belowMinimum} onClick={handlePlaceOrder}>
        {loading ? 'Placing order…' : paymentMethod === 'cod' ? 'Place order' : `Pay ₦${total.toLocaleString()}`}
      </button>
    </div>
  );
                                           }
      

import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function CartDrawer({ open, onClose }) {
  const { items, changeQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  function goToCheckout() {
    onClose();
    navigate('/checkout');
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h2>Your order</h2>
          <button className="close-button" onClick={onClose} aria-label="Close cart">×</button>
        </div>

        {items.length === 0 ? (
          <p className="empty-state">Your cart is empty. Add something delicious from the menu.</p>
        ) : (
          <>
            {items.map((item) => (
              <div className="cart-line" key={item.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>₦{item.price.toLocaleString()} each</div>
                </div>
                <div className="qty-control">
                  <button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity">+</button>
                </div>
              </div>
            ))}

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row" style={{ color: 'rgba(32,26,21,0.6)' }}>
              <span>Delivery fee</span>
              <span>Calculated at checkout</span>
            </div>

            <button className="primary-button" onClick={goToCheckout}>Go to checkout</button>
          </>
        )}
      </div>
    </>
  );
}

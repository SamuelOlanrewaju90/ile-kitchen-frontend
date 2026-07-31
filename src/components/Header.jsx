import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Header({ onOpenCart }) {
  const { itemCount } = useCart();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          Il<span>é</span> Kitchen
        </Link>
        <button className="cart-button" onClick={onOpenCart}>
          Cart
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
      </div>
    </header>
  );
}

import { useCart } from '../context/CartContext.jsx';

export default function MenuItemCard({ item }) {
  const { addItem } = useCart();

  return (
    <div className="menu-card">
      {item.featured && <span className="featured-badge">Chef's Pick</span>}
      <div
        className="menu-card-image"
        style={item.image_url ? { backgroundImage: `url(${item.image_url})` } : undefined}
      />
      <div className="menu-card-name">{item.name}</div>
      {item.description && <div className="menu-card-desc">{item.description}</div>}
      <div className="menu-card-footer">
        <span className="price">₦{Number(item.price).toLocaleString()}</span>
        <button className="add-button" onClick={() => addItem(item)}>
          Add
        </button>
      </div>
    </div>
  );
}

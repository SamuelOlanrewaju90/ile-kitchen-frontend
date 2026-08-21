import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../api.js';
import MenuItemCard from '../components/MenuItemCard.jsx';

export default function VendorStorefront() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet(`/api/vendors/${id}`).then(setVendor).catch((err) => setError(err.message));
    apiGet(`/api/menu?vendor_id=${id}`).then(setMenu).catch((err) => setError(err.message));
  }, [id]);

  const categories = [...new Set(menu.map((i) => i.category))];

  return (
    <div className="container">
      <Link to="/" style={{ display: 'inline-block', margin: '16px 0 0', fontWeight: 600, fontSize: 14 }}>
        ← All restaurants
      </Link>

      {error && <p className="error-banner">{error}</p>}

      {vendor && (
        <section className="hero" style={{ padding: '20px 0 24px' }}>
          <div className="hero-text">
            <h1 style={{ fontSize: 30 }}>{vendor.name}</h1>
            <p>{vendor.description}</p>
            <div className="hero-meta">
              {vendor.cuisine_type && <span>{vendor.cuisine_type}</span>}
              {!vendor.is_open && <span style={{ color: 'var(--chili)', fontWeight: 700 }}>Closed right now</span>}
            </div>
          </div>
        </section>
      )}

      {categories.map((category) => (
        <div key={category}>
          <h2 className="section-title">{category}</h2>
          <div className="menu-grid">
            {menu
              .filter((item) => item.category === category)
              .map((item) => (
                <MenuItemCard item={item} key={item.id} vendorId={Number(id)} vendorName={vendor?.name || ''} />
              ))}
          </div>
        </div>
      ))}

      {menu.length === 0 && !error && <p style={{ padding: '20px 0' }}>Loading menu…</p>}
    </div>
  );
}

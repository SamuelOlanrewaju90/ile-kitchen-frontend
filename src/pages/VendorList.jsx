import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api.js';

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/vendors').then(setVendors).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <h1>Food from restaurants near you, delivered fast.</h1>
          <p>Browse local kitchens, order what you're craving, and track it all the way to your door.</p>
        </div>
        <div className="stamp">Order Now</div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <h2 className="section-title">Restaurants</h2>
      <div className="menu-grid">
        {vendors.map((vendor) => (
          <Link to={`/vendor/${vendor.id}`} key={vendor.id} className="menu-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
              className="menu-card-image"
              style={vendor.logo_url ? { backgroundImage: `url(${vendor.logo_url})` } : undefined}
            />
            <div className="menu-card-name">{vendor.name}</div>
            <div className="menu-card-desc">{vendor.cuisine_type}</div>
            {!vendor.is_open && (
              <span className="status-badge status-cancelled" style={{ width: 'fit-content' }}>
                Closed
              </span>
            )}
          </Link>
        ))}
      </div>

      {vendors.length === 0 && !error && <p style={{ padding: '20px 0' }}>Loading restaurants…</p>}
    </div>
  );
}

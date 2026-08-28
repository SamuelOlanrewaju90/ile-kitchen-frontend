import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../api.js';

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/vendors/meta/cuisines').then(setCuisines).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cuisine) params.set('cuisine', cuisine);
    if (openOnly) params.set('open_only', 'true');
    if (sort) params.set('sort', sort);

    const timeout = setTimeout(() => {
      apiGet(`/api/vendors?${params.toString()}`).then(setVendors).catch((err) => setError(err.message));
    }, 250); // small debounce so typing doesn't fire a request per keystroke

    return () => clearTimeout(timeout);
  }, [search, cuisine, openOnly, sort]);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <h1>Food from restaurants near you, delivered fast.</h1>
          <p>Browse local kitchens, order what you're craving, and track it all the way to your door.</p>
        </div>
        <div className="stamp">Order Now</div>
      </section>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search restaurants or cuisines…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: default</option>
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
        </select>
        <button
          className={`filter-toggle ${openOnly ? 'active' : ''}`}
          onClick={() => setOpenOnly((v) => !v)}
        >
          Open now
        </button>
      </div>

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {vendor.review_count > 0 ? (
                <span style={{ fontSize: 13 }}>
                  <span className="star">★</span> {vendor.average_rating.toFixed(1)} ({vendor.review_count})
                </span>
              ) : (
                <span style={{ fontSize: 13, color: 'rgba(32,26,21,0.4)' }}>No reviews yet</span>
              )}
              {!vendor.is_open && (
                <span className="status-badge status-cancelled">Closed</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {vendors.length === 0 && !error && <p style={{ padding: '20px 0' }}>No restaurants match — try a different search.</p>}
    </div>
  );
}

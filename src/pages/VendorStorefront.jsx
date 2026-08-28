import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../api.js';
import MenuItemCard from '../components/MenuItemCard.jsx';

export default function VendorStorefront() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet(`/api/vendors/${id}`).then(setVendor).catch((err) => setError(err.message));
    apiGet(`/api/menu?vendor_id=${id}`).then(setMenu).catch((err) => setError(err.message));
    apiGet(`/api/reviews/vendor/${id}`).then(setReviews).catch(() => {});
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
              {vendor.review_count > 0 ? (
                <span><span className="star">★</span> {vendor.average_rating.toFixed(1)} ({vendor.review_count} reviews)</span>
              ) : (
                <span>No reviews yet</span>
              )}
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

      {reviews.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 className="section-title">Recent reviews</h2>
          {reviews.map((review) => (
            <div className="order-card" key={review.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{review.customer_name.split(' ')[0]}</strong>
                <span><span className="star">★</span> {review.rating}</span>
              </div>
              {review.comment && <p style={{ fontSize: 14, marginTop: 6 }}>{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

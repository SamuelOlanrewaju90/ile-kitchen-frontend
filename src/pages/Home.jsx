import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';
import MenuItemCard from '../components/MenuItemCard.jsx';

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/api/menu')
      .then(setMenu)
      .catch((err) => setError(err.message));
  }, []);

  const categories = [...new Set(menu.map((i) => i.category))];

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-text">
          <h1>Home-cooked food, delivered by the person who made it.</h1>
          <p>
            Every plate leaves our kitchen and comes straight to your door — no
            middleman, no cold food. Order below and we'll bring it ourselves.
          </p>
        </div>
        <div className="stamp">Hot &amp; Fresh, Daily</div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      {categories.map((category) => (
        <div key={category}>
          <h2 className="section-title">{category}</h2>
          <div className="menu-grid">
            {menu
              .filter((item) => item.category === category)
              .map((item) => (
                <MenuItemCard item={item} key={item.id} />
              ))}
          </div>
        </div>
      ))}

      {menu.length === 0 && !error && <p style={{ padding: '20px 0' }}>Loading menu…</p>}
    </div>
  );
}

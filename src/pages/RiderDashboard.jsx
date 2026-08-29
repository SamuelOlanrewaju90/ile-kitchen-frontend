import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPut } from '../api.js';

export default function RiderDashboard() {
  const [profile, setProfile] = useState(null);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('vendor_token');
  const watchId = useRef(null);

  function loadProfile() {
    apiGet('/api/riders/me', token).then(setProfile).catch((err) => setError(err.message));
  }
  function loadAvailable() {
    apiGet('/api/riders/available-orders', token).then(setAvailable).catch((err) => setError(err.message));
  }
  function loadMine() {
    apiGet('/api/riders/me/deliveries', token).then(setMine).catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadProfile();
    loadAvailable();
    loadMine();
    const interval = setInterval(() => {
      loadAvailable();
      loadMine();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profile?.is_available) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share your location.');
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationError('');
        apiPut('/api/riders/me/location', { lat: position.coords.latitude, lng: position.coords.longitude }, token).catch(() => {});
      },
      () => setLocationError('Location permission denied — turn it on to receive deliveries.'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [profile?.is_available, token]);

  async function toggleAvailable() {
    try {
      const updated = await apiPut('/api/riders/me/availability', { is_available: !profile.is_available }, token);
      setProfile(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function acceptOrder(orderId) {
    try {
      await apiPut(`/api/riders/accept/${orderId}`, {}, token);
      loadAvailable();
      loadMine();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateDeliveryStatus(orderId, delivery_status) {
    try {
      await apiPut(`/api/riders/deliveries/${orderId}/status`, { delivery_status }, token);
      loadMine();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_user');
    navigate('/rider/login');
  }

  const activeDeliveries = mine.filter((o) => !['delivered', 'cancelled'].includes(o.delivery_status));
  const pastDeliveries = mine.filter((o) => ['delivered', 'cancelled'].includes(o.delivery_status));

  return (
    <div>
      <div className="dash-header">
        <h1 style={{ fontSize: 22 }}>Rider dashboard</h1>
        <button className="cart-button" onClick={logout}>Log out</button>
      </div>

      <div className="container" style={{ paddingTop: 20 }}>
        {error && <p className="error-banner">{error}</p>}
        {locationError && <p className="error-banner">{locationError}</p>}

        {profile && (
          <div className="settings-panel">
            <div className="settings-row">
              <label>Available for deliveries</label>
              <label className="toggle-switch">
                <input type="checkbox" checked={profile.is_available} onChange={toggleAvailable} />
                <span className="toggle-slider" />
              </label>
            </div>
            {profile.is_available && (
              <p style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)', marginTop: 8 }}>
                Sharing your location while you're available and on a delivery.
              </p>
            )}
          </div>
        )}

        {activeDeliveries.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>My active delivery</h2>
            {activeDeliveries.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-card-top">
                  <div>
                    <strong>#{order.id} — {order.vendor_name}</strong>
                    <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>Pickup: {order.vendor_address}</div>
                  </div>
                  <span className={`status-badge status-${order.delivery_status}`}>{order.delivery_status.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ fontSize: 13 }}>Deliver to: {order.address}</div>
                <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>{order.customer_name} · {order.phone}</div>
                <div className="order-actions">
                  {order.delivery_status === 'picked_up' && (
                    <button className="secondary-button active" onClick={() => updateDeliveryStatus(order.id, 'in_transit')}>Start delivery</button>
                  )}
                  {order.delivery_status === 'in_transit' && (
                    <button className="secondary-button active" onClick={() => updateDeliveryStatus(order.id, 'delivered')}>Mark delivered</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {profile?.is_available && activeDeliveries.length === 0 && (
          <>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Available deliveries</h2>
            {available.length === 0 && <p style={{ color: 'rgba(32,26,21,0.6)' }}>Nothing ready for pickup right now.</p>}
            {available.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-card-top">
                  <div>
                    <strong>#{order.id} — {order.vendor_name}</strong>
                    <div style={{ fontSize: 13, color: 'rgba(32,26,21,0.6)' }}>Pickup: {order.vendor_address}</div>
                  </div>
                  <span className="price">₦{Number(order.delivery_fee).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 13 }}>Deliver to: {order.address}</div>
                <button className="secondary-button active" style={{ marginTop: 10 }} onClick={() => acceptOrder(order.id)}>Accept delivery</button>
              </div>
            ))}
          </>
        )}

        {!profile?.is_available && activeDeliveries.length === 0 && (
          <p style={{ color: 'rgba(32,26,21,0.6)' }}>Turn on availability above to see nearby deliveries.</p>
        )}

        {pastDeliveries.length > 0 && (
          <>
            <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}>Past deliveries</h2>
            {pastDeliveries.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-card-top">
                  <strong>#{order.id} — {order.vendor_name}</strong>
                  <span className={`status-badge status-${order.delivery_status}`}>{order.delivery_status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

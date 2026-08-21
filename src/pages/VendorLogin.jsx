import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../api.js';

export default function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiPost('/api/auth/login', { email, password });
      localStorage.setItem('vendor_token', token);
      localStorage.setItem('vendor_user', JSON.stringify(user));
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 20 }}>Vendor login</h1>
      {error && <p className="error-banner">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        New restaurant? <Link to="/vendor/register" style={{ fontWeight: 600 }}>Apply here</Link>
      </p>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../api.js';

export default function RiderRegister() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('Please fill in every field.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiPost('/api/auth/register', { ...form, role: 'rider' });
      localStorage.setItem('vendor_token', token);
      localStorage.setItem('vendor_user', JSON.stringify(user));
      navigate('/rider/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Become a rider</h1>
      <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Accept nearby deliveries and get paid per drop.</p>
      {error && <p className="error-banner">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Full name</label><input value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
        <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} /></div>
        <button className="primary-button" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already riding with us? <Link to="/rider/login" style={{ fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}

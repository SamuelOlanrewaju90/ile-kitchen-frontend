import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../api.js';

export default function VendorRegister() {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({ name: '', email: '', phone: '', password: '' });
  const [profile, setProfile] = useState({ name: '', description: '', cuisine_type: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function updateAccount(field, value) { setAccount((prev) => ({ ...prev, [field]: value })); }
  function updateProfile(field, value) { setProfile((prev) => ({ ...prev, [field]: value })); }

  async function createAccount(e) {
    e.preventDefault();
    setError('');
    if (!account.name || !account.email || !account.password) {
      setError('Please fill in your name, email, and a password.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiPost('/api/auth/register', { ...account, role: 'vendor' });
      localStorage.setItem('vendor_token', token);
      localStorage.setItem('vendor_user', JSON.stringify(user));
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile(e) {
    e.preventDefault();
    setError('');
    if (!profile.name) {
      setError('Please enter your restaurant name.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      await apiPost('/api/vendors', profile, token);
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <div className="form-page">
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Become a vendor</h1>
        <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Step 1 of 2 — your account</p>
        {error && <p className="error-banner">{error}</p>}
        <form onSubmit={createAccount}>
          <div className="field"><label>Your name</label><input value={account.name} onChange={(e) => updateAccount('name', e.target.value)} /></div>
          <div className="field"><label>Email</label><input type="email" value={account.email} onChange={(e) => updateAccount('email', e.target.value)} /></div>
          <div className="field"><label>Phone</label><input value={account.phone} onChange={(e) => updateAccount('phone', e.target.value)} /></div>
          <div className="field"><label>Password</label><input type="password" value={account.password} onChange={(e) => updateAccount('password', e.target.value)} /></div>
          <button className="primary-button" disabled={loading}>{loading ? 'Creating…' : 'Continue'}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14 }}>
          Already have an account? <Link to="/vendor/login" style={{ fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Tell us about your restaurant</h1>
      <p style={{ color: 'rgba(32,26,21,0.6)', marginBottom: 20 }}>Step 2 of 2 — your profile</p>
      {error && <p className="error-banner">{error}</p>}
      <form onSubmit={createProfile}>
        <div className="field"><label>Restaurant name</label><input value={profile.name} onChange={(e) => updateProfile('name', e.target.value)} /></div>
        <div className="field"><label>Description</label><textarea rows={3} value={profile.description} onChange={(e) => updateProfile('description', e.target.value)} /></div>
        <div className="field"><label>Cuisine type</label><input value={profile.cuisine_type} onChange={(e) => updateProfile('cuisine_type', e.target.value)} placeholder="e.g. Nigerian, Chinese, Continental" /></div>
        <div className="field"><label>Address</label><textarea rows={2} value={profile.address} onChange={(e) => updateProfile('address', e.target.value)} /></div>
        <button className="primary-button" disabled={loading}>{loading ? 'Submitting…' : 'Submit for approval'}</button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(32,26,21,0.6)' }}>
        Your restaurant won't be visible to customers until an admin approves it. Once submitted, you can still log in and start adding menu items.
      </p>
    </div>
  );
}

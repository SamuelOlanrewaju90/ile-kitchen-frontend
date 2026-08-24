import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import { VendorRoute, AdminRoute, RiderRoute } from './components/ProtectedRoute.jsx';
import VendorList from './pages/VendorList.jsx';
import VendorStorefront from './pages/VendorStorefront.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import MyOrders from './pages/MyOrders.jsx';
import VendorRegister from './pages/VendorRegister.jsx';
import VendorLogin from './pages/VendorLogin.jsx';
import VendorDashboard from './pages/VendorDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import RiderRegister from './pages/RiderRegister.jsx';
import RiderLogin from './pages/RiderLogin.jsx';
import RiderDashboard from './pages/RiderDashboard.jsx';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppButton />

      <Routes>
        <Route path="/" element={<VendorList />} />
        <Route path="/vendor/:id" element={<VendorStorefront />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderStatus />} />
        <Route path="/my-orders" element={<MyOrders />} />

        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        <Route path="/rider/register" element={<RiderRegister />} />
        <Route path="/rider/login" element={<RiderLogin />} />
        <Route path="/rider/dashboard" element={<RiderRoute><RiderDashboard /></RiderRoute>} />
      </Routes>

      <p className="footer-note">Ilé Market · Home-cooked food, delivered by local vendors.</p>
    </>
  );
}

import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import Home from './pages/Home.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import MyOrders from './pages/MyOrders.jsx';
import OwnerLogin from './pages/OwnerLogin.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WhatsAppButton />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:id" element={<OrderStatus />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route
          path="/owner"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      <p className="footer-note">Ilé Kitchen · Home-cooked, delivered by us.</p>
    </>
  );
}

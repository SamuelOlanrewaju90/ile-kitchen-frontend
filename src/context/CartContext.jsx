import { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState('');

  // Marketplace carts can only hold items from one vendor at a time
  // (same behaviour as Glovo/Uber Eats). Adding from a different vendor
  // asks first, then clears and starts fresh.
  function addItem(menuItem, fromVendorId, fromVendorName) {
    if (vendorId !== null && vendorId !== fromVendorId) {
      const confirmed = window.confirm(
        `Your cart has items from ${vendorName}. Start a new order from ${fromVendorName} instead?`
      );
      if (!confirmed) return;
      setItems([]);
    }
    setVendorId(fromVendorId);
    setVendorName(fromVendorName);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id);
      if (existing) {
        return prev.map((i) => (i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, price: Number(menuItem.price), quantity: 1 }];
    });
  }

  function changeQuantity(id, delta) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0)
    );
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setItems([]);
    setVendorId(null);
    setVendorName('');
  }

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, vendorId, vendorName, addItem, changeQuantity, removeItem, clearCart, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

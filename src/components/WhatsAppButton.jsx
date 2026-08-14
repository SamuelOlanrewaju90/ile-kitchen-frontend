// The WhatsApp number is pulled from your backend settings so you
// can change it later without redeploying the frontend.
import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';

export default function WhatsAppButton() {
  const [number, setNumber] = useState('');

  useEffect(() => {
    apiGet('/api/settings')
      .then((settings) => setNumber(settings.whatsapp_number || ''))
      .catch(() => {});
  }, []);

  if (!number) return null;

  return (
    <a
      className="whatsapp-fab"
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      💬
    </a>
  );
}

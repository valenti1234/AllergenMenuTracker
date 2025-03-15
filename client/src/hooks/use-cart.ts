import { useState, useEffect } from 'react';

export function useCart() {
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cartData = localStorage.getItem('cartItems');
        if (cartData) {
          const cartItems = JSON.parse(cartData);
          // Calcola il numero totale di elementi nel carrello
          const count = Object.values(cartItems).reduce((total: number, item: any) => total + item.quantity, 0);
          setCartItemCount(count);
        } else {
          setCartItemCount(0);
        }
      } catch (error) {
        console.error('Error reading cart data:', error);
        setCartItemCount(0);
      }
    };

    // Aggiorna il conteggio all'avvio
    updateCartCount();

    // Ascolta gli eventi di storage per aggiornare il conteggio quando cambia il carrello
    window.addEventListener('storage', updateCartCount);
    // Ascolta un evento personalizzato per aggiornamenti locali
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  return cartItemCount;
} 
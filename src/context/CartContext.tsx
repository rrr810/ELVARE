import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartLine, ColorOption, Product } from '../types';

const STORAGE_KEY = 'elvare-cart-v1';

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, size: string, color: ColorOption, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function getSavedCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line) => line?.key && line?.product?.id && Number(line.quantity) > 0) as CartLine[];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(getSavedCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // The cart still works for the current session if browser storage is unavailable.
    }
  }, [items]);

  const addItem: CartContextValue['addItem'] = (product, size, color, quantity = 1) => {
    const key = `${product.id}::${size}::${color.name}`;
    setItems((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) => line.key === key
          ? { ...line, quantity: Math.min(10, line.quantity + quantity) }
          : line);
      }
      return [...current, { key, product, size, color, quantity: Math.min(10, Math.max(1, quantity)) }];
    });
  };

  const removeItem = (key: string) => setItems((current) => current.filter((line) => line.key !== key));
  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(key);
      return;
    }
    setItems((current) => current.map((line) => line.key === key ? { ...line, quantity: Math.min(10, quantity) } : line));
  };
  const clearCart = () => setItems([]);

  const value = useMemo(() => ({
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.product.priceKsh * item.quantity, 0),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}

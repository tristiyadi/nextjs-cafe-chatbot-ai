import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const existingItem = get().items.find(
          (item) => item.menuItemId === newItem.menuItemId && item.notes === newItem.notes
        );

        if (existingItem) {
          set({
            items: get().items.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...newItem, id: Math.random().toString(36).substring(7) },
            ],
          });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "cafe-cart-storage",
    }
  )
);

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CartLine, CustomizationOption, Product } from '@/lib/types'

type CartContextType = {
  lines: CartLine[]
  addToCart: (product: Product, selectedOptions: CustomizationOption[], quantity: number) => void
  removeLine: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function computeUnitPrice(product: Product, options: CustomizationOption[]) {
  return product.base_price + options.reduce((sum, o) => sum + o.price_delta, 0)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  function addToCart(product: Product, selectedOptions: CustomizationOption[], quantity: number) {
    const unitPrice = computeUnitPrice(product, selectedOptions)
    const lineId = `${product.id}-${selectedOptions.map((o) => o.id).sort().join(',')}-${Date.now()}`
    setLines((prev) => [...prev, { lineId, product, quantity, selectedOptions, unitPrice }])
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId))
  }

  function updateQuantity(lineId: string, quantity: number) {
    if (quantity < 1) {
      removeLine(lineId)
      return
    }
    setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)))
  }

  function clearCart() {
    setLines([])
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0)

  return (
    <CartContext.Provider value={{ lines, addToCart, removeLine, updateQuantity, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

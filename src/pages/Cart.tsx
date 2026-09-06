import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
export default function Cart() {
  const { lines, removeLine, updateQuantity, subtotal } = useCart()

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Your cart</h1>
        <Link to="/menu" className="text-sm text-espresso-light underline hover:text-espresso">
          Back to menu
        </Link>
      </div>

      {lines.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-espresso-light">Your cart is empty.</p>
          <Link to="/menu" className="inline-block mt-4 text-sm text-caramel-dark underline">
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {lines.map((line) => (
            <div key={line.lineId} className="border border-line p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-display text-lg">{line.product.name}</p>
                {line.selectedOptions.length > 0 && (
                  <p className="text-sm text-espresso-light mt-1">
                    {line.selectedOptions.map((o) => o.label).join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-line">
                    <button
                      onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                      className="w-8 h-8 hover:bg-cream-dark"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                      className="w-8 h-8 hover:bg-cream-dark"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeLine(line.lineId)}
                    className="text-sm text-burgundy underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="whitespace-nowrap">₹{line.unitPrice * line.quantity}</p>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-cream border-t border-line">
          <div className="max-w-2xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-espresso-light">Subtotal</span>
              <span className="font-display text-xl">₹{subtotal}</span>
            </div>
            <p className="text-xs text-espresso-light mb-3">
              Taxes and any loyalty discounts are calculated at checkout.
            </p>
            <Link
              to="/checkout"
              className="block w-full text-center bg-espresso text-cream py-3 hover:bg-espresso-light transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

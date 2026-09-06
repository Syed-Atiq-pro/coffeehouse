import { useMemo, useState } from 'react'
import type { CustomizationOption, Product } from '@/lib/types'
import { useCart } from '@/contexts/CartContext'

type Props = {
  product: Product
  onClose: () => void
}

export default function CustomizeModal({ product, onClose }: Props) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  // selections: groupId -> array of chosen option ids (single-select groups keep length 1)
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const group of product.customization_groups) {
      if (group.is_required && group.customization_options.length > 0) {
        initial[group.id] = [group.customization_options[0].id]
      }
    }
    return initial
  })

  function toggleOption(groupId: string, optionId: string, allowMultiple: boolean) {
    setSelections((prev) => {
      const current = prev[groupId] ?? []
      if (allowMultiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        return { ...prev, [groupId]: next }
      }
      return { ...prev, [groupId]: [optionId] }
    })
  }

  const selectedOptionObjects: CustomizationOption[] = useMemo(() => {
    const result: CustomizationOption[] = []
    for (const group of product.customization_groups) {
      const chosenIds = selections[group.id] ?? []
      for (const opt of group.customization_options) {
        if (chosenIds.includes(opt.id)) result.push(opt)
      }
    }
    return result
  }, [selections, product])

  const unitPrice = product.base_price + selectedOptionObjects.reduce((s, o) => s + o.price_delta, 0)
  const total = unitPrice * quantity

  const missingRequired = product.customization_groups
    .filter((g) => g.is_required)
    .some((g) => (selections[g.id] ?? []).length === 0)

  function handleAdd() {
    addToCart(product, selectedOptionObjects, quantity)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-espresso/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full sm:max-w-md max-h-[90vh] overflow-y-auto border border-line"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="customize-title"
      >
        <div className="p-6 border-b border-line flex items-start justify-between">
          <div>
            <h2 id="customize-title" className="font-display text-2xl">{product.name}</h2>
            <p className="text-sm text-espresso-light mt-1">{product.description}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-espresso-light hover:text-espresso text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {product.customization_groups.map((group) => (
            <fieldset key={group.id}>
              <legend className="text-sm font-medium mb-2">
                {group.name}
                {group.is_required && <span className="text-burgundy ml-1">*</span>}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.customization_options.map((opt) => {
                  const chosen = (selections[group.id] ?? []).includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(group.id, opt.id, group.allow_multiple)}
                      aria-pressed={chosen}
                      className={`px-3.5 py-2 text-sm border transition-colors ${
                        chosen
                          ? 'border-caramel bg-caramel text-cream'
                          : 'border-line bg-white/50 hover:border-caramel'
                      }`}
                    >
                      {opt.label}
                      {opt.price_delta > 0 && <span className="ml-1 opacity-70">+₹{opt.price_delta}</span>}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center border border-line">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 hover:bg-cream-dark"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 hover:bg-cream-dark"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-line">
          <button
            type="button"
            disabled={missingRequired}
            onClick={handleAdd}
            className="w-full bg-espresso text-cream py-3 hover:bg-espresso-light transition-colors disabled:opacity-40 flex items-center justify-between px-5"
          >
            <span>Add to cart</span>
            <span>₹{total}</span>
          </button>
          {missingRequired && (
            <p className="text-xs text-burgundy mt-2">Choose a size to continue.</p>
          )}
        </div>
      </div>
    </div>
  )
}

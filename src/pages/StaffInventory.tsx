import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Ingredient } from '@/lib/types'

function stockStatus(ing: Ingredient): { label: string; className: string } {
  if (ing.current_quantity <= 0) return { label: 'Out of stock', className: 'text-burgundy border-burgundy' }
  if (ing.current_quantity < ing.minimum_quantity) return { label: 'Low stock', className: 'text-caramel-dark border-caramel' }
  return { label: 'In stock', className: 'text-sage border-sage' }
}

export default function StaffInventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('ingredients').select('*').order('name')
    setIngredients((data as Ingredient[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRestock(ingredientId: string) {
    const raw = restockAmounts[ingredientId]
    const amount = parseFloat(raw)
    if (!amount || amount <= 0) return

    setBusyId(ingredientId)
    await supabase.rpc('restock_ingredient', {
      p_ingredient_id: ingredientId,
      p_amount: amount,
      p_reason: 'Manual restock',
    })
    setBusyId(null)
    setRestockAmounts((prev) => ({ ...prev, [ingredientId]: '' }))
    load()
  }

  const lowOrOutCount = ingredients.filter((i) => i.current_quantity < i.minimum_quantity).length

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Inventory</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>
      {lowOrOutCount > 0 && (
        <p className="text-sm text-burgundy mb-6">{lowOrOutCount} ingredient{lowOrOutCount !== 1 ? 's' : ''} need attention</p>
      )}
      {lowOrOutCount === 0 && <div className="mb-6" />}

      {loading && <div className="skeleton h-40 w-full" />}

      <div className="space-y-3">
        {ingredients.map((ing) => {
          const status = stockStatus(ing)
          return (
            <div key={ing.id} className="border border-line p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display text-lg">{ing.name}</p>
                <span className={`text-xs border px-2 py-0.5 ${status.className}`}>{status.label}</span>
              </div>
              <p className="text-sm text-espresso-light mb-3">
                {ing.current_quantity} {ing.unit} on hand · minimum {ing.minimum_quantity} {ing.unit}
                {ing.supplier && ` · ${ing.supplier}`}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={`Add ${ing.unit}`}
                  value={restockAmounts[ing.id] ?? ''}
                  onChange={(e) => setRestockAmounts((prev) => ({ ...prev, [ing.id]: e.target.value }))}
                  className="flex-1 border border-line px-3 py-1.5 text-sm"
                />
                <button
                  onClick={() => handleRestock(ing.id)}
                  disabled={busyId === ing.id}
                  className="text-sm bg-espresso text-cream px-4 hover:bg-espresso-light disabled:opacity-50"
                >
                  {busyId === ing.id ? '…' : 'Restock'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

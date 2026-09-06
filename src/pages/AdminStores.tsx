import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type Store = {
  id: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean
}

export default function AdminStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const { data } = await supabase.from('stores').select('*').order('name')
    setStores((data as Store[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await supabase.from('stores').insert({ name, address: address || null, phone: phone || null })
    setSubmitting(false)
    setName('')
    setAddress('')
    setPhone('')
    load()
  }

  async function toggleActive(store: Store) {
    await supabase.from('stores').update({ is_active: !store.is_active }).eq('id', store.id)
    load()
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Stores</h1>
        <Link to="/staff" className="text-sm text-espresso-light underline hover:text-espresso">
          Orders
        </Link>
      </div>

      <form onSubmit={handleCreate} className="border border-line p-5 mb-8 space-y-3">
        <p className="text-sm font-medium">Add a store</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" className="w-full border border-line px-3 py-2 text-sm" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full border border-line px-3 py-2 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border border-line px-3 py-2 text-sm" />
        <button type="submit" disabled={submitting} className="bg-espresso text-cream px-5 py-2 text-sm hover:bg-espresso-light disabled:opacity-50">
          {submitting ? 'Adding…' : 'Add store'}
        </button>
      </form>

      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.id} className="border border-line p-4 flex items-center justify-between">
              <div>
                <p className="font-display">{store.name}</p>
                <p className="text-xs text-espresso-light">{store.address}{store.phone && ` · ${store.phone}`}</p>
              </div>
              <button
                onClick={() => toggleActive(store)}
                className={`text-xs border px-3 py-1 ${store.is_active ? 'border-sage text-sage' : 'border-line text-espresso-light'}`}
              >
                {store.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

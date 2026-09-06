import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Product, ProductCategory } from '@/lib/types'
import CustomizeModal from '@/components/CustomizeModal'
import { useCart } from '@/contexts/CartContext'
import { resolveProductImage } from '@/lib/productImages'

function ProductImage({ src, alt }: { src: string | null; alt: string }) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [resolving, setResolving] = useState(Boolean(src))

  useEffect(() => {
    let cancelled = false
    setFailed(false)

    if (!src?.trim()) {
      setResolvedSrc(null)
      setResolving(false)
      return
    }

    setResolving(true)
    resolveProductImage(src).then((url) => {
      if (cancelled) return
      setResolvedSrc(url)
      setResolving(false)
    })

    return () => { cancelled = true }
  }, [src])

  if (!src || failed || (!resolving && !resolvedSrc)) {
    return (
      <div className="w-full aspect-[4/3] bg-cream-dark flex items-center justify-center text-xs text-espresso-light">
        Image unavailable
      </div>
    )
  }

  if (resolving || !resolvedSrc) {
    return <div className="skeleton w-full aspect-[4/3]" aria-label={`Loading ${alt}`} />
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      onError={() => setFailed(true)}
      className="w-full aspect-[4/3] object-cover bg-cream-dark"
    />
  )
}

export default function Menu() {
  const { itemCount, subtotal } = useCart()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customizing, setCustomizing] = useState<Product | null>(null)
  const [customizingLoading, setCustomizingLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const [categoriesResult, productsResult] = await Promise.all([
        supabase.from('product_categories').select('id, name, display_order').order('display_order'),
        supabase
          .from('products')
          .select('id, category_id, name, description, base_price, image_url, is_available, is_recommended, out_of_stock')
          .eq('is_available', true),
      ])

      const { data: cats, error: catError } = categoriesResult
      const { data: prods, error: prodError } = productsResult

      if (catError || prodError) {
        setError('Could not load the menu. Please try again.')
        setLoading(false)
        return
      }

      setCategories(cats ?? [])
      setProducts(((prods ?? []) as Omit<Product, 'customization_groups'>[]).map((product) => ({ ...product, customization_groups: [] })) as Product[])
      setActiveCategory(cats?.[0]?.id ?? null)
      setLoading(false)
    }
    load()
  }, [])

  const visibleProducts = products.filter((p) => p.category_id === activeCategory)

  async function openProduct(product: Product) {
    if (product.out_of_stock || customizingLoading) return

    setCustomizingLoading(true)
    setError(null)

    const { data, error: customizationError } = await supabase
      .from('customization_groups')
      .select('id, name, is_required, allow_multiple, customization_options(id, label, price_delta)')
      .eq('product_id', product.id)

    setCustomizingLoading(false)

    if (customizationError) {
      setError('Could not load customization options. Please try again.')
      return
    }

    setCustomizing({
      ...product,
      customization_groups: (data ?? []) as Product['customization_groups'],
    })
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 bg-cream/95 backdrop-blur border-b border-line z-10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-espresso-light">Coffee House</p>
            <h1 className="font-display text-2xl">Menu</h1>
          </div>
          <Link
            to="/cart"
            className="border border-espresso px-4 py-2 text-sm flex items-center gap-2 hover:bg-espresso hover:text-cream transition-colors"
          >
            Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 pb-3 flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 text-sm border transition-colors ${
                  activeCategory === c.id
                    ? 'border-caramel bg-caramel text-cream'
                    : 'border-line hover:border-caramel'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-burgundy">{error}</p>}

        {!loading && !error && visibleProducts.length === 0 && (
          <p className="text-sm text-espresso-light">Nothing in this category right now.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => void openProduct(product)}
              disabled={product.out_of_stock}
              className={`text-left border border-line overflow-hidden transition-colors ${
                product.out_of_stock
                  ? 'bg-cream-dark/40 opacity-60 cursor-not-allowed'
                  : 'bg-white/40 hover:border-caramel'
              }`}
            >
              <ProductImage src={product.image_url} alt={product.name} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{product.name}</p>
                  {product.is_recommended && !product.out_of_stock && (
                    <span className="text-xs text-caramel-dark">Popular</span>
                  )}
                  {product.out_of_stock && (
                    <span className="text-xs text-burgundy">Currently unavailable</span>
                  )}
                </div>
                <p className="text-sm whitespace-nowrap">from ₹{product.base_price}</p>
              </div>
                <p className="text-sm text-espresso-light mt-2">{product.description}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {subtotal > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-espresso text-cream">
          <Link to="/cart" className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</span>
            <span className="font-display text-lg">View cart · ₹{subtotal}</span>
          </Link>
        </div>
      )}

      {customizingLoading && (
        <div className="fixed inset-0 bg-espresso/20 flex items-center justify-center z-40" aria-live="polite">
          <div className="bg-cream border border-line px-5 py-4 shadow-sm">Loading options…</div>
        </div>
      )}

      {customizing && (
        <CustomizeModal product={customizing} onClose={() => setCustomizing(null)} />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { parseCraving, recommend, type CoffeePreferences } from '@/lib/coffeeEngine'
import { useCart } from '@/contexts/CartContext'

const fallback: Product[] = [
  { id:'espresso', name:'Classic Espresso', description:'Short, intense and silky.', base_price:120, image_url:'/images/products/classic-espresso.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'latte', name:'Caffè Latte', description:'Velvety and balanced.', base_price:160, image_url:'/images/products/caffe-latte.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'mocha', name:'Mocha', description:'Chocolate-forward comfort.', base_price:190, image_url:'/images/products/mocha.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'cold', name:'Iced Cold Coffee', description:'Chilled and creamy.', base_price:180, image_url:'/images/products/iced-cold-coffee.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'caramel', name:'Caramel Frappe', description:'Cold, sweet and indulgent.', base_price:220, image_url:'/images/products/caramel-frappe.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
]

export default function AiBarista() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>(fallback)
  const [query, setQuery] = useState('')
  const [prefs, setPrefs] = useState<CoffeePreferences>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof recommend>[number] | null>(null)
  const [added, setAdded] = useState(false)
  useEffect(() => { supabase.from('products').select('id,name,description,base_price,image_url,is_available,is_recommended,out_of_stock,category_id').eq('is_available', true).then(({ data }) => { if (data?.length) setProducts(data.map(p => ({ ...p, customization_groups: [] })) as Product[]) }) }, [])
  function ask(text = query) { setLoading(true); setAdded(false); const parsed = parseCraving(text); setPrefs(parsed); window.setTimeout(() => { setResult(recommend(products, parsed)[0] ?? null); setLoading(false) }, 450) }
  return <main className="barista-page"><div className="barista-noise"/><nav><Link to="/" className="barista-brand">COFFEE <i>HOUSE</i></Link><Link to="/menu">Menu ↗</Link></nav><section className="barista-wrap"><div className="barista-intro"><span>COFFEE HOUSE / AI BARISTA</span><h1>Tell me your<br/><i>craving.</i></h1><p>No rigid menu. Describe the moment and I’ll match it to what’s available.</p><div className="barista-input"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && query.trim() && ask()} placeholder="Something cold, creamy and not too sweet…"/><button onClick={() => query.trim() && ask()}>Brew match ↗</button></div><div className="barista-chips">{['I need energy','Something cold','Comfort me','Under ₹200','Not too sweet'].map(x => <button key={x} onClick={() => { setQuery(x); ask(x) }}>{x}</button>)}</div></div><div className={`barista-result ${loading ? 'loading' : ''}`}>{loading ? <><div className="barista-loader"/><p>Reading your craving…</p></> : result ? <><span className="match">{result.score}% MATCH</span><img src={result.product.image_url || '/images/products/caffe-latte.jpg'} alt={result.product.name}/><h2>{result.product.name}</h2><p>{result.product.description}</p><strong>₹{result.product.base_price}</strong><small>{prefs.mood ? `Chosen for a ${prefs.mood} moment.` : 'Matched to your words and the drink profile.'}</small><div><button className="barista-order" onClick={() => { addToCart(result.product, [], 1); setAdded(true) }}>{added ? 'Added to cart ✓' : 'Add to cart'}</button><Link to="/menu">Customize ↗</Link></div></> : <><div className="barista-cup">☕</div><h2>Your cup is waiting.</h2><p>Describe what you want and let the barista find the closest match.</p></>}</div></section></main>
}

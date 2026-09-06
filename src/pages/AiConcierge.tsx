import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/lib/types'

const fallback: Product[] = [
  { id:'espresso', name:'Classic Espresso', description:'Short, intense and silky.', base_price:120, image_url:'/images/products/classic-espresso.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'latte', name:'Caffè Latte', description:'Velvety and balanced.', base_price:160, image_url:'/images/products/caffe-latte.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'mocha', name:'Mocha', description:'Chocolate-forward comfort.', base_price:190, image_url:'/images/products/mocha.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
  { id:'cold', name:'Iced Cold Coffee', description:'Chilled and creamy.', base_price:180, image_url:'/images/products/iced-cold-coffee.jpg', is_available:true, out_of_stock:false, is_recommended:true, category_id:'coffee', customization_groups:[] },
]

type Message = { role: 'user' | 'assistant'; content: string }

export default function AiConcierge() {
  const { addToCart } = useCart()
  const [products, setProducts] = useState<Product[]>(fallback)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role:'assistant', content:'Tell me the moment: bold and fast, cold and creamy, low-sugar, under ₹200, or anything else you are craving.' }])
  const [lastPick, setLastPick] = useState<Product | null>(null)
  useEffect(() => { supabase.from('products').select('id,name,description,base_price,image_url,is_available,out_of_stock,is_recommended,category_id').eq('is_available', true).then(({data}) => data?.length && setProducts(data.map(p => ({...p, customization_groups: []})) as Product[])) }, [])
  const catalog = useMemo(() => products.map(p => ({ id:p.id, name:p.name, price:p.base_price, description:p.description })), [products])

  async function ask(text = input) {
    if (!text.trim() || loading) return
    const next = [...messages, { role:'user' as const, content:text.trim() }]
    setMessages(next); setInput(''); setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json', ...(session?.access_token ? {Authorization:`Bearer ${session.access_token}`} : {})}, body:JSON.stringify({ mode:'concierge', messages:next, context:{ catalog } }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error)
      setMessages(m => [...m, { role:'assistant', content:d.reply }])
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          let { data: conversation } = await supabase.from('ai_conversations').select('id').eq('user_id', user.id).eq('mode','concierge').order('updated_at',{ascending:false}).limit(1).maybeSingle()
          if (!conversation) { const created = await supabase.from('ai_conversations').insert({user_id:user.id,mode:'concierge',title:'Coffee Concierge'}).select('id').single(); conversation = created.data }
          if (conversation?.id) await supabase.from('ai_messages').insert([{conversation_id:conversation.id,user_id:user.id,role:'user',content:text.trim()},{conversation_id:conversation.id,user_id:user.id,role:'assistant',content:d.reply}])
        }
      } catch { /* history is best-effort */ }
      const pick = products.find(p => d.reply.toLowerCase().includes(p.name.toLowerCase()))
      if (pick) setLastPick(pick)
    } catch (e) { setMessages(m => [...m, { role:'assistant', content:`AI is temporarily unavailable. ${e instanceof Error ? e.message : 'Please try again.'}` }]) }
    finally { setLoading(false) }
  }

  return <main className="min-h-screen bg-[#0b0806] text-[#f6ead8] px-4 py-6 md:px-10">
    <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12"><Link to="/" className="font-black tracking-[.22em]">COFFEE <i>HOUSE</i></Link><Link to="/dashboard" className="opacity-70 hover:opacity-100">Dashboard ↗</Link></nav>
    <section className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_.9fr] gap-8">
      <div><span className="text-xs tracking-[.3em] opacity-50">AI COFFEE CONCIERGE</span><h1 className="text-5xl md:text-7xl font-black mt-4 leading-[.9]">Your taste.<br/><i>Your moment.</i></h1><p className="mt-6 max-w-xl text-lg opacity-65">A real AI layer connected to the live Coffee House catalog. Ask naturally. Get a reasoned recommendation, then order it.</p>
        <div className="mt-8 flex flex-wrap gap-2">{['Something cold and creamy','Strong but under ₹180','Not too sweet','Surprise me'].map(x=><button key={x} onClick={()=>ask(x)} className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">{x}</button>)}</div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.03] p-5 h-[430px] overflow-y-auto space-y-4">{messages.map((m,i)=><div key={i} className={m.role==='user'?'ml-auto max-w-[85%] text-right':'max-w-[90%]'}><span className="text-[10px] tracking-[.2em] opacity-40">{m.role==='user'?'YOU':'AI BARISTA'}</span><p className="mt-1 leading-relaxed whitespace-pre-wrap">{m.content}</p></div>)}{loading&&<p className="opacity-50">Thinking through the menu…</p>}</div>
        <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Describe your craving…" className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-5 py-4 outline-none focus:border-white/30"/><button onClick={()=>ask()} className="rounded-2xl bg-[#f1d2a5] text-black px-6 font-bold">Ask ↗</button></div>
      </div>
      <aside className="rounded-[2rem] border border-white/10 bg-white/[.03] p-6 self-start sticky top-6">{lastPick?<><span className="text-xs tracking-[.25em] opacity-50">RECOMMENDED CUP</span><img src={lastPick.image_url||'/images/products/caffe-latte.jpg'} className="w-full aspect-square object-cover rounded-3xl mt-4"/><h2 className="text-3xl font-black mt-5">{lastPick.name}</h2><p className="opacity-60 mt-2">{lastPick.description}</p><div className="flex justify-between items-center mt-6"><b>₹{lastPick.base_price}</b><button onClick={()=>addToCart(lastPick,[],1)} className="rounded-full bg-[#f1d2a5] text-black px-5 py-3 font-bold">Add to cart</button></div></>:<div className="min-h-[480px] flex flex-col justify-center"><div className="text-8xl mb-8">☕</div><h2 className="text-3xl font-black">No generic chatbot.</h2><p className="opacity-60 mt-3">The assistant is grounded in your live product catalog, so recommendations can lead directly to your cart.</p></div>}</aside>
    </section>
  </main>
}

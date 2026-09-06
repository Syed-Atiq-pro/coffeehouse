import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLocalTasteHistory, calculateDNA } from '@/lib/coffeeEngine'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function CoffeeDNA() {
  const { profile } = useAuth(); const [history, setHistory] = useState<string[]>([])
  useEffect(() => { setHistory(getLocalTasteHistory()); if (profile) supabase.from('orders').select('id,created_at,order_items(products(name))').eq('customer_id', profile.id).order('created_at', { ascending: false }).limit(20).then(({ data }) => { const names = (data || []).flatMap((o: any) => (o.order_items || []).map((i: any) => i.products?.name).filter(Boolean)); if (names.length) setHistory(names) }) }, [profile])
  const dna = calculateDNA(history)
  const stats = [['Strength',dna.strength],['Sweetness',dna.sweetness],['Milk',dna.milk],['Cold',dna.cold],['Chocolate',dna.chocolate],['Fruitiness',dna.fruity]]
  return <main className="dna-page"><nav><Link to="/" className="dna-logo">COFFEE <i>HOUSE</i></Link><div><Link to="/menu">Menu</Link><Link to="/dashboard">Dashboard</Link></div></nav><section className="dna-hero"><div><span>PERSONAL COFFEE PROFILE</span><h1>Your Coffee<br/><i>DNA.</i></h1><p>Your taste evolves with every cup. This profile learns from your choices and helps the House serve something closer to you.</p></div><div className="dna-badge"><div className="dna-ring"><span>☕</span></div><b>{dna.personality}</b><small>{history.length ? `${history.length} cups analyzed` : 'Your first cup sets the baseline'}</small></div></section><section className="dna-grid">{stats.map(([label,value]) => <div className="dna-stat" key={label as string}><div><span>{label}</span><b>{value}%</b></div><div className="dna-bar"><i style={{width:`${value}%`}}/></div></div>)}</section><section className="dna-story"><span>THE NEXT CUP</span><h2>Your taste has a pattern.<br/><i>Use it as a compass.</i></h2><p>As you order more, your Coffee DNA becomes more accurate. Your AI Barista uses it to surface drinks that fit your preferences without hiding the rest of the menu.</p><Link to="/barista">Ask the AI Barista ↗</Link></section></main>
}

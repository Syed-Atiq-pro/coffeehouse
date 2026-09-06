import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'

const drinks = [
  { name: 'Velvet Latte', coffee: 55, milk: 85, sweetness: 35, ice: 0 },
  { name: 'Midnight Mocha', coffee: 70, milk: 70, sweetness: 70, ice: 0 },
  { name: 'Iced Cloud', coffee: 48, milk: 88, sweetness: 55, ice: 85 },
]

export default function CoffeeLab() {
  const [drink, setDrink] = useState(0)
  const [milk, setMilk] = useState(75)
  const [sweetness, setSweetness] = useState(40)
  const [ice, setIce] = useState(10)
  const [shots, setShots] = useState(2)
  const current = drinks[drink]
  const cupStyle = useMemo(() => ({ '--coffee-level': `${Math.min(78, 44 + shots * 8)}%`, '--milk': `${milk}%`, '--sweet': `${sweetness}%`, '--ice': `${ice}%` }) as CSSProperties, [milk, sweetness, ice, shots])
  return <main className="lab-page">
    <nav className="lab-nav"><Link to="/" className="lab-logo">COFFEE <i>HOUSE</i></Link><div><Link to="/menu">Menu</Link><Link to="/dashboard">My House</Link></div></nav>
    <section className="lab-hero">
      <div className="lab-copy"><span className="lab-kicker">THE COFFEE LAB / 07</span><h1>Build the cup<br/><i>you imagined.</i></h1><p>Experiment with milk, sweetness, ice and espresso. Your recipe is yours.</p><div className="lab-presets">{drinks.map((d, i) => <button key={d.name} className={drink === i ? 'active' : ''} onClick={() => { setDrink(i); setMilk(d.milk); setSweetness(d.sweetness); setIce(d.ice) }}>{d.name}</button>)}</div></div>
      <div className="lab-stage"><div className="lab-orbit orbit-a"/><div className="lab-orbit orbit-b"/><div className="lab-steam"/><div className="lab-cup" style={cupStyle}><div className="lab-liquid"/><div className="lab-foam"/><div className="lab-handle"/></div><div className="lab-bean b1"/><div className="lab-bean b2"/><div className="lab-bean b3"/><div className="lab-recipe-name">{current.name}</div></div>
    </section>
    <section className="lab-controls"><div className="control"><label>Milk <b>{milk}%</b></label><input type="range" min="0" max="100" value={milk} onChange={e => setMilk(+e.target.value)}/></div><div className="control"><label>Sweetness <b>{sweetness}%</b></label><input type="range" min="0" max="100" value={sweetness} onChange={e => setSweetness(+e.target.value)}/></div><div className="control"><label>Ice <b>{ice}%</b></label><input type="range" min="0" max="100" value={ice} onChange={e => setIce(+e.target.value)}/></div><div className="shot-control"><label>Espresso</label><button onClick={() => setShots(Math.max(1, shots - 1))}>−</button><strong>{shots}</strong><button onClick={() => setShots(Math.min(4, shots + 1))}>+</button><small>shots</small></div></section>
    <section className="lab-bottom"><span>YOUR RECIPE</span><strong>{current.name} · {shots} shot{shots > 1 ? 's' : ''} · {milk}% milk · {sweetness}% sweet · {ice}% ice</strong><Link to="/menu">Find a matching drink ↗</Link></section>
  </main>
}

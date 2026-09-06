import type { Product } from '@/lib/types'

export type CoffeePreferences = {
  temperature?: 'hot' | 'cold'
  strength?: number
  sweetness?: number
  milk?: number
  chocolate?: number
  fruity?: number
  budget?: number
  mood?: string
}

export type CoffeeDNA = {
  strength: number
  sweetness: number
  milk: number
  cold: number
  chocolate: number
  fruity: number
  personality: string
}

const defaults: Record<string, CoffeePreferences> = {
  espresso: { temperature: 'hot', strength: 95, sweetness: 15, milk: 5, chocolate: 55, fruity: 35 },
  americano: { temperature: 'hot', strength: 78, sweetness: 12, milk: 8, chocolate: 45, fruity: 40 },
  latte: { temperature: 'hot', strength: 48, sweetness: 48, milk: 92, chocolate: 58, fruity: 18 },
  cappuccino: { temperature: 'hot', strength: 62, sweetness: 35, milk: 72, chocolate: 52, fruity: 22 },
  mocha: { temperature: 'hot', strength: 58, sweetness: 72, milk: 82, chocolate: 96, fruity: 8 },
  cold: { temperature: 'cold', strength: 52, sweetness: 62, milk: 78, chocolate: 62, fruity: 15 },
  caramel: { temperature: 'cold', strength: 45, sweetness: 88, milk: 82, chocolate: 42, fruity: 5 },
  chai: { temperature: 'hot', strength: 38, sweetness: 58, milk: 76, chocolate: 10, fruity: 12 },
  tea: { temperature: 'hot', strength: 25, sweetness: 28, milk: 15, chocolate: 0, fruity: 65 },
  brownie: { temperature: 'hot', strength: 0, sweetness: 92, milk: 0, chocolate: 100, fruity: 0 },
}

function profileFor(name: string): CoffeePreferences {
  const n = name.toLowerCase()
  if (n.includes('caramel')) return defaults.caramel
  if (n.includes('cold') || n.includes('iced')) return defaults.cold
  if (n.includes('mocha')) return defaults.mocha
  if (n.includes('cappuccino')) return defaults.cappuccino
  if (n.includes('latte')) return defaults.latte
  if (n.includes('espresso')) return defaults.espresso
  if (n.includes('americano')) return defaults.americano
  if (n.includes('chai')) return defaults.chai
  if (n.includes('tea')) return defaults.tea
  if (n.includes('brownie')) return defaults.brownie
  return defaults.latte
}

export function recommend(products: Product[], prefs: CoffeePreferences) {
  return products
    .filter((p) => p.is_available && !p.out_of_stock)
    .map((product) => {
      const p = profileFor(product.name)
      let score = 55
      if (prefs.temperature) score += p.temperature === prefs.temperature ? 22 : -10
      for (const [key, value] of [['strength', prefs.strength], ['sweetness', prefs.sweetness], ['milk', prefs.milk], ['chocolate', prefs.chocolate], ['fruity', prefs.fruity]] as const) {
        if (typeof value === 'number') score += Math.max(-12, 12 - Math.abs((p[key] ?? 50) - value) * 0.24)
      }
      if (prefs.budget && Number(product.base_price) > prefs.budget) score -= 25
      return { product, score: Math.max(0, Math.min(99, Math.round(score))), profile: p }
    })
    .sort((a, b) => b.score - a.score)
}

export function parseCraving(text: string): CoffeePreferences {
  const t = text.toLowerCase()
  const prefs: CoffeePreferences = {}
  if (/cold|iced|chill|refresh/.test(t)) prefs.temperature = 'cold'
  if (/hot|warm|cozy|rain/.test(t)) prefs.temperature = 'hot'
  if (/strong|energy|boost|awake|intense/.test(t)) prefs.strength = 85
  if (/light|mild|gentle|soft/.test(t)) prefs.strength = 30
  if (/sweet|dessert|treat|caramel/.test(t)) prefs.sweetness = 82
  if (/not too sweet|less sweet|low sugar|unsweet/.test(t)) prefs.sweetness = 25
  if (/creamy|milk|velvet|smooth/.test(t)) prefs.milk = 85
  if (/chocolate|mocha|cocoa/.test(t)) prefs.chocolate = 90
  if (/fruity|bright|citrus/.test(t)) prefs.fruity = 80
  const money = t.match(/(?:₹|rs\.?|under|below)\s*(\d{2,4})/)
  if (money) prefs.budget = Number(money[1])
  if (/focus|work|study/.test(t)) { prefs.strength = 78; prefs.sweetness = 30 }
  prefs.mood = /tired|stress|comfort/.test(t) ? 'comfort' : /energy|focus/.test(t) ? 'boost' : undefined
  return prefs
}

export function calculateDNA(history: string[]): CoffeeDNA {
  if (!history.length) return { strength: 60, sweetness: 45, milk: 60, cold: 45, chocolate: 50, fruity: 25, personality: 'The Curious Regular' }
  const totals = { strength: 0, sweetness: 0, milk: 0, cold: 0, chocolate: 0, fruity: 0 }
  let weightTotal = 0
  history.forEach((name, index) => {
    const weight = Math.max(1, history.length - index)
    const p = profileFor(name)
    totals.strength += (p.strength ?? 50) * weight
    totals.sweetness += (p.sweetness ?? 50) * weight
    totals.milk += (p.milk ?? 50) * weight
    totals.cold += (p.temperature === 'cold' ? 90 : 15) * weight
    totals.chocolate += (p.chocolate ?? 30) * weight
    totals.fruity += (p.fruity ?? 15) * weight
    weightTotal += weight
  })
  const dna = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v / weightTotal)])) as Omit<CoffeeDNA, 'personality'>
  const personality = dna.milk > 72 && dna.sweetness > 55 ? 'The Smooth Explorer' : dna.strength > 72 ? 'The Bold Roaster' : dna.cold > 62 ? 'The Cool Chaser' : dna.fruity > 45 ? 'The Origin Seeker' : 'The Curious Regular'
  return { ...dna, personality }
}

export function saveLocalPreference(name: string) {
  try {
    const existing = JSON.parse(localStorage.getItem('coffee-house-taste-history') || '[]') as string[]
    existing.unshift(name)
    localStorage.setItem('coffee-house-taste-history', JSON.stringify(existing.slice(0, 30)))
  } catch { /* storage can be unavailable */ }
}

export function getLocalTasteHistory() {
  try { return JSON.parse(localStorage.getItem('coffee-house-taste-history') || '[]') as string[] } catch { return [] }
}

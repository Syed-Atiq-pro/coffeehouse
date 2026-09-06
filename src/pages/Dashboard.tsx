import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import hero from '@/assets/hero.png'

const tierLabel: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  if (!profile) {
    return (
      <div className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
        <div className="skeleton h-56 w-full mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-24 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <header className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm text-espresso-light">Good to see you</p>
          <h1 className="font-display text-4xl sm:text-5xl">{firstName} ☕</h1>
        </div>
        <button onClick={handleSignOut} className="text-sm text-espresso-light underline hover:text-espresso">Sign out</button>
      </header>

      <section className="grid lg:grid-cols-[1.2fr_.8fr] border border-line bg-white/40 overflow-hidden mb-8">
        <div className="p-7 sm:p-9 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] text-caramel-dark">Your Coffee House</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">A better cup starts here.</h2>
          <p className="text-sm text-espresso-light mt-3 max-w-xl">Order your favourite drink, collect points, and keep your digital member card ready for your next visit.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/menu" className="bg-espresso text-cream px-5 py-2.5 hover:bg-espresso-light">Browse menu</Link>
            <Link to="/card" className="border border-espresso px-5 py-2.5 hover:bg-espresso hover:text-cream">Open my card</Link>
          </div>
        </div>
        <img src={hero} alt="Coffee House" className="w-full h-full min-h-56 object-cover" />
      </section>

      <Link to="/notifications" className="inline-block text-sm text-caramel-dark underline mb-6">Notifications</Link>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="border border-line p-5"><p className="text-sm text-espresso-light">Loyalty tier</p><p className="font-display text-2xl mt-1">{tierLabel[profile.loyalty_tier] ?? profile.loyalty_tier}</p></div>
        <div className="border border-line p-5"><p className="text-sm text-espresso-light">Points</p><p className="font-display text-2xl mt-1">{profile.loyalty_points}</p></div>
        <div className="border border-line p-5"><p className="text-sm text-espresso-light">Total orders</p><p className="font-display text-2xl mt-1">{profile.total_orders}</p></div>
        <div className="border border-line p-5"><p className="text-sm text-espresso-light">Total spending</p><p className="font-display text-2xl mt-1">₹{profile.total_spending}</p></div>
      </section>

      <div className="border border-line p-6 bg-white/40 mb-4 flex items-center justify-between gap-4">
        <div><p className="text-sm text-espresso-light mb-1">Member ID</p><p className="font-display text-xl">{profile.member_id ?? '—'}</p></div>
        <Link to="/card" className="text-sm text-caramel-dark underline">View card</Link>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Link to="/schedule" className="dashboard-feature-card"><span>Schedule</span><strong>Plan your next cup →</strong></Link><Link to="/stores" className="dashboard-feature-card"><span>Find a store</span><strong>Locations & favourites →</strong></Link><Link to="/reviews" className="dashboard-feature-card"><span>Reviews</span><strong>Rate your coffee →</strong></Link><Link to="/achievements" className="dashboard-feature-card"><span>Achievements</span><strong>Unlock your milestones →</strong></Link><Link to="/barista" className="border border-caramel text-caramel-dark text-center py-3 hover:bg-caramel hover:text-cream transition-colors">☕ AI Barista</Link><Link to="/ai" className="border border-white/10 text-center py-3 hover:bg-white/10 transition-colors">✦ AI Concierge</Link>
        <Link to="/dna" className="border border-line text-center py-3 hover:border-caramel transition-colors">🧬 My Coffee DNA</Link>
        <Link to="/lab" className="border border-line text-center py-3 hover:border-caramel transition-colors">🧪 Coffee Lab</Link>
        <Link to="/community" className="border border-line text-center py-3 hover:border-caramel transition-colors">📸 Coffee Moments</Link>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <Link to="/menu" className="border border-espresso text-center py-3 hover:bg-espresso hover:text-cream transition-colors">Browse the menu</Link>
        <Link to="/card" className="border border-line text-center py-3 hover:border-caramel transition-colors">My customer card</Link>
        <Link to="/verify-identity" className="border border-line text-center py-3 hover:border-caramel transition-colors">{profile.identity_verified ? 'Identity verified ✓' : 'Verify my identity'}</Link>
        <Link to="/orders" className="border border-line text-center py-3 hover:border-caramel transition-colors">View order history</Link>
        <Link to="/gift-cards" className="border border-line text-center py-3 hover:border-caramel transition-colors">Gift a coffee</Link>
        <Link to="/referrals" className="border border-line text-center py-3 hover:border-caramel transition-colors">Refer a friend</Link>
      </section>

      {['staff', 'manager', 'admin'].includes(profile.role) && (
        <Link to="/staff" className="block mt-3 border border-caramel text-caramel-dark text-center py-3 hover:bg-caramel hover:text-cream transition-colors">Open staff dashboard</Link>
      )}
    </main>
  )
}

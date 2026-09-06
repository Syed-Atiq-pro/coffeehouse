import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Notification } from '@/lib/types'

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      setItems((data as Notification[]) ?? [])
      setLoading(false)

      // Mark unread ones as read once viewed
      const unreadIds = (data ?? []).filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    load()
    if (!user) return
    const channel = supabase.channel(`notifications-${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => { setItems(prev => [payload.new as Notification, ...prev]) }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user])

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Notifications</h1>
        <Link to="/dashboard" className="text-sm text-espresso-light underline hover:text-espresso">
          Dashboard
        </Link>
      </div>

      {loading && <div className="skeleton h-20 w-full" />}

      {!loading && items.length === 0 && (
        <p className="text-sm text-espresso-light">Nothing yet.</p>
      )}

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="border border-line p-4">
            <p className="font-display text-lg">{n.title}</p>
            <p className="text-sm text-espresso-light mt-1">{n.body}</p>
            <p className="text-xs text-espresso-light mt-2">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

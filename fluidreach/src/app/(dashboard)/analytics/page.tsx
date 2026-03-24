'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'

export default function AnalyticsPage() {
  const { workspaceId } = useAuth()
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalBroadcasts: 0,
    vip: 0,
    architect: 0,
    corporate: 0,
    otherNetwork: 0,
  })

  useEffect(() => {
    if (workspaceId) loadStats()
  }, [workspaceId])

  async function loadStats() {
    try {
      const contactsSnap = await getDocs(collection(db, 'workspaces', workspaceId!, 'contacts'))
      const campaignsSnap = await getDocs(collection(db, 'workspaces', workspaceId!, 'campaigns'))

      let vip = 0, architect = 0, corporate = 0, otherNetwork = 0
      contactsSnap.docs.forEach(d => {
        const tags = d.data().tags || []
        if (tags.includes('VIP')) vip++
        if (tags.includes('Architect')) architect++
        if (tags.includes('Corporate')) corporate++
        if (tags.includes('Other Network')) otherNetwork++
      })

      setStats({
        totalContacts:   contactsSnap.size,
        totalBroadcasts: campaignsSnap.size,
        vip,
        architect,
        corporate,
        otherNetwork,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const statCards = [
    { label: 'Total Contacts',   value: stats.totalContacts,   icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Broadcasts', value: stats.totalBroadcasts, icon: '📣', color: 'bg-green-50 text-green-600' },
    { label: 'VIP Contacts',     value: stats.vip,             icon: '⭐', color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Architects',       value: stats.architect,       icon: '🏗️', color: 'bg-purple-50 text-purple-600' },
    { label: 'Corporate',        value: stats.corporate,       icon: '🏢', color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Other Network',    value: stats.otherNetwork,    icon: '🌐', color: 'bg-teal-50 text-teal-600' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your contacts and broadcasts</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center text-lg mb-4`}>
              {card.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Network breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'VIP',           value: stats.vip,          color: 'bg-yellow-400' },
              { label: 'Architect',     value: stats.architect,    color: 'bg-blue-400' },
              { label: 'Corporate',     value: stats.corporate,    color: 'bg-purple-400' },
              { label: 'Other Network', value: stats.otherNetwork, color: 'bg-teal-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: stats.totalContacts > 0 ? `${(item.value / stats.totalContacts) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total contacts</span>
              <span className="font-semibold text-gray-900">{stats.totalContacts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Broadcasts sent</span>
              <span className="font-semibold text-gray-900">{stats.totalBroadcasts}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Avg contacts per broadcast</span>
              <span className="font-semibold text-gray-900">
                {stats.totalBroadcasts > 0 ? Math.round(stats.totalContacts / stats.totalBroadcasts) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
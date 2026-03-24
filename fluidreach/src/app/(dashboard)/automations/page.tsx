'use client'
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'

interface Automation {
  id: string
  name: string
  trigger: string
  action: string
  message: string
  enabled: boolean
}

const TRIGGERS = [
  'When contact is created',
  'When tag is added: VIP',
  'When tag is added: Architect',
  'When tag is added: Corporate',
  'When tag is added: Other Network',
]

const ACTIONS = [
  'Send WhatsApp message',
  'Add tag: VIP',
  'Add tag: Architect',
  'Add tag: Corporate',
]

export default function AutomationsPage() {
  const { workspaceId } = useAuth()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', trigger: TRIGGERS[0], action: ACTIONS[0], message: '' })

  useEffect(() => {
    if (workspaceId) loadAutomations()
  }, [workspaceId])

  async function loadAutomations() {
    try {
      const snap = await getDocs(collection(db, 'workspaces', workspaceId!, 'automations'))
      setAutomations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Automation)))
    } catch (e) { console.error(e) }
  }

  async function saveAutomation(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'workspaces', workspaceId, 'automations'), {
        ...form, enabled: true, createdAt: serverTimestamp()
      })
      setForm({ name: '', trigger: TRIGGERS[0], action: ACTIONS[0], message: '' })
      setShowForm(false)
      loadAutomations()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  async function toggleAutomation(id: string, enabled: boolean) {
    if (!workspaceId) return
    await updateDoc(doc(db, 'workspaces', workspaceId, 'automations', id), { enabled: !enabled })
    loadAutomations()
  }

  async function deleteAutomation(id: string) {
    if (!workspaceId) return
    if (!confirm('Delete this automation?')) return
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'automations', id))
    loadAutomations()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 text-sm mt-1">Trigger messages automatically based on contact actions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Automation
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Automation</h2>
          <form onSubmit={saveAutomation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Automation Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Welcome new VIP contact" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger *</label>
                <select value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <select value={form.action} onChange={e => setForm({...form, action: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            {form.action === 'Send WhatsApp message' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea required rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Hi {name}, welcome to our network!" />
                <p className="text-xs text-gray-400 mt-1">Use {`{name}`} to personalize</p>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {saving ? 'Saving...' : 'Save Automation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {automations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No automations yet</h3>
            <p className="text-gray-500 text-sm mb-4">Create automations to send messages automatically when contacts are added or tagged.</p>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + New Automation
            </button>
          </div>
        ) : (
          automations.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${a.enabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.trigger} → {a.action}</p>
                {a.message && <p className="text-xs text-gray-400 mt-0.5 truncate">"{a.message}"</p>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleAutomation(a.id, a.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${a.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.enabled ? 'Active' : 'Paused'}
                </button>
                <button onClick={() => deleteAutomation(a.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
const fs = require('fs')

const content = `'use client'
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  tags: string[]
}

interface Broadcast {
  id: string
  name: string
  message: string
  audience: string
  recipientCount: number
  sentCount: number
  failedCount: number
  mediaType?: string
  status: string
  createdAt: any
}

const NETWORK_OPTIONS = ['All Contacts', 'VIP', 'Architect', 'Corporate', 'Other Network']

export default function CampaignsPage() {
  const { workspaceId, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, status: '' })
  const [contactSearch, setContactSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [form, setForm] = useState({ name: '', message: '', network: 'All Contacts' })

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return }
    if (workspaceId) { loadBroadcasts(); loadContacts() }
  }, [workspaceId, user, authLoading])

  useEffect(() => { filterContacts() }, [form.network, allContacts, contactSearch])

  async function loadBroadcasts() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'workspaces', workspaceId!, 'campaigns'))
      setBroadcasts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Broadcast)))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function loadContacts() {
    try {
      const snap = await getDocs(collection(db, 'workspaces', workspaceId!, 'contacts'))
      setAllContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)))
    } catch (e) { console.error(e) }
  }

  function filterContacts() {
    let result = allContacts
    if (form.network !== 'All Contacts') result = result.filter(c => c.tags?.includes(form.network))
    if (contactSearch) result = result.filter(c =>
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch))
    setFilteredContacts(result)
    setSelectedIds(new Set())
  }

  function toggleContact(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  function toggleAll() {
    if (selectedIds.size === filteredContacts.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredContacts.map(c => c.id)))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) { setPreviewUrl(URL.createObjectURL(file)); setMediaType('image') }
    else if (file.type.startsWith('video/')) { setPreviewUrl(''); setMediaType('video') }
    else if (file.type === 'application/pdf') { setPreviewUrl(''); setMediaType('pdf') }
  }

  function removeFile() { setSelectedFile(null); setPreviewUrl(''); setMediaType('') }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    if (selectedIds.size === 0) { alert('Please select at least one contact.'); return }
    setSaving(true)

    const selectedContacts = allContacts.filter(c => selectedIds.has(c.id))
    let sentCount = 0
    let failedCount = 0

    setSendProgress({ current: 0, total: selectedContacts.length, status: 'Sending...' })

    for (let i = 0; i < selectedContacts.length; i++) {
      const contact = selectedContacts[i]
      setSendProgress({ current: i + 1, total: selectedContacts.length, status: "Sending to " + contact.name + "..." })
      try {
        const personalizedMessage = form.message.replace(/{name}/g, contact.name)
        const res = await fetch('/api/send-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact.phone, message: personalizedMessage }),
        })
        if (res.ok) sentCount++
        else failedCount++
      } catch (e) { failedCount++ }
      await new Promise(r => setTimeout(r, 500))
    }

    try {
      await addDoc(collection(db, 'workspaces', workspaceId, 'campaigns'), {
        name:           form.name,
        message:        form.message,
        audience:       form.network,
        recipientIds:   Array.from(selectedIds),
        recipientCount: selectedIds.size,
        sentCount,
        failedCount,
        recipients:     selectedContacts.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
        mediaType:      mediaType || null,
        mediaName:      selectedFile?.name || null,
        status:         failedCount === 0 ? 'sent' : sentCount === 0 ? 'failed' : 'partial',
        createdAt:      serverTimestamp(),
      })
    } catch (e) { console.error(e) }

    setSendProgress({ current: 0, total: 0, status: '' })
    setForm({ name: '', message: '', network: 'All Contacts' })
    setSelectedIds(new Set())
    removeFile()
    setShowForm(false)
    setSaving(false)
    loadBroadcasts()
    alert("Broadcast complete! Sent: " + sentCount + " | Failed: " + failedCount)
  }

  const tagColors: Record<string, string> = {
    'VIP': 'bg-yellow-50 text-yellow-700',
    'Architect': 'bg-blue-50 text-blue-700',
    'Corporate': 'bg-purple-50 text-purple-700',
    'Other Network': 'bg-green-50 text-green-700',
  }

  const statusColors: Record<string, string> = {
    'sent': 'bg-green-50 text-green-700',
    'failed': 'bg-red-50 text-red-700',
    'partial': 'bg-yellow-50 text-yellow-700',
  }

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
          <p className="text-gray-500 text-sm mt-1">Send WhatsApp messages to your contacts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Broadcast
        </button>
      </div>

      {saving && sendProgress.total > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">{sendProgress.status}</span>
            <span className="text-sm text-blue-600">{sendProgress.current}/{sendProgress.total}</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: sendProgress.total > 0 ? (sendProgress.current / sendProgress.total * 100) + '%' : '0%' }} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Broadcast</h2>
          <form onSubmit={handleSend} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Diwali Offer 2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Network</label>
                <select value={form.network} onChange={e => setForm({...form, network: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {NETWORK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Type your WhatsApp message here... Use {name} to personalize" />
              <p className="text-xs text-gray-400 mt-1">{form.message.length} characters · Use {"{name}"} to insert contact name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attach Media (optional)</label>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                  <input type="file" accept="image/*,video/*,.pdf" onChange={handleFileSelect} className="hidden" id="media-upload" />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📎</div>
                    <p className="text-sm text-gray-600 font-medium">Click to upload image, video or PDF</p>
                    <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, MP4, PDF</p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {mediaType === 'video' ? '🎥' : mediaType === 'pdf' ? '📄' : '📎'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mediaType === 'image' ? '🖼️ Image' : mediaType === 'video' ? '🎥 Video' : '📄 PDF'}
                      {' · '}{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Recipients <span className="ml-2 text-blue-600 font-semibold">{selectedIds.size} selected</span>
                </label>
                <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  placeholder="Search contacts..." />
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                      onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-xs font-medium text-gray-600">
                      {selectedIds.size === filteredContacts.length && filteredContacts.length > 0 ? 'Deselect all' : 'Select all'} ({filteredContacts.length} contacts)
                    </span>
                  </label>
                  <span className="text-xs text-gray-400">{form.network}</span>
                </div>
                {filteredContacts.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No contacts found for this network.</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {filteredContacts.map(contact => (
                      <label key={contact.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selectedIds.has(contact.id)}
                          onChange={() => toggleContact(contact.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.phone || 'No phone'}</p>
                        </div>
                        <div className="flex gap-1">
                          {contact.tags?.map(tag => (
                            <span key={tag} className={"text-xs px-2 py-0.5 rounded-full font-medium " + (tagColors[tag] || 'bg-gray-100 text-gray-600')}>{tag}</span>
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || selectedIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
                {saving ? '⏳ Sending...' : "📣 Send to " + selectedIds.size + " contacts"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setSelectedIds(new Set()); removeFile() }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading broadcasts...</div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📣</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No broadcasts yet</h3>
            <p className="text-gray-500 text-sm mb-4">Create your first broadcast to send WhatsApp messages.</p>
            <button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ New Broadcast</button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Media</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Failed</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {broadcasts.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs px-2 py-1 rounded-full font-medium " + (tagColors[b.audience] || 'bg-gray-100 text-gray-600')}>{b.audience}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{b.message}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.mediaType === 'image' ? '🖼️' : b.mediaType === 'video' ? '🎥' : b.mediaType === 'pdf' ? '📄' : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">{b.sentCount || 0}</td>
                  <td className="px-4 py-3 text-sm text-red-500 font-medium">{b.failedCount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={"text-xs px-2 py-1 rounded-full font-medium " + (statusColors[b.status] || 'bg-gray-100 text-gray-600')}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{b.createdAt?.toDate?.()?.toLocaleDateString() || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}`

fs.writeFileSync('src/app/(dashboard)/campaigns/page.tsx', content)
console.log('Done!')
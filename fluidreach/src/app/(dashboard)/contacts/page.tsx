'use client'
import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
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

const CONTACT_TAGS = ['VIP', 'Architect', 'Corporate', 'Other Network']

export default function ContactsPage() {
  const { workspaceId, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', tag: 'VIP' })

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return }
    if (workspaceId) loadContacts()
  }, [workspaceId, user, authLoading])

  async function loadContacts() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'workspaces', workspaceId!, 'contacts'))
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openAddForm() {
    setEditingContact(null)
    setForm({ name: '', phone: '', email: '', tag: 'VIP' })
    setShowForm(true)
  }

  function openEditForm(contact: Contact) {
    setEditingContact(contact)
    setForm({
      name:  contact.name,
      phone: contact.phone?.replace('+91', '') || '',
      email: contact.email,
      tag:   contact.tags?.[0] || 'VIP',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    setSaving(true)
    try {
      const data = {
        name:  form.name,
        phone: '+91' + form.phone,
        email: form.email,
        tags:  [form.tag],
      }
      if (editingContact) {
        await updateDoc(doc(db, 'workspaces', workspaceId, 'contacts', editingContact.id), data)
      } else {
        await addDoc(collection(db, 'workspaces', workspaceId, 'contacts'), {
          ...data, createdAt: serverTimestamp()
        })
      }
      setForm({ name: '', phone: '', email: '', tag: 'VIP' })
      setShowForm(false)
      setEditingContact(null)
      loadContacts()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function deleteContact(id: string) {
    if (!workspaceId) return
    if (!confirm('Delete this contact?')) return
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'contacts', id))
    loadContacts()
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !workspaceId) return
    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        if (!row.name) continue
        await addDoc(collection(db, 'workspaces', workspaceId, 'contacts'), {
          name:      row.name || '',
          phone:     row.phone || '',
          email:     row.email || '',
          tags:      row.tag ? [row.tag] : row.tags ? [row.tags] : ['Other Network'],
          createdAt: serverTimestamp(),
        })
        imported++
      }
      alert(`Successfully imported ${imported} contacts!`)
      loadContacts()
    } catch (e) {
      console.error(e)
      alert('Error importing CSV. Please check the format.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function downloadSampleCSV() {
    const csv = `name,phone,email,tag\nJohn Smith,9876543210,john@example.com,VIP\nJane Doe,9876543211,jane@example.com,Architect\nBob Wilson,9876543212,bob@example.com,Corporate`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_contacts.csv'
    a.click()
  }

  const filtered = contacts.filter(c => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchTag = filterTag === 'All' || c.tags?.includes(filterTag)
    return matchSearch && matchTag
  })

  const tagColors: Record<string, string> = {
    'VIP':           'bg-yellow-50 text-yellow-700',
    'Architect':     'bg-blue-50 text-blue-700',
    'Corporate':     'bg-purple-50 text-purple-700',
    'Other Network': 'bg-green-50 text-green-700',
  }

  if (authLoading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{contacts.length} total contacts</p>
        </div>
        <div className="flex gap-2">
          {/* Import CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
            id="csv-import"
          />
          <button
            onClick={() => downloadSampleCSV()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
          >
            📥 Sample CSV
          </button>
          <label
            htmlFor="csv-import"
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
          >
            {importing ? '⏳ Importing...' : '📤 Import CSV'}
          </label>
          <button
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingContact ? '✏️ Edit Contact' : 'New Contact'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm font-medium">
                  +91
                </span>
                <input
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="98765 43210"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Network Type *</label>
              <select
                value={form.tag}
                onChange={e => setForm({...form, tag: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {CONTACT_TAGS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {saving ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Contact'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingContact(null) }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search contacts..."
        />
        <select
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="All">All Networks</option>
          {CONTACT_TAGS.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* CSV Format hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-xs text-blue-700">
        💡 CSV format: <span className="font-mono">name, phone, email, tag</span> — Click "Sample CSV" to download a template
      </div>

      {/* Contacts Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading contacts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No contacts found. Click + Add Contact to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Network</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.email || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.tags?.map(tag => (
                        <span key={tag} className={`text-xs px-2 py-1 rounded-full font-medium ${tagColors[tag] || 'bg-gray-100 text-gray-600'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditForm(c)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
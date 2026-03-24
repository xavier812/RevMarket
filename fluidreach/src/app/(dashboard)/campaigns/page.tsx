'use client'
import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Broadcast {
  id: string
  name: string
  message: string
  mediaUrl?: string
  mediaType?: string
  audience: string
  status: string
  sentCount: number
  createdAt: any
}

const AUDIENCE_OPTIONS = ['All Contacts', 'VIP', 'Architect', 'Corporate', 'Other Network']

export default function CampaignsPage() {
  const { workspaceId, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    message: '',
    audience: 'All Contacts',
    mediaUrl: '',
    mediaType: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return }
    if (workspaceId) loadBroadcasts()
  }, [workspaceId, user, authLoading])

  async function loadBroadcasts() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'workspaces', workspaceId!, 'campaigns'))
      setBroadcasts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Broadcast)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
      setForm({ ...form, mediaType: 'image' })
    } else if (file.type.startsWith('video/')) {
      setPreviewUrl('')
      setForm({ ...form, mediaType: 'video' })
    } else if (file.type === 'application/pdf') {
      setPreviewUrl('')
      setForm({ ...form, mediaType: 'pdf' })
    }
  }

  async function uploadFile(): Promise<string> {
    if (!selectedFile || !workspaceId) return ''
    setUploading(true)
    try {
      const fileRef = ref(storage, `workspaces/${workspaceId}/broadcasts/${Date.now()}_${selectedFile.name}`)
      await uploadBytes(fileRef, selectedFile)
      const url = await getDownloadURL(fileRef)
      return url
    } finally {
      setUploading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    setSaving(true)
    try {
      let mediaUrl = ''
      if (selectedFile) {
        mediaUrl = await uploadFile()
      }
      await addDoc(collection(db, 'workspaces', workspaceId, 'campaigns'), {
        name:      form.name,
        message:   form.message,
        audience:  form.audience,
        mediaUrl:  mediaUrl,
        mediaType: form.mediaType,
        status:    'sent',
        sentCount: 0,
        createdAt: serverTimestamp(),
      })
      setForm({ name: '', message: '', audience: 'All Contacts', mediaUrl: '', mediaType: '' })
      setSelectedFile(null)
      setPreviewUrl('')
      setShowForm(false)
      loadBroadcasts()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<string, string> = {
    sent:    'bg-green-50 text-green-700',
    draft:   'bg-gray-100 text-gray-600',
    sending: 'bg-blue-50 text-blue-700',
    failed:  'bg-red-50 text-red-700',
  }

  const audienceColors: Record<string, string> = {
    'All Contacts':  'bg-gray-100 text-gray-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
          <p className="text-gray-500 text-sm mt-1">Send WhatsApp messages to your contacts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + New Broadcast
        </button>
      </div>

      {/* Broadcast Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Broadcast</h2>
          <form onSubmit={handleSend} className="space-y-4">

            {/* Broadcast Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Diwali Offer 2024"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send To *</label>
              <select
                value={form.audience}
                onChange={e => setForm({...form, audience: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Type your WhatsApp message here..."
              />
              <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Media (optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="space-y-2">
                      {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                      )}
                      <p className="text-sm font-medium text-blue-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {form.mediaType === 'image' ? '🖼️ Image' :
                         form.mediaType === 'video' ? '🎥 Video' :
                         form.mediaType === 'pdf'   ? '📄 PDF' : ''}
                         {' '}· {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-blue-500">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📎</div>
                      <p className="text-sm text-gray-600">Click to upload image, video or PDF</p>
                      <p className="text-xs text-gray-400">Supports JPG, PNG, MP4, PDF</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                {saving || uploading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {uploading ? 'Uploading...' : 'Sending...'}
                  </>
                ) : (
                  <>📣 Send Broadcast</>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setSelectedFile(null); setPreviewUrl('') }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcasts List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading broadcasts...</div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📣</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No broadcasts yet</h3>
            <p className="text-gray-500 text-sm mb-4">Create your first broadcast to send WhatsApp messages to your contacts.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + New Broadcast
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Media</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {broadcasts.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${audienceColors[b.audience] || 'bg-gray-100 text-gray-600'}`}>
                      {b.audience}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{b.message}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.mediaType === 'image' ? '🖼️ Image' :
                     b.mediaType === 'video' ? '🎥 Video' :
                     b.mediaType === 'pdf'   ? '📄 PDF'   : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {b.createdAt?.toDate?.()?.toLocaleDateString() || '—'}
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

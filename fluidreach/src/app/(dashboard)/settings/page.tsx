'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { updateProfile, updatePassword } from 'firebase/auth'

export default function SettingsPage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [newPassword, setNewPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [passMsg, setPassMsg] = useState('')

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    setSavingName(true)
    try {
      await updateProfile(auth.currentUser!, { displayName: name })
      setNameMsg('Name updated successfully!')
    } catch (e) {
      setNameMsg('Failed to update name.')
    } finally {
      setSavingName(false)
      setTimeout(() => setNameMsg(''), 3000)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { setPassMsg('Password must be at least 6 characters.'); return }
    setSavingPassword(true)
    try {
      await updatePassword(auth.currentUser!, newPassword)
      setNewPassword('')
      setPassMsg('Password updated successfully!')
    } catch (e) {
      setPassMsg('Failed to update password. Please sign out and sign in again first.')
    } finally {
      setSavingPassword(false)
      setTimeout(() => setPassMsg(''), 4000)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.displayName || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name" />
          </div>
          {nameMsg && <p className="text-sm text-green-600">{nameMsg}</p>}
          <button type="submit" disabled={savingName}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {savingName ? 'Saving...' : 'Update name'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters" />
          </div>
          {passMsg && <p className="text-sm text-green-600">{passMsg}</p>}
          <button type="submit" disabled={savingPassword}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {savingPassword ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account info</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Account ID</span>
            <span className="text-sm font-mono text-gray-500">{user?.uid?.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Plan</span>
            <span className="text-sm font-medium text-green-600">Free</span>
          </div>
        </div>
      </div>
    </div>
  )
}
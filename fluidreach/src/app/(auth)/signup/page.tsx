'use client'
import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: name })
      const workspaceId = user.uid
      await setDoc(doc(db, 'workspaces', workspaceId), { name: name + 's Workspace', ownerId: user.uid, plan: 'free', createdAt: serverTimestamp() })
      await setDoc(doc(db, 'workspaces', workspaceId, 'members', user.uid), { userId: user.uid, role: 'owner', joinedAt: serverTimestamp() })
      router.push('/contacts')
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') { setError('An account with this email already exists.') }
      else { setError('Something went wrong. Please try again.') }
    } finally { setLoading(false) }
  }
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-8'>
      <h2 className='text-xl font-semibold text-gray-900 mb-6'>Create your account</h2>
      {error && <div className='bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4'>{error}</div>}
      <form onSubmit={handleSignup} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Your name</label>
          <input type='text' required value={name} onChange={e => setName(e.target.value)} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='John Smith' />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
          <input type='email' required value={email} onChange={e => setEmail(e.target.value)} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='you@example.com' />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
          <input type='password' required value={password} onChange={e => setPassword(e.target.value)} className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' placeholder='At least 6 characters' />
        </div>
        <button type='submit' disabled={loading} className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg text-sm transition-colors'>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className='text-center text-sm text-gray-500 mt-6'>Already have an account? <Link href='/login' className='text-blue-600 hover:underline font-medium'>Sign in</Link></p>
    </div>
  )
}

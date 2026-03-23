'use client'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e?: any) {
    if (e?.preventDefault) e.preventDefault()
    setError('')
    setLoading(true)
    try {
      console.log('Trying login with:', email)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Login success:', result.user.email)
      router.replace('/contacts')
    } catch (err: any) {
      console.log('Login error code:', err.code)
      console.log('Login error message:', err.message)
      if (err.code === 'auth/invalid-credential') {
        setError('Wrong email or password.')
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Wrong password.')
      } else {
        setError(err.message || 'Something went wrong.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 mt-2">Sign in to your Fluidreach account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-6">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        No account?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline font-medium">
          Create one free
        </Link>
      </p>
    </div>
  )
}
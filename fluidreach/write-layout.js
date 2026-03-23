const fs = require('fs')

const content = `'use client'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await signOut(auth)
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full">
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">F</div>
            <span className="text-lg font-semibold text-white">Fluidreach</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/contacts" className={pathname === "/contacts" ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white" : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"}>
            👥 Contacts
          </Link>
          <Link href="/campaigns" className={pathname === "/campaigns" ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white" : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"}>
            📣 Campaigns
          </Link>
          <Link href="/automations" className={pathname === "/automations" ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white" : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"}>
            ⚡ Automations
          </Link>
          <Link href="/analytics" className={pathname === "/analytics" ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white" : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"}>
            📊 Analytics
          </Link>
          <Link href="/settings" className={pathname === "/settings" ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white" : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"}>
            ⚙️ Settings
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white">
            🚪 Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}`

fs.writeFileSync('src/app/(dashboard)/layout.tsx', content)
console.log('Done! File written successfully.')
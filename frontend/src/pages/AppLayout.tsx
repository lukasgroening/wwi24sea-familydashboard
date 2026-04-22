import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import InviteModal from '../components/InviteModal'
import { useAuthStore } from '../store/authStore'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onInviteClick={() => setInviteOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="flex items-center gap-3 px-4 md:hidden"
          style={{ background: '#ede5d2', borderBottom: '1px solid #ddd3be', minHeight: 52 }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2a241d', padding: 8, display: 'flex', alignItems: 'center', minHeight: 44, minWidth: 44 }}
            aria-label="Menü öffnen"
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, color: 'oklch(55% 0.12 146)', lineHeight: 1 }}>
            Famly<span style={{ color: 'oklch(65% 0.14 20)' }}>.</span>
          </span>
        </header>

        <Outlet />
      </div>

      {user?.join_code && (
        <InviteModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          familyName={user.family_name ?? 'Deine Familie'}
          joinCode={user.join_code}
        />
      )}
    </div>
  )
}

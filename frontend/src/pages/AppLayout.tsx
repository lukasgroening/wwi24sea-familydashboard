import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header
          className="flex items-center gap-3 px-4 py-3 md:hidden"
          style={{ background: 'var(--color-stone-200)', borderBottom: '1px solid var(--color-stone-sidebar)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-lg leading-none"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-stone-900)' }}
            aria-label="Menü öffnen"
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-sm">FamilyBoard</span>
        </header>

        <Outlet />
      </div>
    </div>
  )
}

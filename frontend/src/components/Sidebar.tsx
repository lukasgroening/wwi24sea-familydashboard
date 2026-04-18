import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, GraduationCap, Users, Settings, Home, X, type LucideIcon } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Kalender', to: '/calendar', icon: CalendarDays },
  { label: 'Stundenplan', to: '/schedule', icon: GraduationCap },
]

const adminItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Mitglieder', to: '/admin/members', icon: Users },
]

const systemAdminItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'System', to: '/admin/system', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'
  const isSystemAdmin = user?.role === 'System-Administrator'

  return (
    <aside
      className={`w-56 flex flex-col gap-7 flex-shrink-0 py-7 px-4 fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ background: 'var(--color-stone-200)', borderRight: '1px solid var(--color-stone-sidebar)' }}
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--color-sage-500)' }}>
            <Home size={16} />
          </div>
          <span className="font-semibold text-sm">FamilyBoard</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-stone-700)' }}
          aria-label="Menü schließen"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: 'var(--color-stone-500)' }}>
          Übersicht
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-medium' : ''}`
            }
            style={({ isActive }) => ({
              background: isActive ? 'white' : 'transparent',
              color: isActive ? 'var(--color-stone-900)' : 'var(--color-stone-700)',
              boxShadow: isActive ? '0 1px 3px oklch(0 0 0 / 0.06)' : 'none',
            })}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest px-2 mb-1 mt-5" style={{ color: 'var(--color-stone-500)' }}>
              Verwaltung
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-medium' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? 'var(--color-stone-900)' : 'var(--color-stone-700)',
                  boxShadow: isActive ? '0 1px 3px oklch(0 0 0 / 0.06)' : 'none',
                })}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
            {isSystemAdmin && systemAdminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-medium' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? 'var(--color-stone-900)' : 'var(--color-stone-700)',
                  boxShadow: isActive ? '0 1px 3px oklch(0 0 0 / 0.06)' : 'none',
                })}
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors w-full"
        style={{ background: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px oklch(0 0 0 / 0.05)' }}
        title="Abmelden"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: 'var(--color-sage-500)' }}>
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{user?.username ?? 'Gast'}</div>
          <div className="text-xs truncate" style={{ color: 'var(--color-stone-600)' }}>{user?.role ?? 'Nutzer'}</div>
        </div>
      </button>
    </aside>
  )
}

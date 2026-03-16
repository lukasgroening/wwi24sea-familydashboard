import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { label: 'Dashboard', to: '/', icon: '⊞' },
  { label: 'Kalender', to: '/calendar', icon: '◻' },
  { label: 'Stundenplan', to: '/schedule', icon: '◻' },
]

const adminItems = [
  { label: 'Mitglieder', to: '/admin/members', icon: '◻' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'Familien-Administrator' || user?.role === 'System-Administrator'

  return (
    <aside className="w-56 flex flex-col gap-7 flex-shrink-0 py-7 px-4" style={{ background: '#eeeee9', borderRight: '1px solid #e0e0d8' }}>
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-base" style={{ background: '#7c9a7e' }}>
          ⌂
        </div>
        <span className="font-semibold text-sm">FamilyBoard</span>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: '#b5b5a8' }}>
          Übersicht
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-medium' : ''}`
            }
            style={({ isActive }) => ({
              background: isActive ? '#ffffff' : 'transparent',
              color: isActive ? '#2d2d2d' : '#7a7a72',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            })}
          >
            <span className="text-sm">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="text-xs font-semibold uppercase tracking-widest px-2 mb-1 mt-5" style={{ color: '#b5b5a8' }}>
              Verwaltung
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-medium' : ''}`
                }
                style={({ isActive }) => ({
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#2d2d2d' : '#7a7a72',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                })}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors w-full"
        style={{ background: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        title="Abmelden"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: '#7c9a7e' }}>
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{user?.username ?? 'Gast'}</div>
          <div className="text-xs truncate" style={{ color: '#9e9e96' }}>{user?.role ?? 'Nutzer'}</div>
        </div>
      </button>
    </aside>
  )
}

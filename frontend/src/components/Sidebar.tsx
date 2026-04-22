import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, GraduationCap, Users, Settings, X, UserPlus, type LucideIcon, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onInviteClick: () => void
}

const navItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Kalender', to: '/calendar', icon: CalendarDays },
  { label: 'Stundenplan', to: '/schedule', icon: GraduationCap },
]

const adminItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Mitglieder', to: '/admin/members', icon: Users },
]

const systemAdminItems: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'System', to: '/admin/system', icon: Settings },
]

const ink = '#2a241d'
const inkSoft = '#8a7d6a'
const ink2 = '#554a3c'
const paper = '#f5efe3'
const paper2 = '#ede5d2'
const border = '#ddd3be'
const accent = 'oklch(55% 0.12 146)'

export default function Sidebar({ isOpen, onClose, onInviteClick }: SidebarProps) {
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
      className={`flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        width: 224,
        gap: 24,
        padding: '28px 16px',
        background: paper2,
        borderRight: `1px solid ${border}`,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', color: inkSoft, textTransform: 'uppercase', marginBottom: 2 }}>
            dein digitales Zuhause
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, color: accent, lineHeight: 1 }}>
            Famly<span style={{ color: 'oklch(65% 0.14 20)' }}>.</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: inkSoft, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'unset', minWidth: 'unset' }}
          aria-label="Menü schließen"
        >
          <X size={18} />
        </button>
      </div>

      {/* Family card */}
      {user?.family_name && (
        <div style={{ padding: '10px 12px', background: paper, borderRadius: 8, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>Familie</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.family_name}
            </span>
            {user.join_code && (
              <button
                onClick={onInviteClick}
                title="Einladen"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accent, padding: 4, display: 'flex', minHeight: 'unset', minWidth: 'unset' }}
              >
                <UserPlus size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: inkSoft, textTransform: 'uppercase', padding: '0 8px', marginBottom: 4 }}>
          Übersicht
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
              background: isActive ? paper : 'transparent',
              color: isActive ? ink : ink2,
              fontWeight: isActive ? 500 : 400,
              border: isActive ? `1px solid ${border}` : '1px solid transparent',
              transition: 'all 150ms',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={15} color={isActive ? accent : ink2} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: inkSoft, textTransform: 'uppercase', padding: '0 8px', marginBottom: 4, marginTop: 20 }}>
              Verwaltung
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
                  background: isActive ? paper : 'transparent',
                  color: isActive ? ink : ink2,
                  fontWeight: isActive ? 500 : 400,
                  border: isActive ? `1px solid ${border}` : '1px solid transparent',
                  transition: 'all 150ms',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} color={isActive ? accent : ink2} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
            {isSystemAdmin && systemAdminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
                  background: isActive ? paper : 'transparent',
                  color: isActive ? ink : ink2,
                  fontWeight: isActive ? 500 : 400,
                  border: isActive ? `1px solid ${border}` : '1px solid transparent',
                  transition: 'all 150ms',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} color={isActive ? accent : ink2} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User / Logout */}
      <button
        onClick={handleLogout}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8, textAlign: 'left',
          background: paper, border: `1px solid ${border}`, cursor: 'pointer',
          width: '100%', minHeight: 'unset',
        }}
        title="Abmelden"
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent, color: paper, fontSize: 13, fontWeight: 500,
        }}>
          {user?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username ?? 'Gast'}
          </div>
          <div style={{ fontSize: 11, color: inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.role ?? 'Nutzer'}
          </div>
        </div>
        <LogOut size={14} color={inkSoft} />
      </button>
    </aside>
  )
}

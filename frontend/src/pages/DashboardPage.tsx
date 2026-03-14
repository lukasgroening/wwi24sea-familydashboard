import { WIDGETS } from '../widgets'
import WidgetCard from '../components/WidgetCard'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

function canSeeWidget(widgetRole: Role | undefined, userRole: Role | undefined): boolean {
  if (!widgetRole) return true
  if (userRole === 'sysadmin') return true
  if (userRole === 'admin') return true
  return widgetRole === 'user'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

const today = new Date().toLocaleDateString('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function DashboardPage() {
  const { user } = useAuthStore()
  const visibleWidgets = WIDGETS.filter((w) => canSeeWidget(w.requiredRole, user?.role))

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Topbar */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#1a1a1a' }}>
            {getGreeting()}{user?.name ? `, ${user.name}` : ''} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9e9e96' }}>{today}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'sysadmin') && (
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#7c9a7e', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ＋ Widget
          </button>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-3.5">
        {/* Weather — with forecast */}
        {visibleWidgets.find((w) => w.id === 'weather') && (() => {
          const WeatherWidget = WIDGETS.find((w) => w.id === 'weather')!.component
          return (
            <div
              className="col-span-4 row-span-2 rounded-2xl p-5"
              style={{ background: '#7c9a7e', minHeight: '380px' }}
            >
              <WeatherWidget />
            </div>
          )
        })()}

        {/* Calendar — big, spans 2 rows */}
        {visibleWidgets.find((w) => w.id === 'calendar') && (
          <WidgetCard
            widget={WIDGETS.find((w) => w.id === 'calendar')!}
            className="col-span-5 row-span-2"
            style={{ minHeight: '420px' }}
          />
        )}

        {/* Todo */}
        {visibleWidgets.find((w) => w.id === 'todo') && (
          <WidgetCard
            widget={WIDGETS.find((w) => w.id === 'todo')!}
            className="col-span-4"
            style={{ minHeight: '180px' }}
          />
        )}

        {/* Schedule — below weather + todo */}
        {visibleWidgets.find((w) => w.id === 'schedule') && (
          <WidgetCard
            widget={WIDGETS.find((w) => w.id === 'schedule')!}
            className="col-span-7"
            style={{ minHeight: '220px' }}
          />
        )}
      </div>
    </div>
  )
}

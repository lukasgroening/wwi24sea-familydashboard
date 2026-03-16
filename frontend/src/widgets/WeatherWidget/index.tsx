import type { WidgetProps } from '../../types'

// Mock data — swap with: api.get('/weather?city=...') once backend is ready
const mock = {
  city: 'München',
  temp: 14,
  description: 'Teilweise bewölkt',
  high: 17,
  low: 9,
  rain: 62,
}

export default function WeatherWidget(_props: WidgetProps) {
  return (
    <div className="h-full flex flex-col" style={{ color: 'white' }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Wetter · {mock.city}
      </div>
      <div className="text-6xl font-light tracking-tight leading-none mb-1">{mock.temp}°</div>
      <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>{mock.description}</div>
      <div className="flex gap-3 mt-auto">
        {[
          { label: 'max', value: `↑ ${mock.high}°` },
          { label: 'min', value: `↓ ${mock.low}°` },
          { label: 'Regen', value: `${mock.rain}%` },
        ].map((s) => (
          <div key={s.label} className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {s.value}
            <span className="block" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

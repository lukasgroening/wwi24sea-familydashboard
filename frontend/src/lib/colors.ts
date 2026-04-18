export const colors = {
  // Sage (primary brand color)
  sage50:  'var(--color-sage-50)',
  sage500: 'var(--color-sage-500)',

  // Stone (neutrals)
  stone50:      'var(--color-stone-50)',
  stone100:     'var(--color-stone-100)',
  stone200:     'var(--color-stone-200)',
  stone400:     'var(--color-stone-400)',
  stone500:     'var(--color-stone-500)',
  stone600:     'var(--color-stone-600)',
  stone700:     'var(--color-stone-700)',
  stone800:     'var(--color-stone-800)',
  stone900:     'var(--color-stone-900)',
  stoneBorder:  'var(--color-stone-border)',
  stoneSidebar: 'var(--color-stone-sidebar)',
  stoneRow:     'var(--color-stone-row)',
  stoneDim:     'var(--color-stone-dim)',

  // Danger (errors, destructive actions)
  danger50:  'var(--color-danger-50)',
  danger100: 'var(--color-danger-100)',
  danger200: 'var(--color-danger-200)',
  danger500: 'var(--color-danger-500)',
  danger700: 'var(--color-danger-700)',

  // Warning
  warning50:  'var(--color-warning-50)',
  warning800: 'var(--color-warning-800)',

  // Role badges
  roleFamily: 'var(--color-role-family)',
} as const

const SCHEDULE_COLORS = [
  'oklch(0.655 0.053 146.8)',
  'oklch(0.792 0.049 145.2)',
  'oklch(0.853 0.028 145.5)',
  'oklch(0.746 0.056 159.1)',
  'oklch(0.824 0.042 145.3)',
  'oklch(0.705 0.060 247.1)',
  'oklch(0.720 0.050 247.1)',
]

export function getScheduleColor(id: number): string {
  return SCHEDULE_COLORS[id % SCHEDULE_COLORS.length]
}

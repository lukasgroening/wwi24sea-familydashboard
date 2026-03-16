export type Role = 'admin' | 'user' | 'sysadmin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  familyId: string
  avatarInitials?: string
}

export interface WidgetConfig {
  id: string
  name: string
  description: string
  component: React.ComponentType<WidgetProps>
  defaultSize: 'small' | 'medium' | 'large'
  /** Minimum role required to see this widget */
  requiredRole?: Role
}

/** A widget instance placed on the dashboard */
export interface DashboardWidgetInstance {
  /** Unique instance id */
  instanceId: string
  /** References WidgetConfig.id */
  widgetId: string
  /** Column span in 12-col grid */
  colSpan: number
  /** Row span */
  rowSpan: number
  /** User-defined settings for this instance */
  settings: Record<string, unknown>
}

export interface WidgetProps {
  /** Config passed from the dashboard (e.g. selected city, person) */
  settings?: Record<string, unknown>
}

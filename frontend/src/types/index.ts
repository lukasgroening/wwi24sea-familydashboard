export type Role = 'System-Administrator' | 'Familien-Administrator' | 'Nutzer'

export interface User {
  id: number
  username: string
  role: Role
  family_id?: number | null
  family_name?: string | null
  join_code?: string | null
}

export interface Family {
  id: number
  name: string
  join_code: string
  member_count: number
}

export interface WidgetConfig {
  id: string
  name: string
  description: string
  component: React.ComponentType<WidgetProps>
  defaultSize: 'small' | 'medium' | 'large'
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
  settings: Record<string, unknown>
  onSettingsChange: (settings: Record<string, unknown>) => void
}

export type Role = 'System-Administrator' | 'Familien-Administrator' | 'Nutzer'

export interface User {
  id: number
  username: string
  role: Role
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
  settings?: Record<string, unknown>
}

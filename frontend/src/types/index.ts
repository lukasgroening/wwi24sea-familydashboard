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

export interface WidgetProps {
  settings?: Record<string, unknown>
}

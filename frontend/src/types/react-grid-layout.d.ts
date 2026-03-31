declare module 'react-grid-layout' {
  import * as React from 'react'

  export interface Layout {
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    maxW?: number
    minH?: number
    maxH?: number
    static?: boolean
    isDraggable?: boolean
    isResizable?: boolean
  }

  export interface ReactGridLayoutProps {
    className?: string
    style?: React.CSSProperties
    width?: number
    cols?: number
    rowHeight?: number
    layout?: Layout[]
    onLayoutChange?: (layout: Layout[]) => void
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void
    draggableHandle?: string
    draggableCancel?: string
    isResizable?: boolean
    isDraggable?: boolean
    compactType?: 'vertical' | 'horizontal' | null
    margin?: [number, number]
    containerPadding?: [number, number]
    children?: React.ReactNode
  }

  export class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
  export class GridLayout extends React.Component<ReactGridLayoutProps> {}

  export default ReactGridLayout
}

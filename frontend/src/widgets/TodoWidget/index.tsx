import { useState } from 'react'
import type { WidgetProps } from '../../types'

interface Todo {
  id: number
  text: string
  done: boolean
  tag?: string
}

// Mock data — swap with: api.get('/todos') once backend is ready
const initialTodos: Todo[] = [
  { id: 1, text: 'Wäsche aufhängen', done: true, tag: 'Haushalt' },
  { id: 2, text: 'Schulranzen kontrollieren', done: true, tag: 'Kinder' },
  { id: 3, text: 'Einkaufen gehen', done: false, tag: 'Heute' },
  { id: 4, text: 'Arzt anrufen – Lena', done: false, tag: 'Heute' },
  { id: 5, text: 'Auto zur Inspektion', done: false, tag: 'Diese Woche' },
]

export default function TodoWidget(_props: WidgetProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [input, setInput] = useState('')

  const toggle = (id: number) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const add = () => {
    if (!input.trim()) return
    setTodos((prev) => [...prev, { id: Date.now(), text: input.trim(), done: false }])
    setInput('')
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border"
          style={{ background: '#f8f8f4', borderColor: '#e8e8e2', fontFamily: 'inherit' }}
          placeholder="Neue Aufgabe..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          onClick={add}
          className="w-9 h-9 rounded-lg text-white text-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#7c9a7e' }}
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {todos.map((todo) => (
          <div
            key={todo.id}
            onClick={() => toggle(todo.id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            style={{ background: '#f8f8f4' }}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
              style={{
                border: todo.done ? 'none' : '1.5px solid #c8c8c0',
                background: todo.done ? '#7c9a7e' : 'transparent',
                color: 'white',
              }}
            >
              {todo.done && '✓'}
            </div>
            <span
              className="flex-1 text-sm"
              style={{ color: todo.done ? '#b5b5a8' : '#2d2d2d', textDecoration: todo.done ? 'line-through' : 'none' }}
            >
              {todo.text}
            </span>
            {todo.tag && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: todo.tag === 'Heute' ? '#f0f5f0' : '#f4f4f0',
                  color: todo.tag === 'Heute' ? '#7c9a7e' : '#9e9e96',
                }}
              >
                {todo.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from "react";
import api from "../../lib/api";
import type { WidgetProps } from "../../types";

interface Todo {
  id: number;
  title: string;
  is_completed: boolean;
  tag?: string;
  user_id?: number;
}

export default function TodoWidget(_props: WidgetProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [filterTag, setFilterTag] = useState("Alle");
  const [loading, setLoading] = useState(true);

  const tagOptions = ["Eltern", "Au-Pair", "Kinder"];

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const { data } = await api.get("/api/todos/");
      setTodos(data);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const newStatus = !todo.is_completed;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: newStatus } : t)),
    );

    try {
      await api.patch(`/api/todos/${id}`, { is_completed: newStatus });
    } catch {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_completed: todo.is_completed } : t,
        ),
      );
    }
  };

  const add = async () => {
    if (!input.trim()) return;

    const tag = customTag.trim() || selectedTag || null;

    try {
      const { data } = await api.post("/api/todos/", {
        title: input.trim(),
        tag,
      });
      setTodos((prev) => [...prev, data]);
      setInput("");
      setSelectedTag("");
      setCustomTag("");
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
    }
  };

  const deleteTodo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await api.delete(`/api/todos/${id}`);
    } catch {
      loadTodos();
    }
  };

  const getFilteredTodos = () => {
    if (filterTag === "Alle") return todos;
    if (filterTag === "Kein Tag") return todos.filter((t) => !t.tag);
    return todos.filter((t) => t.tag === filterTag);
  };

  const getAvailableTags = () => {
    const used = new Set<string>();
    todos.forEach((t) => t.tag && used.add(t.tag));

    const stdUsed = tagOptions.filter((t) => used.has(t)).sort();
    const custom = Array.from(used)
      .filter((t) => !tagOptions.includes(t))
      .sort();

    return ["Alle", "Kein Tag", ...stdUsed, ...custom];
  };

  const inputStyle = {
    background: "#f8f8f4",
    borderColor: "#e8e8e2",
    fontFamily: "inherit",
  };
  const btnGreen = { background: "#7c9a7e" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: "#9e9e96" }}>
          Lade Todos...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border"
            style={inputStyle}
            placeholder="Neue Aufgabe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <div className="relative w-9 h-9">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full h-full rounded-lg text-sm outline-none border cursor-pointer"
              style={{
                ...inputStyle,
                appearance: "none",
                textAlign: "center",
                fontSize: "0",
              }}
              title={`Filter: ${filterTag}`}
            >
              {getAvailableTags().map((tag) => (
                <option key={tag} value={tag} style={{ fontSize: "14px" }}>
                  {tag === "Alle"
                    ? "Alle anzeigen"
                    : tag === "Kein Tag"
                      ? "Ohne Tag"
                      : tag}
                </option>
              ))}
            </select>
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{ fontSize: "18px" }}
            >
              ☰
            </div>
          </div>
          <button
            onClick={add}
            className="w-9 h-9 rounded-lg text-white text-xl flex items-center justify-center"
            style={btnGreen}
          >
            +
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag === selectedTag ? "" : tag);
                  setCustomTag("");
                }}
                className="px-3 py-1 rounded text-xs transition-colors border"
                style={{
                  background: selectedTag === tag ? "#7c9a7e" : "#f8f8f4",
                  color: selectedTag === tag ? "white" : "#2d2d2d",
                  borderColor: selectedTag === tag ? "#7c9a7e" : "#e8e8e2",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: "#9e9e96" }}>
            oder
          </span>
          <input
            className="px-2 py-1 rounded text-xs outline-none border w-24"
            style={{
              ...inputStyle,
              borderColor: customTag ? "#7c9a7e" : "#e8e8e2",
            }}
            placeholder="Eigenes Tag"
            value={customTag}
            onChange={(e) => {
              setCustomTag(e.target.value);
              if (e.target.value) setSelectedTag("");
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {getFilteredTodos().map((todo) => (
          <div
            key={todo.id}
            onClick={() => toggle(todo.id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            style={inputStyle}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
              style={{
                border: todo.is_completed ? "none" : "1.5px solid #c8c8c0",
                background: todo.is_completed ? "#7c9a7e" : "transparent",
                color: "white",
              }}
            >
              {todo.is_completed && "✓"}
            </div>
            <span
              className="flex-1 text-sm"
              style={{
                color: todo.is_completed ? "#b5b5a8" : "#2d2d2d",
                textDecoration: todo.is_completed ? "line-through" : "none",
              }}
            >
              {todo.title}
            </span>
            {todo.is_completed && (
              <button
                onClick={(e) => deleteTodo(todo.id, e)}
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-sm hover:bg-red-100"
                style={{ color: "#b5b5a8" }}
                title="Löschen"
              >
                ×
              </button>
            )}
            {todo.tag && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: "#f4f4f0", color: "#9e9e96" }}
              >
                {todo.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

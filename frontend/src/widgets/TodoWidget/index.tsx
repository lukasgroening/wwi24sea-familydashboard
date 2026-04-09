import { useState, useEffect } from "react";
import api from "../../lib/api";

interface Todo {
  id: number;
  title: string;
  is_completed: boolean;
  tag?: string | null;
  user_id?: number;
}

const COLORS = {
  background: "#f8f8f4",
  border: "#e8e8e2",
  borderActive: "#7c9a7e",
  primary: "#7c9a7e",
  textPrimary: "#2d2d2d",
  textMuted: "#9e9e96",
  textCompleted: "#b5b5a8",
  tagBackground: "#f4f4f0",
  white: "white",
};

const TAG_OPTIONS = ["Eltern", "Au-Pair", "Kinder"];
const FILTER_ALL = "Alle";
const FILTER_NO_TAG = "Kein Tag";

export default function TodoWidget() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [filterTag, setFilterTag] = useState(FILTER_ALL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const { data } = await api.get<Todo[]>("/api/todos/");
      setTodos(data);
    } catch (error) {
      console.error("Fehler beim Laden der Todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    const title = input.trim();
    if (!title) return;

    const tag = customTag.trim() || selectedTag || null;

    try {
      const { data } = await api.post<Todo>("/api/todos/", { title, tag });
      setTodos((prev) => [...prev, data]);

      setInput("");
      setSelectedTag("");
      setCustomTag("");
    } catch (error) {
      console.error("Fehler beim Erstellen des Todos:", error);
    }
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) return;

    const newStatus = !todo.is_completed;

    // Optimistisches Update
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, is_completed: newStatus } : todo,
      ),
    );

    try {
      await api.patch(`/api/todos/${id}`, { is_completed: newStatus });
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);

      // Rollback bei Fehler
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? todo : t
        ),
      );
    }
  };

  const deleteTodo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const backup = [...todos];

    // Optimistisches Update
    setTodos((prev) => prev.filter((todo) => todo.id !== id));

    try {
      await api.delete(`/api/todos/${id}`);
    } catch (error) {
      console.error("Fehler beim Löschen:", error);

      setTodos(backup);
    }
  };

  const getFilteredTodos = () => {
    if (filterTag === FILTER_ALL) return todos;
    if (filterTag === FILTER_NO_TAG) return todos.filter((todo) => !todo.tag);
    return todos.filter((todo) => todo.tag === filterTag);
  };

  const getAvailableTags = () => {
    const usedTags = new Set<string>();
    todos.forEach((todo) => {
      if (todo.tag) usedTags.add(todo.tag);
    });

    const availableStandardTags = TAG_OPTIONS.filter((tag) =>
      usedTags.has(tag),
    );

    const customTags = Array.from(usedTags)
      .filter((tag) => !(TAG_OPTIONS as readonly string[]).includes(tag))
      .sort();

    return [FILTER_ALL, FILTER_NO_TAG, ...availableStandardTags, ...customTags];
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? "" : tag);
    setCustomTag("");
  };

  const handleCustomTagChange = (value: string) => {
    setCustomTag(value);
    if (value) setSelectedTag("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTodo();
  };

  const inputStyle = {
    background: COLORS.background,
    borderColor: COLORS.border,
    fontFamily: "inherit",
  };

  const buttonStyle = {
    background: COLORS.primary,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Lade Todos...
        </p>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border"
            style={inputStyle}
            placeholder="Neue Aufgabe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
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
                  {tag === FILTER_ALL
                    ? "Alle anzeigen"
                    : tag === FILTER_NO_TAG
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
            onClick={addTodo}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-lg text-white text-xl flex items-center justify-center transition-opacity disabled:opacity-50"
            style={buttonStyle}
            title="Todo hinzufügen"
          >
            +
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded text-xs transition-colors border"
                style={{
                  background:
                    selectedTag === tag ? COLORS.primary : COLORS.background,
                  color:
                    selectedTag === tag ? COLORS.white : COLORS.textPrimary,
                  borderColor:
                    selectedTag === tag ? COLORS.primary : COLORS.border,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>
            oder
          </span>
          <input
            className="px-2 py-1 rounded text-xs outline-none border w-24"
            style={{
              ...inputStyle,
              borderColor: customTag ? COLORS.borderActive : COLORS.border,
            }}
            placeholder="Eigenes Tag"
            value={customTag}
            onChange={(e) => handleCustomTagChange(e.target.value)}
          />
        </div>
      </div>

      {/* To-Do Liste */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {filterTag === FILTER_ALL
                ? "Keine Todos vorhanden"
                : "Keine Todos mit diesem Filter"}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
              style={inputStyle}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
                style={{
                  border: todo.is_completed
                    ? "none"
                    : `1.5px solid ${COLORS.border}`,
                  background: todo.is_completed
                    ? COLORS.primary
                    : "transparent",
                  color: COLORS.white,
                }}
              >
                {todo.is_completed && "✓"}
              </div>

              <span
                className="flex-1 text-sm"
                style={{
                  color: todo.is_completed
                    ? COLORS.textCompleted
                    : COLORS.textPrimary,
                  textDecoration: todo.is_completed ? "line-through" : "none",
                }}
              >
                {todo.title}
              </span>

              {todo.is_completed && (
                <button
                  onClick={(e) => deleteTodo(todo.id, e)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-sm hover:bg-red-100 transition-colors"
                  style={{ color: COLORS.textCompleted }}
                  title="Löschen"
                >
                  x
                </button>
              )}

              {todo.tag && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: COLORS.tagBackground,
                    color: COLORS.textMuted,
                  }}
                >
                  {todo.tag}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

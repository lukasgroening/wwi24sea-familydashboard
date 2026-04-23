import { useState } from "react";
import { Check, Plus, SlidersHorizontal, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { colors } from "../../lib/colors";
import type { WidgetProps } from "../../types";

interface Todo {
  id: number;
  title: string;
  is_completed: boolean;
  tag?: string | null;
  user_id?: number;
}

const COLORS = {
  background:    colors.stone50,
  border:        colors.stoneBorder,
  borderActive:  colors.sage500,
  primary:       colors.sage500,
  textPrimary:   colors.stone900,
  textMuted:     colors.stone600,
  textCompleted: colors.stone500,
  tagBackground: colors.stone100,
  white:         "white",
};

const TAG_OPTIONS = ["Eltern", "Au-Pair", "Kinder"];
const FILTER_ALL = "Alle";
const FILTER_NO_TAG = "Kein Tag";

export default function TodoWidget({ settings, onSettingsChange }: WidgetProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [filterTag, setFilterTag] = useState(FILTER_ALL);

  const { data: todos = [], isLoading: loading, error } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => api.get<Todo[]>("/api/todos/").then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (payload: { title: string; tag: string | null }) =>
      api.post<Todo>("/api/todos/", payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setInput("");
      setSelectedTag("");
      setCustomTag("");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_completed }: { id: number; is_completed: boolean }) =>
      api.patch(`/api/todos/${id}`, { is_completed }),
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) => (t.id === id ? { ...t, is_completed } : t)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["todos"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/todos/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old) =>
        old?.filter((t) => t.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["todos"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const addTodo = () => {
    const title = input.trim();
    if (!title) return;
    const tag = customTag.trim() || selectedTag || null;
    addMutation.mutate({ title, tag });
  };

  const getFilteredTodos = () => {
    if (filterTag === FILTER_ALL) return todos;
    if (filterTag === FILTER_NO_TAG) return todos.filter((t) => !t.tag);
    return todos.filter((t) => t.tag === filterTag);
  };

  const getAvailableTags = () => {
    const usedTags = new Set<string>();
    todos.forEach((t) => { if (t.tag) usedTags.add(t.tag) });
    const standardTags = TAG_OPTIONS.filter((tag) => usedTags.has(tag));
    const customTags = Array.from(usedTags)
      .filter((tag) => !(TAG_OPTIONS as readonly string[]).includes(tag))
      .sort();
    return [FILTER_ALL, FILTER_NO_TAG, ...standardTags, ...customTags];
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? "" : tag);
    setCustomTag("");
  };

  const handleCustomTagChange = (value: string) => {
    setCustomTag(value);
    if (value) setSelectedTag("");
  };

  const inputStyle = {
    background: COLORS.background,
    borderColor: COLORS.border,
    fontFamily: "inherit",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Lade Todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Todos konnten nicht geladen werden.</p>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();

  return (
    <div className="flex flex-col gap-3 h-full min-w-0 overflow-hidden">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 min-w-0">
          <input
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none border"
            style={inputStyle}
            placeholder="Neue Aufgabe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTodo() }}
          />

          <div className="relative w-9 h-9">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full h-full rounded-lg text-sm outline-none border cursor-pointer"
              style={{ ...inputStyle, appearance: "none", textAlign: "center", fontSize: "0" }}
              title={`Filter: ${filterTag}`}
            >
              {getAvailableTags().map((tag) => (
                <option key={tag} value={tag} style={{ fontSize: "14px" }}>
                  {tag === FILTER_ALL ? "Alle anzeigen" : tag === FILTER_NO_TAG ? "Ohne Tag" : tag}
                </option>
              ))}
            </select>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ color: COLORS.textMuted }}>
              <SlidersHorizontal size={14} />
            </div>
          </div>

          <button
            onClick={addTodo}
            disabled={!input.trim() || addMutation.isPending}
            className="w-9 h-9 rounded-lg text-white flex items-center justify-center transition-opacity disabled:opacity-50"
            style={{ background: COLORS.primary }}
            title="Todo hinzufügen"
          >
            <Plus size={18} />
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
                  background: selectedTag === tag ? COLORS.primary : COLORS.background,
                  color: selectedTag === tag ? COLORS.white : COLORS.textPrimary,
                  borderColor: selectedTag === tag ? COLORS.primary : COLORS.border,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>oder</span>
          <input
            className="px-2 py-1 rounded text-xs outline-none border w-24"
            style={{ ...inputStyle, borderColor: customTag ? COLORS.borderActive : COLORS.border }}
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
              {filterTag === FILTER_ALL ? "Keine Todos vorhanden" : "Keine Todos mit diesem Filter"}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              onClick={() => toggleMutation.mutate({ id: todo.id, is_completed: !todo.is_completed })}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:opacity-80 min-w-0 overflow-hidden"
              style={inputStyle}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
                style={{
                  border: todo.is_completed ? "none" : `1.5px solid ${COLORS.border}`,
                  background: todo.is_completed ? COLORS.primary : "transparent",
                  color: COLORS.white,
                }}
              >
                {todo.is_completed && <Check size={10} />}
              </div>

              <span
                className="flex-1 text-sm"
                style={{
                  color: todo.is_completed ? COLORS.textCompleted : COLORS.textPrimary,
                  textDecoration: todo.is_completed ? "line-through" : "none",
                }}
              >
                {todo.title}
              </span>

              {todo.is_completed && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(todo.id) }}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors"
                  style={{ color: COLORS.textCompleted }}
                  title="Löschen"
                >
                  <X size={12} />
                </button>
              )}

              {todo.tag && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: COLORS.tagBackground, color: COLORS.textMuted }}>
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

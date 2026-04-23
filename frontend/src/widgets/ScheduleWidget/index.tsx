import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import type { User } from "../../types";

const DAY_LABELS: Record<string, string> = {
  Montag: "Mo",
  Dienstag: "Di",
  Mittwoch: "Mi",
  Donnerstag: "Do",
  Freitag: "Fr",
  Samstag: "Sa",
  Sonntag: "So",
};

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

interface ScheduleEntry {
  id: number;
  subject: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string | null;
  teacher?: string | null;
  user_id?: number | null;
}

const todayIndex = Math.min(new Date().getDay() - 1, 4);
const todayKey = DAYS[todayIndex >= 0 ? todayIndex : 0];

const COLORS = [
  "oklch(0.655 0.053 146.8)",
  "oklch(0.792 0.049 145.2)",
  "oklch(0.853 0.028 145.5)",
  "oklch(0.746 0.056 159.1)",
  "oklch(0.824 0.042 145.3)",
];

function formatTime(t: string) {
  return t.slice(0, 5);
}

export default function ScheduleWidget() {
  const { user } = useAuthStore();
  const [activeDay, setActiveDay] = useState(todayKey);

  const {
    data: entries = [],
    isLoading: loading,
    error: loadError,
  } = useQuery<ScheduleEntry[]>({
    queryKey: ["schedule"],
    queryFn: () =>
      api.get<ScheduleEntry[]>("/api/schedule/").then((r) => r.data),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/api/users/").then((r) => r.data),
  });

  const usersWithEntries = useMemo(
    () => users.filter((u) => entries.some((e) => e.user_id === u.id)),
    [users, entries],
  );

  const defaultFilterUserId = useMemo(() => {
    if (user && entries.some((e) => e.user_id === user.id)) {
      return String(user.id);
    }
    return "all";
  }, [user, entries]);

  const [filterUserId, setFilterUserId] = useState(defaultFilterUserId);

  const error = loadError ? "Stundenplan konnte nicht geladen werden." : null;

  const lessons = entries
    .filter((e) => {
      const dayMatch = e.day_of_week === activeDay;
      const userMatch =
        filterUserId === "all" || String(e.user_id) === filterUserId;
      return dayMatch && userMatch;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Person tabs */}
      {usersWithEntries.length > 0 && (
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterUserId("all")}
            className="px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap"
            style={{
              background:
                filterUserId === "all"
                  ? "var(--color-stone-200)"
                  : "var(--color-stone-50)",
              color:
                filterUserId === "all"
                  ? "var(--color-stone-900)"
                  : "var(--color-stone-600)",
              fontWeight: filterUserId === "all" ? 500 : 400,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Alle
          </button>
          {usersWithEntries.map((u) => (
            <button
              key={u.id}
              onClick={() => setFilterUserId(String(u.id))}
              className="px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap"
              style={{
                background:
                  filterUserId === String(u.id)
                    ? "var(--color-stone-200)"
                    : "var(--color-stone-50)",
                color:
                  filterUserId === String(u.id)
                    ? "var(--color-stone-900)"
                    : "var(--color-stone-600)",
                fontWeight: filterUserId === String(u.id) ? 500 : 400,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {u.username}
            </button>
          ))}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className="px-3 py-1 rounded-lg text-xs transition-colors"
            style={{
              background:
                activeDay === d ? "var(--color-stone-100)" : "transparent",
              color:
                activeDay === d
                  ? "var(--color-stone-900)"
                  : "var(--color-stone-600)",
              fontWeight: activeDay === d ? 500 : 400,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {loading && (
          <p
            className="text-sm text-center py-6"
            style={{ color: "var(--color-stone-500)" }}
          >
            Lade Stundenplan…
          </p>
        )}
        {error && (
          <p
            className="text-sm text-center py-6"
            style={{ color: "var(--color-danger-700)" }}
          >
            {error}
          </p>
        )}
        {!loading && !error && lessons.length === 0 && (
          <div
            className="text-sm text-center py-6"
            style={{ color: "var(--color-stone-500)" }}
          >
            Kein Unterricht
          </div>
        )}
        {!loading &&
          lessons.map((lesson, i) => {
            const assignedUser = users.find((u) => u.id === lesson.user_id);
            return (
              <div
                key={lesson.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: "oklch(0.977 0.008 146.0)",
                  borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
                }}
              >
                <div
                  className="text-xs w-16 flex-shrink-0"
                  style={{ color: "var(--color-stone-600)" }}
                >
                  {formatTime(lesson.start_time)} –{" "}
                  {formatTime(lesson.end_time)}
                </div>
                <div className="text-sm font-medium flex-1 min-w-0">
                  {lesson.subject}
                </div>
                {assignedUser && (
                  <div
                    className="text-xs px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      background: "var(--color-sage-100)",
                      color: "var(--color-sage-700)",
                      fontSize: "10px",
                    }}
                  >
                    {assignedUser.username}
                  </div>
                )}
                {lesson.room && (
                  <div
                    className="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                    style={{
                      background: "var(--color-stone-100)",
                      color: "var(--color-stone-600)",
                    }}
                  >
                    {lesson.room}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

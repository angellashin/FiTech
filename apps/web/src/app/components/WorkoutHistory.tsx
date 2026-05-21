import { useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Search, Star, Trash2, X } from 'lucide-react';
import type { WorkoutPlan } from '../domain/workout';
import {
  calculateExerciseVolume,
  deleteWorkoutSession,
  getAllSessions,
  type WorkoutSessionRecord,
} from '../utils/workoutHistory';
import { buildSessionAnalytics } from '../services/workoutAnalytics';
import { WorkoutReviewFaceIcon } from './WorkoutReviewFaceIcon';

interface WorkoutHistoryProps {
  onBack: () => void;
  onLoadPlan: (plan: WorkoutPlan) => void;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const getSessionTitle = (session: WorkoutSessionRecord) => {
  const groups = session.muscleGroup?.length ? session.muscleGroup : ['chest'];
  return groups.map((group) => group.replace('-', ' ')).join(' + ');
};

const sessionToPlan = (session: WorkoutSessionRecord): WorkoutPlan => ({
  goal: session.goal ?? 'strength',
  muscleGroup: session.muscleGroup?.length ? session.muscleGroup : ['chest'],
  duration: session.duration ?? 45,
  exercises: session.exercises.map((exercise) => ({
    ...exercise,
    setDetails: exercise.setDetails?.map((set) => ({ ...set, completed: false })),
  })),
  rationale: ['Loaded from your workout history.'],
});

export function WorkoutHistory({ onBack, onLoadPlan }: WorkoutHistoryProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sessions = getAllSessions().sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  void version;

  // Build date → session count map (used for calendar dots)
  const sessionCountByDate = new Map<string, number>();
  for (const s of sessions) {
    const key = s.completedAt.slice(0, 10);
    sessionCountByDate.set(key, (sessionCountByDate.get(key) ?? 0) + 1);
  }

  // Calendar computed values
  const calYear = calendarMonth.getFullYear();
  const calMonthIdx = calendarMonth.getMonth();
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();
  const firstWeekday = new Date(calYear, calMonthIdx, 1).getDay();
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthPrefix = `${calYear}-${String(calMonthIdx + 1).padStart(2, '0')}`;
  const workoutsThisMonth = [...sessionCountByDate.entries()]
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((sum, [, count]) => sum + count, 0);

  const filteredSessions = sessions.filter((session) => {
    const haystack = [
      getSessionTitle(session),
      session.exercises.map((exercise) => exercise.name).join(' '),
      session.review?.notes ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  // Apply date filter from calendar selection
  const displayedSessions = selectedDate
    ? filteredSessions.filter((s) => s.completedAt.startsWith(selectedDate))
    : filteredSessions;

  const selected =
    displayedSessions.find((session) => session.id === selectedId) ?? displayedSessions[0] ?? null;
  const selectedAnalytics = selected ? buildSessionAnalytics(selected) : null;
  const selectedExerciseWork =
    selected?.exercises
      .map((exercise) => ({
        name: exercise.name,
        work: Math.round(calculateExerciseVolume(exercise)),
        completedSets: exercise.setDetails?.filter((set) => set.completed).length ?? 0,
      }))
      .filter((item) => item.work > 0 || item.completedSets > 0) ?? [];
  const selectedMaxExerciseWork = Math.max(1, ...selectedExerciseWork.map((item) => item.work));
  const trainedDays = new Set(sessions.map((session) => session.completedAt.slice(0, 10))).size;

  const handleDelete = (sessionId: string) => {
    if (!window.confirm('Delete this workout session?')) return;
    deleteWorkoutSession(sessionId);
    setSelectedId(null);
    setVersion((current) => current + 1);
  };

  return (
    <div className="size-full flex flex-col bg-neutral-950 text-white overflow-auto">
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur-sm z-10">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Workout History</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-dark rounded-2xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Sessions</div>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </div>
          <div className="glass-dark rounded-2xl p-4">
            <div className="text-xs text-neutral-500 mb-1">Training days</div>
            <div className="text-2xl font-bold">{trainedDays}</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-dark rounded-2xl p-4 mb-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calYear, calMonthIdx - 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">
              {calendarMonth.toLocaleString('en', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calYear, calMonthIdx + 1, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center text-xs text-neutral-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const count = sessionCountByDate.get(dateStr) ?? 0;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
                    ${isSelected
                      ? 'bg-blue-500 text-white font-semibold'
                      : count > 0
                      ? 'text-white hover:bg-neutral-700'
                      : 'text-neutral-500 hover:bg-neutral-800'
                    }`}
                >
                  {isToday && !isSelected && (
                    <span className="absolute inset-0 rounded-full ring-1 ring-emerald-400/60" />
                  )}
                  {day}
                  {count > 0 && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Monthly summary */}
          <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400 text-center">
            {workoutsThisMonth > 0
              ? `${workoutsThisMonth} workout${workoutsThisMonth > 1 ? 's' : ''} this month`
              : 'No workouts this month'}
          </div>
        </div>

        <div className="relative mb-5">
          <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercise, muscle, or note"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Active date filter badge */}
        {selectedDate && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full px-3 py-1 text-xs font-medium">
              <CalendarDays className="w-3 h-3" />
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              &nbsp;·&nbsp;
              {displayedSessions.length} session{displayedSessions.length !== 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {displayedSessions.length === 0 && (
          <div className="glass-dark rounded-3xl p-8 text-center text-neutral-400">
            <CalendarDays className="w-8 h-8 mx-auto mb-3" />
            {selectedDate ? 'No workouts on this day.' : 'No workouts found yet.'}
          </div>
        )}

        <div className="space-y-4">
          {displayedSessions.map((session) => {
            const isSelected = selected?.id === session.id;
            return (
              <div
                key={session.id}
                className={`rounded-3xl border ${isSelected ? 'border-blue-500/40' : 'border-neutral-800/50'} bg-gradient-to-br from-neutral-900 to-neutral-950 overflow-hidden`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : session.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold capitalize mb-1">
                      {getSessionTitle(session)} workout
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatDate(session.completedAt)}
                    </div>
                    <div className="text-xs text-neutral-400 mt-2">
                      {session.completedSets}/{session.totalSets} sets ·{' '}
                      {Math.round(session.totalVolume).toLocaleString()} volume
                    </div>
                  </div>
                  <div className="text-neutral-200">
                    {session.review ? (
                      <WorkoutReviewFaceIcon rating={session.review.rating} className="w-7 h-7" />
                    ) : (
                      '—'
                    )}
                  </div>
                </button>

                {isSelected && selectedAnalytics && (
                  <div className="border-t border-white/5 p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="glass-dark rounded-xl p-3">
                        <div className="text-neutral-500 mb-1">Completion Rate</div>
                        <div className="font-bold text-emerald-400">
                          {selectedAnalytics.adherenceRate}%
                        </div>
                      </div>
                      <div className="glass-dark rounded-xl p-3">
                        <div className="text-neutral-500 mb-1">New Records</div>
                        <div className="font-bold text-yellow-400">
                          {selectedAnalytics.prs.length}
                        </div>
                      </div>
                    </div>

                    {selectedAnalytics.insights.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedAnalytics.insights.slice(0, 2).map((insight) => (
                          <div key={insight.id} className="glass-dark rounded-xl p-3 text-sm">
                            <div className="font-medium text-white mb-1">{insight.title}</div>
                            <div className="text-neutral-400">{insight.body}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      {session.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-neutral-200">{exercise.name}</span>
                          <span className="text-neutral-500">
                            {exercise.sets} × {exercise.reps}
                          </span>
                        </div>
                      ))}
                    </div>

                    {selectedExerciseWork.length > 0 && (
                      <div className="glass-dark rounded-xl p-3 mb-4">
                        <div className="text-sm font-medium text-white mb-3">Work by exercise</div>
                        <div className="space-y-3">
                          {selectedExerciseWork.map((item) => (
                            <div key={item.name}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-neutral-300">{item.name}</span>
                                <span className="text-neutral-500">
                                  {item.work.toLocaleString()} work
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500"
                                  style={{
                                    width: `${Math.max(5, (item.work / selectedMaxExerciseWork) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {session.review && (
                      <div className="glass-dark rounded-xl p-3 mb-4 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-300" />
                          <span className="flex items-center gap-2">
                            Face review
                            <WorkoutReviewFaceIcon
                              rating={session.review.rating}
                              className="w-5 h-5"
                            />
                          </span>
                        </div>
                        {session.review.notes && (
                          <div className="text-neutral-400">{session.review.notes}</div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onLoadPlan(sessionToPlan(session))}
                        className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl py-3 text-sm font-medium transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Load Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(session.id)}
                        className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl py-3 text-sm font-medium transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

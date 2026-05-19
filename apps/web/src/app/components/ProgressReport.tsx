import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Dumbbell,
  Medal,
  Target,
  TrendingUp,
} from 'lucide-react';
import { buildProgressReport, type ExerciseTrend } from '../services/progressReport';

interface ProgressReportProps {
  onBack: () => void;
}

const formatNumber = (value: number) => Math.round(value).toLocaleString();

const formatWork = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
};

const formatChange = (changePercent: number | null) => {
  if (changePercent === null) return 'New baseline';
  if (changePercent > 0) return `+${changePercent}%`;
  return `${changePercent}%`;
};

const directionColor = (direction: string) => {
  if (direction === 'up') return 'text-orange-300';
  if (direction === 'down') return 'text-blue-300';
  if (direction === 'stable') return 'text-emerald-300';
  return 'text-neutral-300';
};

const bubbleSize = (work: number, maxWork: number) => {
  if (work <= 0 || maxWork <= 0) return 6;
  return Math.max(10, Math.min(36, 10 + (work / maxWork) * 26));
};

const trendDirectionCopy = (trend: ExerciseTrend | undefined) => {
  if (!trend || trend.points.length < 2) return 'More repeated logs will unlock a reliable trend.';
  const first = trend.points[0].estimatedOneRepMax;
  const latest = trend.points[trend.points.length - 1].estimatedOneRepMax;
  const diff = latest - first;
  if (diff >= 2) return `Estimated strength is up about ${diff}kg from the first logged sample.`;
  if (diff <= -2)
    return `Estimated strength is down about ${Math.abs(diff)}kg; keep the next plan conservative.`;
  return 'Strength is holding steady; repeatable form can come before any larger jump.';
};

export function ProgressReport({ onBack }: ProgressReportProps) {
  const report = buildProgressReport();
  const hasHistory = report.totalSessions > 0;
  const [activeExercise, setActiveExercise] = useState(report.exerciseTrends[0]?.exercise ?? '');

  const selectedTrend = useMemo(
    () =>
      report.exerciseTrends.find((trend) => trend.exercise === activeExercise) ??
      report.exerciseTrends[0],
    [activeExercise, report.exerciseTrends],
  );
  const maxDayWork = Math.max(...report.dailyWork.map((day) => day.work), 1);
  const maxBubbleWork = Math.max(
    ...report.weekBubbles.flatMap((week) => week.days.map((day) => day.work)),
    1,
  );

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
        <div className="text-center">
          <h1 className="text-xl font-semibold">Progress Report</h1>
          <p className="text-xs text-neutral-500">Graphs from your workout records</p>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 pb-8 space-y-5">
        {!hasHistory && (
          <div className="glass-dark rounded-3xl p-8 text-center text-neutral-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-3" />
            Complete workouts to unlock trend, recovery, and record analysis.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-dark rounded-2xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-2">
              <CalendarDays className="w-4 h-4" />
              Training Days
            </div>
            <div className="text-2xl font-bold">{report.trainingDays}</div>
            <div className="text-xs text-neutral-500 mt-1">
              {report.totalSessions} total sessions
            </div>
          </div>
          <div className="glass-dark rounded-2xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-2">
              <TrendingUp className="w-4 h-4" />
              Current Streak
            </div>
            <div className="text-2xl font-bold">{report.currentStreak}</div>
            <div className="text-xs text-neutral-500 mt-1">consecutive training days</div>
          </div>
          <div className="glass-dark rounded-2xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-2">
              <Target className="w-4 h-4" />
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-emerald-300">
              {report.averageCompletionRate}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">completed / planned sets</div>
          </div>
          <div className="glass-dark rounded-2xl p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-2">
              <Dumbbell className="w-4 h-4" />
              Total Work
            </div>
            <div className="text-2xl font-bold text-blue-300">{formatWork(report.totalWork)}</div>
            <div className="text-xs text-neutral-500 mt-1">completed sets only</div>
          </div>
        </div>

        <div className="bg-white text-neutral-950 rounded-3xl p-5 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">This week’s progress</h2>
              <p className="text-xs text-neutral-400">Daily work from completed sets</p>
            </div>
            <div className={`text-lg font-bold ${directionColor(report.weeklyWork.direction)}`}>
              {formatChange(report.weeklyWork.changePercent)}
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.dailyWork} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="dayLabel" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis hide domain={[0, maxDayWork]} />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                  formatter={(value) => [formatNumber(Number(value)), 'Work']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                />
                <Bar dataKey="work" radius={[8, 8, 8, 8]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${Math.min(100, (report.weeklyWork.current / Math.max(report.weeklyWork.previous || report.weeklyWork.current || 1, 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="text-xs font-semibold text-neutral-500">
              {formatWork(report.weeklyWork.current)} / {formatWork(report.weeklyWork.previous)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-5 border border-neutral-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Exercise Log</h2>
              <p className="text-xs text-neutral-500">Strength trend by repeated exercise</p>
            </div>
            {report.exerciseTrends.length > 0 && (
              <select
                value={selectedTrend?.exercise ?? ''}
                onChange={(event) => setActiveExercise(event.target.value)}
                className="max-w-[160px] rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white outline-none"
              >
                {report.exerciseTrends.map((trend) => (
                  <option key={trend.exercise} value={trend.exercise}>
                    {trend.exercise}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!selectedTrend ? (
            <div className="text-sm text-neutral-500">
              Repeat weighted exercises to build graphs.
            </div>
          ) : (
            <>
              <div className="h-44 rounded-2xl bg-white p-3 text-neutral-950">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedTrend.points}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} fontSize={10} width={32} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${formatNumber(Number(value))}${name === 'estimatedOneRepMax' ? 'kg' : ''}`,
                        name === 'estimatedOneRepMax' ? 'e1RM' : String(name),
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimatedOneRepMax"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="glass-dark rounded-xl p-3">
                  <div className="text-neutral-500 mb-1">e1RM</div>
                  <div className="font-bold text-blue-300">
                    {selectedTrend.latestEstimatedOneRepMax ?? 0}kg
                  </div>
                </div>
                <div className="glass-dark rounded-xl p-3">
                  <div className="text-neutral-500 mb-1">Max weight</div>
                  <div className="font-bold text-white">{selectedTrend.topWeight}kg</div>
                </div>
                <div className="glass-dark rounded-xl p-3">
                  <div className="text-neutral-500 mb-1">Max work</div>
                  <div className="font-bold text-white">{formatWork(selectedTrend.topVolume)}</div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-100">
                {trendDirectionCopy(selectedTrend)}
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-5 border border-neutral-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Workout Progress</h2>
              <p className="text-xs text-neutral-500">Last 6 weeks by training day</p>
            </div>
            <div className="text-xs text-neutral-500">Work</div>
          </div>
          <div className="grid grid-cols-[76px_repeat(7,1fr)] gap-y-4 text-xs">
            <div />
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`${day}-${index}`} className="text-center text-neutral-600">
                {day}
              </div>
            ))}
            {report.weekBubbles.map((week) => (
              <div key={week.weekLabel} className="contents">
                <div className="flex flex-col justify-center text-neutral-500">
                  <span>{week.weekLabel}</span>
                  <span className="text-[10px] text-neutral-700">{formatWork(week.totalWork)}</span>
                </div>
                {week.days.map((day) => {
                  const size = bubbleSize(day.work, maxBubbleWork);
                  return (
                    <div key={day.date} className="h-10 flex items-center justify-center">
                      {day.work > 0 ? (
                        <div
                          className={`flex items-center justify-center rounded-full bg-blue-500 text-[9px] font-semibold text-white shadow-lg shadow-blue-900/30 ${day.isToday ? 'ring-2 ring-white/70' : ''}`}
                          style={{ width: size, height: size }}
                          title={`${day.date}: ${formatNumber(day.work)} work`}
                        >
                          {size > 24 ? formatWork(day.work) : ''}
                        </div>
                      ) : (
                        <span className="text-neutral-700">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-5 border border-neutral-800/50">
          <h2 className="text-lg font-semibold mb-3">Coach Notes</h2>
          <div className="space-y-2">
            {report.recommendations.map((item) => (
              <div key={item} className="glass-dark rounded-xl p-3 text-sm text-neutral-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-5 border border-neutral-800/50">
          <h2 className="text-lg font-semibold mb-3">Muscle Group Coverage</h2>
          {report.muscleGroups.length === 0 ? (
            <div className="text-sm text-neutral-500">No muscle group data yet.</div>
          ) : (
            <>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={report.muscleGroups.slice(0, 6)}
                    margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="coverage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} />
                    <YAxis hide />
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    <Area
                      type="monotone"
                      dataKey="share"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#coverage)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {report.muscleGroups.slice(0, 5).map((group) => (
                  <div key={group.group}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-200">{group.label}</span>
                      <span className="text-neutral-500">{group.share}%</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.max(group.share, 4)}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-600 mt-1">
                      {group.completedSets} sets · {formatNumber(group.totalWork)} work
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-3xl p-5 border border-neutral-800/50">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-5 h-5 text-yellow-300" />
            <h2 className="text-lg font-semibold">Top Records</h2>
          </div>
          {report.topRecords.length === 0 ? (
            <div className="text-sm text-neutral-500">Complete weighted sets to build records.</div>
          ) : (
            <div className="space-y-2">
              {report.topRecords.map((record) => (
                <div key={record.exercise} className="glass-dark rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{record.exercise}</span>
                    <span className="text-yellow-300">e1RM {record.estimatedOneRepMax}kg</span>
                  </div>
                  <div className="text-neutral-500">
                    {record.weight}kg × {record.reps} reps · {formatNumber(record.volume)} work
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

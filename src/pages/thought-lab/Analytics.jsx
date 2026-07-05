import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { subDays, format as formatDate, isAfter } from 'date-fns';
import IOSTopBar from './IOSTopBar';

export default function Analytics() {
  const { thoughts } = useData();
  const [search, setSearch] = useState('');

  const totals = useMemo(() => ({
    captured: thoughts.length,
    published: thoughts.filter(t => t.stage === 'Published').length,
    avgReuse: thoughts.length ? Math.round(thoughts.reduce((a, t) => a + (t.reuseScore || 0), 0) / thoughts.length) : 0,
    highImportance: thoughts.filter(t => t.importance === 'High').length,
  }), [thoughts]);

  const pillarData = useMemo(() => {
    const counts = {};
    thoughts.forEach(t => { if (t.pillar) counts[t.pillar] = (counts[t.pillar] || 0) + 1; });
    return Object.entries(counts).map(([pillar, count]) => ({ pillar, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [thoughts]);

  const timelineData = useMemo(() => {
    const days = [...Array(14)].map((_, i) => subDays(new Date(), 13 - i));
    return days.map(day => {
      const label = formatDate(day, 'MMM d');
      const count = thoughts.filter(t => {
        const created = new Date(t.createdAt);
        return formatDate(created, 'MMM d') === label;
      }).length;
      return { day: label, count };
    });
  }, [thoughts]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 60; i++) {
      const day = subDays(new Date(), i);
      const hasThought = thoughts.some(t => isAfter(new Date(t.createdAt), subDays(day, 1)) && new Date(t.createdAt) <= day);
      if (hasThought) count++;
      else if (i > 0) break;
    }
    return count;
  }, [thoughts]);

  const stats = [
    { label: 'Thoughts Captured', value: totals.captured },
    { label: 'Published', value: totals.published },
    { label: 'Avg Reuse Score', value: `${totals.avgReuse}%` },
    { label: 'High Priority Open', value: totals.highImportance },
    { label: 'Capture Streak', value: `${streak}d` },
  ];

  return (
    <div>
      <IOSTopBar search={search} onSearchChange={setSearch} searchPlaceholder="Search Analytics..." />

      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-ios-text)] tracking-tight">Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-[var(--color-ios-surface)] rounded-2xl p-4 border border-[var(--color-ios-border)]">
              <p className="text-2xl font-bold text-[var(--color-ios-text)]">{s.value}</p>
              <p className="text-xs text-[var(--color-ios-text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-5">
            <h3 className="font-semibold text-[var(--color-ios-text)] mb-4">Pillar Distribution</h3>
            {pillarData.length === 0 ? (
              <p className="text-sm text-[var(--color-ios-text-muted)]">No pillars tagged yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pillarData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="pillar" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0050cb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-[var(--color-ios-surface)] rounded-2xl border border-[var(--color-ios-border)] p-5">
            <h3 className="font-semibold text-[var(--color-ios-text)] mb-4">Thoughts Captured (last 14 days)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#0050cb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

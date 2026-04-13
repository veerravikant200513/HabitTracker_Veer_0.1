'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: habitsData } = await supabase.from('habits').select('*');
      const { data: logsData } = await supabase.from('habit_logs').select('*');
      setHabits(habitsData || []);
      setLogs((logsData as HabitLog[]) || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const now = new Date();

  // Weekly Stats (Monday to Sunday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0,0,0,0);
    return date;
  };

  const startOfThisWeek = getStartOfWeek(now);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeekLogs = logs.filter(l => new Date(l.logged_date) >= startOfThisWeek);
  const lastWeekLogs = logs.filter(l => {
    const d = new Date(l.logged_date);
    return d >= startOfLastWeek && d < startOfThisWeek;
  });

  // Monthly Stats
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthLogs = logs.filter(l => new Date(l.logged_date) >= startOfMonth);
  const lastMonthLogs = logs.filter(l => {
    const d = new Date(l.logged_date);
    return d >= startOfLastMonth && d < startOfMonth;
  });

  const getStats = (currentLogs: HabitLog[], previousLogs: HabitLog[]) => {
    const currentMins = currentLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const previousMins = previousLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    
    let percentage = 0;
    if (previousMins > 0) percentage = ((currentMins - previousMins) / previousMins) * 100;
    else if (currentMins > 0) percentage = 100;

    // Breakdown per habit
    const breakdown = habits.map(h => {
      const mins = currentLogs.filter(l => l.habit_id === h.id).reduce((s, l) => s + (l.duration_minutes || 0), 0);
      return { name: h.name, duration: mins, color: h.color };
    }).filter(h => h.duration > 0).sort((a,b) => b.duration - a.duration);

    return { current: currentMins / 60, previous: previousMins / 60, percentage, breakdown };
  };

  const weeklyStats = getStats(thisWeekLogs, lastWeekLogs);
  const monthlyStats = getStats(thisMonthLogs, lastMonthLogs);

  const currentStats = tab === 'weekly' ? weeklyStats : monthlyStats;

  return (
    <>
      <header className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Progress Reports</h1>
          <p className="text-secondary">Analyze your productivity trends.</p>
        </div>
        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${tab === 'weekly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => setTab('weekly')}>Weekly Report</button>
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${tab === 'monthly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => setTab('monthly')}>Monthly Report</button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <div className="flex flex-col gap-10 max-w-6xl">
          
          <div className="grid grid-cols-12 gap-8">
            <div className="card bento-4 flex flex-col justify-center py-10" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="card-label">Total Time ({tab === 'weekly' ? 'This Week' : 'This Month'})</div>
              <div className="text-5xl font-bold mb-3 tracking-tighter">{currentStats.current.toFixed(1)} <span className="text-xl text-muted font-medium">hrs</span></div>
              <div className={`badge ${currentStats.percentage >= 0 ? 'badge-success' : 'badge-error'} self-start mt-2 px-3 py-1`}>
                {currentStats.percentage >= 0 ? '+' : ''}{currentStats.percentage.toFixed(0)}% vs last {tab === 'weekly' ? 'week' : 'month'}
              </div>
            </div>

            <div className="card bento-8 flex flex-col min-h-[350px] overflow-visible" style={{ gap: '2rem' }}>
              <div className="card-label">Habit Breakdown (Hours Spent)</div>
              {currentStats.breakdown.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-secondary py-10">No data for this time period yet.</div>
              ) : (
                <div className="flex-1" style={{ width: '100%', minHeight: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentStats.breakdown.map(b => ({ ...b, hours: Number((b.duration/60).toFixed(1)) }))} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(var(--accent-rgb), 0.05)'}}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                      />
                      <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={32}>
                        {currentStats.breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="card bento-12 mt-4">
            <div className="card-label mb-8">Detailed Statistics</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStats.breakdown.length === 0 ? (
                <p className="text-secondary">No habits tracked in this period.</p>
              ) : currentStats.breakdown.map((b, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: b.color }} />
                      <span className="font-semibold">{b.name}</span>
                   </div>
                   <div className="text-secondary text-sm">
                      <span className="font-bold text-[var(--text-primary)]">{Math.floor(b.duration / 60)}h {b.duration % 60}m</span> total time
                   </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </>
  );
}

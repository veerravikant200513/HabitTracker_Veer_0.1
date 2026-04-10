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

  // Weekly Stats
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekLogs = logs.filter(l => new Date(l.logged_date) >= oneWeekAgo);
  const lastWeekLogs = logs.filter(l => {
    const d = new Date(l.logged_date);
    return d >= twoWeeksAgo && d < oneWeekAgo;
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
        <div className="flex flex-col gap-8 max-w-5xl">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bento-4 flex flex-col justify-center">
              <div className="card-label">Total Time ({tab === 'weekly' ? 'This Week' : 'This Month'})</div>
              <div className="text-4xl font-bold mb-2">{currentStats.current.toFixed(1)} <span className="text-xl text-muted">hrs</span></div>
              <div className={`badge ${currentStats.percentage >= 0 ? 'badge-success' : 'badge-error'} self-start`}>
                {currentStats.percentage >= 0 ? '+' : ''}{currentStats.percentage.toFixed(0)}% vs last {tab === 'weekly' ? 'week' : 'month'}
              </div>
            </div>

            <div className="card bento-8 min-h-[250px]">
              <div className="card-label mb-4">Time Breakdown (Hours)</div>
              {currentStats.breakdown.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted">No activity to report.</div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentStats.breakdown.map(b => ({ ...b, hours: Number((b.duration/60).toFixed(1)) }))} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                      />
                      <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={24}>
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

          <div className="card bento-12">
            <div className="card-label mb-6">Detailed Habits</div>
            <div className="flex flex-col gap-4">
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

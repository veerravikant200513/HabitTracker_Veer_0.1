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
  const [reportDate, setReportDate] = useState(new Date());

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

  const currentPeriodStart = tab === 'weekly' ? getStartOfWeek(reportDate) : new Date(reportDate.getFullYear(), reportDate.getMonth(), 1);
  const previousPeriodStart = tab === 'weekly' 
    ? new Date(currentPeriodStart.getTime() - 7 * 24 * 60 * 60 * 1000) 
    : new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 1, 1);
  const currentPeriodEnd = tab === 'weekly'
    ? new Date(currentPeriodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, 1);

  const currentLogs = logs.filter(l => {
    const d = new Date(l.logged_date);
    return d >= currentPeriodStart && d < currentPeriodEnd;
  });
  const previousLogs = logs.filter(l => {
    const d = new Date(l.logged_date);
    return d >= previousPeriodStart && d < currentPeriodStart;
  });

  const shiftDate = (amount: number) => {
    const nextDate = new Date(reportDate);
    if (tab === 'weekly') nextDate.setDate(nextDate.getDate() + amount * 7);
    else nextDate.setMonth(nextDate.getMonth() + amount);
    setReportDate(nextDate);
  };

  const getDisplayTitle = () => {
    if (tab === 'monthly') return reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const end = new Date(currentPeriodStart);
    end.setDate(end.getDate() + 6);
    return `${currentPeriodStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`;
  };

  const getPeriodLabel = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (tab === 'weekly') {
      const startOfCurrentWeek = getStartOfWeek(today);
      const diffDays = Math.round((currentPeriodStart.getTime() - startOfCurrentWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (diffDays === 0) return 'This Week';
      if (diffDays === -1) return 'Last Week';
      if (diffDays === 1) return 'Next Week';
      
      // Otherwise show dates
      const end = new Date(currentPeriodStart);
      end.setDate(end.getDate() + 6);
      return `${currentPeriodStart.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined, {month:'short', day:'numeric'})}`;
    } else {
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const diffMonths = (currentPeriodStart.getFullYear() - startOfCurrentMonth.getFullYear()) * 12 + (currentPeriodStart.getMonth() - startOfCurrentMonth.getMonth());
      
      if (diffMonths === 0) return 'This Month';
      if (diffMonths === -1) return 'Last Month';
      if (diffMonths === 1) return 'Next Month';
      
      return currentPeriodStart.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
  };

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

  const periodStats = getStats(currentLogs, previousLogs);

  return (
    <>
      <header className="page-header flex flex-col items-center justify-between gap-6 mb-8 md:flex-row">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{tab === 'weekly' ? 'Weekly' : 'Monthly'} Progress</h1>
          <p className="text-secondary">{getDisplayTitle()}</p>
        </div>

        {/* Navigation segment */}
        <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
           <button className="px-3 py-1 hover:text-[var(--text-primary)] text-secondary transition-colors" onClick={() => shiftDate(-1)}>❮</button>
           <button className="px-4 py-1 font-medium hover:text-[var(--text-primary)] text-secondary transition-colors text-sm border-x border-[var(--border)] min-w-[100px] text-center" onClick={() => setReportDate(new Date())}>
             {getPeriodLabel()}
           </button>
           <button className="px-3 py-1 hover:text-[var(--text-primary)] text-secondary transition-colors" onClick={() => shiftDate(1)}>❯</button>
        </div>

        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${tab === 'weekly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => { setTab('weekly'); setReportDate(new Date()); }}>Weekly</button>
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${tab === 'monthly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => { setTab('monthly'); setReportDate(new Date()); }}>Monthly</button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <div className="flex flex-col gap-10 max-w-6xl">
          
          <div className="grid grid-cols-12 gap-8">
            <div className="card bento-4 flex flex-col justify-center py-10" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="card-label">Total Time</div>
              <div className="text-5xl font-bold mb-3 tracking-tighter">{periodStats.current.toFixed(1)} <span className="text-xl text-muted font-medium">hrs</span></div>
              <div className={`badge ${periodStats.percentage >= 0 ? 'badge-success' : 'badge-error'} self-start mt-2 px-3 py-1`}>
                {periodStats.percentage >= 0 ? '+' : ''}{periodStats.percentage.toFixed(0)}% vs last period
              </div>
            </div>

            <div className="card bento-8 flex flex-col min-h-[350px] overflow-visible" style={{ gap: '2rem' }}>
              <div className="card-label">Habit Breakdown (Hours Spent)</div>
              {periodStats.breakdown.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-secondary py-10">No data for this time period yet.</div>
              ) : (
                <div className="flex-1" style={{ width: '100%', minHeight: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodStats.breakdown.map(b => ({ ...b, hours: Number((b.duration/60).toFixed(1)) }))} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(var(--accent-rgb), 0.05)'}}
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#ffffff' }}
                      />
                      <Bar dataKey="hours" radius={[0, 6, 6, 0]} barSize={32}>
                        {periodStats.breakdown.map((entry, index) => (
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
              {periodStats.breakdown.length === 0 ? (
                <p className="text-secondary">No habits tracked in this period.</p>
              ) : periodStats.breakdown.map((b, i) => (
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

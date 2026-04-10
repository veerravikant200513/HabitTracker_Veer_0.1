'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog } from '@/types';

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (view === 'monthly') newDate.setMonth(newDate.getMonth() + amount);
    if (view === 'weekly') newDate.setDate(newDate.getDate() + amount * 7);
    if (view === 'daily') newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  const renderMonthly = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-2 mt-4 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-semibold text-muted mb-2">{day}</div>
        ))}
        {blanks.map(b => <div key={`blank-${b}`} className="p-2" />)}
        {days.map(d => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayLogs = logs.filter(l => l.logged_date === dateStr);
          const totalDuration = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
          
          return (
            <div key={d} className="card p-2 min-h-[80px] flex flex-col items-center hover:border-[var(--accent)] transition-colors cursor-pointer" onClick={() => { setView('daily'); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d)); }}>
              <span className="text-sm font-semibold mb-1">{d}</span>
              {totalDuration > 0 && <span className="text-xs text-accent">{Math.floor(totalDuration/60)}h {totalDuration%60}m</span>}
              <div className="flex gap-1 mt-auto flex-wrap justify-center overflow-hidden h-4">
                {dayLogs.slice(0,4).map((l, i) => {
                  const habit = habits.find(h => h.id === l.habit_id);
                  return habit ? <div key={i} className="w-2 h-2 rounded-full" style={{ background: habit.color }} title={habit.name} /> : null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekly = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div className="flex flex-col gap-4 mt-4">
        {days.map((day, idx) => {
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
          const dayLogs = logs.filter(l => l.logged_date === dateStr);
          
          return (
            <div key={idx} className="card p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-24 flex-shrink-0">
                <div className="text-sm text-muted">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}</div>
                <div className="text-xl font-bold">{day.getDate()} {day.toLocaleString('default', { month: 'short' })}</div>
              </div>
              <div className="flex-1 w-full">
                {dayLogs.length === 0 ? (
                  <span className="text-sm text-secondary">No activity</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dayLogs.map((log, i) => {
                      const habit = habits.find(h => h.id === log.habit_id);
                      if (!habit) return null;
                      return (
                        <div key={i} className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{ background: habit.color }} />
                           <span className="text-sm font-medium w-32 truncate">{habit.name}</span>
                           <span className="text-sm text-accent">{log.duration_minutes}m</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  const renderDaily = () => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayLogs = logs.filter(l => l.logged_date === dateStr);
    
    return (
      <div className="card bento-12 min-h-[400px] mt-4">
         <h2 className="text-xl mb-6 border-b border-[var(--border)] pb-4">{currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
         {dayLogs.length === 0 ? (
           <div className="text-center text-muted py-10">No habits logged on this day.</div>
         ) : (
           <div className="flex flex-col gap-4">
             {dayLogs.map((log, i) => {
                const habit = habits.find(h => h.id === log.habit_id);
                if (!habit) return null;
                return (
                  <div key={i} className="habit-row">
                    <div className="habit-icon" style={{ background: `${habit.color}20`, color: habit.color }}>
                      {habit.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{habit.name}</div>
                      <div className="text-xs text-secondary mt-1">{log.duration_minutes} minutes logged</div>
                    </div>
                  </div>
                )
             })}
           </div>
         )}
      </div>
    );
  };

  const getDisplayTitle = () => {
    if (view === 'monthly') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (view === 'weekly') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`;
    }
    return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <header className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-secondary">Track your habit history over time.</p>
        </div>
        
        <div className="flex bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${view === 'daily' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => setView('daily')}>Daily</button>
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${view === 'weekly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => setView('weekly')}>Weekly</button>
           <button className={`px-4 py-1 text-sm rounded-md transition-colors ${view === 'monthly' ? 'bg-[var(--accent)] text-white' : 'text-secondary hover:text-primary'}`} onClick={() => setView('monthly')}>Monthly</button>
        </div>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)]">
            <button className="btn-icon" onClick={() => changeDate(-1)}>←</button>
            <div className="text-xl font-bold">{getDisplayTitle()}</div>
            <button className="btn-icon" onClick={() => changeDate(1)}>→</button>
          </div>
          
          {view === 'monthly' && renderMonthly()}
          {view === 'weekly' && renderWeekly()}
          {view === 'daily' && renderDaily()}
        </div>
      )}
    </>
  );
}

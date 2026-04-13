'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog } from '@/types';
import { TimelineSwitcher } from '@/components/ui/timeline-switcher';

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

  const setToday = () => setCurrentDate(new Date());

  const renderMonthly = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Calculate total rows to fill the grid properly
    const totalCells = blanks.length + days.length;
    const trailingBlanksCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const trailingBlanks = Array.from({ length: trailingBlanksCount }, (_, i) => i);

    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--bg-card)' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-semibold text-muted text-center py-3">{day}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {blanks.map(b => (
            <div key={`blank-${b}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: 120, background: 'rgba(255,255,255,0.01)' }} />
          ))}
          
          {days.map(d => {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayLogs = logs.filter(l => l.logged_date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            return (
              <div 
                key={d} 
                onClick={() => { setView('daily'); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d)); }}
                style={{ 
                  borderRight: '1px solid var(--border)', 
                  borderBottom: '1px solid var(--border)', 
                  minHeight: 120, 
                  padding: '8px', 
                  cursor: 'pointer',
                  position: 'relative'
                }}
                className="hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex justify-end mb-2">
                   <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--accent)] text-white' : 'text-secondary'}`}>
                      {d}
                   </span>
                </div>
                
                <div className="flex flex-col gap-1 overflow-hidden h-[75px]" style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}>
                  {dayLogs.map((l, i) => {
                    const habit = habits.find(h => h.id === l.habit_id);
                    if (!habit) return null;
                    return (
                      <div key={i} className="text-[10px] px-2 py-1 rounded truncate font-medium flex items-center gap-1" style={{ background: `${habit.color}15`, color: habit.color, borderLeft: `2px solid ${habit.color}` }}>
                        <span className="opacity-70">{habit.icon}</span> {habit.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {trailingBlanks.map(b => (
            <div key={`t-blank-${b}`} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: 120, background: 'rgba(255,255,255,0.01)' }} />
          ))}
        </div>
      </div>
    );
  };

  const renderWeekly = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', background: 'var(--bg-card)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {days.map(day => (
            <div key={day.toISOString()} className="text-center py-3">
               <div className="text-xs font-semibold text-muted">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()]}</div>
               <div className="text-xl font-bold mt-1 text-primary">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
           {days.map((day, idx) => {
              const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const dayLogs = logs.filter(l => l.logged_date === dateStr);
              
              return (
                <div key={idx} style={{ borderRight: '1px solid var(--border)', minHeight: 400, padding: '8px' }}>
                  <div className="flex flex-col gap-2">
                    {dayLogs.map((log, i) => {
                      const habit = habits.find(h => h.id === log.habit_id);
                      if (!habit) return null;
                      return (
                        <div key={i} className="text-[11px] p-2 rounded-md font-medium" style={{ background: `${habit.color}15`, color: habit.color, borderLeft: `3px solid ${habit.color}` }}>
                           <div className="font-bold flex items-center justify-between mb-1">
                             <span className="truncate pr-1">{habit.icon} {habit.name}</span>
                           </div>
                           <div className="opacity-80">{log.duration_minutes} min logged</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
           })}
        </div>
      </div>
    );
  };

  const renderDaily = () => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const dayLogs = logs.filter(l => l.logged_date === dateStr);
    
    return (
      <div className="card bento-12 min-h-[400px]">
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
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString(undefined, {month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'})}`;
    }
    return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <header className="page-header flex flex-col items-center justify-between gap-6 mb-8 md:flex-row">
        <h1 className="text-3xl font-bold tracking-tight min-w-[250px]">{getDisplayTitle()}</h1>
        
        {/* View Switcher segment */}
        <TimelineSwitcher view={view} onViewChange={setView} />

        {/* Navigation segment */}
        <div className="flex gap-2 min-w-[250px] justify-end">
           <div className="flex items-center bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1">
             <button className="px-3 py-1 hover:text-[var(--text-primary)] text-secondary transition-colors" onClick={() => changeDate(-1)}>
               ❮
             </button>
             <button className="px-4 py-1 font-medium hover:text-[var(--text-primary)] text-secondary transition-colors text-sm border-x border-[var(--border)]" onClick={setToday}>
               {view === 'daily' ? 'Today' : view === 'weekly' ? 'This Week' : 'This Month'}
             </button>
             <button className="px-3 py-1 hover:text-[var(--text-primary)] text-secondary transition-colors" onClick={() => changeDate(1)}>
               ❯
             </button>
           </div>
        </div>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : (
        <div className="w-full">
          {view === 'monthly' && renderMonthly()}
          {view === 'weekly' && renderWeekly()}
          {view === 'daily' && renderDaily()}
        </div>
      )}
    </>
  );
}

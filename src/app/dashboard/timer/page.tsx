'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Habit } from '@/types';

export default function TimerPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual entry state
  const [manualMinutes, setManualMinutes] = useState('');

  useEffect(() => {
    async function fetchHabits() {
      const supabase = createClient();
      const { data, error } = await supabase.from('habits').select('*').eq('is_active', true);
      if (!error && data) {
        setHabits(data);
        if (data.length > 0) setSelectedHabitId(data[0].id);
      }
      setLoading(false);
    }
    fetchHabits();
    return () => clearInterval(intervalRef.current!);
  }, []);

  function toggleTimer() {
    if (!selectedHabitId) {
      toast.error('Please select a habit first');
      return;
    }
    
    if (isActive) {
      // Pause
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (startTimeRef.current) {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
      startTimeRef.current = null;
    } else {
      // Start/Resume
      startTimeRef.current = Date.now() - (seconds * 1000);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 100); // Check more frequently for smoothness
    }
    setIsActive(!isActive);
  }

  async function saveSession() {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    let finalSeconds = seconds;
    if (startTimeRef.current) {
      finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    
    const minutes = Math.max(1, Math.round(finalSeconds / 60));
    
    await logTime(minutes);
    setSeconds(0);
    startTimeRef.current = null;
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(manualMinutes, 10);
    if (!mins || mins <= 0) return;
    
    await logTime(mins);
    setManualMinutes('');
  }

  async function logTime(minutes: number) {
    if (!selectedHabitId) return;
    const toastId = toast.loading('Logging time...');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { error } = await supabase.from('habit_logs').insert({
      user_id: user.id,
      habit_id: selectedHabitId,
      logged_date: new Date().toISOString().split('T')[0],
      duration_minutes: minutes
    });

    if (error) {
       toast.error('Failed to log time', { id: toastId });
    } else {
       toast.success(`Logged ${minutes} minutes successfully! Mastery increased ✨`, { id: toastId });
    }
  }

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <>
      <header className="page-header text-center pt-8">
        <h1 className="text-3xl font-bold">Focus Session</h1>
        <p className="text-secondary">Track time to earn mastery points.</p>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : habits.length === 0 ? (
        <div className="empty-state">
           <p>You need to create a habit before you can log time.</p>
        </div>
      ) : (
        <div className="max-w-md mx-auto flex flex-col gap-8">
          
          <div className="card bento-12 flex flex-col items-center p-10 text-center relative overflow-hidden" 
               style={{ 
                 borderColor: isActive ? selectedHabit?.color : 'var(--border-medium)',
                 boxShadow: isActive ? `0 0 30px ${selectedHabit?.color}30` : 'none'
               }}>
            
            <select 
              className="input mb-8 text-center appearance-none bg-transparent border-none text-xl font-semibold cursor-pointer outline-none hover:bg-[var(--bg-elevated)]"
              value={selectedHabitId}
              onChange={e => setSelectedHabitId(e.target.value)}
              disabled={isActive}
            >
              {habits.map(h => (
                <option key={h.id} value={h.id} className="bg-[var(--bg-elevated)]">{h.icon} {h.name}</option>
              ))}
            </select>

            <div className={`timer-display mb-8 ${isActive ? 'pulse' : ''}`} style={{ color: isActive ? selectedHabit?.color : 'var(--text-primary)' }}>
              {formatTime(seconds)}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={toggleTimer} 
                className={`btn btn-lg ${isActive ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: 140 }}
              >
                {isActive ? 'Pause' : (seconds > 0 ? 'Resume' : 'Start Focus')}
              </button>
              
              {seconds > 0 && !isActive && (
                <button onClick={saveSession} className="btn btn-lg btn-success" style={{ background: 'var(--success)', color: 'white' }}>
                  Save Session
                </button>
              )}
            </div>
          </div>

          <div className="card bento-12">
             <h3 className="text-base mb-4 font-semibold text-secondary">Manual Entry</h3>
             <form onSubmit={handleManualSubmit} className="flex gap-3">
                <input 
                  type="number" 
                  min="1" 
                  className="input flex-1" 
                  placeholder="Minutes spent (e.g. 45)" 
                  value={manualMinutes}
                  onChange={e => setManualMinutes(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" disabled={!manualMinutes}>Log Time</button>
             </form>
          </div>

        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMasteryInfo } from '@/lib/mastery';
import { calculateStreak } from '@/lib/utils';
import Link from 'next/link';
import { Habit, MasteryInfo, HabitLog } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [mastery, setMastery] = useState<MasteryInfo | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(user.email?.split('@')[0] || 'User');

      const { data: habitsData } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
      const { data: logsData } = await supabase.from('habit_logs').select('*');

      setHabits(habitsData || []);
      setLogs((logsData as HabitLog[]) || []);

      const totalMinutes = (logsData as HabitLog[])?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
      setMastery(getMasteryInfo(totalMinutes));
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Derived state
  const completedTodayCount = 0; // Will be implemented with daily check logic
  const activeProjectsCount = 0; // Will implement project fetching
  const now = new Date();
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
  
  const thisWeekMinutes = logs
    .filter(l => {
       const d = new Date(l.logged_date);
       return d >= startOfThisWeek;
    })
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  
  const lastWeekMinutes = logs
    .filter(l => {
      const d = new Date(l.logged_date);
      return d >= startOfLastWeek && d < startOfThisWeek;
    })
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    
  const thisWeekHours = thisWeekMinutes / 60;
  
  let percentageChange = 0;
  if (lastWeekMinutes > 0) percentageChange = ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100;
  else if (thisWeekMinutes > 0) percentageChange = 100;
  
  const isPositive = percentageChange >= 0;
  return (
    <>
      <header className="page-header">
        <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
        <p className="text-secondary">Here is your progress at a glance.</p>
      </header>

      <div className="bento-grid">
        {/* Ranked Mastery Card */}
        <div className="card bento-6 p-6" style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(145deg, var(--bg-card) 0%, ${mastery?.glowColor || 'var(--bg-elevated)'} 150%)`
        }}>
          <div className="card-label">Current Rank</div>
          <div className="flex items-center gap-4 mb-4">
            <div style={{
              fontSize: '3rem',
              filter: `drop-shadow(0 0 15px ${mastery?.glowColor || 'transparent'})`
            }} className="mastery-glow">
              {mastery?.emoji}
            </div>
            <div>
              <h2 style={{ color: mastery?.color || 'var(--text-primary)', fontSize: '1.8rem', margin: 0, textTransform: 'capitalize' }}>
                {mastery?.label} Mastery
              </h2>
              <p className="text-sm text-secondary">{mastery?.totalHours} hours logged</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-muted">Progress to {mastery?.nextLevel}</span>
              <span className="text-secondary font-medium">{Math.floor(mastery?.progress || 0)}%</span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${mastery?.progress || 0}%`,
                  background: `linear-gradient(90deg, ${mastery?.color || 'var(--accent)'}, ${mastery?.glowColor || 'var(--accent-light)'})`
                }}
              />
            </div>
            {mastery?.hoursToNext && (
              <p className="text-xs text-muted mt-2">{mastery.hoursToNext} hours needed to level up</p>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="card bento-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="card-label mb-2">Time This Week</div>
          <div className="stat-value text-3xl mb-1">{thisWeekHours.toFixed(1)}<span className="text-lg text-muted">h</span></div>
          <div className={`badge ${isPositive ? 'badge-success' : 'badge-error'} inline-flex`}>
            {isPositive ? '+' : ''}{percentageChange.toFixed(0)}% vs last week
          </div>
        </div>

        <div className="card bento-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="card-label mb-2">Active Projects</div>
          <div className="stat-value text-3xl mb-1">{activeProjectsCount}</div>
          <Link href="/dashboard/projects" className="text-sm text-accent hover:underline mt-1">View projects →</Link>
        </div>

        {/* Habits Checklist */}
        <div className="card bento-8">
          <div className="flex justify-between items-center mb-4">
            <div className="card-label mb-0">Daily Habits</div>
            <span className="text-sm font-medium text-secondary">{completedTodayCount}/{habits.length} completed</span>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted text-sm mb-4">No habits defined yet.</p>
              <Link href="/dashboard/habits" className="btn btn-sm btn-primary">Define Habits</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {habits.slice(0, 4).map(habit => {
                const habitLogs = logs.filter(l => l.habit_id === habit.id).map(l => l.logged_date);
                const streaks = calculateStreak(habitLogs);
                
                return (
                  <div key={habit.id} className="habit-row">
                    <div className="check-circle" />
                    <div className="habit-icon" style={{ background: `${habit.color}20`, color: habit.color }}>
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{habit.name}</div>
                      <div className="text-xs text-secondary mt-1 line-clamp-2 whitespace-normal">{habit.description || habit.category}</div>
                    </div>
                    <div className="flex gap-2">
                       <span className="badge badge-muted">🔥 {streaks.current}</span>
                    </div>
                  </div>
                )
              })}
              {habits.length > 4 && (
                 <Link href="/dashboard/habits" className="text-center text-sm text-secondary hover:text-primary mt-2">
                   View {habits.length - 4} more
                 </Link>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card bento-4 flex flex-col gap-4">
          <div className="card-label">Quick Actions</div>
          <Link href="/dashboard/timer" className="btn btn-primary w-full p-4 flex justify-between items-center bg-gradient-to-r from-accent to-accent-light text-white rounded-xl shadow-[0_4px_15px_var(--accent-glow)] transition-transform hover:-translate-y-1">
            <span className="font-bold">Start Timer</span>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
          </Link>
          <button className="btn btn-secondary w-full p-4 flex justify-between items-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]">
            <span className="font-medium">Log Time Manually</span>
            <span style={{ fontSize: '1.2rem' }}>📝</span>
          </button>
        </div>
      </div>
    </>
  );
}

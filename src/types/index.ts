export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  category: string;
  target_minutes_per_day: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  logged_date: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed';
  color: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  sort_order: number;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  habit_id?: string;
  title: string;
  message?: string;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
}

export type MasteryLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'emerald';

export interface MasteryInfo {
  level: MasteryLevel;
  label: string;
  emoji: string;
  minHours: number;
  maxHours: number | null;
  color: string;
  glowColor: string;
  nextLevel?: string;
  hoursToNext?: number;
  progress: number;
  totalHours: number;
}

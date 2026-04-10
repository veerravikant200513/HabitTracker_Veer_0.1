'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Habit } from '@/types';

export default function HabitsPage() {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📖');
  const [color, setColor] = useState('#7c6af7');
  const [category, setCategory] = useState('Learning');
  const [targetMinutes, setTargetMinutes] = useState('30');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  async function fetchHabits() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setHabits(data);
    }
    setLoading(false);
  }

  function openModal(habit: Habit | null = null) {
    if (habit) {
      setEditingHabit(habit);
      setName(habit.name);
      setDescription(habit.description || '');
      setIcon(habit.icon);
      setColor(habit.color);
      setCategory(habit.category);
      setTargetMinutes(habit.target_minutes_per_day.toString());
    } else {
      setEditingHabit(null);
      setName('');
      setDescription('');
      setIcon('📖');
      setColor('#7c6af7');
      setCategory('Learning');
      setTargetMinutes('30');
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingHabit(null);
  }

  async function saveHabit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const habitData = {
      user_id: user.id,
      name,
      description,
      icon,
      color,
      category,
      target_minutes_per_day: parseInt(targetMinutes, 10),
      is_active: true
    };

    if (editingHabit) {
      const { error } = await supabase.from('habits').update(habitData).eq('id', editingHabit.id);
      if (error) toast.error('Failed to update habit');
      else {
        toast.success('Habit updated!');
        fetchHabits();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('habits').insert(habitData);
      if (error) toast.error('Failed to create habit');
      else {
        toast.success('Habit created!');
        fetchHabits();
        closeModal();
      }
    }
    setIsSaving(false);
  }

  async function toggleActive(habit: Habit) {
    const supabase = createClient();
    const { error } = await supabase.from('habits').update({ is_active: !habit.is_active }).eq('id', habit.id);
    if (!error) {
      setHabits(habits.map(h => h.id === habit.id ? { ...h, is_active: !h.is_active } : h));
      toast.success(`Habit ${habit.is_active ? 'archived' : 'activated'}`);
    } else {
      toast.error('Could not update habit');
    }
  }

  const COLORS = ['#7c6af7', '#22c55e', '#38bdf8', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];
  const ICONS = ['📖', '💪', '🧘', '💻', '🎨', '🏃', '🎸', '💧', '🥗'];

  return (
    <>
      <header className="page-header flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Your Habits</h1>
          <p className="text-secondary">Define routines to level up your mastery.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>+ New Habit</button>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : habits.length === 0 ? (
        <div className="card bento-12 text-center py-16">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="mb-2">No habits yet</h3>
          <p className="text-secondary mb-6 max-w-md mx-auto">Habits are the compound interest of self-improvement. Start by tracking something small.</p>
          <button className="btn btn-primary" onClick={() => openModal()}>Create your first habit</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="card flex flex-col hover:border-[var(--border-strong)] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="habit-icon" style={{ background: `${habit.color}20`, color: habit.color }}>{habit.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{habit.name}</h3>
                    <div className="text-xs text-muted mt-1">{habit.category}</div>
                  </div>
                </div>
                <button
                  onClick={() => openModal(habit)}
                  className="btn-icon p-1"
                  title="Edit habit"
                >
                  ✏️
                </button>
              </div>
              <p className="text-sm text-secondary flex-1 mb-4">{habit.description || 'No description'}</p>
              
              <div className="divider opacity-50 my-2" />
              
              <div className="flex justify-between items-center text-xs text-muted">
                <span>{habit.target_minutes_per_day} min / day</span>
                <button 
                  onClick={() => toggleActive(habit)}
                  className={`${habit.is_active ? 'text-success' : 'text-muted hover:text-primary'} transition-colors`}
                >
                  {habit.is_active ? 'Active' : 'Archived'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="mb-6">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h2>
            
            <form onSubmit={saveHabit} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Habit Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Morning Workout" />
              </div>

              <div className="input-group">
                <label className="input-label">Description (optional)</label>
                <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Why are you doing this?" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Health</option>
                    <option>Learning</option>
                    <option>Work</option>
                    <option>Creative</option>
                    <option>Mindfulness</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Daily Target (min)</label>
                  <input type="number" min="1" className="input" value={targetMinutes} onChange={e => setTargetMinutes(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <div 
                      key={c} 
                      className={`color-dot ${color === c ? 'selected' : ''}`} 
                      style={{ background: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Icon</label>
                <div className="flex gap-2 text-2xl flex-wrap">
                  {ICONS.map(i => (
                    <span 
                      key={i} 
                      className={`cursor-pointer border-2 p-1 rounded-md transition-all ${icon === i ? 'border-white shadow-[0_0_0_2px_var(--accent)] bg-[var(--bg-elevated)]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      onClick={() => setIcon(i)}
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <span className="spinner" /> : (editingHabit ? 'Save Changes' : 'Create Habit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

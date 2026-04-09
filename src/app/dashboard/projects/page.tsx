'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Project, Milestone } from '@/types';

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [color, setColor] = useState('#38bdf8');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
  }

  function openModal(project: Project | null = null) {
    if (project) {
      setEditingProject(project);
      setName(project.name);
      setDescription(project.description || '');
      setPriority(project.priority);
      setColor(project.color);
    } else {
      setEditingProject(null);
      setName('');
      setDescription('');
      setPriority('medium');
      setColor('#38bdf8');
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProject(null);
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const projectData = {
      user_id: user.id,
      name,
      description,
      priority,
      color,
      status: editingProject ? editingProject.status : 'active'
    };

    if (editingProject) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
      if (error) toast.error('Failed to update project');
      else {
        toast.success('Project updated!');
        fetchProjects();
        closeModal();
      }
    } else {
      const { error } = await supabase.from('projects').insert(projectData);
      if (error) toast.error('Failed to create project');
      else {
        toast.success('Project created!');
        fetchProjects();
        closeModal();
      }
    }
    setIsSaving(false);
  }

  const COLORS = ['#7c6af7', '#22c55e', '#38bdf8', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

  return (
    <>
      <header className="page-header flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-secondary">Track milestones and larger goals.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>+ New Project</button>
      </header>

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : projects.length === 0 ? (
        <div className="card bento-12 text-center py-16">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="mb-2">No active projects</h3>
          <p className="text-secondary mb-6 max-w-md mx-auto">Projects are great for tracking one-off goals or multi-step processes.</p>
          <button className="btn btn-primary" onClick={() => openModal()}>Start a Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project.id} className="card hover:border-[var(--border-strong)] transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: project.color }} />
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                </div>
                <div className="flex gap-2">
                  <span className={`badge priority-${project.priority}`}>{project.priority}</span>
                  <button onClick={() => openModal(project)} className="btn-icon p-1 text-xs">✏️</button>
                </div>
              </div>
              <p className="text-sm text-secondary mb-4">{project.description || 'No description'}</p>
              
              <div className="flex justify-between items-center text-xs mt-4">
                 <span className="text-muted">Status: <span className="capitalize text-primary">{project.status}</span></span>
                 <button className="text-accent hover:underline">View Milestones →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="mb-6">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
            
            <form onSubmit={saveProject} className="flex flex-col gap-4">
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Build Mobile App" />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is the goal?" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select className="input" value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Color Theme</label>
                  <div className="color-picker" style={{ gap: 4 }}>
                    {COLORS.map(c => (
                      <div 
                        key={c} 
                        className={`color-dot ${color === c ? 'selected' : ''}`} 
                        style={{ background: c, width: 24, height: 24 }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <span className="spinner" /> : (editingProject ? 'Save Changes' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

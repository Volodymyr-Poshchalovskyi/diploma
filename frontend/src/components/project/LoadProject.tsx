import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuth } from '../../hooks/useAuth';
import type { Layer } from '../../types';

interface Project {
  id: string;
  name: string;
  config: { layers: Layer[] };
  created_at: string;
}

export default function LoadProject() {
  const { user } = useAuth();
  const { setLayers } = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('projects')
      .select('id, name, config, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setProjects(data as Project[]));
  }, [user, open]);

  const load = (p: Project) => {
    setLayers(p.config.layers);
    setOpen(false);
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('projects').delete().eq('id', id);
    setProjects(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '6px', background: '#f9f9f9', cursor: 'pointer', fontSize: '0.85rem', color: '#444' }}
      >
        📂 Load saved project
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
          {projects.length === 0 && (
            <p style={{ padding: '0.75rem', color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>No saved projects</p>
          )}
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => load(p)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fafa')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                  {new Date(p.created_at).toLocaleDateString()} · {p.config.layers.length} layer(s)
                </div>
              </div>
              <button
                onClick={e => remove(p.id, e)}
                style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.25rem' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
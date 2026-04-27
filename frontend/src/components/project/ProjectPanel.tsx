import { useEffect, useState } from 'react';
import { Save, FolderOpen, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
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

interface Props {
  projectName: string;
  setProjectName: (name: string) => void;
}

export default function ProjectPanel({ projectName, setProjectName }: Props) {
  const { layers, setLayers } = useProjectStore();
  const { user } = useAuth();
  const [projects, setProjects]   = useState<Project[]>([]);
  const [listOpen, setListOpen]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const loadProjects = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('projects')
      .select('id, name, config, created_at')
      .order('created_at', { ascending: false });
    setProjects((data as Project[]) || []);
  };

  useEffect(() => { loadProjects(); }, [user]);

  const handleSave = async () => {
    if (!projectName.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projectName.trim(),
      config: { layers },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadProjects();
    } else {
      alert('Save failed: ' + error.message);
    }
  };

  const handleLoad = (p: Project) => {
    setLayers(p.config.layers.map(l => ({ ...l, id: crypto.randomUUID() })));
    setProjectName(p.name);
    setListOpen(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('projects').delete().eq('id', id);
    setProjects(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div>
      <p style={s.sectionLabel}>Project</p>

      {/* Single project name input */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <input
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Untitled project"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{
            flex: 1, padding: '0.38rem 0.5rem', border: '1px solid #e5e7eb',
            borderRadius: '6px', fontSize: '0.82rem', outline: 'none',
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !projectName.trim()}
          title="Save project"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.38rem 0.6rem', background: saved ? '#16a34a' : '#01696f',
            color: '#fff', border: 'none', borderRadius: '6px',
            cursor: !projectName.trim() ? 'not-allowed' : 'pointer',
            opacity: !projectName.trim() ? 0.5 : 1, fontSize: '0.78rem', fontWeight: 600,
          }}
        >
          {saved ? <Check size={13} /> : <Save size={13} />}
        </button>
      </div>

      {/* Saved projects list toggle */}
      <button
        onClick={() => { setListOpen(o => !o); if (!listOpen) loadProjects(); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.38rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '6px',
          background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <FolderOpen size={12} />
          Saved projects {projects.length > 0 ? `(${projects.length})` : ''}
        </span>
        {listOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {listOpen && (
        <div style={{
          border: '1px solid #e5e7eb', borderTop: 'none',
          borderRadius: '0 0 6px 6px', background: '#fff',
          maxHeight: '220px', overflowY: 'auto',
        }}>
          {projects.length === 0 && (
            <p style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
              No saved projects
            </p>
          )}
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => handleLoad(p)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0.6rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                  {new Date(p.created_at).toLocaleDateString()} · {p.config.layers.length} layer(s)
                </div>
              </div>
              <button
                onClick={e => handleDelete(p.id, e)}
                style={{
                  color: '#ef4444', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '0.2rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sectionLabel: {
    fontSize: '0.72rem', color: '#6b7280', display: 'block',
    marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em',
  },
};
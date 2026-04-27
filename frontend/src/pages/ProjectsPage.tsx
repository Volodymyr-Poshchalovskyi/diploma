import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useProjectStore } from '../store/useProjectStore';
import { Trash2, ExternalLink, Clock, Layers } from 'lucide-react';
import type { Layer, ProjectSettings } from '../types';

interface SavedProject {
  id: string;
  name: string;
  config: { layers: Layer[], settings: ProjectSettings };
  created_at: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setLayers, updateSettings, setProjectName } = useProjectStore();
  
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('id, name, config, created_at')
      .order('created_at', { ascending: false });
    
    setProjects((data as SavedProject[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  // Функція завантаження проекту в Робочу область
  const handleOpenProject = (p: SavedProject) => {
    if (p.config.layers) {
      setLayers(p.config.layers.map(l => ({ ...l, id: crypto.randomUUID() })));
    }
    if (p.config.settings) {
      updateSettings(p.config.settings);
    }
    setProjectName(p.name);
    // Перекидаємо юзера на робочу область
    navigate('/workspace');
  };

  // Видалення проекту
  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей проект?')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Мої проекти</h1>
        <p style={styles.subtitle}>Керуйте збереженими розрахунками та конфігураціями шарів.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Завантаження проектів...</p>
      ) : projects.length === 0 ? (
        <div style={styles.emptyState}>
          <Layers size={48} color="#d1d5db" strokeWidth={1.5} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>У вас ще немає збережених проектів.</p>
          <button onClick={() => navigate('/workspace')} style={styles.createBtn}>
            Створити новий проект
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map(p => (
            <div key={p.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{p.name}</h3>
                <button onClick={() => handleDelete(p.id)} style={styles.deleteBtn} title="Видалити">
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={styles.cardBody}>
                <p style={styles.metaInfo}>
                  <Layers size={14} /> {p.config.layers?.length || 0} шарів
                </p>
                <p style={styles.metaInfo}>
                  <Clock size={14} /> {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>

              <button onClick={() => handleOpenProject(p)} style={styles.openBtn}>
                <ExternalLink size={14} /> Відкрити проект
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto', width: '100%' },
  header: { marginBottom: 'var(--space-lg)' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' },
  subtitle: { fontSize: '0.9rem', color: 'var(--text-muted)' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' },
  
  card: { background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', transition: 'box-shadow 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deleteBtn: { color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px', cursor: 'pointer', display: 'flex' },
  
  cardBody: { display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.5rem 0' },
  metaInfo: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 },
  
  openBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: '#f3f4f6', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', marginTop: 'auto' },
  
  emptyState: { textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' },
  createBtn: { marginTop: '1rem', padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600 }
};
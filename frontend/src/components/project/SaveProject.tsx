import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuth } from '../../hooks/useAuth';

export default function SaveProject() {
  const { layers } = useProjectStore();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: name.trim(),
      config: { layers },
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setName('');
    } else {
      alert('Save failed: ' + error.message);
    }
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#444' }}>Save Project</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Project name..."
          style={{ flex: 1, padding: '0.35rem 0.5rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem' }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{ padding: '0.35rem 0.75rem', background: saved ? '#38a169' : '#01696f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', opacity: !name.trim() ? 0.5 : 1 }}
        >
          {saved ? '✓' : saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Pencil, Trash2, Check, X, FlaskConical } from 'lucide-react';
import type { Material } from '../types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const emptyForm = { name: '', eps_real: 1, eps_imag: 0, mu_real: 1, mu_imag: 0 };

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Стейт для форми (додавання/редагування)
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Стейт для нотифікацій
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/materials`, { headers });
      const data = await res.json();
      setMaterials(data);
    } catch (e) {
      showToast('Помилка завантаження матеріалів', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { loadMaterials(); }, []);

  const handleOpenAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  
  const handleOpenEdit = (m: Material) => {
    setForm({ name: m.name, eps_real: m.eps_real, eps_imag: m.eps_imag, mu_real: m.mu_real, mu_imag: m.mu_imag });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleCancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast('Назва матеріалу обов\'язкова', 'error');
    setSaving(true);
    try {
      const headers = await getHeaders();
      const url = editId ? `${API}/api/materials/${editId}` : `${API}/api/materials`;
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Помилка збереження');
      
      await loadMaterials();
      handleCancelForm();
      showToast('Матеріал успішно збережено!', 'success');
    } catch (e) {
      showToast('Помилка збереження', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цей матеріал?')) return;
    try {
      const headers = await getHeaders();
      await fetch(`${API}/api/materials/${id}`, { method: 'DELETE', headers });
      setMaterials(ms => ms.filter(m => m.id !== id));
      showToast('Матеріал видалено', 'success');
    } catch (e) {
      showToast('Помилка видалення', 'error');
    }
  };

  const filteredMaterials = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const myMaterials = filteredMaterials.filter(m => m.is_custom);
  const publicMaterials = filteredMaterials.filter(m => !m.is_custom);

  return (
    <div style={styles.container}>
      {toast && (
        <div style={{...styles.toast, background: toast.type === 'success' ? '#10b981' : '#ef4444'}}>
          {toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>База матеріалів</h1>
          <p style={styles.subtitle}>Керуйте параметрами (ε, μ) для швидкого використання у проектах.</p>
        </div>
        <button onClick={handleOpenAdd} style={styles.createBtn}>
          <Plus size={16} /> Додати свій матеріал
        </button>
      </div>

      <div style={styles.searchWrap}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Пошук за назвою..."
          style={styles.searchInput}
        />
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editId ? 'Редагувати матеріал' : 'Новий матеріал'}</h3>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Назва (наприклад: Carbon Fiber)"
            style={styles.formInput}
          />
          <div style={styles.formGrid}>
            {[
              { label: "ε' (Real Permittivity)", key: 'eps_real' },
              { label: "ε'' (Imag Permittivity)", key: 'eps_imag' },
              { label: "μ' (Real Permeability)", key: 'mu_real' },
              { label: "μ'' (Imag Permeability)", key: 'mu_imag' },
            ].map(({ label, key }) => (
              <div key={key} style={styles.inputGroup}>
                <label style={styles.label}>{label}</label>
                <input
                  type="number"
                  step="any"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  style={styles.formInput}
                />
              </div>
            ))}
          </div>
          <div style={styles.formActions}>
            <button onClick={handleCancelForm} style={styles.cancelBtn}>
              <X size={14} /> Скасувати
            </button>
            <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
              <Check size={14} /> {saving ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Завантаження бази...</p>
      ) : (
        <div style={styles.listsContainer}>
          {myMaterials.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Мої матеріали ({myMaterials.length})</h2>
              <div style={styles.grid}>
                {myMaterials.map(m => (
                  <MaterialCard key={m.id} m={m} onEdit={() => handleOpenEdit(m)} onDelete={() => handleDelete(m.id)} isCustom={true} />
                ))}
              </div>
            </div>
          )}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Бібліотека ({publicMaterials.length})</h2>
            <div style={styles.grid}>
              {publicMaterials.map(m => (
                <MaterialCard key={m.id} m={m} isCustom={false} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Підкомпонент для картки матеріалу
function MaterialCard({ m, onEdit, onDelete, isCustom }: { m: Material, onEdit?: () => void, onDelete?: () => void, isCustom: boolean }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlaskConical size={16} color="var(--primary)" />
          <h3 style={styles.cardTitle}>{m.name}</h3>
        </div>
        {isCustom && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={onEdit} style={styles.iconBtn} title="Редагувати"><Pencil size={14} /></button>
            <button onClick={onDelete} style={{...styles.iconBtn, color: '#ef4444'}} title="Видалити"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.paramBox}>
          <span style={styles.paramLabel}>ε (Діелектрична)</span>
          <span style={styles.paramValue}>{m.eps_real}{m.eps_imag ? ` + ${m.eps_imag}j` : ''}</span>
        </div>
        <div style={styles.paramBox}>
          <span style={styles.paramLabel}>μ (Магнітна)</span>
          <span style={styles.paramValue}>{m.mu_real}{m.mu_imag ? ` + ${m.mu_imag}j` : ''}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto', width: '100%' },
  toast: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'fadeIn 0.3s ease' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' },
  subtitle: { fontSize: '0.9rem', color: 'var(--text-muted)' },
  createBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  
  searchWrap: { position: 'relative', marginBottom: 'var(--space-lg)', maxWidth: '400px' },
  searchInput: { width: '100%', padding: '10px 10px 10px 36px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', color: 'var(--text-main)', boxSizing: 'border-box' },
  
  formCard: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' },
  formTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginBottom: 'var(--space-md)' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.8rem', color: '#166534', fontWeight: 500 },
  formInput: { width: '100%', padding: '8px 12px', border: '1px solid #d1fae5', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: 'var(--space-sm)' },
  formActions: { display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' },
  cancelBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', color: '#6b7280', border: '1px solid #d1fae5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500 },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 },
  
  listsContainer: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' },
  section: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' },
  card: { background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 },
  iconBtn: { background: '#f3f4f6', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' },
  
  cardBody: { display: 'flex', gap: 'var(--space-md)', marginTop: '4px' },
  paramBox: { flex: 1, background: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' },
  paramLabel: { display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' },
  paramValue: { display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--mono)' }
};
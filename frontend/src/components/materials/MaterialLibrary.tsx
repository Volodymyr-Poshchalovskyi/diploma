import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProjectStore } from '../../store/useProjectStore';
import type { Material } from '../../types';


const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

const emptyForm = { name: '', eps_real: 1, eps_imag: 0, mu_real: 1, mu_imag: 0 };

// ── Small dropdown used inside LayerBuilder ───────────────────────────────
export function MaterialLibraryDropdown({ layerId }: { layerId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [open, setOpen]           = useState(false);
  const [applied, setApplied]     = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { updateLayer } = useProjectStore();

  useEffect(() => {
    supabase.from('materials').select('*').order('name')
      .then(({ data }) => data && setMaterials(data));
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const apply = (m: Material) => {
    updateLayer(layerId, { eps_real: m.eps_real, eps_imag: m.eps_imag, mu_real: m.mu_real, mu_imag: m.mu_imag, label: m.name });
    setApplied(m.name);
    setOpen(false);
    setTimeout(() => setApplied(''), 2000);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        fontSize: '0.85rem', padding: '6px 8px',
        border: '1px solid var(--border-color)', borderRadius: '4px',
        background: applied ? '#f0fdf4' : '#fff',
        color: applied ? '#166534' : 'var(--text-main)', 
        cursor: 'pointer', transition: 'all 0.2s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {applied ? <Check size={14} /> : <BookOpen size={14} color="var(--text-muted)" />}
          <span>{applied || 'Обрати з бази'}</span>
        </div>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: '100%', minWidth: '220px',
          maxHeight: '240px', overflowY: 'auto', padding: '4px 0',
        }}>
          {materials.length === 0 ? (
             <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Завантаження...</div>
          ) : (
            materials.map(m => (
              <button key={m.id} onClick={() => apply(m)} style={{
                display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{m.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                  ε={m.eps_real}{m.eps_imag ? `+${m.eps_imag}j` : ''} · μ={m.mu_real}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Full Materials tab ────────────────────────────────────────────────────
export default function MaterialLibrary({ layerId: _layerId }: { layerId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  const load = async () => {
    setLoading(true);
    const headers = await authHeaders();
    const res = await fetch(`${API}/api/materials`, { headers });
    const data = await res.json();
    setMaterials(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (m: Material) => {
    setForm({ name: m.name, eps_real: m.eps_real, eps_imag: m.eps_imag, mu_real: m.mu_real, mu_imag: m.mu_imag });
    setEditId(m.id);
    setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const headers = await authHeaders();
    const url = editId ? `${API}/api/materials/${editId}` : `${API}/api/materials`;
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers, body: JSON.stringify(form) });
    await load();
    cancelForm();
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this material?')) return;
    const headers = await authHeaders();
    await fetch(`${API}/api/materials/${id}`, { method: 'DELETE', headers });
    setMaterials(ms => ms.filter(m => m.id !== id));
  };

  const publicMats  = materials.filter(m => !m.is_custom);
  const customMats  = materials.filter(m => m.is_custom);
  const filter      = (list: Material[]) =>
    list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Materials
        </span>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.75rem', padding: '0.3rem 0.6rem',
          background: '#01696f', color: '#fff', border: 'none',
          borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
        }}>
          <Plus size={12} /> Add custom
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search materials..."
        style={{
          width: '100%', padding: '0.35rem 0.5rem', marginBottom: '0.75rem',
          border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8rem',
          outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Add/Edit form */}
      {showForm && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
          padding: '0.75rem', marginBottom: '0.75rem',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
            {editId ? 'Edit material' : 'New custom material'}
          </p>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name (e.g. Carbon Fiber)"
            style={{ width: '100%', padding: '0.3rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '5px', fontSize: '0.8rem', marginBottom: '0.4rem', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.4rem' }}>
            {[
              { label: "ε'",  key: 'eps_real' },
              { label: 'ε"',  key: 'eps_imag' },
              { label: "μ'",  key: 'mu_real'  },
              { label: 'μ"',  key: 'mu_imag'  },
            ].map(({ label, key }) => (
              <label key={key} style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                {label}
                <input
                  type="number"
                  step="any"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  style={{ display: 'block', width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.8rem', marginTop: '0.15rem' }}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button onClick={save} disabled={saving || !form.name.trim()} style={{
              flex: 1, padding: '0.35rem', background: '#01696f', color: '#fff',
              border: 'none', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600,
            }}>
              {saving ? '...' : <><Check size={11} /> Save</>}
            </button>
            <button onClick={cancelForm} style={{
              padding: '0.35rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '5px',
              background: '#fff', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem',
            }}>
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Loading...</p>}

      {/* Custom materials */}
      {customMats.length > 0 && (
        <>
          <p style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
            My materials ({filter(customMats).length})
          </p>
          {filter(customMats).map(m => (
            <MaterialRow key={m.id} m={m} onEdit={() => openEdit(m)} onDelete={() => remove(m.id)} isCustom />
          ))}
          <div style={{ height: '1px', background: '#f3f4f6', margin: '0.6rem 0' }} />
        </>
      )}

      {/* Public materials */}
      <p style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
        Library ({filter(publicMats).length})
      </p>
      {filter(publicMats).map(m => (
        <MaterialRow key={m.id} m={m} isCustom={false} />
      ))}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────
function MaterialRow({ m, onEdit, onDelete, isCustom }: {
  m: Material;
  onEdit?: () => void;
  onDelete?: () => void;
  isCustom: boolean;
}) {
  const { layers, updateLayer } = useProjectStore();

  const applyToLayer = (layerId: string) => {
    updateLayer(layerId, { eps_real: m.eps_real, eps_imag: m.eps_imag, mu_real: m.mu_real, mu_imag: m.mu_imag, label: m.name });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.45rem 0.5rem', borderRadius: '6px', marginBottom: '0.2rem',
      border: '1px solid #f3f4f6', background: '#fafafa', gap: '0.5rem',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>{m.name}</div>
        <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace' }}>
          ε={m.eps_real}{m.eps_imag ? `+${m.eps_imag}j` : ''} · μ={m.mu_real}{m.mu_imag ? `+${m.mu_imag}j` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
        {/* Apply to layer dropdown */}
        {layers.length > 0 && (
          <ApplyDropdown m={m} layers={layers} onApply={applyToLayer} />
        )}
        {isCustom && onEdit && (
          <button onClick={onEdit} title="Edit" style={iconBtn}>
            <Pencil size={11} />
          </button>
        )}
        {isCustom && onDelete && (
          <button onClick={onDelete} title="Delete" style={{ ...iconBtn, color: '#ef4444', borderColor: '#fee2e2' }}>
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Apply to layer dropdown ───────────────────────────────────────────────
function ApplyDropdown({ layers, onApply }: { m: Material; layers: any[]; onApply: (id: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [done, setDone]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const apply = (id: string) => {
    onApply(id);
    setOpen(false);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };

  if (layers.length === 1) {
    return (
      <button onClick={() => apply(layers[0].id)} title="Apply to layer" style={{ ...iconBtn, color: done ? '#166534' : '#01696f', borderColor: done ? '#bbf7d0' : '#d1fae5' }}>
        {done ? <Check size={11} /> : <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Apply</span>}
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Apply to layer" style={{ ...iconBtn, color: '#01696f', borderColor: '#d1fae5' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Apply</span>
        <ChevronDown size={9} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 3px)', zIndex: 200,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: '130px', padding: '3px 0',
        }}>
          {layers.map((l, i) => (
            <button key={l.id} onClick={() => apply(l.id)} style={{
              width: '100%', textAlign: 'left', padding: '0.3rem 0.6rem',
              border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#374151',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {l.label || l.name || `Layer ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.15rem',
  padding: '0.22rem 0.35rem', border: '1px solid #e5e7eb',
  borderRadius: '4px', background: '#fff', color: '#6b7280',
  cursor: 'pointer', fontSize: '0.7rem',
};
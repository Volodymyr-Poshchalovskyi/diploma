import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Layer } from '../../types';
import { MaterialLibraryDropdown } from '../materials/MaterialLibrary';

function SortableLayer({ layer, index }: { layer: Layer, index: number }) {
  const { updateLayer, removeLayer } = useProjectStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: '#fff',
    border: `1px solid ${isDragging ? 'var(--primary)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-sm) var(--space-md)',
    marginBottom: 'var(--space-sm)',
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
    zIndex: isDragging ? 999 : 100 - index,
    position: 'relative',
  };

  const InputField = ({ label, keyName, step }: { label: string, keyName: keyof Layer, step: number }) => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type="number"
        step={step}
        value={layer[keyName] as number}
        onChange={e => updateLayer(layer.id, { [keyName]: parseFloat(e.target.value) || 0 })}
        style={styles.input}
      />
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {/* Шапка картки шару */}
      <div style={styles.layerHeader}>
        <div style={styles.layerHeaderLeft}>
          <div {...attributes} {...listeners} style={styles.dragHandle}>
            <GripVertical size={16} />
          </div>
          <input
            value={layer.label || ''}
            onChange={e => updateLayer(layer.id, { label: e.target.value })}
            style={styles.layerNameInput}
            placeholder="Назва шару"
          />
        </div>
        <button onClick={() => removeLayer(layer.id)} style={styles.deleteBtn}>
          <X size={16} />
        </button>
      </div>

      {/* Бібліотека матеріалів + Товщина */}
      <div style={styles.gridRow}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>Матеріал</label>
          <MaterialLibraryDropdown layerId={layer.id} />
        </div>
        <div style={{ flex: 1 }}>
          <InputField label="Товщина (мм)" keyName="thickness_mm" step={0.1} />
        </div>
      </div>

      {/* Параметри ε та μ (Сітка 2x2) */}
      <div style={styles.paramsGrid}>
        <InputField label="ε' (real)" keyName="eps_real" step={0.1} />
        <InputField label="ε'' (imag)" keyName="eps_imag" step={0.01} />
        <InputField label="μ' (real)" keyName="mu_real" step={0.1} />
        <InputField label="μ'' (imag)" keyName="mu_imag" step={0.01} />
      </div>
    </div>
  );
}

export default function LayerBuilder() {
  const { layers, addLayer, reorderLayers } = useProjectStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex(l => l.id === active.id);
      const newIndex = layers.findIndex(l => l.id === over.id);
      reorderLayers(arrayMove(layers, oldIndex, newIndex));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Структура шарів</h3>
        <button onClick={addLayer} style={styles.addBtn}>
          <Plus size={14} /> Додати шар
        </button>
      </div>
      
      {layers.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
          Немає шарів. Додайте перший шар.
        </p>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {layers.map((layer, index) => <SortableLayer key={layer.id} layer={layer} index={index} />)}
        </SortableContext>
      </DndContext>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  addBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 },
  layerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' },
  layerHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
  dragHandle: { cursor: 'grab', color: '#9ca3af', display: 'flex', alignItems: 'center' },
  layerNameInput: { flex: 1, padding: '4px 8px', border: '1px solid transparent', borderRadius: '4px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', background: 'transparent', outline: 'none', transition: 'border 0.2s' },
  deleteBtn: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' },
  
  gridRow: { display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' },
  paramsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs) var(--space-sm)', background: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' },
  
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)', boxSizing: 'border-box' },
};
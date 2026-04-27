import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../../store/useProjectStore';
import type { Layer } from '../../types';
import { MaterialLibraryDropdown } from '../materials/MaterialLibrary';

function SortableLayer({ layer }: { layer: Layer }) {
  const { updateLayer, removeLayer } = useProjectStore();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: layer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '0.5rem',
  };

  const field = (label: string, key: keyof Layer, step = 0.1) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: '#555', minWidth: '90px' }}>{label}</label>
      <input
        type="number"
        step={step}
        value={layer[key] as number}
        onChange={e => updateLayer(layer.id, { [key]: parseFloat(e.target.value) || 0 })}
        style={{ width: '90px', padding: '0.2rem 0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'right' }}
      />
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span {...attributes} {...listeners} style={{ cursor: 'grab', fontSize: '1rem', color: '#aaa' }}>⠿</span>
        <input
          value={layer.label || ''}
          onChange={e => updateLayer(layer.id, { label: e.target.value })}
          style={{ flex: 1, margin: '0 0.5rem', padding: '0.2rem 0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}
        />
        <button onClick={() => removeLayer(layer.id)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        
      </div>
      <div style={{ marginBottom: '0.5rem' }}>
  <MaterialLibraryDropdown layerId={layer.id} />
</div>
      {field('Thickness (mm)', 'thickness_mm', 0.1)}
      {field('ε\'  (eps_real)', 'eps_real', 0.1)}
      {field('ε\'\'  (eps_imag)', 'eps_imag', 0.01)}
      {field('μ\'  (mu_real)', 'mu_real', 0.1)}
      {field('μ\'\'  (mu_imag)', 'mu_imag', 0.01)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#444' }}>Layers</h3>
        <button onClick={addLayer} style={{ padding: '0.3rem 0.75rem', background: '#01696f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Add</button>
      </div>
      {layers.length === 0 && (
        <p style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No layers yet. Click + Add.</p>
      )}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {layers.map(layer => <SortableLayer key={layer.id} layer={layer} />)}
        </SortableContext>
      </DndContext>
    </div>
  );
}
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { fetchSelected, queue } from '../api/queue';

function SortableItem({ id, onDeselect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '7px 12px',
    marginBottom: 2,
    background: isDragging ? '#e3f2fd' : '#fff3e0',
    border: '1px solid #ffd180',
    borderRadius: 4,
    cursor: 'grab',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span>#{id}</span>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={() => onDeselect(id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
      >
        ✕
      </button>
    </div>
  );
}

export default function RightPanel({ onDeselect: onDeselectProp }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('');
  const filterRef = useRef('');
  const debounceRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async (p, f) => {
    const data = await fetchSelected(p, 20, f);
    if (p === 1) {
      setItems(data.items);
    } else {
      setItems(prev => [...prev, ...data.items]);
    }
    setHasMore(data.hasMore);
  }, []);

  useEffect(() => {
    load(1, '');
  }, [load]);

  useEffect(() => {
    const handler = () => {
      setPage(1);
      load(1, filterRef.current);
    };
    window.addEventListener('selected-changed', handler);
    return () => window.removeEventListener('selected-changed', handler);
  }, [load]);

  const handleFilterChange = useCallback((e) => {
    const val = e.target.value;
    setFilter(val);
    filterRef.current = val;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(1, val);
    }, 300);
  }, [load]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await load(nextPage, filterRef.current);
  }, [page, load]);

  const handleDeselect = useCallback((id) => {
    queue.enqueueDeselect(id);
    setItems(prev => prev.filter(i => Number(i) !== Number(id)));
    onDeselectProp(id);
  }, [onDeselectProp]);

  const handleDragEnd = useCallback(async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const fromIndex = items.findIndex(id => String(id) === active.id);
    const toIndex = items.findIndex(id => String(id) === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const snapshot = [...items];
    setItems(prev => arrayMove(prev, fromIndex, toIndex));

    const filteredIds = filterRef.current ? snapshot : null;
    try {
      await queue.reorder(fromIndex, toIndex, filteredIds);
    } catch {
      setItems(snapshot);
    }
  }, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>
        Selected{filter ? ` (showing ${items.length})` : ` (${items.length}${hasMore ? '+' : ''})`}
      </h3>

      <input
        type="text"
        placeholder="Filter by ID..."
        value={filter}
        onChange={handleFilterChange}
        style={{ marginBottom: 8, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(String)} strategy={verticalListSortingStrategy}>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {items.map((id) => (
              <SortableItem key={id} id={id} onDeselect={handleDeselect} />
            ))}
            {hasMore && (
              <div
                style={{ padding: '8px', textAlign: 'center', color: '#999', fontSize: 12, cursor: 'pointer' }}
                onClick={handleLoadMore}
              >
                Load more...
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

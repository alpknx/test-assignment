import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchItems, queue } from '../api/queue';
import InfiniteList from './InfiniteList';

export default function LeftPanel({ onSelect }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('');
  const [addId, setAddId] = useState('');
  const [addError, setAddError] = useState('');
  const filterRef = useRef('');

  const load = useCallback(async (p, f) => {
    const data = await fetchItems(p, 20, f);
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

  // Refresh when another panel changes selection
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
    setPage(1);
    load(1, val);
  }, [load]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await load(nextPage, filterRef.current);
  }, [page, load]);

  const handleSelect = useCallback((id) => {
    queue.enqueueSelect(id);
    setItems(prev => prev.filter(i => i !== id));
    onSelect(id);
  }, [onSelect]);

  const handleAdd = useCallback(() => {
    const id = Number(addId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setAddError('Enter a valid positive integer');
      return;
    }
    setAddError('');
    queue.enqueueAdd(id);
    setAddId('');
  }, [addId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, boxSizing: 'border-box' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>All Items</h3>

      <input
        type="text"
        placeholder="Filter by ID..."
        value={filter}
        onChange={handleFilterChange}
        style={{ marginBottom: 8, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: addError ? 4 : 12 }}>
        <input
          type="number"
          placeholder="New ID"
          value={addId}
          onChange={e => setAddId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
        />
        <button
          onClick={handleAdd}
          style={{ padding: '6px 14px', cursor: 'pointer', borderRadius: 4, border: '1px solid #999', background: '#f5f5f5' }}
        >
          Add
        </button>
      </div>
      {addError && (
        <div style={{ color: '#c00', fontSize: 12, marginBottom: 8 }}>{addError}</div>
      )}

      <InfiniteList
        items={items}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        renderItem={(id) => (
          <div
            key={id}
            onClick={() => handleSelect(id)}
            style={{
              padding: '7px 12px',
              marginBottom: 2,
              background: '#f9f9f9',
              border: '1px solid #eee',
              borderRadius: 4,
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: 13,
            }}
          >
            #{id}
          </div>
        )}
      />
    </div>
  );
}

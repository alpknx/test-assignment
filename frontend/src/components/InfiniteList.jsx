import { useEffect, useRef, useCallback } from 'react';

// Props:
//   items: array of IDs currently loaded
//   hasMore: bool — whether more items are available
//   onLoadMore: async () => void — called when sentinel enters viewport
//   renderItem: (id, index) => JSX — render function for each item
//   className: string (optional)
export default function InfiniteList({ items, hasMore, onLoadMore, renderItem, className = '' }) {
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const handleIntersect = useCallback(
    async ([entry]) => {
      if (!entry.isIntersecting || !hasMore || loadingRef.current) return;
      loadingRef.current = true;
      await onLoadMore();
      loadingRef.current = false;
    },
    [hasMore, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className={`infinite-list ${className}`} style={{ overflowY: 'auto', flex: 1 }}>
      {items.map((id, index) => renderItem(id, index))}
      {hasMore && (
        <div ref={sentinelRef} style={{ height: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>
          Loading...
        </div>
      )}
    </div>
  );
}

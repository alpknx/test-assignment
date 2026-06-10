// backend/tests/store.test.js
let store;

beforeEach(() => {
  jest.resetModules();
  store = require('../store');
});

describe('getUnselected', () => {
  test('returns first 20 items by default', () => {
    const result = store.getUnselected(1, 20, '');
    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(1_000_000);
  });

  test('page 2 returns items 21-40', () => {
    const result = store.getUnselected(2, 20, '');
    expect(result.items[0]).toBe(21);
    expect(result.items.length).toBe(20);
  });

  test('excludes selected items', () => {
    store.selectItems([1, 2, 3]);
    const result = store.getUnselected(1, 20, '');
    expect(result.items).not.toContain(1);
    expect(result.items).not.toContain(2);
    expect(result.items).not.toContain(3);
    expect(result.items[0]).toBe(4);
    expect(result.total).toBe(999_997);
  });

  test('filter returns only matching items', () => {
    const result = store.getUnselected(1, 20, '12345');
    expect(result.items.every(id => String(id).includes('12345'))).toBe(true);
  });

  test('last page hasMore is false', () => {
    // Select all but last 5
    const ids = Array.from({ length: 999_995 }, (_, i) => i + 1);
    store.selectItems(ids);
    const result = store.getUnselected(1, 20, '');
    expect(result.hasMore).toBe(false);
    expect(result.items.length).toBe(5);
  });
});

describe('selectItems / deselectItems', () => {
  test('selectItems adds to selected', () => {
    store.selectItems([5, 10, 15]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([5, 10, 15]);
  });

  test('selectItems deduplicates', () => {
    store.selectItems([5, 5, 5]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([5]);
  });

  test('deselectItems removes from selected', () => {
    store.selectItems([1, 2, 3]);
    store.deselectItems([2]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([1, 3]);
  });

  test('selecting same item twice is a no-op', () => {
    store.selectItems([7]);
    store.selectItems([7]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([7]);
  });
});

describe('reorderSelected', () => {
  test('unfiltered: moves item forward', () => {
    store.selectItems([1, 2, 3, 4, 5]);
    store.reorderSelected(0, 2, null); // move 1 to position of 3
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([2, 3, 1, 4, 5]);
  });

  test('unfiltered: moves item backward', () => {
    store.selectItems([1, 2, 3, 4, 5]);
    store.reorderSelected(4, 1, null); // move 5 to position of 2
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([1, 5, 2, 3, 4]);
  });

  test('filtered: moves item forward within filtered subset', () => {
    store.selectItems([1, 5, 3, 8, 2]);
    // filteredIds = [5, 8, 2], drag index 0 (5) to index 1 (8)
    store.reorderSelected(0, 1, [5, 8, 2]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([1, 3, 5, 8, 2]);
  });

  test('filtered: moves item backward within filtered subset', () => {
    store.selectItems([1, 5, 3, 8, 2]);
    // filteredIds = [5, 8, 2], drag index 1 (8) to index 0 (5)
    store.reorderSelected(1, 0, [5, 8, 2]);
    const result = store.getSelected(1, 10, '');
    expect(result.items).toEqual([1, 8, 5, 3, 2]);
  });
});

describe('addCustomItem', () => {
  test('adds item outside base range', () => {
    const result = store.addCustomItem(2_000_000);
    expect(result).toEqual({ ok: true });
    // filter by the custom ID to retrieve it (it appears after the 1M base range)
    const unselected = store.getUnselected(1, 10, '2000000');
    expect(unselected.items).toContain(2_000_000);
  });

  test('rejects duplicate custom item', () => {
    store.addCustomItem(2_000_000);
    const result = store.addCustomItem(2_000_000);
    expect(result.error).toBeDefined();
  });

  test('rejects ID in base range (already exists)', () => {
    const result = store.addCustomItem(500);
    expect(result.error).toBeDefined();
  });
});

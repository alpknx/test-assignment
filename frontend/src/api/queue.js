// frontend/src/api/queue.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class RequestQueue {
  constructor() {
    this.pendingAdd = new Map();    // id -> true (dedup)
    this.pendingSelect = new Set();
    this.pendingDeselect = new Set();

    this._modifyTimer = setInterval(() => this._flushModify(), 1000);
    this._addTimer = setInterval(() => this._flushAdd(), 10_000);
    this._addFlushing = false;
  }

  destroy() {
    clearInterval(this._modifyTimer);
    clearInterval(this._addTimer);
  }

  enqueueAdd(id) {
    const n = Number(id);
    if (!Number.isInteger(n) || n <= 0) return;
    if (this.pendingAdd.has(n)) return;
    this.pendingAdd.set(n, true);
  }

  enqueueSelect(id) {
    const n = Number(id);
    this.pendingDeselect.delete(n);
    this.pendingSelect.add(n);
  }

  enqueueDeselect(id) {
    const n = Number(id);
    this.pendingSelect.delete(n);
    this.pendingDeselect.add(n);
  }

  async _flushModify() {
    let changed = false;
    if (this.pendingSelect.size > 0) {
      const ids = [...this.pendingSelect];
      this.pendingSelect.clear();
      await fetch(`${BASE_URL}/api/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).catch(console.error);
      changed = true;
    }
    if (this.pendingDeselect.size > 0) {
      const ids = [...this.pendingDeselect];
      this.pendingDeselect.clear();
      await fetch(`${BASE_URL}/api/deselect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).catch(console.error);
      changed = true;
    }
    if (changed) {
      window.dispatchEvent(new Event('selected-changed'));
    }
  }

  async _flushAdd() {
    if (this._addFlushing || this.pendingAdd.size === 0) return;
    this._addFlushing = true;
    const ids = [...this.pendingAdd.keys()];
    this.pendingAdd.clear();
    for (const id of ids) {
      await fetch(`${BASE_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(console.error);
    }
    this._addFlushing = false;
  }

  async reorder(fromIndex, toIndex, filteredIds = null) {
    await fetch(`${BASE_URL}/api/selected/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex, toIndex, filteredIds }),
    }).catch(console.error);
  }
}

export const queue = new RequestQueue();

export async function fetchItems(page, limit = 20, filter = '') {
  const params = new URLSearchParams({ page, limit, filter });
  const res = await fetch(`${BASE_URL}/api/items?${params}`);
  return res.json();
}

export async function fetchSelected(page, limit = 20, filter = '') {
  const params = new URLSearchParams({ page, limit, filter });
  const res = await fetch(`${BASE_URL}/api/selected?${params}`);
  return res.json();
}

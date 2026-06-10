// backend/server.js
const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/items', (req, res) => {
  const page = Math.max(1, Math.min(50000, parseInt(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
  const filter = req.query.filter || '';
  res.json(store.getUnselected(page, limit, filter));
});

app.get('/api/selected', (req, res) => {
  const page = Math.max(1, Math.min(50000, parseInt(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
  const filter = req.query.filter || '';
  res.json(store.getSelected(page, limit, filter));
});

app.post('/api/select', (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' });
  const validIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
  store.selectItems(validIds);
  res.json({ ok: true });
});

app.post('/api/deselect', (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' });
  const validIds = ids.map(Number).filter(n => Number.isInteger(n) && n > 0);
  store.deselectItems(validIds);
  res.json({ ok: true });
});

app.post('/api/items', (req, res) => {
  const { id } = req.body;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  const result = store.addCustomItem(numId);
  if (result.error) return res.status(409).json(result);
  res.json({ ok: true });
});

app.put('/api/selected/order', (req, res) => {
  const { fromIndex, toIndex, filteredIds } = req.body;
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    return res.status(400).json({ error: 'fromIndex and toIndex required' });
  }
  if (fromIndex < 0 || toIndex < 0 || fromIndex > 1_000_000 || toIndex > 1_000_000) {
    return res.status(400).json({ error: 'indices out of range' });
  }
  store.reorderSelected(fromIndex, toIndex, filteredIds || null);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

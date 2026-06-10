// backend/server.js
const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/items', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const filter = req.query.filter || '';
  res.json(store.getUnselected(page, limit, filter));
});

app.get('/api/selected', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const filter = req.query.filter || '';
  res.json(store.getSelected(page, limit, filter));
});

app.post('/api/select', (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' });
  store.selectItems(ids);
  res.json({ ok: true });
});

app.post('/api/deselect', (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be array' });
  store.deselectItems(ids);
  res.json({ ok: true });
});

app.post('/api/items', (req, res) => {
  const { id } = req.body;
  if (id === undefined) return res.status(400).json({ error: 'id required' });
  const result = store.addCustomItem(id);
  if (result.error) return res.status(409).json(result);
  res.json({ ok: true });
});

app.put('/api/selected/order', (req, res) => {
  const { fromIndex, toIndex, filteredIds } = req.body;
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    return res.status(400).json({ error: 'fromIndex and toIndex required' });
  }
  store.reorderSelected(fromIndex, toIndex, filteredIds || null);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

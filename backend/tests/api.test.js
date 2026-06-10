// backend/tests/api.test.js
const request = require('supertest');

// Each test gets a fresh server with clean state
let app;

beforeEach(() => {
  jest.resetModules();
  app = require('../server');
});

afterEach(done => {
  app.close ? app.close(done) : done();
});

describe('GET /api/items', () => {
  test('returns 20 items on page 1', async () => {
    const res = await request(app).get('/api/items?page=1&limit=20');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(20);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.total).toBe(1_000_000);
  });

  test('filter param narrows results', async () => {
    const res = await request(app).get('/api/items?filter=99999');
    expect(res.status).toBe(200);
    expect(res.body.items.every(id => String(id).includes('99999'))).toBe(true);
  });

  test('clamps negative limit to 1', async () => {
    const res = await request(app).get('/api/items?limit=-5');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
});

describe('POST /api/select + GET /api/selected', () => {
  test('select items and retrieve them', async () => {
    await request(app).post('/api/select').send({ ids: [1, 2, 3] });
    const res = await request(app).get('/api/selected');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([1, 2, 3]);
  });

  test('selected items removed from unselected', async () => {
    await request(app).post('/api/select').send({ ids: [1, 2] });
    const res = await request(app).get('/api/items?page=1&limit=5');
    expect(res.body.items).not.toContain(1);
    expect(res.body.items).not.toContain(2);
  });

  test('rejects non-array ids', async () => {
    const res = await request(app).post('/api/select').send({ ids: 'bad' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/deselect', () => {
  test('deselects items', async () => {
    await request(app).post('/api/select').send({ ids: [10, 20, 30] });
    await request(app).post('/api/deselect').send({ ids: [20] });
    const res = await request(app).get('/api/selected');
    expect(res.body.items).toEqual([10, 30]);
  });
});

describe('POST /api/items', () => {
  test('adds custom item', async () => {
    const res = await request(app).post('/api/items').send({ id: 9_999_999 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('rejects non-integer id', async () => {
    const res = await request(app).post('/api/items').send({ id: 'abc' });
    expect(res.status).toBe(400);
  });

  test('rejects base-range id', async () => {
    const res = await request(app).post('/api/items').send({ id: 500 });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/selected/order', () => {
  test('reorders selected items', async () => {
    await request(app).post('/api/select').send({ ids: [1, 2, 3, 4, 5] });
    await request(app).put('/api/selected/order').send({ fromIndex: 0, toIndex: 2 });
    const res = await request(app).get('/api/selected');
    expect(res.body.items).toEqual([2, 3, 1, 4, 5]);
  });

  test('rejects missing indices', async () => {
    const res = await request(app).put('/api/selected/order').send({ fromIndex: 0 });
    expect(res.status).toBe(400);
  });
});

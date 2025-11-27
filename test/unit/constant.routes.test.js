const express = require('../../server/node_modules/express');
const request = require('supertest');
const categories = require('../../server/constants/reportCategories');
const constantRoutes = require('../../server/routes/constantRoutes');

describe('constantRoutes', () => {
  test('GET /categories ritorna lista categorie', async () => {
    const app = express();
    app.use('/api', constantRoutes);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(categories.REPORT_CATEGORIES);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('handler diretto restituisce le stesse categorie', () => {
    // Estrae l'handler dal router per invocarlo direttamente
    const layer = constantRoutes.stack.find(l => l.route && l.route.path === '/categories');
    expect(layer).toBeDefined();
    const handler = layer.route.stack[0].handle;

    const res = { json: jest.fn() };
    handler({}, res);

    expect(res.json).toHaveBeenCalledWith(categories.REPORT_CATEGORIES);
  });
});
const categories = require('../../server/constants/reportCategories');
const constantRoutes = require('../../server/routes/constantRoutes');

describe('constantRoutes', () => {
  test('router espone il path /categories e l\'handler restituisce le categorie', () => {
    const layer = constantRoutes.stack.find(l => l.route?.path === '/categories');
    expect(layer).toBeDefined();
    const handler = layer.route.stack[0].handle;

    const res = { json: jest.fn() };
    handler({}, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload).toEqual(categories.REPORT_CATEGORIES);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBeGreaterThan(0);
  });

  test('handler diretto restituisce le stesse categorie', () => {
    // Estrae l'handler dal router per invocarlo direttamente
    const layer = constantRoutes.stack.find(l => l.route?.path === '/categories');
    expect(layer).toBeDefined();
    const handler = layer.route.stack[0].handle;

    const res = { json: jest.fn() };
    handler({}, res);

    expect(res.json).toHaveBeenCalledWith(categories.REPORT_CATEGORIES);
  });
});
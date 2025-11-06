import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../index.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

function seed(tasksArray) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasksArray, null, 2), 'utf-8');
}

beforeEach(() => {
  // her test öncesi sıfırla
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
});

describe('Tasks API - happy paths', () => {
  it('GET / should respond ok text', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Tasks API up');
  });

  it('POST /tasks creates and GET /tasks returns data', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Learn Express' })
      .set('Content-Type', 'application/json');

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: 'Learn Express', done: false, id: 1 });

    const list = await request(app).get('/tasks');
    // sayfalama eklediysen data içinde döner; eklemediysen düz dizi
    const payload = Array.isArray(list.body) ? list.body : list.body.data;
    expect(list.status).toBe(200);
    expect(payload.length).toBe(1);
  });

  it('GET /tasks/:id returns single task', async () => {
    seed([{ id: 1, title: 'A', done: false, createdAt: new Date().toISOString() }]);
    const res = await request(app).get('/tasks/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('A');
  });

  it('PATCH /tasks/:id updates fields (title & done)', async () => {
    seed([{ id: 1, title: 'Old', done: false, createdAt: new Date().toISOString() }]);
    const u1 = await request(app)
      .patch('/tasks/1')
      .send({ done: true })
      .set('Content-Type', 'application/json');
    expect(u1.status).toBe(200);
    expect(u1.body.done).toBe(true);

    const u2 = await request(app)
      .patch('/tasks/1')
      .send({ title: 'New Title' })
      .set('Content-Type', 'application/json');
    expect(u2.status).toBe(200);
    expect(u2.body.title).toBe('New Title');
  });

  it('DELETE /tasks/:id removes item', async () => {
    seed([{ id: 1, title: 'To delete', done: false, createdAt: new Date().toISOString() }]);
    const del = await request(app).delete('/tasks/1');
    expect(del.status).toBe(204);

    const res404 = await request(app).get('/tasks/1');
    expect(res404.status).toBe(404);
  });
});

describe('Tasks API - query, sort, pagination', () => {
  beforeEach(() => {
    seed([
      { id: 1, title: 'Read docs', done: false, createdAt: '2025-11-06T08:01:00.000Z' },
      { id: 2, title: 'Write API', done: true,  createdAt: '2025-11-06T08:02:00.000Z' },
      { id: 3, title: 'Test coverage', done: false, createdAt: '2025-11-06T08:03:00.000Z' },
      { id: 4, title: 'Fix bug', done: true,  createdAt: '2025-11-06T08:04:00.000Z' },
      { id: 5, title: 'Deploy project', done: false, createdAt: '2025-11-06T08:05:00.000Z' }
    ]);
  });

  it('filters by done=true/false', async () => {
    const t = await request(app).get('/tasks?done=true');
    const f = await request(app).get('/tasks?done=false');

    const td = Array.isArray(t.body) ? t.body : t.body.data;
    const fd = Array.isArray(f.body) ? f.body : f.body.data;

    expect(td.every(x => x.done === true)).toBe(true);
    expect(fd.every(x => x.done === false)).toBe(true);
  });

  it('searches by keyword in title', async () => {
    const res = await request(app).get('/tasks?search=doc');
    const data = Array.isArray(res.body) ? res.body : res.body.data;
    expect(data.some(x => x.title.toLowerCase().includes('doc'))).toBe(true);
  });

  it('sorts by createdAt desc', async () => {
    const res = await request(app).get('/tasks?sort=createdAt&order=desc');
    const data = Array.isArray(res.body) ? res.body : res.body.data;
    // ilk eleman en yeni olmalı
    expect(data[0].id).toBe(5);
  });

  it('paginates with limit & page', async () => {
    const res = await request(app).get('/tasks?limit=2&page=2');
    // sayfalama JSON zarfıyla dönüyorsa:
    if (!Array.isArray(res.body)) {
      expect(res.body.total).toBe(5);
      expect(res.body.count).toBe(2);
      expect(res.body.page).toBe(2);
      expect(res.body.data.length).toBe(2);
    } else {
      // düz dizi dönen eski sürümün için fallback
      expect(Array.isArray(res.body)).toBe(true);
    }
  });
});

describe('Tasks API - error cases (400/404/invalid)', () => {
  it('GET /tasks/:id with invalid id returns 400', async () => {
    const res = await request(app).get('/tasks/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /tasks/:id not found returns 404', async () => {
    const res = await request(app).get('/tasks/999');
    expect(res.status).toBe(404);
  });

  it('POST /tasks validation: title required', async () => {
    const r1 = await request(app).post('/tasks').send({}).set('Content-Type', 'application/json');
    expect(r1.status).toBe(400);

    const r2 = await request(app).post('/tasks').send({ title: '   ' }).set('Content-Type', 'application/json');
    expect(r2.status).toBe(400);
  });

  it('PATCH /tasks/:id validation: bad title/done', async () => {
    seed([{ id: 1, title: 'X', done: false, createdAt: new Date().toISOString() }]);

    const r1 = await request(app).patch('/tasks/1')
      .send({ title: '   ' })
      .set('Content-Type', 'application/json');
    expect(r1.status).toBe(400);

    const r2 = await request(app).patch('/tasks/1')
      .send({ done: 'yes' })
      .set('Content-Type', 'application/json');
    expect(r2.status).toBe(400);
  });

  it('PATCH /tasks/:id 404 when item missing', async () => {
    const res = await request(app).patch('/tasks/42')
      .send({ done: true })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(404);
  });

  it('DELETE /tasks/:id 404 when missing', async () => {
    const res = await request(app).delete('/tasks/99');
    expect(res.status).toBe(404);
  });

  it('GET /tasks with invalid done query returns 400', async () => {
    const res = await request(app).get('/tasks?done=maybe');
    expect(res.status).toBe(400);
  });

  it('GET /unknown returns JSON 404', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Not Found' });
  });
});

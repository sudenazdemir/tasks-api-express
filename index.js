import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// __dirname eşdeğeri (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON dosya yolu
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Basit dosya okuma/yazma yardımcıları
function loadTasks() {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        // dosya yoksa veya bozuksa boş dizi döndür
        return [];
    }
}

function saveTasks(tasks) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

const app = express();
const PORT = process.env.PORT || 3000;

// JSON gövde parse
app.use(express.json());
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tasks API',
      version: '1.0.0',
      description: 'Simple Tasks REST API with Express (CRUD + filters + pagination + sorting)',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Task: {
          type: 'object',
          required: ['id', 'title', 'done', 'createdAt'],
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Learn Express' },
            done: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2025-11-06T08:01:00.000Z' }
          }
        }
      }
    }
  },
  apis: ['./index.js'], // <-- JSDoc yorumlarını buradan okuyacak
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// basit kök
app.get('/', (req, res) => {
    res.send('Tasks API up ✅');
});

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List tasks
 *     description: Returns tasks with optional filters (done, search), sorting, and pagination.
 *     parameters:
 *       - in: query
 *         name: done
 *         schema: { type: string, enum: [true, false] }
 *         description: Filter by completion (true/false)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive substring search on title
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [id, title, done, createdAt] }
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: asc }
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *         description: Page size
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Page number (1-based)
 *     responses:
 *       200:
 *         description: Tasks list (may be wrapped with pagination metadata)
 *         content:
 *           application/json:
 *             oneOf:
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Task'
 *               - type: object
 *                 properties:
 *                   total: { type: integer, example: 5 }
 *                   count: { type: integer, example: 2 }
 *                   page:  { type: integer, example: 1 }
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "done must be 'true' or 'false'" }
 */
app.get('/tasks', (req, res) => {
    const { done, search, sort, order = "asc", limit, page } = req.query;
    let tasks = loadTasks();

    // done filtresi
    if (done !== undefined) {
        if (done !== 'true' && done !== 'false') {
            return res.status(400).json({ error: "done must be 'true' or 'false'" });
        }
        const doneBool = done === 'true';
        tasks = tasks.filter((t) => t.done === doneBool);
    }

    // arama filtresi
    if (search) {
        const keyword = search.toLowerCase();
        tasks = tasks.filter((t) => t.title.toLowerCase().includes(keyword));
    }


    // 🔸 sıralama
    if (sort) {
        const validFields = ['id', 'title', 'done', 'createdAt'];
        if (!validFields.includes(sort)) {
            return res.status(400).json({ error: `Invalid sort field. Use one of: ${validFields.join(', ')}` });
        }
        tasks.sort((a, b) => {
            const aVal = a[sort];
            const bVal = b[sort];
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // 🔸 sayfalama
    let paginated = tasks;
    if (limit !== undefined) {
        const lim = parseInt(limit);
        const pg = parseInt(page) || 1;
        if (isNaN(lim) || lim <= 0) {
            return res.status(400).json({ error: 'limit must be a positive number' });
        }
        if (pg <= 0) {
            return res.status(400).json({ error: 'page must be positive' });
        }
        const start = (pg - 1) * lim;
        const end = start + lim;
        paginated = tasks.slice(start, end);
    }
    res.json({
        total: tasks.length,
        count: paginated.length,
        page: parseInt(page) || 1,
        data: paginated
    });
});

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'invalid id' } }
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'task not found' } }
 */
app.get('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
    const tasks = loadTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return res.status(404).json({ error: 'task not found' });
    res.json(task);
});

/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create a task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Write API tests" }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error (missing/empty title)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'title is required (non-empty string)' } }
 */
app.post('/tasks', (req, res) => {
    const { title } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title is required (non-empty string)' });
    }
    const tasks = loadTasks();
    const id = (tasks.at(-1)?.id || 0) + 1;
    const newTask = {
        id,
        title: title.trim(),
        done: false,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveTasks(tasks);
    res.status(201).json(newTask);
});

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     summary: Partially update a task (title/done)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Learn Express (updated)" }
 *               done:  { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error (bad title/done)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'done must be boolean when provided' } }
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'task not found' } }
 */
app.patch('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    const { title, done } = req.body || {};
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
        return res.status(400).json({ error: 'title must be non-empty string when provided' });
    }
    if (done !== undefined && typeof done !== 'boolean') {
        return res.status(400).json({ error: 'done must be boolean when provided' });
    }

    const tasks = loadTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'task not found' });

    if (title !== undefined) tasks[idx].title = title.trim();
    if (done !== undefined) tasks[idx].done = done;

    saveTasks(tasks);
    res.json(tasks[idx]);
});

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Deleted successfully (no content)
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'invalid id' } }
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string, example: 'task not found' } }
 */
app.delete('/tasks/:id', (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    const tasks = loadTasks();
    const exists = tasks.some((t) => t.id === id);
    if (!exists) return res.status(404).json({ error: 'task not found' });

    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    res.status(204).send();
});

// 404 (tanımsız route)
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
    console.log(`Tasks API listening on http://localhost:${PORT}`);
});

export default app;
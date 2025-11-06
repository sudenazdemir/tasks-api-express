import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// basit kök
app.get('/', (req, res) => {
    res.send('Tasks API up ✅');
});

/**
 * GET /tasks
 * Tüm görevleri getirir
 * Query destekleri:
 *   ?done=true/false   -> filtreleme
 *   ?search=keyword    -> başlığa göre arama
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
 * GET /tasks/:id
 * Tek bir görevi getirir
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
 * POST /tasks
 * Body: { "title": "string" }
 * Yeni görev oluşturur
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
 * PATCH /tasks/:id
 * Body: { "title"?: "string", "done"?: true|false }
 * Kısmi güncelleme
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
 * DELETE /tasks/:id
 * Görevi siler
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
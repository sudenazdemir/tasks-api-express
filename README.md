![CI](https://github.com/sudenazdemir/tasks-api-express/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/sudenazdemir/tasks-api-express/branch/main/graph/badge.svg)](https://codecov.io/gh/sudenazdemir/tasks-api-express)

# 🧠 Tasks API

A simple RESTful API built with **Node.js (Express)**, showcasing CRUD operations, testing, and coverage integration.

## 🚀 Features
- **GET /tasks** – list all tasks  
- **POST /tasks** – create a new task  
- **PATCH /tasks/:id** – update a task  
- **DELETE /tasks/:id** – delete a task  

## 🧪 Testing & Coverage
This project is tested using **Vitest** and **Supertest**.  
All tests run automatically via **GitHub Actions**, and coverage reports are uploaded to **Codecov**.


## 📘 API Documentation (Swagger)

Interactive docs:
👉 http://localhost:3000/docs

This API is documented with **swagger-ui-express** + **swagger-jsdoc**.
You can explore endpoints, send requests (Try it out), and see schemas/examples.

### 🔁 Endpoints

- **GET /tasks** — List tasks (filters: `done`, `search`; sorting: `sort`, `order`; pagination: `limit`, `page`)
- **GET /tasks/{id}** — Get a task by id
- **POST /tasks** — Create a task
- **PATCH /tasks/{id}** — Partially update (title/done)
- **DELETE /tasks/{id}** — Delete by id

### 🧩 Query Examples

- Filter by done: `GET /tasks?done=true`
- Search in title: `GET /tasks?search=doc`
- Sort newest first: `GET /tasks?sort=createdAt&order=desc`
- Pagination: `GET /tasks?limit=2&page=3`

### 🧪 cURL Examples

List:
```bash
curl "http://localhost:3000/tasks?sort=createdAt&order=desc&limit=5&page=1"
Create:
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Express"}'
Get one:
curl http://localhost:3000/tasks/1
Update:
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done": true}'
  Delete:
curl -X DELETE http://localhost:3000/tasks/1 -i


## 🛠️ How to Run
```bash
npm install
npm run dev
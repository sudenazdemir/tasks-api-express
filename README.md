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


## 📘 API Documentation
Interactive Swagger UI is available at:

👉 [http://localhost:3000/docs](http://localhost:3000/docs)

The API documentation is automatically generated with **swagger-ui-express** and **swagger-jsdoc**.

## 🛠️ How to Run
```bash
npm install
npm run dev
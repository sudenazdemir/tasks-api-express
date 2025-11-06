![CI] (https://github.com/sudenazdemir/tasks-api-express/actions/workflows/ci.yml/badge.svg)
[! [codecov](https://codecov.io/gh/sudenazdemir/tasks-api-express/brancch/main/graph/badge.svg)](https://codecov.io/gh/sudenazdemir/tasks-api-express)

# 🧠 Tasks API

Basit bir RESTful API — Node.js (Express) ile yapılmış, CRUD işlemleri ve test coverage örneği içerir.

## 🚀 Özellikler
- GET /tasks – görevleri listele  
- POST /tasks – yeni görev oluştur  
- PATCH /tasks/:id – görevi güncelle  
- DELETE /tasks/:id – görevi sil  

## 🧪 Test & Coverage
Bu proje **Vitest + Supertest** ile test edilmiştir.  
Testler CI pipeline'da otomatik olarak çalışır ve Codecov aracılığıyla coverage raporu yüklenir.

## 📘 API Documentation
Interactive Swagger UI is available at:

👉 [http://localhost:3000/docs](http://localhost:3000/docs)

The API documentation is automatically generated with **swagger-ui-express** and **swagger-jsdoc**.

## 🛠️ Çalıştırmak için
```bash
npm install
npm run dev

![CI] (https://github.com/sudenazdemir/task-api-express/actions/workflows/ci.yml/badge.svg)
[! [codecov](https://codecov.io/gh/sudenazdemir/task-api-express/brancch/main/graph/badge.svg)](https://codecov.io/gh/sudenazdemir/task-api-express)

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

## 🛠️ Çalıştırmak için
```bash
npm install
npm run dev

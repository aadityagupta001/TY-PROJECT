NeoEstate (TY-PROJECT)


Quick setup (Node.js + MongoDB required)

1. Install dependencies:

```bash
npm install
```

2. Ensure MongoDB is running locally or provide `MONGODB_URI` env var.

3. Start server:

```bash
npm start
```

Server runs on http://localhost:3000 and serves the frontend file `Aaditya Final Project .html` from the project root.

Auth:
- Register: POST /api/register
- Login: POST /api/login
- Admin login: POST /api/admin/login (default admin/admin123 or set ADMIN_USER/ADMIN_PASS env vars). A seeded admin user `admin@neoestate.local` is created on first run.

Database: MongoDB is used (default mongodb://127.0.0.1:27017/neoestate). Sample Indian properties are seeded automatically.

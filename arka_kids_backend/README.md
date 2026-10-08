# Arka Kids Backend

API server for the Arka Kids web portal and parent app.

## Run

```bash
cp .env.example .env.local   # then fill MongoDB / JWT / Cloudinary
npm install
npm run dev
```

API: `http://127.0.0.1:4000/api`  
Health: `http://127.0.0.1:4000/api/health`

Keep this running, then start the web app (`npm run dev` in the repo root) and the Flutter app.

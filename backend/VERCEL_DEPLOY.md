# 🚀 Guida Deploy Vercel - Kinetica Backend

## 📋 Checklist Pre-Deploy

### ✅ **1. Setup Repository**
```bash
# Assicurati che il codice sia su Git
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### ✅ **2. Account Vercel**
1. Vai su [vercel.com](https://vercel.com)
2. Registrati/Login con GitHub
3. Connetti il repository del backend

## 🛠️ **Procedura Deploy Step-by-Step**

### **Step 1: Import Project su Vercel**
1. Dashboard Vercel → "New Project"
2. Import dal tuo repository GitHub
3. Seleziona la cartella `backend/` come root
4. Framework Preset: **"Other"**

### **Step 2: Configura Build Settings**
```bash
# Build Command:
npm run vercel-build

# Output Directory:
dist

# Install Command:
npm install

# Development Command:
npm run dev
```

### **Step 3: Environment Variables**
Nel dashboard Vercel → Settings → Environment Variables, aggiungi:

```bash
NODE_ENV=production
FRONTEND_URL=https://tuo-frontend.vercel.app
JWT_SECRET=fq0BsNzIjZUz9Tn6UehmbcPcVLZqmn28BTDg+yzQLM4HIkcddqC5Ajep2t8h5SzakD4dnXjZ/Tu/SBivC9oNWA==
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=matteo.bevilacqua60@gmail.com
SMTP_PASS=sjve xeir xvvb mvae
FROM_EMAIL=matteo.bevilacqua60@gmail.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT_MINUTES=30
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
```

### **Step 4: Setup Database (Vercel Postgres)**
1. Dashboard Vercel → Storage → Create Database
2. Seleziona **"Postgres"**
3. Copia la `DATABASE_URL` nelle Environment Variables
4. Esegui migration: `npx prisma migrate deploy`

### **Step 5: Deploy!**
```bash
# Automatico al push su main, oppure:
vercel --prod
```

## 🗄️ **Database Options per Vercel**

### **🥇 Opzione 1: Vercel Postgres (Consigliata)**
- ✅ Integrazione nativa
- ✅ Scaling automatico
- ✅ Backup automatici
- 💰 $20/mese dopo free tier

### **🥈 Opzione 2: Supabase (Economica)**
- ✅ PostgreSQL completo
- ✅ Free tier generoso
- ✅ Interface web
- 🔗 [supabase.com](https://supabase.com)

### **🥉 Opzione 3: Railway**
- ✅ PostgreSQL + Redis
- ✅ $5/mese
- 🔗 [railway.app](https://railway.app)

## 📡 **URLs Finali**

Dopo il deploy avrai:
```bash
# Backend API
https://kinetica-backend.vercel.app

# Esempio endpoints:
https://kinetica-backend.vercel.app/health
https://kinetica-backend.vercel.app/api/auth/login
https://kinetica-backend.vercel.app/api/services
```

## ⚙️ **Configurazione Frontend**

Nel tuo frontend, aggiorna l'API URL:
```typescript
// Frontend .env
VITE_API_URL=https://kinetica-backend.vercel.app
```

## 🔧 **Troubleshooting**

### ❌ **Build Failed?**
```bash
# Controlla logs su Vercel Dashboard → Functions tab
# Spesso è un problema di dipendenze:

# Assicurati che @prisma/client sia in dependencies
npm install @prisma/client --save
```

### ❌ **Database Connection Failed?**
```bash
# Verifica DATABASE_URL format:
postgresql://user:password@host:5432/database

# Test connessione:
npx prisma db push
```

### ❌ **Prisma Client Issues?**
```bash
# Rigenera client:
npx prisma generate

# In caso di problemi, aggiungi al vercel.json:
"functions": {
  "dist/index.js": {
    "includeFiles": ["node_modules/.prisma/**"]
  }
}
```

## 🚀 **Commands Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod

# Logs in tempo reale
vercel logs

# Gestione domains
vercel domains add tuodominio.com
```

## 📈 **Monitoring Post-Deploy**

### ✅ **Health Checks**
```bash
# Test API health
curl https://kinetica-backend.vercel.app/health

# Test auth endpoint
curl -X POST https://kinetica-backend.vercel.app/api/auth/login
```

### ✅ **Performance**
- Dashboard Vercel → Analytics
- Response time < 1s
- Cold start < 3s

### ✅ **Logs**
- Dashboard Vercel → Functions → View Function Logs
- Monitor errori e performance

---

## 🎯 **Next Steps Dopo Deploy**

1. **Setup Custom Domain** (opzionale)
2. **Configure SSL** (automatico su Vercel)
3. **Setup Frontend** con nuovo API URL
4. **Test completo** dell'applicazione
5. **Monitor** performance e errori

**🎉 Il tuo backend sarà live e scalabile su Vercel!**

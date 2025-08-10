# 🏥 Kinetica Fisioterapia - Deploy Full-Stack su Vercel

## 🎯 **Strategia Deploy Completa**

### **Opzione 1: Monorepo Unified (CONSIGLIATA)**
```
kinetica-app/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express
├── vercel.json        # Config per entrambi
└── package.json       # Root scripts
```

### **Opzione 2: Due Progetti Separati**
- Frontend: `kinetica-frontend.vercel.app`
- Backend: `kinetica-backend.vercel.app`

## 🛠️ **Setup Monorepo (Raccomandato)**

### **Step 1: Ristrutturiamo il progetto**
```bash
# Dalla root del progetto
mkdir kinetica-fullstack
cd kinetica-fullstack

# Sposta frontend e backend
mv ../frontend ./frontend
mv ../backend ./backend
```

### **Step 2: Creiamo la configurazione root**
```json
// package.json (root)
{
  "name": "kinetica-fullstack",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### **Step 3: Configurazione Vercel Unificata**
```json
// vercel.json (root)
{
  "version": 2,
  "name": "kinetica-fisioterapia",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/dist/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "backend/dist/**",
          "backend/prisma/**",
          "backend/node_modules/.prisma/**"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 🎯 **URLs Finali**
```bash
# Tutto su un dominio:
https://kinetica-fisioterapia.vercel.app/          # Frontend
https://kinetica-fisioterapia.vercel.app/api/      # Backend API
```

## ⚙️ **Configurazione Frontend**
```typescript
// frontend/.env
VITE_API_URL=/api  # Stesso dominio, path relativo!
```

## 📋 **Environment Variables su Vercel**
```bash
# Backend variables
NODE_ENV=production
JWT_SECRET=fq0BsNzIjZUz9Tn6UehmbcPcVLZqmn28BTDg+yzQLM4HIkcddqC5Ajep2t8h5SzakD4dnXjZ/Tu/SBivC9oNWA==
DATABASE_URL=postgresql://...  # Vercel Postgres
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=matteo.bevilacqua60@gmail.com
SMTP_PASS=sjve xeir xvvb mvae
FROM_EMAIL=matteo.bevilacqua60@gmail.com

# Security settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT_MINUTES=30
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
```

## 🚀 **Deploy Steps**

### **1. Preparazione Repository**
```bash
# Crea nuovo repo unificato
git init
git add .
git commit -m "Initial full-stack setup"
git remote add origin https://github.com/tuousername/kinetica-fullstack.git
git push -u origin main
```

### **2. Vercel Setup**
1. Dashboard Vercel → "New Project"
2. Import repository GitHub
3. **Root Directory**: `.` (root del progetto)
4. **Framework Preset**: "Other"
5. **Build Command**: `npm run build`
6. **Output Directory**: `frontend/dist`

### **3. Environment Variables**
Aggiungi tutte le variabili nel dashboard Vercel

### **4. Database Setup**
```bash
# Crea Vercel Postgres
vercel postgres create

# Ottieni DATABASE_URL e aggiungila alle env vars

# Esegui migration
cd backend
npx prisma migrate deploy
```

## 🎨 **Vantaggi Monorepo**

### ✅ **Benefici**
- **Stesso dominio**: No CORS issues
- **Deploy atomico**: Frontend + Backend insieme
- **SSL unificato**: Un solo certificato
- **Costi ridotti**: Un solo progetto Vercel
- **Routing semplice**: `/api/*` → backend, tutto il resto → frontend

### ✅ **Performance**
- **CDN globale** per frontend statico
- **Edge functions** per API
- **Caching automatico** ottimizzato
- **Compression** automatica

## 🔧 **Troubleshooting**

### ❌ **Build Failed?**
```bash
# Verifica che entrambi i package.json siano corretti
# Controlla i path relativi nel vercel.json
```

### ❌ **API Routes non funzionano?**
```bash
# Verifica nel vercel.json:
"routes": [
  { "src": "/api/(.*)", "dest": "/backend/dist/index.js" },
  { "src": "/(.*)", "dest": "/frontend/dist/$1" }
]
```

### ❌ **Prisma Issues?**
```bash
# Aggiungi al build del backend:
"vercel-build": "npx prisma generate && npm run build"
```

## 📈 **Alternative Deploy Strategy**

### **Opzione B: Progetti Separati**
Se preferisci mantenere separati:

```bash
# Frontend
https://kinetica-frontend.vercel.app

# Backend  
https://kinetica-api.vercel.app

# Frontend .env
VITE_API_URL=https://kinetica-api.vercel.app
```

Pro: Scaling indipendente
Contro: CORS configuration, più complesso

---

## 🎯 **La Mia Raccomandazione**

Per **Kinetica Fisioterapia**, ti consiglio il **Monorepo approach**:

🎯 **Benefici per la tua clinica:**
- **Semplicità**: Un solo deploy, un solo dominio
- **Velocità**: Zero latenza tra frontend e backend
- **Sicurezza**: No CORS, tutto stesso origin
- **Costi**: €20/mese invece di €40
- **Manutenzione**: Più semplice da gestire

Vuoi che riorganizziamo il progetto in questa struttura? 🚀

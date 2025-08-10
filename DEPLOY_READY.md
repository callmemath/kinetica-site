# 🚀 Deploy Full-Stack Kinetica su Vercel

## ✅ **PRONTO PER IL DEPLOY!**

Il tuo progetto è ora configurato per il deploy full-stack su Vercel con:
- ✅ Frontend React + Vite buildato
- ✅ Backend Node.js + Express buildato  
- ✅ Database PostgreSQL ready
- ✅ Configurazione sicurezza completa
- ✅ Environment variables setup

## 🎯 **DEPLOY IN 3 SEMPLICI PASSI**

### **Passo 1: Commit & Push**
```bash
# Dalla root del progetto
git add .
git commit -m "🚀 Ready for Vercel full-stack deploy"
git push origin main
```

### **Passo 2: Setup Vercel**
1. Vai su [vercel.com](https://vercel.com)
2. **New Project** → Import da GitHub
3. Seleziona il repository **"Vetrina x Ristoranti"**
4. **Root Directory**: `.` (lascia default)
5. **Framework Preset**: "Vite"

### **Passo 3: Environment Variables**
Nel dashboard Vercel → Settings → Environment Variables:

```bash
# BACKEND VARIABLES
NODE_ENV=production
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

# FRONTEND VARIABLES  
VITE_API_URL=/api
VITE_APP_NAME=Kinetica Fisioterapia Genova
VITE_ENV=production
```

## 🗄️ **Setup Database**

### **Opzione A: Vercel Postgres (Facile)**
1. Dashboard Vercel → Storage → Create Database
2. Seleziona "Postgres"
3. Copia `DATABASE_URL` e aggiungila alle env vars
4. Deploy automatico!

### **Opzione B: Supabase (Gratis)**
1. Vai su [supabase.com](https://supabase.com)
2. New project → PostgreSQL
3. Copia connection string
4. Aggiungi come `DATABASE_URL`

## 📡 **URLs Finali**

Dopo il deploy avrai:
```bash
# Tutto su un dominio:
https://kinetica-fisioterapia.vercel.app/           # Frontend
https://kinetica-fisioterapia.vercel.app/api/       # Backend API

# Esempio endpoints:
https://kinetica-fisioterapia.vercel.app/api/health
https://kinetica-fisioterapia.vercel.app/api/services
https://kinetica-fisioterapia.vercel.app/api/auth/login
```

## 🧪 **Test Post-Deploy**

```bash
# 1. Test frontend
curl https://kinetica-fisioterapia.vercel.app

# 2. Test backend health
curl https://kinetica-fisioterapia.vercel.app/api/health

# 3. Test API endpoint
curl -X POST https://kinetica-fisioterapia.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 🎨 **Vantaggi di questa configurazione**

### ✅ **Dominio Unificato**
- ❌ No CORS issues
- ✅ Stesso SSL certificate
- ✅ Frontend e API stesso dominio
- ✅ Routing pulito: `/` → frontend, `/api/` → backend

### ✅ **Performance**
- 🚀 CDN globale per frontend
- ⚡ Edge functions per API
- 🗜️ Compression automatica
- 📊 Analytics inclusi

### ✅ **Costi**
- 💰 Un solo progetto Vercel
- 🆓 SSL gratuito
- 📈 Scaling automatico
- 🔧 Zero server maintenance

## 🔧 **Se qualcosa va storto**

### ❌ **Build Failed?**
```bash
# Controlla Vercel logs → Functions tab
# Spesso è un path problem nel vercel.json
```

### ❌ **API 404?**
```bash
# Verifica vercel.json routes:
{
  "src": "/api/(.*)",
  "dest": "/backend/dist/index.js"
}
```

### ❌ **Database connection?**
```bash
# Verifica DATABASE_URL format:
postgresql://user:password@host:5432/database

# Test locale:
cd backend && npx prisma migrate deploy
```

## 🎯 **Domini Personalizzati (Opzionale)**

Dopo il deploy puoi configurare:
```bash
# Esempi domini:
kinetica.fisioterapia.it
app.kineticagenova.com
fisioterapia.genova.it
```

1. Dashboard Vercel → Settings → Domains
2. Add domain
3. Configure DNS records
4. SSL automatico

## 🚀 **DEPLOY NOW!**

Il tuo progetto è **PRONTO**! 

1. **Push su GitHub** ✅
2. **Import su Vercel** ✅  
3. **Add Environment Variables** ✅
4. **Setup Database** ✅
5. **Test & Go Live!** 🎉

**Risultato**: Applicazione professionale live su `https://kinetica-fisioterapia.vercel.app` in 10 minuti!

---

## 📞 **Need Help?**

Se hai problemi durante il deploy:
1. Controlla Vercel dashboard → Functions logs
2. Verifica environment variables
3. Test endpoints con curl
4. Check database connection

**🏥 Kinetica Fisioterapia - Ready for Production! 🚀**

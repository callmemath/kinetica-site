# 🚀 Deploy a Vercel - Guida Completa

## 📋 Prerequisiti
- [x] Codice pronto per il deploy (completato)
- [x] Build funzionanti (testati)
- [x] Configurazione Vercel (vercel.json creato)
- [x] Variabili d'ambiente configurate
- [x] Sicurezza implementata
- [ ] Account Vercel attivo
- [ ] Database PostgreSQL (Vercel Postgres o Supabase)

## 🛠️ Fase 1: Setup Account Vercel

### 1.1 Registrazione
1. Vai su https://vercel.com
2. Clicca "Sign Up"
3. Usa il tuo account GitHub per il login
4. Autorizza Vercel ad accedere ai tuoi repository

### 1.2 Connessione Repository
1. Nel dashboard Vercel, clicca "New Project"
2. Importa il repository "Vetrina x Ristoranti"
3. Vercel rileverà automaticamente che è un progetto Vite/React

## 📊 Fase 2: Setup Database

### Opzione A: Vercel Postgres (Consigliato)
```bash
# Nel dashboard Vercel:
1. Vai alla tab "Storage" del tuo progetto
2. Clicca "Create Database" → "Postgres"
3. Scegli il nome: kinetica-db
4. Region: Europe (fra1) per performance ottimali
5. Copia le variabili d'ambiente generate
```

### Opzione B: Supabase (Alternativa)
```bash
# Su supabase.com:
1. Crea nuovo progetto: "kinetica-fisioterapia"
2. Region: Europe West (Francoforte)
3. Copia DATABASE_URL dal dashboard
```

## ⚙️ Fase 3: Configurazione Environment Variables

Nel dashboard Vercel → Settings → Environment Variables, aggiungi:

### 🔐 Variabili Obbligatorie
```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# JWT Security
JWT_SECRET=fq0BsNzIjZUz9Tn6UehmbcPcVLZqmn28BTDg+yzQLM4HIkcddqC5Ajep2t8h5SzakD4dnXjZ/Tu/SBivC9oNWA==

# API Configuration
NODE_ENV=production
PORT=3001

# Email Configuration (opzionali per ora)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@kinetica.com

# Frontend
VITE_API_URL=/api
```

### 📧 Setup Email (Gmail)
Per abilitare l'invio email:
1. Vai su Google Account → Security
2. Abilita "2-Step Verification"
3. Genera "App Password" per l'applicazione
4. Usa questa password nella variabile EMAIL_PASS

## 🔧 Fase 4: Configurazione Deployment

### 4.1 Build Settings (Auto-rilevati)
Vercel userà automaticamente:
```bash
Build Command: npm run vercel-build
Output Directory: dist
Install Command: npm install
```

### 4.2 Verifica Configurazione
Il file `vercel.json` è già configurato per:
- Frontend servito da `/`
- Backend APIs su `/api/*`
- Gestione SPA per React Router

## 🚀 Fase 5: Deploy

### 5.1 Primo Deploy
```bash
# Automatic dopo configurazione:
1. Nel dashboard Vercel clicca "Deploy"
2. Attendi build (~2-3 minuti)
3. Vercel genererà URL tipo: https://vetrina-x-ristoranti-abc123.vercel.app
```

### 5.2 Setup Database Schema
```bash
# Dopo il primo deploy, vai nel Function Logs e cerca l'errore Prisma
# Questo è normale - il database esiste ma è vuoto

# Opzione A: Manual SQL (database dashboard)
# Copia e incolla il contenuto di schema.prisma come SQL

# Opzione B: Prisma Studio (locale con DATABASE_URL di produzione)
npx prisma db push
npx prisma generate
```

## 🏁 Fase 6: Verifica Funzionamento

### 6.1 Test Frontend
- ✅ Homepage caricate
- ✅ Navigazione tra pagine
- ✅ Design responsive

### 6.2 Test Backend APIs
```bash
# Test API health:
curl https://your-app.vercel.app/api/health

# Test database connection:
curl https://your-app.vercel.app/api/settings
```

### 6.3 Test Sistema Completo
- ✅ Pagina prenotazioni
- ✅ Form contatti
- ✅ Login system (se necessario)

## 🔗 Configurazione Dominio Personalizzato

### 6.1 Aggiunta Dominio
```bash
# Nel dashboard Vercel → Settings → Domains:
1. Aggiungi: kineticafisioterapia.com
2. Configura DNS presso il tuo provider:

# DNS Records:
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.61
```

### 6.2 SSL Certificate
Vercel configura automaticamente Let's Encrypt SSL per tutti i domini.

## 📈 Monitoring e Manutenzione

### Analytics
- Vercel Analytics: Automaticamente attivo
- Real User Monitoring incluso

### Logs
```bash
# Accesso logs:
1. Dashboard Vercel → Functions tab
2. View Function Logs per debugging
3. Edge Network logs per performance
```

### Updates
```bash
# Deploy automatico ad ogni push su main:
git add .
git commit -m "Update: feature description"
git push origin main
# Vercel rebuilds automaticamente
```

## ⚠️ Troubleshooting Comuni

### Database Connection Issues
```bash
# Verifica DATABASE_URL:
1. Controlla formato: postgresql://user:pass@host:5432/db
2. Testa connessione in Function Logs
3. Verifica che IP Vercel sia whitelisted (se necessario)
```

### Build Failures
```bash
# Controlla Build Logs per:
1. TypeScript errors
2. Missing dependencies  
3. Environment variables mancanti
```

### API Routes Non Funzionanti
```bash
# Verifica:
1. File in backend/src/routes/
2. vercel.json routing configuration
3. Environment variables backend
```

## 🎯 Risultato Finale

Al completamento avrai:
- ✅ Frontend React ottimizzato e responsive  
- ✅ Backend APIs sicure e performanti
- ✅ Database PostgreSQL cloud
- ✅ SSL certificate automatico
- ✅ CDN globale per performance
- ✅ Analytics e monitoring
- ✅ Deploy automatici ad ogni push

**URL Finale**: `https://kineticafisioterapia.com` (con dominio personalizzato)

---

## 🆘 Supporto

Se incontri problemi:
1. Controlla Function Logs nel dashboard Vercel
2. Verifica Environment Variables
3. Testa APIs individualmente
4. Controlla build logs per errori TypeScript

**Il tuo progetto è ora completamente pronto per il deploy su Vercel!** 🚀

# Kinetica Fisioterapia Backend - Production Guide

🏥 **Backend API sicuro e scalabile per Kinetica Fisioterapia Genova**

## 🚀 Quick Start per Produzione

### 1. Setup dell'ambiente

```bash
# Clona il repository
git clone <repository-url>
cd backend

# Installa le dipendenze
npm install

# Copia e configura le variabili d'ambiente
cp .env.example .env
# IMPORTANTE: Modifica .env con i tuoi valori di produzione!
```

### 2. Configurazione sicura

```bash
# Genera un JWT secret sicuro
npm run generate:jwt

# Esegui il setup completo per la produzione
npm run setup:production

# Oppure setup con admin user
npm run setup:production -- --create-admin
```

### 3. Deploy

```bash
# Build e deploy automatico
npm run production:deploy

# Oppure step by step:
npm run build
npm run db:migrate:production
npm run start:production
```

## 🔒 Sicurezza Implementata

### ✅ **Autenticazione e Autorizzazione**
- JWT con scadenza configurabile (default: 30 minuti)
- Rate limiting per endpoint sensibili
- Validazione rigorosa input con Zod
- Middleware di autorizzazione role-based

### ✅ **Protezione da Attacchi**
- Helmet.js per security headers
- CORS configurato per produzione
- Input sanitization contro XSS
- Rate limiting progressivo:
  - Auth: 5 tentativi/15min
  - OTP: 3 richieste/minuto
  - Password reset: 3 tentativi/ora
  - Generale: 100 richieste/15min

### ✅ **Headers di Sicurezza**
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- X-XSS-Protection

### ✅ **Logging e Monitoring**
- Logging di sicurezza per richieste sospette
- Graceful shutdown con cleanup
- Error handling centralizzato
- Session timeout configurabile

## 📋 Variabili d'Ambiente Critiche

### ⚠️ **OBBLIGATORIE da modificare:**

```bash
# SICUREZZA CRITICA
JWT_SECRET=GENERA_CON_openssl_rand_base64_64
FRONTEND_URL=https://tuo-dominio-produzione.com

# EMAIL
SMTP_USER=tua-email@gmail.com
SMTP_PASS=password-app-gmail
FROM_EMAIL=tua-email@gmail.com

# DATABASE
DATABASE_URL="file:./production.db"
# O PostgreSQL: "postgresql://user:pass@host:5432/db"
```

### 📊 **Opzionali (con default sicuri):**

```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minuti
RATE_LIMIT_MAX_REQUESTS=100      # Max richieste per finestra
SESSION_TIMEOUT_MINUTES=30       # Timeout sessione
LOG_LEVEL=error                  # Livello logging
ENABLE_REQUEST_LOGGING=false     # Log richieste
```

## 🏗️ Architettura di Sicurezza

```
Internet → Reverse Proxy → Rate Limiter → Security Headers → Auth → Routes
                                ↓
                         🔒 Security Middleware:
                         - Input Sanitization
                         - CORS Validation  
                         - Token Verification
                         - Role Authorization
```

## 📡 Endpoint e Rate Limits

| Endpoint | Rate Limit | Autenticazione |
|----------|------------|----------------|
| `POST /api/auth/login` | 5/15min | ❌ |
| `POST /api/auth/register` | 5/15min | ❌ |
| `POST /api/auth/request-otp` | 3/1min | ❌ |
| `POST /api/auth/forgot-password` | 3/1h | ❌ |
| `GET /api/bookings` | 100/15min | ✅ |
| `POST /api/bookings` | 10/10min | ✅ |
| `GET /api/admin/*` | 100/15min | ✅ Admin |

## 🛡️ Best Practices Implementate

### 🔐 **Autenticazione**
- Password con requisiti forti (8+ char, maiusc/minusc/numeri)
- JWT con expiration time
- Sessioni con timeout configurabile
- OTP per operazioni sensibili

### 🌐 **Network Security**
- HTTPS obbligatorio in produzione
- CORS ristretto al dominio frontend
- Headers di sicurezza completi
- Rate limiting per IP

### 💾 **Database Security**
- Connessioni sicure
- Query parameterizzate (Prisma ORM)
- Backup automatici raccomandati
- Separazione dev/prod databases

### 📧 **Email Security**
- Template dinamici anti-XSS
- Rate limiting per email
- Validazione indirizzi email
- App passwords per SMTP

## 🚨 Controlli di Sicurezza

### Prima del deploy:

```bash
# Verifica configurazione sicurezza
npm run security:check

# Output atteso:
✅ All security checks passed
✅ JWT_SECRET sufficient length
✅ FRONTEND_URL uses HTTPS
✅ No placeholder values found
```

### Monitoring continuo:

```bash
# Check logs per attività sospette
tail -f logs/security.log | grep "SUSPICIOUS"

# Monitor rate limiting
curl -I https://your-api.com/api/auth/login
# Controlla headers: X-RateLimit-*
```

## 🔧 Troubleshooting

### ❌ **Errori comuni:**

1. **JWT_SECRET troppo corto**
   ```bash
   # Genera nuovo secret
   npm run generate:jwt
   ```

2. **CORS errors**
   ```bash
   # Verifica FRONTEND_URL in .env
   FRONTEND_URL=https://tuo-dominio.com  # NO trailing slash
   ```

3. **Rate limit troppo aggressivo**
   ```bash
   # Aumenta limits in .env
   RATE_LIMIT_MAX_REQUESTS=200
   RATE_LIMIT_WINDOW_MS=1800000  # 30 min
   ```

4. **Database connection failed**
   ```bash
   # Per SQLite, verifica path
   DATABASE_URL="file:./production.db"
   
   # Per PostgreSQL, verifica credenziali
   DATABASE_URL="postgresql://user:pass@host:5432/db"
   ```

## 📈 Performance & Scalability

### 🎯 **Ottimizzazioni implementate:**
- Connection pooling (Prisma)
- Graceful shutdown
- Memory-efficient rate limiting
- Compressed responses
- Minimal logging in produzione

### 📊 **Metriche consigliate:**
- Response time < 200ms
- Memory usage < 512MB
- Database connection pool < 10
- Error rate < 1%

## 🆘 Supporto e Maintenance

### 📞 **In caso di problemi:**
1. Controlla logs: `tail -f logs/app.log`
2. Verifica health: `GET /health`
3. Test database: `npm run db:studio`
4. Restart graceful: `kill -SIGTERM <pid>`

### 🔄 **Updates sicuri:**
```bash
# 1. Backup database
cp production.db production.db.backup

# 2. Test in staging
NODE_ENV=staging npm run build

# 3. Deploy con zero downtime
npm run production:deploy
```

---

**🏥 Kinetica Fisioterapia Genova - Sistema Backend Sicuro e Professionale**

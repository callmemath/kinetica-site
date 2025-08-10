# 🚀 Deployment Kinetica Fisioterapia su DigitalOcean

Guida completa per deployare l'applicazione Kinetica Fisioterapia su un server DigitalOcean con Docker.

## 📋 Prerequisiti

### 1. Account DigitalOcean
- Crea un account su [DigitalOcean](https://www.digitalocean.com/)
- Aggiungi un metodo di pagamento

### 2. SSH Key Setup
```bash
# Genera chiave SSH (se non l'hai già)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copia la chiave pubblica
cat ~/.ssh/id_rsa.pub
```

### 3. Dominio (Opzionale)
- Acquista un dominio
- Configura i DNS per puntare al tuo droplet

## 🖥️ Creazione Droplet

### 1. Accedi al pannello DigitalOcean
- Vai su [DigitalOcean Console](https://cloud.digitalocean.com/)
- Clicca "Create" → "Droplet"

### 2. Configurazione Droplet
```
Distribuzione: Ubuntu 22.04 LTS
Piano: Basic
CPU: Regular Intel
Size: $12/mese (2GB RAM, 1 vCPU, 50GB SSD) - MINIMO
      $24/mese (4GB RAM, 2 vCPU, 80GB SSD) - RACCOMANDATO

Datacenter: Scegli il più vicino (es. Frankfurt per l'Europa)
VPC: Default
Authentication: SSH Key (incolla la tua chiave pubblica)
Hostname: kinetica-server
```

### 3. Aggiungi la tua SSH Key
- Incolla il contenuto di `~/.ssh/id_rsa.pub`
- Dai un nome alla chiave

## ⚙️ Configurazione Pre-Deploy

### 1. Configura le variabili d'ambiente

Crea il file `.env.production`:

```bash
# Environment
NODE_ENV=production

# Server
PORT=3001

# Frontend URL - IMPORTANTE: Inserisci il tuo dominio/IP
FRONTEND_URL=https://your-domain.com
# O se non hai dominio: FRONTEND_URL=http://YOUR_DROPLET_IP

# JWT Secret - GENERA UN SECRET SICURO
JWT_SECRET=your-super-secure-jwt-secret-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# Database
DATABASE_URL="file:/app/data/production.db"

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT_MINUTES=30
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
```

### 2. Genera JWT Secret sicuro
```bash
# Genera un secret di 64 caratteri
openssl rand -base64 64
```

### 3. Setup Email con Gmail
1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Abilita 2FA se non è già attivo
3. Vai su "App passwords"
4. Genera una password per "Mail"
5. Usa questa password in `SMTP_PASS`

## 🚀 Deployment

### 1. Imposta le variabili di ambiente per il deploy
```bash
export DROPLET_IP="YOUR_DROPLET_IP"
export DROPLET_USER="root"
export DOMAIN="your-domain.com"  # Opzionale
```

### 2. Esegui il deployment
```bash
# Deploy completo
./deploy-digitalocean.sh
```

### 3. Il script farà automaticamente:
- ✅ Setup del droplet con Docker
- ✅ Installazione delle dipendenze
- ✅ Configurazione del firewall
- ✅ Deploy dell'applicazione
- ✅ Setup del database
- ✅ Configurazione SSL (se hai un dominio)

## 🔧 Post-Deploy

### 1. Verifica che tutto funzioni
```bash
# Test health check
curl http://YOUR_DROPLET_IP/health

# Con dominio e SSL
curl https://your-domain.com/health
```

### 2. Crea l'utente admin
```bash
# Connettiti al server
ssh root@YOUR_DROPLET_IP

# Vai nella directory dell'app
cd /opt/kinetica

# Crea utente admin
docker-compose exec backend npm run setup:production -- --create-admin
```

### 3. Test completo
- Vai su `http://YOUR_DROPLET_IP` (o il tuo dominio)
- Testa registrazione utente
- Testa login
- Accedi al pannello admin con le credenziali generate

## 🔒 SSL/HTTPS Setup (Opzionale ma Raccomandato)

### Se hai un dominio:

1. **Configura DNS:**
   - Vai al tuo provider DNS
   - Crea un record A che punta a `YOUR_DROPLET_IP`
   - Esempio: `kinetica.tuodominio.com` → `YOUR_DROPLET_IP`

2. **Il deployment configurerà automaticamente SSL** se hai impostato `DOMAIN`

3. **Verifica SSL:**
   ```bash
   curl -I https://your-domain.com
   ```

## 📊 Monitoring e Manutenzione

### 1. Comandi utili
```bash
# Connettiti al server
ssh root@YOUR_DROPLET_IP

# Vai nella directory app
cd /opt/kinetica

# Visualizza logs
docker-compose logs -f

# Restart servizi
docker-compose restart

# Aggiorna applicazione
git pull && docker-compose build && docker-compose up -d

# Backup database
docker-compose exec backend cp /app/data/production.db /app/data/backup-$(date +%Y%m%d).db
```

### 2. Health Monitoring
```bash
# Check status servizi
docker-compose ps

# Health check API
curl http://localhost/health

# Verifica spazio disco
df -h

# Verifica memoria
free -m
```

### 3. Backup automatico
Il sistema include un servizio di backup automatico che:
- Crea backup giornalieri del database
- Conserva backup per 7 giorni
- Salva in `/opt/kinetica/backups/`

## 🚨 Troubleshooting

### Problemi comuni:

1. **Errore di connessione SSH:**
   ```bash
   # Verifica che la chiave SSH sia corretta
   ssh -v root@YOUR_DROPLET_IP
   ```

2. **Servizi non partono:**
   ```bash
   # Controlla logs
   cd /opt/kinetica
   docker-compose logs backend
   docker-compose logs frontend
   ```

3. **Database errori:**
   ```bash
   # Reset database
   docker-compose exec backend npm run db:migrate:production
   docker-compose exec backend npm run setup:production
   ```

4. **Memoria insufficiente:**
   - Upgraда droplet a un piano superiore
   - Minimo raccomandato: 2GB RAM

5. **Errori SSL:**
   ```bash
   # Rinnova certificato
   certbot renew
   docker-compose restart frontend
   ```

## 💰 Costi Stimati

| Componente | Costo Mensile |
|------------|---------------|
| Droplet Basic (2GB) | $12/mese |
| Droplet Raccomandato (4GB) | $24/mese |
| Dominio | $10-15/anno |
| **Totale mensile** | **$12-24** |

## 🔄 Aggiornamenti

### Per aggiornare l'applicazione:
```bash
# Locale: commit le modifiche
git add .
git commit -m "Update application"
git push

# Server: pull e redeploy
ssh root@YOUR_DROPLET_IP
cd /opt/kinetica
git pull
docker-compose build
docker-compose up -d
```

## 📞 Supporto

### Log importanti da controllare:
- `/opt/kinetica/logs/` - Application logs
- `docker-compose logs` - Container logs
- `/var/log/nginx/` - Nginx logs (se configurato)

### Comandi di diagnosi:
```bash
# Verifica servizi attivi
systemctl status docker
docker-compose ps

# Verifica rete
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Verifica spazio
df -h
du -sh /opt/kinetica/
```

---

**🎉 La tua applicazione Kinetica Fisioterapia è ora live su DigitalOcean!**

Per assistenza ulteriore, consulta la [documentazione DigitalOcean](https://docs.digitalocean.com/) o contatta il supporto.
# 🏥 Kinetica Fisioterapia - Sistema Gestionale Completo

Sistema completo per la gestione di uno studio di fisioterapia con frontend React e backend Node.js, pronto per il deployment su DigitalOcean.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![DigitalOcean](https://img.shields.io/badge/DigitalOcean-Ready-blue)

## 🚀 Funzionalità

### 👥 **Gestione Utenti**
- Registrazione e autenticazione pazienti
- Sistema OTP per sicurezza avanzata
- Gestione profili e storico

### 📅 **Sistema Prenotazioni**
- Prenotazioni online intuitive
- Calendario dinamico disponibilità
- Conferme automatiche via email
- Sistema reminder automatico

### 🏥 **Pannello Amministrativo**
- Dashboard completa con statistiche
- Gestione staff e servizi
- Reports dettagliati fatturato
- Controllo completo prenotazioni

### 📧 **Sistema Email Dinamico**
- Template professionali personalizzabili
- Informazioni studio dinamiche da database
- Conferme, reminder e notifiche
- Integrazione SMTP sicura

### 🔒 **Sicurezza Enterprise**
- Rate limiting avanzato
- Headers di sicurezza completi
- Validazione input rigorosa
- Sessioni sicure con JWT

## 🏗️ Architettura

```
Frontend (React + Vite)
       ↓
   Nginx Proxy
       ↓
Backend (Node.js + Express)
       ↓
Database (SQLite/PostgreSQL)
```

## 📦 Stack Tecnologico

### **Frontend**
- **React 18** con TypeScript
- **Vite** per build ottimizzate
- **TailwindCSS** per UI responsive
- **React Router** per SPA
- **React Hook Form** + Zod validation

### **Backend**
- **Node.js 18** con Express
- **TypeScript** per type safety
- **Prisma ORM** per database
- **JWT** per autenticazione
- **Nodemailer** per email
- **Helmet** + rate limiting per sicurezza

### **Database**
- **SQLite** (default)
- **PostgreSQL** (production ready)
- Schema completo con relazioni

### **DevOps**
- **Docker** + Docker Compose
- **Nginx** reverse proxy
- **SSL** automatico con Let's Encrypt
- **Backup** automatici database

## 🚀 Quick Start

### **Sviluppo Locale**

```bash
# Clone del repository
git clone https://github.com/USERNAME/kinetica-fisioterapia.git
cd kinetica-fisioterapia

# Setup completo
npm run setup

# Avvio development
npm run dev:fullstack
```

Accedi a:
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5174/admin

### **Deploy Produzione su DigitalOcean**

```bash
# Test pre-deployment
./test-deployment.sh

# Configura environment
cp .env.backend.production backend/.env
# Modifica con i tuoi dati reali

# Deploy automatico
export DROPLET_IP="YOUR_DROPLET_IP"
export DOMAIN="your-domain.com"  # opzionale
./deploy-digitalocean.sh
```

📖 **Guida completa**: [DIGITALOCEAN-DEPLOY.md](./DIGITALOCEAN-DEPLOY.md)

### Sito Vetrina (Pubblico)
- **Homepage** con presentazione dello studio e call-to-action "Prenota Ora"
- **Chi Siamo** con descrizione della filosofia, fondatrice e team
- **Servizi** (Fisioterapia, Osteopatia, Riabilitazione sportiva, Ginnastica posturale, Pilates)
- **Collaborazioni** (Cirque Du Soleil, Genova Volley)
- **Contatti** con indirizzo, telefono, email e mappa Google
- **Footer** con link social (Facebook, Instagram)

### WebApp Prenotazioni
- **Prenotazione Utente**: Form dinamico per scegliere servizio, data e ora
- **Area Personale**: Gestione prenotazioni esistenti via login OTP
- **Dashboard Staff**: Agenda visiva per gestione prenotazioni (ottimizzata per tablet/mobile)

### Design & UX
- Design elegante con colori chiari e accenti caldi
- Approccio mobile-first completamente responsive
- Animazioni fluide e interazioni intuitive

## 🚀 Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS con design system personalizzato
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Auth**: JWT + OTP semplificato

## 📦 Installazione e Avvio

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build di produzione
npm run preview
```

## 🔐 Autenticazione

Il sistema utilizza un approccio semplificato con:
- **Login via email + OTP** per i pazienti
- **Account staff** per la gestione (ruoli: user, staff, admin)
- **JWT tokens** per sessioni persistenti

### Account Demo
- **Paziente**: `mario.rossi@email.com`
- **Staff**: `staff@kineticafisioterapiagenova.it`
- **OTP**: `123456` (qualsiasi codice a 6 cifre)

## 🎯 Funzionalità Implementate

### ✅ Completate
- [x] Setup progetto con Vite + React + TypeScript
- [x] Configurazione TailwindCSS con tema personalizzato
- [x] Sistema di routing con React Router
- [x] Header responsive con navigazione mobile
- [x] Footer completo con informazioni contatto
- [x] Homepage con hero, servizi, testimonial
- [x] Sistema prenotazioni multi-step
- [x] Autenticazione con login OTP
- [x] Hook per gestione autenticazione
- [x] Design responsive mobile-first

---

**Kinetica Fisioterapia Genova** - Il tuo benessere è la nostra missione 💪

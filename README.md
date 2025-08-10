# Kinetica Fisioterapia Genova - Frontend

Sito web professionale e WebApp gestionale per lo studio Kinetica Fisioterapia Genova.

## 🎯 Caratteristiche Principali

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

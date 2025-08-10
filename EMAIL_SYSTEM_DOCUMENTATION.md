# Sistema Email Completo - Kinetica Fisioterapia

## 📧 Panoramica

Il sistema email di Kinetica Fisioterapia include funzionalità complete per:
- **OTP Email**: Registrazione, login e reset password 
- **Booking Email**: Conferma prenotazioni e cancellazioni
- **Reminder Email**: Promemoria automatici 24h prima degli appuntamenti

## 🔧 Configurazione

### Variabili Ambiente (.env)

```bash
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@kineticafisioterapia.com"
```

### Provider Supportati

**Gmail** (Consigliato per sviluppo)
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"  # App Password, non la password normale
```

**SendGrid** (Consigliato per produzione)
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

**Mailgun**
```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT=587
SMTP_USER="your-mailgun-smtp-login"
SMTP_PASS="your-mailgun-smtp-password"
```

## 📬 Tipi di Email

### 1. OTP Email (Autenticazione)

**Registrazione OTP**
- Inviata quando un utente si registra
- Codice a 6 cifre valido per 10 minuti
- Template professionale con branding Kinetica

**Login OTP** 
- Inviata per il login sicuro
- Stesso formato del codice registrazione

**Reset Password OTP**
- Inviata per reimpostare la password
- Design distintivo rosso per sicurezza

### 2. Booking Email (Prenotazioni)

**Conferma Prenotazione**
- Inviata automaticamente alla creazione di una booking
- Include tutti i dettagli: servizio, data, orario, terapista, costo
- Inviata anche quando l'admin conferma una prenotazione PENDING

**Promemoria 24h Prima**
- Sistema automatico che controlla ogni ora
- Invia reminder 24 ore prima dell'appuntamento
- Include informazioni pratiche (arrivare 10 min prima, documento, etc.)
- Tracking per evitare invii duplicati

**Conferma Cancellazione**
- Inviata quando una prenotazione viene cancellata
- Dall'utente o dall'admin
- Include link per nuova prenotazione

## 🤖 Sistema Reminder Automatico

### Funzionamento

1. **Controllo Orario**: Ogni ora verifica le prenotazioni del giorno successivo
2. **Filtro Status**: Solo prenotazioni CONFIRMED 
3. **Tracking**: Campo `reminderSent` previene duplicati
4. **Errore Resiliente**: Continua anche se una email fallisce

### Statistiche Reminder

Endpoint di monitoraggio:
```bash
GET /api/test/reminder-stats
```

Risposta:
```json
{
  "success": true,
  "data": {
    "totalBookings": 5,
    "remindersSent": 3,
    "pendingReminders": 2
  }
}
```

## 🔌 Integrazione API

### Booking Creation (POST /api/bookings)

```javascript
// Dopo creazione booking, automaticamente invia email conferma
const booking = await prisma.booking.create({...});
await emailService.sendBookingConfirmation(email, firstName, bookingDetails);
```

### Admin Status Update (PUT /api/admin/bookings/:id/status)

```javascript
// Quando status cambia a CONFIRMED o CANCELLED
if (status === 'CONFIRMED') {
  await emailService.sendBookingConfirmation(...);
} else if (status === 'CANCELLED') {
  await emailService.sendBookingCancellation(...);
}
```

### Booking Cancellation (DELETE /api/bookings/:id)

```javascript
// Quando utente cancella prenotazione
await emailService.sendBookingCancellation(...);
```

## 🧪 Testing

### Endpoint di Test (Solo Development)

**Test Email Invio**
```bash
GET /api/test/email
```

**Statistiche Reminder**
```bash
GET /api/test/reminder-stats
```

### Test in Produzione

1. **Registrazione**: Prova il flusso di registrazione completo
2. **Booking**: Crea una prenotazione e verifica email conferma
3. **Reminder**: Crea prenotazione per domani e aspetta reminder
4. **Cancellazione**: Cancella prenotazione e verifica email

## 🚀 Deploy in Produzione

### 1. Configurazione SMTP

Sostituire le credenziali di development con quelle di produzione:

```bash
# Produzione - SendGrid (Consigliato)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxxxxxxx"
FROM_EMAIL="noreply@kineticafisioterapia.com"
```

### 2. Validazione DNS

Per email professionali, configurare:
- **SPF Record**: `v=spf1 include:sendgrid.net ~all`
- **DKIM**: Fornito dal provider
- **DMARC**: Policy per sicurezza email

### 3. Monitoraggio

- Logs di invio email nei server logs
- Statistiche reminder via API
- Bounce e delivery rates dal provider

## 📋 Template Email

Tutti i template includono:
- **Design Responsive**: Ottimizzato per mobile
- **Branding Kinetica**: Colori e logo aziendali
- **Informazioni Contatto**: Indirizzo, telefono, email
- **CTA Chiari**: Pulsanti per azioni principali
- **Accessibilità**: Contrasti colori e leggibilità

## 🔒 Sicurezza

- **Rate Limiting**: Previene spam OTP
- **Validation**: Input sanitization
- **Timeout**: OTP scadono automaticamente
- **Tracking**: Log di tutti gli invii
- **Error Handling**: Fallback gracefully

## ⚡ Performance

- **Async**: Invio email non blocca API response
- **Batch Processing**: Reminder elaborati in batch
- **Retry Logic**: Automatically retry failed sends
- **Connection Pooling**: SMTP connections riutilizzate

## 🐛 Troubleshooting

### Email Non Arrivano

1. **Verifica Credenziali**: SMTP_USER e SMTP_PASS corretti
2. **Check Logs**: Console logs mostrano errori
3. **Firewall**: Porta 587 aperta
4. **Provider Limits**: Rispetta rate limits

### Reminder Non Inviati

1. **Database**: Campo `reminderSent` correttamente aggiornato
2. **Timezone**: Date corrette per il fuso orario
3. **Service Status**: ReminderService attivo
4. **Booking Status**: Solo CONFIRMED ricevono reminder

### Template Rotti

1. **HTML Syntax**: Valida markup HTML
2. **Variables**: Tutte le variabili definite
3. **CSS Inline**: Style inline per compatibilità
4. **Test Render**: Preview con dati mock

---

## 📞 Supporto

Per problemi con il sistema email:
1. Check logs backend per errori specifici
2. Verifica configurazione SMTP
3. Test con endpoint di development
4. Contatta provider email per delivery issues

**Sistema completamente funzionale e pronto per produzione!** ✅

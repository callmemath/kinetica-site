## 🧪 Test Email Reale

Per testare l'invio email reale (invece di solo console logs), puoi temporaneamente modificare l'EmailService:

### Metodo 1: Test Endpoint con Email Reale

Aggiungi questo endpoint temporaneo nel file `backend/src/index.ts`:

```javascript
// Test email endpoint con invio reale (development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test/real-email/:email', async (req, res) => {
    try {
      const { EmailService } = await import('./services/EmailService');
      const emailService = new EmailService();
      
      // Forza invio reale anche in development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const testBookingDetails = {
        id: 'test-booking-123',
        serviceName: 'Fisioterapia Test',
        date: new Date().toISOString(),
        time: '14:30',
        therapistName: 'Dr. Test',
        duration: 60,
        price: 80,
        notes: 'Test booking per verificare le email'
      };

      await emailService.sendBookingConfirmation(
        req.params.email, // Email da URL
        'Test User',
        testBookingDetails
      );
      
      // Ripristina env originale
      process.env.NODE_ENV = originalEnv;

      res.json({
        success: true,
        message: `Email di test inviata realmente a ${req.params.email}`
      });
    } catch (error) {
      console.error('Real email test error:', error);
      res.status(500).json({
        success: false,
        message: 'Errore nell\'invio dell\'email reale: ' + error.message
      });
    }
  });
}
```

Poi testa con:
```bash
curl -X GET "http://localhost:3001/api/test/real-email/la-tua-email@gmail.com"
```

### Metodo 2: Cambio Temporaneo NODE_ENV

Oppure cambia temporaneamente nel file `.env`:
```bash
NODE_ENV=production
```

E riavvia il server, poi testa normalmente.

### Metodo 3: Test tramite Registrazione

Il modo più semplice è testare tramite il flusso normale:
1. Vai su http://localhost:5174/login
2. Clicca "Registrati"
3. Inserisci la tua email Gmail
4. Dovresti ricevere l'OTP reale nella tua casella email!

# Configurazione Studio - Guida Completa

## 📍 File di Configurazione Centralizzato

Tutte le informazioni dello studio sono centralizzate nel file:
```
src/config/studioInfo.ts
```

## 🎯 Vantaggi

- **Un unico posto** per modificare tutte le informazioni dello studio
- **Consistenza** garantita su tutto il sito
- **Facilità di manutenzione** - niente più modifiche file per file
- **Funzioni di utilità** per formattazione automatica

## 📝 Come Modificare le Informazioni

### 1. Informazioni Generali
```typescript
name: 'Kinetica',                    // Nome breve dello studio
fullName: 'Kinetica Fisioterapia Genova',  // Nome completo
tagline: 'Fisioterapia Genova',      // Sottotitolo
```

### 2. Contatti
```typescript
contact: {
  phone: '+39 010 123 4567',         // Numero di telefono
  email: 'info@kineticafisioterapia.com', // Email principale
  website: 'www.kineticafisioterapia.com', // Sito web
}
```

### 3. Indirizzo
```typescript
address: {
  street: 'Via Example 123',          // Via e numero civico
  city: 'Genova',                     // Città
  province: 'GE',                     // Provincia
  postalCode: '16100',                // CAP
  country: 'Italia',                  // Paese
}
```

### 4. Orari di Apertura
```typescript
workingHours: {
  monday: { start: '08:00', end: '20:00' },    // Lunedì
  tuesday: { start: '08:00', end: '20:00' },   // Martedì
  wednesday: { start: '08:00', end: '20:00' }, // Mercoledì
  thursday: { start: '08:00', end: '20:00' },  // Giovedì
  friday: { start: '08:00', end: '20:00' },    // Venerdì
  saturday: { start: '08:00', end: '13:00' },  // Sabato
  sunday: { closed: true },                    // Domenica (chiuso)
}
```

### 5. Social Media
```typescript
social: {
  facebook: 'https://facebook.com/kineticafisioterapia',
  instagram: 'https://instagram.com/kineticafisioterapia',
  linkedin: 'https://linkedin.com/company/kineticafisioterapia',
  youtube: 'https://youtube.com/@kineticafisioterapia',
}
```

## 🛠️ Funzioni di Utilità

Il file include anche funzioni helper per formattare automaticamente i dati:

### Formattazione Telefono
```typescript
formatters.formatPhone('+39 010 123 4567')     // → '010 123 4567'
formatters.formatPhoneLink('+39 010 123 4567') // → '+390101234567'
```

### Link Email
```typescript
formatters.formatEmailLink('info@studio.com')           // → 'mailto:info@studio.com'
formatters.formatEmailLink('info@studio.com', 'Saluti') // → 'mailto:info@studio.com?subject=Saluti'
```

### Google Maps
```typescript
formatters.generateMapsLink() // → Link Google Maps con indirizzo
```

## 📍 Dove vengono utilizzate

Le informazioni sono automaticamente utilizzate in:

- ✅ **Header** - Nome e tagline dello studio
- ✅ **Footer** - Tutti i contatti, orari, social
- ✅ **Dashboard Utente** - Sezione contatti centro
- ✅ **Pagine di contatto** - Informazioni complete
- 🔄 **Altri componenti** - Man mano che vengono aggiornati

## 🎨 Come Aggiungere in Nuovi Componenti

1. **Importa la configurazione:**
```typescript
import { STUDIO_INFO, formatters } from '../config/studioInfo';
```

2. **Usa le informazioni:**
```typescript
// Nome dello studio
<h1>{STUDIO_INFO.name}</h1>

// Telefono con link
<a href={`tel:${formatters.formatPhoneLink(STUDIO_INFO.contact.phone)}`}>
  {formatters.formatPhone(STUDIO_INFO.contact.phone)}
</a>

// Email con link
<a href={formatters.formatEmailLink(STUDIO_INFO.contact.email)}>
  {STUDIO_INFO.contact.email}
</a>

// Indirizzo completo
<p>{STUDIO_INFO.address.full}</p>

// Orari formattati
{Object.entries(STUDIO_INFO.workingHours.formatted).map(([period, hours]) => (
  <p key={period}>{period}: {hours}</p>
))}
```

## 📋 Lista di Controllo per Aggiornamenti

Quando aggiorni le informazioni dello studio:

- [ ] Modifica solo il file `src/config/studioInfo.ts`
- [ ] Verifica che tutti i campi siano corretti
- [ ] Testa il sito per verificare che le modifiche siano visibili
- [ ] Controlla che i link funzionino (telefono, email, maps)

## 🚀 Esempi di Utilizzo Rapido

### Cambiare Numero di Telefono
```typescript
// In src/config/studioInfo.ts
contact: {
  phone: '+39 010 999 8877', // Nuovo numero
  // ...
}
```

### Aggiornare Orari
```typescript
// In src/config/studioInfo.ts
workingHours: {
  monday: { start: '09:00', end: '19:00' }, // Nuovi orari lunedì
  // ...
}
```

### Cambiare Indirizzo
```typescript
// In src/config/studioInfo.ts
address: {
  street: 'Via Nuova 456',
  city: 'Genova',
  province: 'GE',
  postalCode: '16121',
  country: 'Italia',
}
```

Tutte le modifiche saranno automaticamente applicate in tutto il sito! 🎉

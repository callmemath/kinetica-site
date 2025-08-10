# 🩺 Gestione Staff Kinetica - Guida Produzione

Questa guida spiega come gestire gli account staff in ambiente di produzione senza accesso diretto al database.

## 🚀 Script Disponibili

### 1. Creazione Nuovo Staff
```bash
npx tsx scripts/create-staff.ts <firstName> <lastName> <email> <password> <specialization> [phone] [yearsOfExperience] [bio]
```

**Parametri obbligatori:**
- `firstName`: Nome del fisioterapista
- `lastName`: Cognome
- `email`: Email (deve essere unica)
- `password`: Password (minimo 6 caratteri)
- `specialization`: Specializzazione professionale

**Parametri opzionali:**
- `phone`: Numero di telefono
- `yearsOfExperience`: Anni di esperienza (numero)
- `bio`: Biografia/descrizione

**Esempi:**
```bash
# Creazione base
npx tsx scripts/create-staff.ts "Mario" "Rossi" "mario.rossi@kinetica.it" "securepass123" "Fisioterapia"

# Creazione completa
npx tsx scripts/create-staff.ts "Sara" "Bianchi" "sara.bianchi@kinetica.it" "mypass456" "Osteopatia" "+39 333 123 4567" "8" "Specialista in manipolazioni vertebrali e terapie manuali"
```

### 2. Gestione Staff Esistente
```bash
npx tsx scripts/manage-staff.ts <comando> [parametri]
```

**Comandi disponibili:**

#### Lista tutti gli staff
```bash
npx tsx scripts/manage-staff.ts list
```

#### Attiva/Disattiva staff
```bash
npx tsx scripts/manage-staff.ts activate mario.rossi@kinetica.it
npx tsx scripts/manage-staff.ts deactivate mario.rossi@kinetica.it
```

#### Reset password
```bash
npx tsx scripts/manage-staff.ts reset-password mario.rossi@kinetica.it nuovapassword123
```

#### Elimina staff
```bash
# Eliminazione normale (fallisce se ci sono prenotazioni)
npx tsx scripts/manage-staff.ts delete mario.rossi@kinetica.it

# Eliminazione forzata
npx tsx scripts/manage-staff.ts delete mario.rossi@kinetica.it --force
```

## 🔐 Sicurezza

### Password
- Minimo 6 caratteri
- Vengono hashate con bcrypt (salt 10)
- Non sono mai visibili in plain text

### Ruoli
- Tutti gli staff hanno ruolo `STAFF`
- Account automaticamente verificati
- Accesso limitato alle proprie prenotazioni

### Validazione
- Email deve essere unica nel sistema
- Tutti i campi obbligatori vengono validati
- Errori descrittivi in caso di problemi

## 📋 Workflow di Produzione

### 1. Nuovo Dipendente
```bash
# 1. Crea l'account
npx tsx scripts/create-staff.ts "Nome" "Cognome" "email@kinetica.it" "passwordtemp123" "Specializzazione" "telefono" "anni"

# 2. Verifica creazione
npx tsx scripts/manage-staff.ts list

# 3. Comunica credenziali al dipendente (tramite canale sicuro)
```

### 2. Dipendente Dimesso
```bash
# 1. Disattiva temporaneamente
npx tsx scripts/manage-staff.ts deactivate email@kinetica.it

# 2. Se necessario, elimina definitivamente
npx tsx scripts/manage-staff.ts delete email@kinetica.it --force
```

### 3. Password Dimenticata
```bash
# Reset password
npx tsx scripts/manage-staff.ts reset-password email@kinetica.it nuovapassword123
```

### 4. Monitoraggio
```bash
# Lista completa con statistiche
npx tsx scripts/manage-staff.ts list
```

## 🚨 Troubleshooting

### Errore: "Email già esistente"
L'email è già utilizzata da un altro utente o staff member.
```bash
# Verifica chi usa l'email
npx tsx scripts/manage-staff.ts list | grep "email@esempio.com"
```

### Errore: "Staff ha prenotazioni attive"
Non puoi eliminare staff con prenotazioni pendenti.
```bash
# Forza eliminazione (attenzione!)
npx tsx scripts/manage-staff.ts delete email@kinetica.it --force
```

### Script non funziona
Verifica di essere nella cartella backend:
```bash
cd /path/to/your/backend
npx tsx scripts/manage-staff.ts list
```

## 🔄 Backup e Sicurezza

### Prima di eliminazioni importanti
```bash
# Backup del database
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

### Log delle operazioni
Tutti gli script mostrano output dettagliato per audit trail.

## 📞 Supporto

In caso di problemi:
1. Verifica la sintassi dei comandi
2. Controlla i log di errore
3. Verifica connessione database
4. Contatta il team di sviluppo

---

**⚠️ Importante:** Questi script modificano direttamente il database. Usali con attenzione in produzione e mantieni sempre backup aggiornati.

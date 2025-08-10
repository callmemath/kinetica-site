#!/bin/bash

# 🚀 Script di deployment rapido per Kinetica
echo "🩺 Kinetica - Deploy Staff Management System"
echo "============================================"

# Verifica se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Esegui questo script dalla directory backend"
    exit 1
fi

# Install dependencies
echo "📦 Installazione dipendenze..."
npm install

# Generate Prisma client
echo "🔧 Generazione Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Applicazione migrazioni database..."
npx prisma migrate deploy

# Setup production
echo "🚀 Setup iniziale produzione..."
npm run setup:production

echo ""
echo "✅ Deploy completato!"
echo ""
echo "📋 Comandi utili per la gestione staff:"
echo "   npm run staff:list                              # Lista tutti gli staff"
echo "   npm run staff:create Nome Cognome email pass specializzazione"
echo "   npm run staff:manage activate email@esempio.com # Attiva staff"
echo "   npm run staff:manage deactivate email@esempio.com # Disattiva staff"
echo "   npm run staff:manage reset-password email@esempio.com nuovapass"
echo ""
echo "📚 Documentazione completa: STAFF_MANAGEMENT.md"

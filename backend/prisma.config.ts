import { defineConfig } from 'prisma/config'

export default defineConfig({
  // Configurazione per il seeding del database
  seed: 'tsx prisma/seed.ts',
  
  // Altre configurazioni possono essere aggiunte qui in futuro
  // quando saranno supportate dalla nuova configurazione
})

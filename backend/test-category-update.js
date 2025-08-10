const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCategoryColor() {
  // Trova la categoria 'Ciao' e cambia il colore
  const category = await prisma.category.findFirst({
    where: { value: 'Ciao' }
  });
  
  if (!category) {
    console.log('Category not found');
    return;
  }
  
  console.log('Current category:', category);
  
  // Cambia il colore a blu
  const newColor = '#3b82f6'; // blu
  
  const updatedCategory = await prisma.category.update({
    where: { id: category.id },
    data: { color: newColor }
  });
  
  console.log('Updated category color to:', updatedCategory.color);
  
  // Verifica che il servizio ora abbia la categoria aggiornata
  const serviceWithCategory = await prisma.service.findFirst({
    where: { categoryId: category.id },
    include: { category: true }
  });
  
  console.log('Service with updated category color:', serviceWithCategory?.category?.color);
}

updateCategoryColor()
  .catch((e) => {
    console.error('Errore:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

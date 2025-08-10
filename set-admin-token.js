// Script per impostare il token admin nel localStorage
// Apri la console del browser e incolla questo script

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWU0ZWRycnAwMDAwb3RuMmI3bW14YWszIiwiZW1haWwiOiJhZG1pbkBraW5ldGljYS5pdCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1NDc2MzA0NSwiZXhwIjoxNzU0ODQ5NDQ1fQ.4GGxQvj4kEpxBr5n-6qgztODEQ1ZmKv38V_WUfQUYf4';

localStorage.setItem('authToken', adminToken);
console.log('Token admin impostato nel localStorage');
console.log('Ricarica la pagina per vedere i report');

// Verifica il token
console.log('Token salvato:', localStorage.getItem('authToken'));

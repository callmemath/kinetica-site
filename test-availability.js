const fetch = require('node-fetch');

async function testAvailability() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/available-slots?date=2025-08-10&serviceId=cme0qnimm0003uf2e9dwxjmz0', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyX2NtZTBxbmltcTAwMGF1ZjJlbzFkdnRqc2giLCJlbWFpbCI6Im1hcmNvLnJvc3NpQGtpbmV0aWNhLml0Iiwicm9sZSI6IlNUQUZGIiwiaWF0IjoxNzU0NjgzNDAyLCJleHAiOjE3NTUyODgyMDJ9.Q_NVGKjOwNZqtxoH_ybALGhV4KEjCgJNti9lJd_UlVQ',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAvailability();

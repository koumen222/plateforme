// Script pour vérifier les sources Google Sheets configurées
const axios = require('axios');

async function checkSources() {
  try {
    // Récupérer un token valide (remplacez par votre token)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODcwZGE4NjU5MGY0MzkxMmJmNGNhMCIsImVtYWlsIjoiemVuZG9AZ21haWwuY29tIiwicm9sZSI6ImVjb21fYWRtaW4iLCJ3b3Jrc3BhY2VJZCI6IjY5ODcwZGE5NjU5MGY0MzkxMmJmNGNhMiIsImlhdCI6MTc3MTA0MzQ1NSwiZXhwIjoxNzcxMTI5ODU1fQ.example';
    
    const response = await axios.get('http://localhost:3000/api/ecom/auto-sync/settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Sources configurées:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
    // Tester chaque source
    const { sources } = response.data.data;
    
    if (sources.legacy) {
      console.log('\n🔍 Test source legacy:', sources.legacy);
      await testSheetUrl(sources.legacy.spreadsheetId, sources.legacy.sheetName);
    }
    
    sources.custom.forEach((source, index) => {
      console.log(`\n🔍 Test source custom ${index + 1}:`, source);
      testSheetUrl(source.spreadsheetId, source.sheetName);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

async function testSheetUrl(spreadsheetId, sheetName) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName || 'Sheet1')}`;
    console.log(`🔗 Test URL: ${url}`);
    
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
      if (jsonStr) {
        const json = JSON.parse(jsonStr[1]);
        console.log(`✅ Sheet accessible - ${json.table?.rows?.length || 0} lignes`);
      } else {
        console.log('⚠️ Format de réponse invalide');
      }
    } else {
      console.log(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  }
}

checkSources();

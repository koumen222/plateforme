// Script pour créer un admin via l'API du backend
const http = require('http');

const adminData = {
  email: 'admin@ecommerce.com',
  password: 'admin123',
  role: 'ecom_admin',
  firstName: 'Administrateur',
  lastName: 'E-commerce'
};

function createAdminViaAPI() {
  const postData = JSON.stringify(adminData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/ecom/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (res.statusCode === 201) {
          console.log('🎉 Compte administrateur e-commerce créé avec succès!');
          console.log('\n📋 Identifiants de connexion:');
          console.log('   🌐 URL: http://localhost:5173/ecom/login');
          console.log('   📧 Email: admin@ecommerce.com');
          console.log('   🔑 Mot de passe: admin123');
          console.log('   🎯 Rôle: ecom_admin (accès complet)');
          console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants!');
        } else {
          console.log('❌ Erreur lors de la création:', result.message || data);
        }
      } catch (error) {
        console.log('❌ Réponse du serveur:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Erreur de connexion au backend:', error.message);
    console.log('\n💡 Assurez-vous que le backend est démarré sur http://localhost:3000');
    console.log('   Lancez: npm start dans le dossier backend');
  });

  req.write(postData);
  req.end();
}

console.log('🔄 Création du compte admin e-commerce...');
createAdminViaAPI();

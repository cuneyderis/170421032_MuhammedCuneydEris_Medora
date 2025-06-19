const admin = require('firebase-admin');

// Firebase Admin SDK'sını initialize et
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://medora-1f84d-default-rtdb.europe-west1.firebasedatabase.app'
});

async function updateFirestoreRules() {
  try {
    console.log('Firestore güvenlik kuralları güncelleniyor...');

    // Yeni güvenlik kuralları
    const newRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    console.log('Yeni kurallar:');
    console.log(newRules);
    
    console.log('\n⚠️  Bu script sadece kuralları gösterir.');
    console.log('📋 Lütfen Firebase Console\'dan manuel olarak güncelleyin:');
    console.log('1. Firebase Console → Firestore Database → Rules');
    console.log('2. Yukarıdaki kuralları kopyala-yapıştır');
    console.log('3. Publish butonuna tıkla');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    process.exit(0);
  }
}

// Script'i çalıştır
updateFirestoreRules(); 
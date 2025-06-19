const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://medora-1f84d-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

async function fixFirestoreIndexes() {
  console.log('🔧 Firestore index sorunları düzeltiliyor...');
  
  try {
    // 1. health-assessments koleksiyonundaki sorgu yapısını kontrol et
    console.log('📊 Health assessments koleksiyonu kontrol ediliyor...');
    
    const assessmentsRef = db.collection('health-assessments');
    
    // Basit query yap (index gerektirmez)
    const snapshot = await assessmentsRef
      .limit(5)
      .get();
    
    console.log(`✅ ${snapshot.size} assessment belgesi bulundu`);
    
    // 2. Mevcut belgelerin yapısını kontrol et
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('📋 Belge yapısı:', {
        id: doc.id,
        userId: data.userId,
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : 'Yok',
        hasCardiovascularRisk: !!data.cardiovascularRisk,
        hasEcgAnalysis: !!data.ecgAnalysis
      });
    });
    
    // 3. Index gerektirmeyen alternative query öner
    console.log('\n💡 Önerilen çözümler:');
    console.log('1. Composite index oluştur: https://console.firebase.google.com/v1/r/project/medora-1f84d/firestore/indexes');
    console.log('2. Query yapısını değiştir (tek field sorgulama)');
    console.log('3. Client-side filtering kullan');
    
    // 4. Test query - sadece userId ile
    console.log('\n🧪 Test query - sadece userId ile...');
    const testUserId = 'test-user-id';
    
    const simpleQuery = await assessmentsRef
      .where('userId', '==', testUserId)
      .limit(10)
      .get();
    
    console.log(`✅ Basit query başarılı: ${simpleQuery.size} sonuç`);
    
    console.log('\n✅ Firestore index analizi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Firestore index hatası:', error);
    
    if (error.code === 9) {
      console.log('\n🔗 Composite index oluşturmak için:');
      console.log('https://console.firebase.google.com/v1/r/project/medora-1f84d/firestore/indexes?create_composite=Cldwcm9qZWN0cy9tZWRvcmEtMWY4NGQvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2hlYWx0aC1hc3Nlc3NtZW50cy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC');
    }
  }
}

// Script'i çalıştır
if (require.main === module) {
  fixFirestoreIndexes()
    .then(() => {
      console.log('🎉 Script tamamlandı!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { fixFirestoreIndexes }; 
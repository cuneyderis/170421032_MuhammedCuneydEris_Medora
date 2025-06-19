const admin = require('firebase-admin');

// Firebase Admin SDK'sını initialize et
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://medora-1f84d-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.firestore();
const auth = admin.auth();

async function fixDoctorIds() {
  try {
    console.log('Doktor ID\'lerini düzeltme işlemi başlıyor...');

    // 1. Tüm doktor document'larını al
    const doctorsSnapshot = await db.collection('doctors').get();
    console.log(`${doctorsSnapshot.docs.length} doktor belgesi bulundu`);

    // 2. Her doktor için Authentication'da eşleşen kullanıcıyı bul
    for (const doctorDoc of doctorsSnapshot.docs) {
      const doctorData = doctorDoc.data();
      const currentDocId = doctorDoc.id;
      const doctorEmail = doctorData.email;

      console.log(`\nİşleniyor: ${doctorEmail} (Mevcut ID: ${currentDocId})`);

      try {
        // Email ile Authentication'da kullanıcıyı bul
        const userRecord = await auth.getUserByEmail(doctorEmail);
        const authUid = userRecord.uid;

        console.log(`Authentication UID bulundu: ${authUid}`);

        // Eğer document ID zaten auth UID ile eşleşiyorsa, atla
        if (currentDocId === authUid) {
          console.log('✅ ID zaten doğru, atlıyor...');
          continue;
        }

        // 3. Yeni document'ı doğru UID ile oluştur
        await db.collection('doctors').doc(authUid).set({
          ...doctorData,
          uid: authUid, // UID'yi de data'ya ekle
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Yeni document oluşturuldu: ${authUid}`);

        // 4. Eski document'ı sil
        await db.collection('doctors').doc(currentDocId).delete();
        console.log(`🗑️ Eski document silindi: ${currentDocId}`);

        // 5. Bu doktorun randevularını güncelle
        const appointmentsSnapshot = await db.collection('appointments')
          .where('doctorId', '==', currentDocId)
          .get();

        if (!appointmentsSnapshot.empty) {
          console.log(`${appointmentsSnapshot.docs.length} randevu güncelleniyor...`);
          
          const batch = db.batch();
          appointmentsSnapshot.docs.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, {
              doctorId: authUid,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
          
          await batch.commit();
          console.log('✅ Randevular güncellendi');
        }

      } catch (authError) {
        console.error(`❌ ${doctorEmail} için Authentication kullanıcısı bulunamadı:`, authError.message);
        
        // Eğer Authentication'da kullanıcı yoksa, oluştur
        console.log('Authentication kullanıcısı oluşturuluyor...');
        try {
          const newUserRecord = await auth.createUser({
            email: doctorEmail,
            password: 'TempPassword123!', // Geçici şifre
            displayName: `${doctorData.title || 'Dr.'} ${doctorData.name}`,
            emailVerified: true
          });

          console.log(`✅ Authentication kullanıcısı oluşturuldu: ${newUserRecord.uid}`);

          // Document'ı yeni UID ile yeniden oluştur
          await db.collection('doctors').doc(newUserRecord.uid).set({
            ...doctorData,
            uid: newUserRecord.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Eski document'ı sil
          await db.collection('doctors').doc(currentDocId).delete();

          // Randevuları güncelle
          const appointmentsSnapshot = await db.collection('appointments')
            .where('doctorId', '==', currentDocId)
            .get();

          if (!appointmentsSnapshot.empty) {
            const batch = db.batch();
            appointmentsSnapshot.docs.forEach(appointmentDoc => {
              batch.update(appointmentDoc.ref, {
                doctorId: newUserRecord.uid,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
            });
            await batch.commit();
          }

          console.log(`✅ ${doctorEmail} için tüm işlemler tamamlandı`);
          console.log(`🔑 Geçici şifre: TempPassword123!`);

        } catch (createError) {
          console.error(`❌ ${doctorEmail} için kullanıcı oluşturulamadı:`, createError.message);
        }
      }
    }

    console.log('\n🎉 Doktor ID düzeltme işlemi tamamlandı!');
    console.log('\n📋 Özet:');
    
    // Son durumu kontrol et
    const finalDoctorsSnapshot = await db.collection('doctors').get();
    console.log(`✅ Toplam doktor sayısı: ${finalDoctorsSnapshot.docs.length}`);
    
    for (const doc of finalDoctorsSnapshot.docs) {
      const data = doc.data();
      console.log(`   - ${data.email}: ${doc.id}`);
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    process.exit(0);
  }
}

// Script'i çalıştır
fixDoctorIds(); 
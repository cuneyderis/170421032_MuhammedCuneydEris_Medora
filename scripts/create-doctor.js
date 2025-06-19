const admin = require('firebase-admin');

// Firebase Admin SDK'sını initialize etmek için service account key'inizi buraya eklemeniz gerekiyor
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://medora-1f84d-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.firestore();
const auth = admin.auth();

async function createDoctorUser() {
  try {
    // Önce Authentication'da doktor kullanıcısını oluştur
    const userRecord = await auth.createUser({
      email: 'doktor@medora.com',
      password: 'doktor123', // Güvenli bir şifre kullanın
      displayName: 'Dr. Ahmet Kardiyolog'
    });

    console.log('Doktor authentication oluşturuldu:', userRecord.uid);

    // Sonra Firestore'da doktor belgesini oluştur
    const doctorData = {
      uid: userRecord.uid,
      email: 'doktor@medora.com',
      firstName: 'Dr. Ahmet',
      lastName: 'Kardiyolog',
      role: 'doctor',
      specialization: 'Kardiyoloji',
      licenseNumber: 'KRD-2024-001',
      hospital: 'Medora Tıp Merkezi',
      department: 'Kardiyoloji Bölümü',
      experience: 15,
      education: [
        'İstanbul Üniversitesi Tıp Fakültesi',
        'Johns Hopkins Kardiyoloji Uzmanlığı'
      ],
      certifications: [
        'Kardiyoloji Uzmanı',
        'Girişimsel Kardiyoloji Sertifikası'
      ],
      image: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('doctors').doc(userRecord.uid).set(doctorData);
    console.log('Doktor Firestore belgesi oluşturuldu');

    console.log('Doktor başarıyla oluşturuldu!');
    console.log('Email: doktor@medora.com');
    console.log('Şifre: doktor123');
    console.log('UID:', userRecord.uid);

  } catch (error) {
    console.error('Doktor oluşturulurken hata:', error);
  }
}

// Script'i çalıştır
createDoctorUser(); 
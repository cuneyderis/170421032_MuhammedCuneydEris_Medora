import { auth, db } from "@/config/firebase";
import { AuthContextType, UserHealthProfile, UserType, DoctorProfile } from "@/types";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { setDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from "react";
import { View, Text } from "react-native";


const AuthContext = createContext<AuthContextType | null>(null);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserType>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
        console.log('AuthContext useEffect started');
        
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser ? 'logged in' : 'logged out');
            
            try {
                if (firebaseUser) {
                    // Kullanıcı verilerini al
                    const userData = await getUserData(firebaseUser.uid);
                    
                    if (userData) {
                        console.log('User data loaded:', userData.role);
                        setUser(userData);
                    } else {
                        console.log("User data bulunamadi");
                        setUser(null);
                    }
                } else {
                    console.log('No user found');
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
                setUser(null);
            } finally {
                // Her durumda loading'i false yap
                setIsLoading(false);
                console.log('Loading set to false');
            }
        });

        return () => {
            console.log('Auth listener cleanup');
            unsub();
        };
    }, []);

    // User state değiştiğinde navigation yap
    useEffect(() => {
        if (!isLoading && user) {
            console.log('Navigation effect triggered for user:', user.role);
            
            setTimeout(() => {
                if (user.role === 'doctor') {
                    console.log("Doktor tabs'a yonlendiriliyor");
                    router.replace("/(tabs)");
                } else if (user.role === 'patient') {
                    if (!user.healthProfile) {
                        console.log("Health profile eksik, onboarding'e yonlendiriliyor");
                        router.replace("/(auth)/onboarding-modal");
                    } else {
                        console.log("Patient tabs'a yonlendiriliyor");
                        router.replace("/(tabs)");
                    }
                } else {
                    console.log("Welcome'a yonlendiriliyor");
                    router.replace("/(auth)/welcome");
                }
            }, 100);
        } else if (!isLoading && !user) {
            console.log('No user, redirecting to welcome');
            setTimeout(() => {
                router.replace("/(auth)/welcome");
            }, 100);
        }
    }, [user, isLoading]);

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };

        } catch (error: any) {
            let msg = error.message;
            console.log("err msg:", msg);
            if(msg.includes("(auth/invalid-credential)")){
                msg= "Hatalı giriş";
            }
            if(msg.includes("(auth/invalid-email)")){
                msg= "Hatalı email";
            }
            if(msg.includes("(auth/network-request-failed)")){
                msg= "İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.";
            }
            if(msg.includes("timeout")){
                msg= "Bağlantı zaman aşımına uğradı. Tekrar deneyin.";
            }
            return { success: false, msg }
        }
    };

    const logout = async (): Promise<{ success: boolean; msg?: string }> => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error: any) {
            console.log("Çıkış yaparken hata:", error);
            return { 
                success: false, 
                msg: error.message || "Çıkış yapılırken bir hata oluştu" 
            };
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            let response = await createUserWithEmailAndPassword(
                auth,
                email,
                password);
            
            // Her zaman patients koleksiyonuna kaydet, sadece hastalar kayıt olabilir
            await setDoc(doc(db, "patients", response?.user?.uid), {
                firstName,
                lastName,
                email,
                uid: response?.user?.uid,
                role: 'patient'
            });
            
            // After registration, redirect to onboarding modal
            router.replace("/(auth)/onboarding-modal");
            
            return { success: true };

        } catch (error: any) {
            let msg = error.message;
            if(msg.includes("(auth/email-already-in-use)")){
                msg= "Bu email zaten kullanılıyor";
            }
            if(msg.includes("(auth/invalid-email)")){
                msg= "Hatalı email";
            }
            return { success: false, msg }
        }
    };

    const getUserData = async (uid: string): Promise<UserType> => {
        try {
            // First check if the user is a patient
            const patientDocRef = doc(db, "patients", uid);
            const patientDocSnap = await getDoc(patientDocRef);

            if (patientDocSnap.exists()) {
                const data = patientDocSnap.data();
                
                // Local'den resmi yükle
                let imageUri = null;
                if (data.image && data.image.startsWith('local://')) {
                    imageUri = await loadProfileImageFromStorage(uid);
                } else {
                    imageUri = data.image;
                }
                
                const userData: UserType = {
                    uid: data?.uid,
                    email: data.email || null,
                    firstName: data.firstName || null,
                    lastName: data.lastName || null,
                    image: imageUri,
                    healthProfile: data.healthProfile || null,
                    role: 'patient'
                };
                return userData;
            }

            // If not found in patients, check doctors collection
            const doctorDocRef = doc(db, "doctors", uid);
            const doctorDocSnap = await getDoc(doctorDocRef);

            if (doctorDocSnap.exists()) {
                const data = doctorDocSnap.data();
                console.log("Bulunan doktor verisi:", data);
                
                // Local'den resmi yükle
                let imageUri = null;
                if (data.image && data.image.startsWith('local://')) {
                    imageUri = await loadProfileImageFromStorage(uid);
                } else {
                    imageUri = data.image;
                }
                
                // Doktor adını normalize et
                const firstName = data.firstName || data.name?.split(' ')[0] || 'Doktor';
                const lastName = data.lastName || data.name?.split(' ').slice(1).join(' ') || '';
                
                const userData: UserType = {
                    uid: data?.uid,
                    email: data.email || null,
                    firstName: firstName,
                    lastName: lastName,
                    image: imageUri,
                    doctorProfile: {
                        specialization: data.specialization || data.specialty,
                        licenseNumber: data.licenseNumber,
                        hospital: data.hospital,
                        department: data.department,
                        experience: data.experience,
                        education: data.education || [],
                        certifications: data.certifications || []
                    },
                    role: data.role || 'doctor'
                };
                return userData;
            }

            // Kullanıcı hiçbir koleksiyonda bulunamadıysa, temel user oluştur
            console.log('User not found in any collection, creating fallback user');
            const fallbackUser: UserType = {
                uid: uid,
                email: null,
                firstName: 'Kullanıcı',
                lastName: '',
                role: 'patient'
            };
            return fallbackUser;
        } catch (error: any) {
            console.log('Kullanıcı verisi alınırken hata:', error);
            // Hata durumunda da fallback user döndür
            const fallbackUser: UserType = {
                uid: uid,
                email: null,
                firstName: 'Kullanıcı',
                lastName: '',
                role: 'patient'
            };
            return fallbackUser;
        }
    };

    const updateUserData = async (uid: string): Promise<void> => {
        await getUserData(uid);
        return;
    };

    const updateHealthProfile = async (
        uid: string, 
        healthProfileData: UserHealthProfile
    ): Promise<{ success: boolean; msg?: string }> => {
        try {
            // Önce kullanıcı rolünü kontrol et
            const userData = await getUserData(uid);
            
            // Eğer kullanıcı doktor ise, işlem yapmadan başarılı döndür
            if (userData?.role === 'doctor') {
                console.log("Doktor kullanıcı için sağlık profili güncelleme atlandı");
                return { success: true };
            }
            
            // Hasta ise normal işleme devam et
            const docRef = doc(db, "patients", uid);
            
            // Update the health profile in Firestore
            await updateDoc(docRef, {
                healthProfile: healthProfileData,
            });
            
            // Update local user state
            if (user) {
                setUser({
                    ...user,
                    healthProfile: healthProfileData,
                });
            }
            
            return { success: true };
        } catch (error: any) {
            console.error('Error updating health profile:', error);
            return { 
                success: false, 
                msg: error.message || 'Failed to update health profile' 
            };
        }
    };

    const uploadProfileImage = async (
        uid: string,
        imageUri: string
    ): Promise<{ success: boolean; url?: string; msg?: string }> => {
        try {
            console.log('Starting image save for user:', uid);
            
            // Resmi AsyncStorage'a kaydet
            const storageKey = `profile_image_${uid}`;
            await AsyncStorage.setItem(storageKey, imageUri);
            console.log('Image saved to AsyncStorage');
            
            return { success: true, url: imageUri };
        } catch (error: any) {
            console.error('Error saving profile image:', error);
            
            return { 
                success: false, 
                msg: 'Resim kaydedilemedi. Cihaz belleği dolu olabilir.'
            };
        }
    };

    const updateProfileImage = async (
        uid: string,
        imageUri: string
    ): Promise<{ success: boolean; msg?: string }> => {
        try {
            // Resmi local'e kaydet
            const uploadResult = await uploadProfileImage(uid, imageUri);
            
            if (!uploadResult.success) {
                return { success: false, msg: uploadResult.msg };
            }
            
            // Sadece Firestore'da image URL'ini güncelle (local path olarak)
            const userData = await getUserData(uid);
            const collection = userData?.role === 'doctor' ? 'doctors' : 'patients';
            
            const docRef = doc(db, collection, uid);
            await updateDoc(docRef, {
                image: `local://${uid}`, // Local reference olarak sakla
            });
            
            // Local user state'i güncelle
            if (user) {
                setUser({
                    ...user,
                    image: imageUri, // Gerçek local path'i state'te sakla
                });
            }
            
            return { success: true };
        } catch (error: any) {
            console.error('Error updating profile image:', error);
            return { 
                success: false, 
                msg: error.message || 'Profil resmi güncellenemedi'
            };
        }
    };

    const loadProfileImageFromStorage = async (uid: string): Promise<string | null> => {
        try {
            const storageKey = `profile_image_${uid}`;
            const imageUri = await AsyncStorage.getItem(storageKey);
            return imageUri;
        } catch (error) {
            console.error('Error loading profile image from storage:', error);
            return null;
        }
    };

    const refreshUserData = async (): Promise<void> => {
        if (user?.uid) {
            await getUserData(user.uid);
        }
    };

    // Kullanıcı manuel veri girişi kaydet
    const saveUserHealthInput = async (
        uid: string,
        key: string,
        value: any
    ): Promise<{ success: boolean; msg?: string }> => {
        try {
            const userDocRef = doc(db, "patients", uid);
            const docSnap = await getDoc(userDocRef);
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const currentProfile = userData.healthProfile || {};
                
                // Manual entries'i güncelle
                const manualEntries = currentProfile.manualEntries || {};
                manualEntries[key] = {
                    value,
                    timestamp: Date.now(),
                    source: 'user_input'
                };

                // Ana profile da kaydet
                const updatedProfile = { ...currentProfile };
                switch (key) {
                    case 'weight':
                        updatedProfile.weight = value;
                        break;
                    case 'height':
                        updatedProfile.height = value;
                        break;
                    case 'bloodPressure':
                        updatedProfile.bloodPressure = {
                            ...value,
                            timestamp: Date.now()
                        };
                        break;
                    case 'age':
                        updatedProfile.age = value;
                        break;
                    case 'gender':
                        updatedProfile.gender = value;
                        break;
                }

                updatedProfile.manualEntries = manualEntries;

                // Firestore'a kaydet
                await updateDoc(userDocRef, {
                    healthProfile: updatedProfile
                });

                // Local state'i güncelle
                setUser(prevUser => {
                    if (prevUser) {
                        return {
                            ...prevUser,
                            healthProfile: updatedProfile
                        };
                    }
                    return prevUser;
                });

                console.log(`💾 Kullanıcı ${key} verisi kaydedildi:`, value);
                return { success: true };
            }

            return { success: false, msg: 'Kullanıcı bulunamadı' };
        } catch (error: any) {
            console.error(`❌ ${key} verisi kaydedilirken hata:`, error);
            return { 
                success: false, 
                msg: error.message || 'Veri kaydedilirken hata oluştu' 
            };
        }
    };

    const contextValue: AuthContextType = {
        user,
        setUser,
        login,
        register,
        updateUserData,
        updateHealthProfile,
        updateProfileImage,
        refreshUserData,
        logout,
        isLoading,
        saveUserHealthInput
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                    <Text style={{ fontSize: 18, color: '#333' }}>Yükleniyor...</Text>
                </View>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
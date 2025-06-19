import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { AuthProvider } from '@/contexts/authContext'
import * as SplashScreen from 'expo-splash-screen'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const StackLayout = () => {
  useEffect(() => {
    // Direkt olarak splash screen'i gizle
    console.log('App initialization completed');
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ai-health" options={{ headerShown: false }} />
      <Stack.Screen name="ai-health-assessment" options={{ headerShown: false }} />
      <Stack.Screen name="ai-test" options={{ headerShown: false }} />
      <Stack.Screen name="appointment-detail" options={{ headerShown: false }} />
      <Stack.Screen name="doctor-detail" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout(){
  return(
    <AuthProvider>
      <StackLayout />
    </AuthProvider>
  )
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
})
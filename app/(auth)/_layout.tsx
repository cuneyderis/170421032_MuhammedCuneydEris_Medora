import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.neutral900,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.neutral900,
        },
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: 'Giriş Yap',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Kaydol',
        }}
      />
      <Stack.Screen
        name="onboarding-modal"
        options={{
          title: 'Sağlık Profili',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
} 
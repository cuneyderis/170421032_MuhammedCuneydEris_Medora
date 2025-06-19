import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabs from '@/components/CustomTabs';
import * as Icons from 'phosphor-react-native';
import { useAuth } from '@/contexts/authContext';

// TabBar için tip tanımı
type TabBarIconProps = {
  color: string;
  size: number;
  focused: boolean;
};

// TabBar props için any tipi kullanmayı önlemek için
type TabsProps = any;

const TabsLayout = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props: TabsProps) => <CustomTabs {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.House
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* Doctor-specific tabs */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Hastalarım',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.Users
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="appointment"
        options={{
          title: 'Randevular',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.Calendar
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.ChatCircleText
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* Patient-specific tabs */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Randevularım',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.Calendar
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="health-data"
        options={{
          title: 'Sağlık Verilerim',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.HeartStraight
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="ai-health"
        options={{
          title: 'AI Asistan',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.Robot
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="health-metrics"
        options={{
          title: 'Sağlık Metrikleri',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.ChartLine
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }: TabBarIconProps) => (
            <Icons.User
              size={size}
              color={color}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
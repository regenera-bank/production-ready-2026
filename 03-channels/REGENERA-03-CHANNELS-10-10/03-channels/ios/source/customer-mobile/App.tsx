
import { StatusBar } from 'expo-status-bar';
// import "./global.css";
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRouter } from './src/app/navigation/AppRouter';
import { View } from 'react-native';

// Initialize Firebase Infrastructure
import './src/platform/notifications/firebase';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#020617' }}>
        <StatusBar style="light"  />
        <AppRouter />
      </View>
    </SafeAreaProvider>
  );
}

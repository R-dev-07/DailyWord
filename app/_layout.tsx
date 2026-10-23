import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { initializeDatabase } from '@/src/database';
import { usePalette } from '@/src/theme';

export default function RootLayout() {
  const palette = usePalette();

  useEffect(() => {
    initializeDatabase().catch((error) => console.warn('Local database setup failed', error));
  }, []);

  // The window behind the app follows the theme, so no black strip can show above, below or behind a screen.
  useEffect(() => { void SystemUI.setBackgroundColorAsync(palette.background); }, [palette.background]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={palette.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background }, statusBarTranslucent: true, navigationBarTranslucent: true }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader" options={{ presentation: 'card' }} />
        <Stack.Screen name="appearance" options={{ presentation: 'modal' }} />
        <Stack.Screen name="about" options={{ presentation: 'card' }} />
        <Stack.Screen name="note" options={{ presentation: 'modal' }} />
        <Stack.Screen name="versions" options={{ presentation: 'modal' }} />
        <Stack.Screen name="read-aloud" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}

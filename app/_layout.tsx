import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#FFFC00',
          headerTitleStyle: { color: '#FFF', fontWeight: '700' },
          contentStyle: { backgroundColor: '#000' },
          headerShadowVisible: false,
        }}
      />
    </>
  );
}

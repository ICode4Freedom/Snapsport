import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initRevenueCat, checkUnlockStatus } from '../src/core/revenuecat';
import { useStore } from '../src/store/useStore';

// Show extraction-complete alerts even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function isZipUri(url: string) {
  return url.endsWith('.zip') || url.includes('.zip?') || url.startsWith('file://');
}

export default function RootLayout() {
  const setPendingFileUri = useStore((s) => s.setPendingFileUri);
  const setPurchased = useStore((s) => s.setPurchased);

  function handleIncomingUrl(url: string) {
    if (!url) return;
    if (isZipUri(url)) {
      setPendingFileUri(url);
      router.replace('/import');
    }
  }

  useEffect(() => {
    // Initialize RevenueCat and restore any prior purchase
    initRevenueCat();
    checkUnlockStatus().then((purchased) => {
      if (purchased) setPurchased(true);
    });

    // App opened via document association (Open In… from Mail/Files)
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });

    // App already open, receives a new file
    const sub = Linking.addEventListener('url', ({ url }) => handleIncomingUrl(url));
    return () => sub.remove();
  }, []);

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
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

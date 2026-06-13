import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateMockMemories } from '../src/data/mockMemories';
import { useStore } from '../src/store/useStore';

const EMAIL_APPS = [
  { label: 'Gmail',      scheme: 'googlegmail://' },
  { label: 'Outlook',    scheme: 'ms-outlook://'  },
  { label: 'Yahoo Mail', scheme: 'ymail://'        },
  { label: 'Spark',      scheme: 'readdle-spark://' },
  { label: 'ProtonMail', scheme: 'protonmail://'   },
  { label: 'Apple Mail', scheme: 'mailto:'         },
];

async function openEmailApp() {
  const available: typeof EMAIL_APPS = [];
  for (const app of EMAIL_APPS) {
    try {
      if (await Linking.canOpenURL(app.scheme)) available.push(app);
    } catch {}
  }

  if (available.length === 0) {
    // No email app installed — fall back to Gmail on the web
    await Linking.openURL('https://mail.google.com');
    return;
  }

  if (available.length === 1) {
    await Linking.openURL(available[0].scheme);
    return;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Open email app',
      options: [...available.map((a) => a.label), 'Cancel'],
      cancelButtonIndex: available.length,
    },
    (index) => {
      if (index < available.length) {
        Linking.openURL(available[index].scheme);
      }
    }
  );
}

async function openSnapchat() {
  try {
    const supported = await Linking.canOpenURL('snapchat://');
    if (supported) {
      await Linking.openURL('snapchat://');
      return;
    }
  } catch {}
  await Linking.openURL('https://www.snapchat.com');
}

interface Step {
  n: string;
  emoji: string;
  title: string;
  bullets: string[];
  checkboxes?: string[];
  cta?: { label: string; onPress: () => void };
}

const STEPS: Step[] = [
  {
    n: '1',
    emoji: '👻',
    title: 'Request your data from Snapchat',
    bullets: [
      'Tap your Profile icon (top-left of Snapchat)',
      'Tap ⚙️ Settings → Privacy → My Data',
      'Toggle ON both options below, then set date range to All Time → Submit',
    ],
    checkboxes: ['Export your Memories', 'Export JSON Files'],
    cta: { label: 'Open Snapchat →', onPress: openSnapchat },
  },
  {
    n: '2',
    emoji: '📧',
    title: 'Download the ZIP from your email',
    bullets: [
      'Check email from no-reply@snapchat.com',
      'Subject: "Your Snapchat data is ready"',
      'Tap the download link — it saves a ZIP to your phone',
      'Links expire in 7 days — download soon',
    ],
    cta: { label: 'Open Email App →', onPress: openEmailApp },
  },
  {
    n: '3',
    emoji: '⚡',
    title: 'Open the ZIP in SnapsPort',
    bullets: [
      'From Mail: long-press the ZIP → Share → SnapsPort',
      'From Files app: tap the ZIP → Share icon → SnapsPort',
      'Or tap the button below to select the file manually',
    ],
    cta: { label: 'I have my ZIP →', onPress: () => router.push('/import') },
  },
];

function StepCard({ step, delay }: { step: Step; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      {/* Step number row */}
      <View style={styles.stepRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{step.n}</Text>
        </View>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{step.title}</Text>

      {/* Bullets */}
      <View style={styles.bullets}>
        {step.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.dot}>›</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Checkboxes */}
      {step.checkboxes && (
        <View style={styles.checkboxGroup}>
          {step.checkboxes.map((label, i) => (
            <View key={i} style={styles.checkboxRow}>
              <View style={styles.checkboxBox}>
                <Text style={styles.checkboxTick}>✓</Text>
              </View>
              <Text style={styles.checkboxLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      {step.cta && (
        <TouchableOpacity style={styles.cardCta} onPress={step.cta.onPress} activeOpacity={0.8}>
          <Text style={styles.cardCtaText}>{step.cta.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const { setMemories, setDebugMode, setProgress } = useStore();

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  function handleDebugProcessing() {
    setDebugMode(true);
    setMemories(generateMockMemories());
    router.push({ pathname: '/processing', params: { skipped: '3' } });
  }

  function handleDebugComplete(withFailures: boolean) {
    setDebugMode(true);
    if (withFailures) {
      setProgress({ total: 75, saved: 68, failed: 7, active: 0 });
    } else {
      setProgress({ total: 75, saved: 75, failed: 0, active: 0 });
    }
    router.push('/complete');
  }

  function handleDebugImportError() {
    Alert.alert(
      'Import failed',
      'No photos or videos found in the ZIP.\n\nMake sure you selected the correct Snapchat export file(s) from your data download email.',
      [{ text: 'OK' }]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [
              { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
            ],
          }}
        >
          <Text style={styles.logo}>⚡ SnapsPort</Text>
          <Text style={styles.tagline}>
            Move your Snapchat memories to iCloud Photos in 3 steps.
          </Text>
          <View style={styles.urgencyBadge}>
            <Text style={styles.urgencyText}>
              ⏰  Snapchat now charges for storage past 5GB — act before your links expire
            </Text>
          </View>
        </Animated.View>

        <View style={styles.divider} />

        {STEPS.map((step, i) => (
          <StepCard key={i} step={step} delay={i * 100} />
        ))}

        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>🔒  Your data stays on your phone</Text>
          <Text style={styles.privacyText}>
            SnapsPort downloads memories directly from Snapchat to your device. No account, no server, nothing shared with us.
          </Text>
        </View>

        {__DEV__ && (
          <View style={styles.debugPanel}>
            <Text style={styles.debugLabel}>⚙️  Debug shortcuts</Text>
            <TouchableOpacity style={styles.debugBtn} onPress={handleDebugProcessing} activeOpacity={0.7}>
              <Text style={styles.debugBtnText}>Processing (paywall + download)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugBtn} onPress={() => handleDebugComplete(false)} activeOpacity={0.7}>
              <Text style={styles.debugBtnText}>Complete — all done 🎉</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugBtn} onPress={() => handleDebugComplete(true)} activeOpacity={0.7}>
              <Text style={styles.debugBtnText}>Complete — with failures ⚠️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugBtn} onPress={handleDebugImportError} activeOpacity={0.7}>
              <Text style={styles.debugBtnText}>Import error alert</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  content: { padding: 22, paddingBottom: 52 },

  logo: { color: '#FFFC00', fontSize: 30, fontWeight: '900', marginBottom: 8 },
  tagline: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 14,
  },
  urgencyBadge: {
    backgroundColor: '#120e00',
    borderColor: '#FFFC00',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  urgencyText: { color: '#FFFC00', fontSize: 13, lineHeight: 18 },

  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 24 },

  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFC00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeText: { color: '#000', fontWeight: '900', fontSize: 14 },
  stepEmoji: { fontSize: 20 },

  cardTitle: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 21,
  },

  bullets: { marginBottom: 4 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dot: {
    color: '#FFFC00',
    fontSize: 16,
    lineHeight: 20,
    width: 16,
    flexShrink: 0,
  },
  bulletText: { color: '#888', fontSize: 13, lineHeight: 19, flex: 1 },

  checkboxGroup: {
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#FFFC00',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxTick: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  checkboxLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  cardCta: {
    marginTop: 14,
    backgroundColor: '#FFFC00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardCtaText: { color: '#000', fontWeight: '800', fontSize: 15 },

  privacyBox: {
    backgroundColor: '#060e06',
    borderColor: '#1a3d1a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  privacyTitle: { color: '#4caf50', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  privacyText: { color: '#4a7a4a', fontSize: 12, lineHeight: 17 },

  debugPanel: {
    marginTop: 24,
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  debugLabel: { color: '#444', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  debugBtn: {
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  debugBtnText: { color: '#555', fontSize: 13 },
});

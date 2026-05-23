import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Email app deep links — tried in order until one opens
const EMAIL_APPS = [
  { label: 'Gmail', scheme: 'googlegmail://' },
  { label: 'Outlook', scheme: 'ms-outlook://' },
  { label: 'Mail', scheme: 'message://' },
  { label: 'Mail', scheme: 'mailto:' },
];

async function openEmailApp() {
  for (const app of EMAIL_APPS) {
    try {
      const supported = await Linking.canOpenURL(app.scheme);
      if (supported) {
        await Linking.openURL(app.scheme);
        return;
      }
    } catch {}
  }
  await Linking.openURL('mailto:');
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
      'Toggle ON: Export your Memories + Export JSON Files',
      'Set date range to All Time → Submit',
    ],
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

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

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
});

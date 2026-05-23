import { router } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StepCard } from '@/components/StepCard';

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚡ SnapsPort</Text>
          <Text style={styles.tagline}>Move your Snapchat memories to iCloud Photos in minutes.</Text>
          <View style={styles.urgencyBadge}>
            <Text style={styles.urgencyText}>
              ⏰  Snapchat storage fees begin — act before your URLs expire
            </Text>
          </View>
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How it works</Text>

        <StepCard
          step={1}
          title="Request your Snapchat data"
          description={'Open Snapchat → Profile → Settings → My Data → toggle "Export your Memories" + "Export JSON Files" → All Time → Submit. You\'ll get an email with a download link.'}
        />
        <StepCard
          step={2}
          title="Download the ZIP file"
          description="Open the email from Snapchat and download the ZIP to your phone. You have about 7 days before the links inside expire — start soon."
        />
        <StepCard
          step={3}
          title="Import into SnapsPort"
          description="Tap the button below, select your ZIP file, and we'll handle the rest. All photos and videos go straight into your iCloud Photos library."
        />

        {/* Privacy note */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyTitle}>🔒 Your data never leaves your phone</Text>
          <Text style={styles.privacyText}>
            SnapsPort downloads your memories directly from Snapchat to your device. We have no server, no account, and no access to your files.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/import')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Select my Snapchat ZIP →</Text>
        </TouchableOpacity>

        <Text style={styles.fine}>
          First 50 memories free · Unlock all for $0.99 (one-time)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },

  header: { marginBottom: 32 },
  logo: { color: '#FFFC00', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  tagline: { color: '#FFF', fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 14 },

  urgencyBadge: {
    backgroundColor: '#1a1400',
    borderColor: '#FFFC00',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  urgencyText: { color: '#FFFC00', fontSize: 13, lineHeight: 18 },

  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  privacyBox: {
    backgroundColor: '#0a1a0a',
    borderColor: '#1f4d1f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 28,
  },
  privacyTitle: { color: '#4caf50', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  privacyText: { color: '#6a9e6a', fontSize: 13, lineHeight: 18 },

  cta: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 17 },

  fine: { color: '#555', fontSize: 12, textAlign: 'center' },
});

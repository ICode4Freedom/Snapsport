import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../src/store/useStore';

export default function CompleteScreen() {
  const { progress, reset } = useStore();

  const hasFailures = progress.failed > 0;

  async function handleShare() {
    try {
      await Share.share({
        message:
          'Just moved all my Snapchat memories to iCloud Photos in minutes with SnapsPort! Download it here: https://apps.apple.com/app/snapsport',
      });
    } catch {
      // ignore
    }
  }

  function handleDone() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{hasFailures ? '⚠️' : '🎉'}</Text>
        <Text style={styles.title}>
          {hasFailures ? 'Mostly done!' : 'All done!'}
        </Text>
        <Text style={styles.subtitle}>
          Your Snapchat memories are now in{' '}
          <Text style={styles.highlight}>iCloud Photos</Text> — in the{' '}
          <Text style={styles.mono}>SnapsPort</Text> album.
        </Text>

        <View style={styles.statsRow}>
          <Stat label="Saved" value={progress.saved} color="#4caf50" />
          {hasFailures && <Stat label="Failed" value={progress.failed} color="#e53935" />}
        </View>

        {hasFailures && (
          <View style={styles.failureBox}>
            <Text style={styles.failureTitle}>Some memories failed</Text>
            <Text style={styles.failureText}>
              This usually means those download links expired (Snapchat links last ~7 days). Request a new data export from Snapchat and try again to capture the rest.
            </Text>
          </View>
        )}

        <View style={styles.nextSteps}>
          <Text style={styles.nextTitle}>What's next</Text>
          <Text style={styles.nextItem}>📱  Open the Photos app → Albums → SnapsPort</Text>
          <Text style={styles.nextItem}>☁️  iCloud will sync to all your Apple devices automatically</Text>
          <Text style={styles.nextItem}>🗑️  You can now cancel your Snapchat storage subscription</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>Share SnapsPort with friends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.stat}>
      <Text style={[statStyles.number, { color }]}>{value.toLocaleString()}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { alignItems: 'center', flex: 1 },
  number: { fontSize: 40, fontWeight: '900' },
  label: { color: '#666', fontSize: 13, marginTop: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24, alignItems: 'center' },

  emoji: { fontSize: 64, marginTop: 32, marginBottom: 16 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  subtitle: {
    color: '#888',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  highlight: { color: '#FFFC00', fontWeight: '700' },
  mono: { color: '#FFFC00', fontFamily: 'monospace' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 20,
  },

  failureBox: {
    backgroundColor: '#1a0505',
    borderColor: '#5a1515',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  failureTitle: { color: '#e57373', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  failureText: { color: '#8a4a4a', fontSize: 13, lineHeight: 18 },

  nextSteps: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 10,
    marginBottom: 28,
  },
  nextTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  nextItem: { color: '#888', fontSize: 13, lineHeight: 20 },

  shareBtn: {
    backgroundColor: '#111',
    borderColor: '#FFFC00',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  shareBtnText: { color: '#FFFC00', fontWeight: '700', fontSize: 16 },

  doneBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: { color: '#555', fontSize: 16 },
});

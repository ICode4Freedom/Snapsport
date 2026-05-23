import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProgressBar } from '../src/components/ProgressBar';
import { runDownloadQueue } from '../src/core/downloader';
import { useStore, FREE_TIER_LIMIT } from '../src/store/useStore';

export default function ProcessingScreen() {
  const { skipped } = useLocalSearchParams<{ skipped?: string }>();
  const {
    jobs,
    memories,
    progress,
    isPurchased,
    cancelSignal,
    updateProgress,
    cancelDownload,
    setPhase,
    setPurchased,
  } = useStore();

  const [hasStarted, setHasStarted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const startedRef = useRef(false);

  const total = jobs.length;
  const allMemoriesCount = memories.length;
  const isLimited = !isPurchased && allMemoriesCount > FREE_TIER_LIMIT;
  const progressRatio = progress.total > 0 ? (progress.saved + progress.failed) / progress.total : 0;

  async function startDownload() {
    if (startedRef.current) return;
    startedRef.current = true;
    setHasStarted(true);
    cancelSignal.cancelled = false;

    await runDownloadQueue(jobs, (prog, job) => {
      updateProgress(prog, job);
    }, cancelSignal);

    router.replace('/complete');
  }

  useEffect(() => {
    if (isConfirmed) {
      startDownload();
    }
  }, [isConfirmed]);

  function handleCancel() {
    Alert.alert('Cancel download?', 'Memories downloaded so far will stay in your library.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: () => {
          cancelDownload();
          router.replace('/');
        },
      },
    ]);
  }

  function handleUnlock() {
    // TODO: integrate RevenueCat for real IAP
    // For now, simulate purchase
    Alert.alert(
      'Unlock All Memories',
      `Download all ${allMemoriesCount.toLocaleString()} memories for $0.99 (one-time purchase).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock — $0.99',
          onPress: () => {
            setPurchased(true);
          },
        },
      ]
    );
  }

  // Confirmation gate before starting
  if (!isConfirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Ready to export</Text>

          <View style={styles.summaryBox}>
            <Row label="Memories found" value={allMemoriesCount.toLocaleString()} />
            <Row label="Will be downloaded" value={total.toLocaleString()} highlight />
            {parseInt(skipped ?? '0', 10) > 0 && (
              <Row label="Skipped (missing data)" value={skipped ?? '0'} dim />
            )}
          </View>

          {isLimited && (
            <View style={styles.upgradeBox}>
              <Text style={styles.upgradeTitle}>
                Free tier: first {FREE_TIER_LIMIT} memories
              </Text>
              <Text style={styles.upgradeText}>
                You have {allMemoriesCount.toLocaleString()} memories.{' '}
                Unlock all for a one-time $0.99 payment.
              </Text>
              <TouchableOpacity style={styles.unlockBtn} onPress={handleUnlock} activeOpacity={0.85}>
                <Text style={styles.unlockBtnText}>Unlock all — $0.99</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️  Keep this screen open during the download. Large libraries may take 10–30 minutes.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => setIsConfirmed(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Start downloading →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Download in progress
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Downloading…</Text>

        <View style={styles.statsBox}>
          <BigStat label="Saved" value={progress.saved} color="#4caf50" />
          <BigStat label="Remaining" value={Math.max(0, progress.total - progress.saved - progress.failed)} color="#FFFC00" />
          <BigStat label="Failed" value={progress.failed} color="#e53935" />
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progressRatio} />
          <Text style={styles.progressLabel}>
            {Math.round(progressRatio * 100)}% · {progress.active} active
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            🔒  Don't close the app. Memories are going directly to your iCloud Photos.
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
  dim,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, dim && rowStyles.dim]}>{label}</Text>
      <Text style={[rowStyles.value, highlight && rowStyles.highlight, dim && rowStyles.dim]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { color: '#888', fontSize: 15 },
  value: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  highlight: { color: '#FFFC00' },
  dim: { color: '#555' },
});

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.stat}>
      <Text style={[statStyles.number, { color }]}>{value.toLocaleString()}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  stat: { alignItems: 'center', flex: 1 },
  number: { fontSize: 32, fontWeight: '900' },
  label: { color: '#666', fontSize: 12, marginTop: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24 },

  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 24 },

  summaryBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  upgradeBox: {
    backgroundColor: '#1a1400',
    borderColor: '#FFFC00',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  upgradeTitle: { color: '#FFFC00', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  upgradeText: { color: '#999', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  unlockBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unlockBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },

  warningBox: {
    backgroundColor: '#1a0f00',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  warningText: { color: '#b87333', fontSize: 13, lineHeight: 18 },

  cta: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 17 },

  statsBox: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },

  progressContainer: { gap: 10, marginBottom: 24 },
  progressLabel: { color: '#666', fontSize: 13, textAlign: 'center' },

  cancelBtn: { marginTop: 'auto', alignItems: 'center', paddingVertical: 16 },
  cancelText: { color: '#555', fontSize: 15 },
});

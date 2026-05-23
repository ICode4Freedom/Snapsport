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
import { useStore, ExportDestination } from '../src/store/useStore';

export default function ProcessingScreen() {
  const { skipped } = useLocalSearchParams<{ skipped?: string }>();
  const {
    jobs,
    memories,
    progress,
    cancelSignal,
    updateProgress,
    cancelDownload,
    exportDestination,
    setExportDestination,
  } = useStore();

  const [hasStarted, setHasStarted] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const startedRef = useRef(false);

  const total = jobs.length;
  const allMemoriesCount = memories.length;
  const skippedCount = parseInt(skipped ?? '0', 10);
  const progressRatio = progress.total > 0 ? (progress.saved + progress.failed) / progress.total : 0;

  async function startDownload() {
    if (startedRef.current) return;
    startedRef.current = true;
    setHasStarted(true);
    cancelSignal.cancelled = false;

    await runDownloadQueue(jobs, exportDestination, (prog, job) => {
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

  // Confirmation + destination picker gate before starting
  if (!isConfirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Ready to export</Text>

          <View style={styles.summaryBox}>
            <Row label="Memories found" value={allMemoriesCount.toLocaleString()} />
            <Row label="Will be downloaded" value={total.toLocaleString()} highlight />
            {skippedCount > 0 && (
              <Row label="Skipped (missing data)" value={String(skippedCount)} dim />
            )}
          </View>

          {/* Destination picker */}
          <Text style={styles.sectionLabel}>Save memories to</Text>
          <View style={styles.pickerRow}>
            <DestOption
              label="SnapsPort Album"
              subtitle="Organized in a dedicated album"
              icon="📁"
              selected={exportDestination === 'album'}
              onPress={() => setExportDestination('album')}
            />
            <DestOption
              label="Camera Roll"
              subtitle="Blends into your existing photos"
              icon="🖼️"
              selected={exportDestination === 'camera-roll'}
              onPress={() => setExportDestination('camera-roll')}
            />
          </View>

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
          <BigStat
            label="Remaining"
            value={Math.max(0, progress.total - progress.saved - progress.failed)}
            color="#FFFC00"
          />
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
            🔒  Don't close the app. Memories are going directly to your{' '}
            {exportDestination === 'album' ? 'SnapsPort album' : 'Camera Roll'}.
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DestOption({
  label,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  label: string;
  subtitle: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[destStyles.option, selected && destStyles.optionSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={destStyles.icon}>{icon}</Text>
      <Text style={[destStyles.label, selected && destStyles.labelSelected]}>{label}</Text>
      <Text style={destStyles.subtitle}>{subtitle}</Text>
      {selected && <View style={destStyles.dot} />}
    </TouchableOpacity>
  );
}

const destStyles = StyleSheet.create({
  option: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#222',
  },
  optionSelected: {
    borderColor: '#FFFC00',
    backgroundColor: '#1a1800',
  },
  icon: { fontSize: 26, marginBottom: 8 },
  label: { color: '#888', fontWeight: '700', fontSize: 14, marginBottom: 4, textAlign: 'center' },
  labelSelected: { color: '#FFFC00' },
  subtitle: { color: '#555', fontSize: 11, lineHeight: 15, textAlign: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFC00',
    marginTop: 10,
  },
});

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
    marginBottom: 20,
  },

  sectionLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  pickerRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },

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

  progressContainer: { marginBottom: 24, gap: 10 },
  progressLabel: { color: '#666', fontSize: 13, textAlign: 'center' },

  cancelBtn: { marginTop: 'auto', alignItems: 'center', paddingVertical: 16 },
  cancelText: { color: '#555', fontSize: 15 },
});

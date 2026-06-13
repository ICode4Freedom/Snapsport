import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { unzip } from 'react-native-zip-archive';
import { ProgressBar } from '../src/components/ProgressBar';
import { scanMediaFiles } from '../src/core/parser';
import { useStore } from '../src/store/useStore';

type ImportPhase = 'idle' | 'extracting' | 'scanning';

export default function ImportScreen() {
  const navigation = useNavigation();
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [extractProgress, setExtractProgress] = useState(0);
  const [zipStatus, setZipStatus] = useState({ current: 0, total: 0 });
  const appStateRef = useRef(AppState.currentState);
  const { setMemories, setExtractedDirs, setError, pendingFileUri, setPendingFileUri } = useStore();
  const [mediaPermission, requestPermission] = MediaLibrary.usePermissions();

  const isExtracting = phase === 'extracting';
  const isLoading = phase !== 'idle';

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isExtracting,
      headerLeft: isExtracting ? () => null : undefined,
    });
  }, [isExtracting]);

  useEffect(() => {
    if (!isExtracting) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, [isExtracting]);

  useEffect(() => {
    if (pendingFileUri && !isLoading) {
      const uri = pendingFileUri;
      setPendingFileUri(null);
      handleImportFromUris([uri]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFileUri]);

  async function ensurePermission(): Promise<boolean> {
    if (mediaPermission?.granted) return true;
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission required',
        'SnapsPort needs access to your photo library to save memories. Please allow it in Settings.',
        [{ text: 'OK' }]
      );
    }
    return granted;
  }

  async function notifyComplete() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ZIP extracted!',
          body: 'Your memories are ready — tap to continue.',
        },
        trigger: null,
      });
    } catch {}
  }

  async function handlePickFile() {
    if (!(await ensurePermission())) return;

    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'public.zip-archive'],
        copyToCacheDirectory: true,
        multiple: true,
      });
    } catch {
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const uris = result.assets.map((a) => a.uri);
    await handleImportFromUris(uris);
  }

  async function handleImportFromUris(zipUris: string[]) {
    if (!(await ensurePermission())) return;

    const extractedDirs: string[] = [];

    try {
      setPhase('extracting');
      setZipStatus({ current: 0, total: zipUris.length });
      setExtractProgress(0);

      for (let i = 0; i < zipUris.length; i++) {
        setZipStatus({ current: i + 1, total: zipUris.length });
        setExtractProgress(i / zipUris.length);

        const extractDir = `${FileSystem.cacheDirectory}snapsport_extract_${i}/`;
        extractedDirs.push(extractDir);

        await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

        const sourcePath = stripFileUri(zipUris[i]);
        const targetPath = stripFileUri(extractDir);

        await unzip(sourcePath, targetPath, 'UTF-8', (zipProgress) => {
          const pct = Math.min(Math.max(zipProgress, 0), 1);
          setExtractProgress((i + pct) / zipUris.length);
        });
      }

      setExtractProgress(1);

      if (appStateRef.current !== 'active') {
        await notifyComplete();
      }

      setPhase('scanning');
      const { memories, skipped } = await scanMediaFiles(extractedDirs);

      if (memories.length === 0) {
        await cleanupDirs(extractedDirs);
        throw new Error(
          'No photos or videos found in the ZIP(s).\n\nMake sure you selected the correct Snapchat export file(s) from your data download email.'
        );
      }

      // Keep extractedDirs alive — downloader cleans them up after saving
      setExtractedDirs(extractedDirs);
      setMemories(memories);
      router.replace({ pathname: '/processing', params: { skipped: String(skipped) } });
    } catch (err) {
      await cleanupDirs(extractedDirs);
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setPhase('idle');
      setExtractProgress(0);
      Alert.alert('Import failed', msg, [{ text: 'OK' }]);
    }
  }

  const extractLabel =
    zipStatus.total > 1
      ? `Extracting ZIP ${zipStatus.current} of ${zipStatus.total}…`
      : 'Extracting ZIP…';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {isExtracting ? (
              <>
                <Text style={styles.loadingTitle}>{extractLabel}</Text>
                <View style={styles.progressWrapper}>
                  <ProgressBar progress={extractProgress} />
                  <Text style={styles.progressPct}>
                    {Math.round(extractProgress * 100)}%
                  </Text>
                </View>
                <Text style={styles.loadingSubtitle}>
                  Large exports may take a minute — you can switch apps and we'll notify you when it's done
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.loadingTitle}>Scanning for memories…</Text>
                <View style={styles.progressWrapper}>
                  <ProgressBar progress={1} />
                </View>
                <Text style={styles.loadingSubtitle}>Almost there…</Text>
              </>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.title}>Select your ZIP file(s)</Text>
            <Text style={styles.subtitle}>
              Snapchat emails you ZIP file(s) containing your memories. Select all of them at once — SnapsPort will find your photos and videos automatically. Tap the button below or use{' '}
              <Text style={styles.highlight}>Share → SnapsPort</Text> from your Mail app.
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePickFile} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>📂  Choose ZIP file(s)</Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.line} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Faster: Open In from Mail</Text>
              <Text style={styles.shareSteps}>
                1. Open the Snapchat email on this iPhone{'\n'}
                2. Tap the ZIP attachment{'\n'}
                3. Tap the Share icon → select SnapsPort{'\n'}
                4. Import starts automatically
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function stripFileUri(uri: string): string {
  const stripped = uri.replace(/^file:\/\//, '');
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
}

async function cleanupDirs(dirs: string[]) {
  await Promise.all(dirs.map((d) => FileSystem.deleteAsync(d, { idempotent: true })));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },

  loadingContainer: { alignItems: 'center', gap: 20 },
  loadingTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  progressWrapper: { width: '100%', gap: 8 },
  progressPct: { color: '#FFFC00', fontSize: 13, fontWeight: '600', textAlign: 'right' },

  loadingSubtitle: { color: '#555', fontSize: 13, textAlign: 'center' },

  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: '#777', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  highlight: { color: '#FFFC00', fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 17 },

  orDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#222' },
  orText: { color: '#444', fontSize: 13 },

  shareCard: {
    backgroundColor: '#0a0a0a',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  shareTitle: { color: '#FFF', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  shareSteps: { color: '#777', fontSize: 13, lineHeight: 22 },
});

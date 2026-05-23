import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { unzip } from 'react-native-zip-archive';
import { parseMemoriesJson } from '../src/core/parser';
import { useStore } from '../src/store/useStore';

type ImportPhase = 'idle' | 'picking' | 'extracting' | 'parsing';

export default function ImportScreen() {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [statusText, setStatusText] = useState('');
  const { setMemories, setError } = useStore();

  const [mediaPermission, requestPermission] = MediaLibrary.usePermissions();

  async function handleImport() {
    // Ensure Photos permission before we do anything else
    if (!mediaPermission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'SnapsPort needs access to your photo library to save memories. Please allow it in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setPhase('picking');

    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });
    } catch {
      setPhase('idle');
      return;
    }

    if (result.canceled || !result.assets?.[0]) {
      setPhase('idle');
      return;
    }

    const zipUri = result.assets[0].uri;
    const extractDir = `${FileSystem.cacheDirectory}snapsport_extract/`;

    try {
      setPhase('extracting');
      setStatusText('Extracting ZIP…');

      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });
      await unzip(zipUri, extractDir);

      setPhase('parsing');
      setStatusText('Reading memories…');

      const jsonPath = await findMemoriesJson(extractDir);
      const raw = await FileSystem.readAsStringAsync(jsonPath);
      const { memories, skipped } = parseMemoriesJson(raw);

      // Clean up extract dir
      await FileSystem.deleteAsync(extractDir, { idempotent: true });

      if (memories.length === 0) {
        throw new Error('No memories found in this file. Make sure you exported "Memories" from Snapchat.');
      }

      setMemories(memories);

      router.replace({
        pathname: '/processing',
        params: { skipped: String(skipped) },
      });
    } catch (err) {
      await FileSystem.deleteAsync(extractDir, { idempotent: true });
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setPhase('idle');
      Alert.alert('Import failed', msg);
    }
  }

  const isLoading = phase !== 'idle';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Select your ZIP file</Text>
        <Text style={styles.subtitle}>
          Tap below and choose the ZIP file Snapchat emailed you. It contains a file called{' '}
          <Text style={styles.mono}>memories_history.json</Text>.
        </Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFFC00" />
            <Text style={styles.loadingText}>{statusText}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.cta} onPress={handleImport} activeOpacity={0.85}>
            <Text style={styles.ctaText}>📂  Choose ZIP file</Text>
          </TouchableOpacity>
        )}

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Can't find the ZIP?</Text>
          <Text style={styles.tipText}>
            Check your email from Snapchat (no-reply@snapchat.com). The subject line says "Your Snapchat data is ready". Tap the link to download it first.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

async function findMemoriesJson(extractDir: string): Promise<string> {
  const candidates = [
    `${extractDir}memories_history.json`,
    `${extractDir}json/memories_history.json`,
    `${extractDir}export/memories_history.json`,
  ];

  for (const path of candidates) {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
  }

  // Walk one level deeper if Snapchat wrapped in a subfolder
  const contents = await FileSystem.readDirectoryAsync(extractDir);
  for (const entry of contents) {
    const sub = `${extractDir}${entry}/memories_history.json`;
    const info = await FileSystem.getInfoAsync(sub);
    if (info.exists) return sub;
  }

  throw new Error(
    'Could not find memories_history.json inside the ZIP. Make sure you selected "Export your Memories" AND "Export JSON Files" when requesting your data from Snapchat.'
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },

  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: '#888', fontSize: 15, lineHeight: 22, marginBottom: 36 },
  mono: { color: '#FFFC00', fontFamily: 'monospace' },

  cta: {
    backgroundColor: '#FFFC00',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 28,
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 17 },

  loadingBox: { alignItems: 'center', gap: 16, marginBottom: 28, paddingVertical: 20 },
  loadingText: { color: '#888', fontSize: 15 },

  tipBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
  },
  tipTitle: { color: '#FFF', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  tipText: { color: '#666', fontSize: 13, lineHeight: 18 },
});

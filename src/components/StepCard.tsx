import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  step: number;
  title: string;
  description: string;
}

export function StepCard({ step, title, description }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{step}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFC00',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  description: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
});

import { MemoryItem } from '../core/parser';

export const MOCK_MEMORY_COUNT = 75;

export function generateMockMemories(): MemoryItem[] {
  return Array.from({ length: MOCK_MEMORY_COUNT }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000 * 2);
    return {
      date: d,
      mediaType: i % 5 === 0 ? 'VIDEO' : 'PHOTO',
      localPath: `file:///mock/snapsport/memory-${i}.${i % 5 === 0 ? 'mp4' : 'jpg'}`,
    } satisfies MemoryItem;
  });
}
